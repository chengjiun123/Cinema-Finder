
# Cinema Finder — Backend Architecture & Implementation Plan

## Post Office in one sentence
End-users are **Walk-in Guests** at the **Counter** (Lovable UI). Movie **Inventory** is delivered nightly from an **External Vendor** (TMDb) by a **Back Room Specialist** (cron-triggered sync). You — the **Manager with a Key** — stock the **Cinema** and **Showtime** shelves yourself through an admin panel. **Security Guards** (RLS) make sure guests can only read, never touch the Warehouse.

---

## PHASE 2 — Architecture Blueprint

### A. Data flow

```text
                  External Vendor                  Manager (you)
                 ┌──────────────┐                ┌─────────────┐
                 │   TMDb API   │                │ Admin Panel │
                 └──────┬───────┘                └──────┬──────┘
                        │ nightly                       │ CRUD cinemas
                        │ (pg_cron + pg_net)            │ + showtimes
                        ▼                               ▼
            ┌────────────────────────────────────────────────┐
            │     Back Room Specialists (server fns)         │
            │  syncTmdbCatalog | upsertCinema | upsertShow.. │
            └────────────────────┬───────────────────────────┘
                                 ▼
                          ┌────────────┐
                          │  Warehouse │  (Postgres / Lovable Cloud)
                          │  shelves:  │
                          │  movies    │
                          │  cinemas   │
                          │  showtimes │
                          │  user_roles│
                          └────┬───────┘
                               │ public reads (RLS: SELECT for all)
                               ▼
            ┌────────────────────────────────────────────────┐
            │  Public Clerk (read server fns)                │
            │  getMoviesByCategory | getCinemasForSelection  │
            └────────────────────┬───────────────────────────┘
                                 ▼
                          ┌────────────┐
                          │  Counter   │  TanStack routes / + /results
                          │ (Lovable)  │  + /admin (gated)
                          └────────────┘
```

### B. Shelves (tables) — Labels (schema)

All in `public` schema. Every table gets explicit `GRANT`s and RLS.

1. **`movies`** — Movie Inventory (synced from TMDb, never hand-edited)
   - `id` (uuid pk)
   - `tmdb_id` (int, unique) — natural key from TMDb
   - `title`, `poster_url`, `backdrop_url`
   - `category` (enum: `now_showing | coming_soon | popular`)
   - `genres` (text[]), `duration_minutes` (int), `release_date` (date)
   - `overview` (text), `tmdb_popularity` (numeric)
   - `synced_at`, timestamps

2. **`cinemas`** — Cinema directory (admin-managed)
   - `id` (uuid pk), `name`, `address`, `description`, `photo_url`
   - `latitude` (numeric), `longitude` (numeric), `base_price` (numeric)
   - `is_active` (bool default true), timestamps

3. **`showtimes`** — Daily showtime grid (admin-managed; option B)
   - `id` (uuid pk)
   - `cinema_id` (uuid fk → cinemas, on delete cascade)
   - `movie_id` (uuid fk → movies, on delete cascade)
   - `starts_at` (timestamptz) — the specific show time
   - `price` (numeric) — per-showing override; null falls back to cinema base_price
   - `screen_label` (text, nullable) — e.g. "IMAX 2"
   - timestamps
   - Indexes: `(movie_id, starts_at)`, `(cinema_id, starts_at)`, `(starts_at)` for date filtering
   - Validation trigger: `starts_at` must be in the future on insert (no CHECK with `now()`)

4. **`profiles`** — minimal (admins only need a row; created via trigger on signup)
   - `id` (uuid pk = auth.users.id), `display_name`, timestamps

5. **`user_roles`** — separate roles table (security best practice)
   - `id`, `user_id` (fk auth.users), `role` (enum `admin | user`), unique(user_id, role)

6. **`app_role`** enum + **`has_role(uuid, app_role)`** security-definer function (used by every admin RLS policy and admin server fn).

### C. Security Guards (RLS) — who sees what

| Shelf       | anon read | authenticated read | write           |
|-------------|-----------|--------------------|-----------------|
| movies      | ✅        | ✅                 | admin only      |
| cinemas     | ✅ (only `is_active=true`) | ✅ | admin only |
| showtimes   | ✅ (only `starts_at >= now() - 6h`) | ✅ | admin only |
| profiles    | ❌        | own row only       | own row         |
| user_roles  | ❌        | ❌ (read via has_role) | service_role only |

Server fn middleware is the primary gate; RLS is the backstop.

### D. ID Check (Authentication)

- **Lovable Cloud Auth**: email + password **and** Google sign-in (via Lovable broker + `configure_social_auth({ providers: ['google'] })`).
- Auto-confirm email **off** (default) — admins verify their email.
- No end-user signup needed; the sign-in form lives only at `/admin/login`. We don't expose signup publicly (or we set `disable_signup: true` and seed the first admin manually).
- `requireSupabaseAuth` middleware + `has_role(auth.uid(), 'admin')` check inside every admin server fn.

### E. Self-service screen (hooks / read path)

TanStack Query is the default read shape:

- `getMoviesByCategoryFn()` → loaders for `/`
- `getMoviesByIdsFn({ ids })` → loaders for `/results`
- `getCinemasForSelectionFn({ movieIds, lat, lng, date })` → returns `CinemaGroup[]` with cinemas sorted by distance then price, **plus the showtimes array per (cinema, movie)** for the requested day. Replaces `getCinemasForMovies` from `cinema-data.ts`.
- `searchMoviesFn({ query })` — server-side title search.

Distance is calculated **server-side** using PostGIS-style haversine in SQL (or Postgres `earthdistance` extension) so we can `ORDER BY distance LIMIT 12` at the DB instead of pulling all cinemas to the client.

### F. Back Room Specialists (server logic)

Per stack rules we use **TanStack `createServerFn`** for app-internal logic — NOT Supabase Edge Functions. The only server-route file is the **public cron endpoint** that pg_cron pings.

Server functions (in `src/lib/*.functions.ts`):
- `syncTmdbCatalog` — internal; pulls Now Playing / Popular / Upcoming from TMDb, upserts into `movies` by `tmdb_id`. Reads `TMDB_API_KEY` from `process.env`.
- `getMoviesByCategory`, `getMoviesByIds`, `searchMovies`, `getCinemasForSelection` — public reads (no auth middleware; use `supabaseAdmin` scoped via SQL).
- Admin (gated by `requireSupabaseAuth` + `has_role` check):
  - `upsertCinema`, `deleteCinema`, `toggleCinemaActive`
  - `createShowtime`, `updateShowtime`, `deleteShowtime`, `bulkCreateShowtimes` (CSV-style for a week)
  - `triggerTmdbSync` (manual button in admin)

Server route (only one, raw HTTP):
- `src/routes/api/public/cron/sync-tmdb.ts` — verifies `apikey` header against the anon key, then calls `syncTmdbCatalog`. Triggered by pg_cron + pg_net nightly at 03:00.

### G. External Vendor connections (APIs & secrets)

- **TMDb** — needs a v4 read-access token. Stored as `TMDB_API_KEY` (server-only secret). Free tier, no per-request cost, ~50 req/s — well within nightly sync.
- **Geolocation** — stays client-side (`navigator.geolocation`). No vendor.
- No paid showtime API (you curate showtimes).

### H. Phased build order (what to build first)

```text
Phase 1  Foundation         migration: movies, cinemas, showtimes, profiles,
                            user_roles, app_role enum, has_role(), trigger,
                            grants, RLS. Seed first admin manually.

Phase 2  TMDb sync           TMDB_API_KEY secret → syncTmdbCatalog server fn
                            + /api/public/cron/sync-tmdb route + pg_cron job.
                            Replace mockMovies.json reads on / with server fn.

Phase 3  Admin panel         /admin/login (email+pw + Google),
                            /admin layout (gated by has_role),
                            /admin/cinemas (CRUD),
                            /admin/showtimes (week-grid editor + bulk paste).

Phase 4  Public results      getCinemasForSelection server fn with SQL haversine
                            + showtimes for active day. Replace mockCinemas + 
                            deterministic-hash logic in /results. Add date picker
                            and time chips in CinemaCard.

Phase 5  Cleanup             Delete src/data/mockMovies.json, mockCinemas.json,
                            and the priceModifier / screensMovie helpers in
                            src/lib/cinema-data.ts. Keep calculateDistanceKm
                            only if still used client-side for display fallback.
```

---

## PHASE 3 — Implementation Plan (TDD, module-by-module)

Each module follows Red → Green → Refactor. After each, I'll give you a preview-mode test script and **wait for your approval** before the next.

### Module 1 — Foundation migration
- Write SQL: enums, `has_role`, all tables, GRANTs, RLS, validation trigger, profile-on-signup trigger.
- Configure auth: email enabled (no auto-confirm), Google enabled via `configure_social_auth`.
- Test: I'll give you SQL snippets to verify in Cloud → SQL editor; you create your admin account; I run `INSERT INTO user_roles` to grant `admin`.

### Module 2 — TMDb sync
- Red: vitest for `syncTmdbCatalog` with mocked `fetch` returning TMDb fixture pages → asserts upsert payload shape.
- Green: implement server fn + `/api/public/cron/sync-tmdb` route + pg_cron schedule.
- Request secret: `TMDB_API_KEY` (I'll tell you exactly where to get it on themoviedb.org).
- Test: from preview, hit the cron URL with the anon key in `apikey` header; verify rows appear via Cloud → Database → movies.

### Module 3 — Public reads + landing/results wiring
- Red: vitest for `getMoviesByCategoryFn`, `getMoviesByIdsFn`, `getCinemasForSelectionFn` using Supabase test client mocks.
- Green: implement server fns; convert `src/routes/index.tsx` and `src/routes/results.tsx` loaders to use `queryClient.ensureQueryData` + `useSuspenseQuery`.
- Test: preview `/` shows real TMDb posters; `/results` is empty (no cinemas yet) — expected.

### Module 4 — Admin panel: login + cinemas CRUD
- Red: component tests for `<CinemaForm>` validation, server-fn tests for `upsertCinema` (admin allowed, non-admin 403).
- Green: `/admin/login`, `_authenticated` layout, `/admin/cinemas` list + form with lat/lng + photo URL.
- Test: log in, add 5 cinemas, see them appear; log out and confirm you can't reach `/admin/cinemas`.

### Module 5 — Admin panel: showtimes editor
- Red: tests for `createShowtime` validation (future date, valid fk), `bulkCreateShowtimes` (parse + insert N rows in one transaction).
- Green: `/admin/showtimes` — pick movie + cinema + date → time chips you add; plus a "bulk paste" mode (CSV of `time,price` lines for a week).
- Test: add showtimes for one cinema + movie for today; verify visible.

### Module 6 — Cinema-card showtime UI + cleanup
- Red: component tests for showtime chips inside `CinemaCard` (date filter, sold-out display, empty state).
- Green: extend `CinemaCard` to show today's showtimes; add a date picker to `/results`; remove mock files + dead helpers in `cinema-data.ts`.
- Test: full flow — pick 3 movies → /results shows real cinemas with today's times sorted by distance.

### Module 7 — Polish
- Skeleton states tied to suspense boundaries.
- Error boundaries on every route with loader.
- Security scan + lint pass.

---

## Technical notes (skip if non-technical)

- Stack rule: app-internal logic = `createServerFn`, NOT Supabase Edge Functions. Only exception is `/api/public/cron/sync-tmdb` (server route, verified via `apikey` header).
- Pg-cron auth pattern uses the anon key in `apikey` header — no custom shared secret.
- Roles live in `user_roles`, never on profiles, accessed via security-definer `has_role` (prevents RLS recursion + privilege escalation).
- Distance/sort happens in SQL with haversine (or `earthdistance` extension) so we paginate at the DB.
- TMDb category mapping: TMDb `now_playing` → `now_showing`, `upcoming` → `coming_soon`, `popular` → `popular`. We store one row per movie; `category` is the *primary* bucket (we'll pick the highest-priority one if a movie appears in multiple feeds).
- All times stored as `timestamptz`; UI displays in user's local zone.

---

**Approve this plan and I'll start with Module 1 (Foundation migration). Reply with any changes before I begin.**
