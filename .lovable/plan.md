
# Cinema Finder MVP — Implementation Plan

Per your workflow constraint, this plan covers **front-end only** with mock data. No backend, no Lovable Cloud, no auth. We build **page by page**, write tests first (Red → Green → Refactor), and stop after each module so you can verify in preview before moving on.

## Design direction

Mobile-first, ~480px max-width centered on desktop. Clean, cinematic aesthetic — dark surfaces with a single warm accent (think movie ticket / theater seating). I'll propose final tokens (oklch palette + typography) at the start of Module 1 and you approve before any component work.

If you'd rather see 2–3 rendered visual directions side-by-side before I commit, say so and I'll generate them.

## Module breakdown (stop-and-test gates)

Each module ends with: tests passing, a short "how to test in preview" note, and a wait for your go-ahead.

### Module 0 — Foundation
- Set up Vitest + React Testing Library + jsdom (co-located `*.test.tsx`)
- Design tokens in `src/styles.css` (oklch palette, typography, radii, motion)
- Mock data files: `mockMovies.json` (~20), `mockCinemas.json` (~40 KL-area), `mockShowings.json` (~150–200)
- Mock service module `src/lib/cinema-data.ts`: `getMovies`, `getCinemasForMovies`, `calculateDistance` (Haversine) — all unit-tested
- Geolocation hook `useUserLocation` with KL city-center fallback — tested with mocked `navigator.geolocation`

### Module 1 — Landing page (`/`)
- Route `src/routes/index.tsx` with route-specific `head()` metadata
- Components (each with co-located tests): `AppHeader`, `SearchBar` (debounced live filter), `MovieRow` (horizontal scroll), `MoviePosterCard` (selection state), `FindCinemasFab` (badge counter, appears on first selection)
- Selection state held in URL query param (`?movies=…`) so back button preserves it
- States: skeleton loading, empty-search fallback ("Popular movies →"), error toast
- **Stop and verify in preview**

### Module 2 — Results page (`/results`)
- Route `src/routes/results.tsx`, reads `movies` from validated search params (zod adapter), back arrow returns to `/` with selection intact
- Components: `ResultsHeader`, `MovieTabBar` (horizontal scroll, one tab per movie), `CinemaCard` (collapsed)
- Sort: distance ascending, then price ascending
- States: skeleton cards, "no cinemas — here are nearby popular cinemas" fallback, location-denied banner, error retry
- **Stop and verify in preview**

### Module 3 — Expanded cinema card
- Inline expand/collapse with height transition (~250ms), single-card-expanded rule (auto-collapses others)
- Full layout: photo (progressive/blur-up load), name, price, distance, full address, description, "~N min drive"
- Image error fallback placeholder
- Auto-scroll to keep expanded card in view
- **Stop and verify in preview**

### Module 4 — Polish pass
- Cross-cutting: toast system (Sonner) wired for location/network errors, back-button selection preservation verified end-to-end, FAB micro-animation, selection scale animation, accessibility sweep (ARIA, focus order, keyboard nav, WCAG AA contrast)
- Final responsive QA at mobile / tablet / desktop widths

## Technical notes

- **Routing:** TanStack Start file-based routes — `src/routes/index.tsx` and `src/routes/results.tsx`. `results.tsx` uses `validateSearch` with `zodValidator` + `fallback` for the `movies` param (comma-separated IDs).
- **State:** No global store. Selection lives in the URL. Expanded-card state is local to the results page. Geolocation cached in a small context provider mounted on `/results`.
- **Testing:** Vitest + RTL, co-located `*.test.tsx` / `*.test.ts`. Red-Green-Refactor enforced — every component and service ships with a failing test written first. `navigator.geolocation` mocked per test.
- **Mock images:** TMDB poster URLs for movies; curated Unsplash/static URLs for cinema photos with placeholder fallback.
- **No backend touched** until you explicitly approve moving past the front-end MVP.

## What I need from you before starting

1. **Go-ahead on the module sequence** above (or tell me to reorder/merge).
2. **Design direction:** commit to my proposed direction (dark cinematic + warm accent) at Module 0, OR ask me to generate 2–3 rendered options first.
3. **Movie list:** OK to use real current titles with TMDB poster URLs? (Alternative: fully fictional titles with generated posters.)
