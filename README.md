***Generated using Vibe Coding (Lovable + Claude)

# 🎬 Cinema Finder

> Find the best cinema for tonight — fastest, cheapest, nearest. No accounts, no fuss.

Cinema Finder is a mobile-first web app that helps users decide where to watch a movie without the hassle of opening multiple cinema websites. Pick the movies you want to watch, and instantly see a list of nearby cinemas sorted by distance and price.

---

## 🧩 The Problem

Booking a cinema ticket today means hopping between TGV, GSC, MBO, and other sites just to compare prices and locations. It's slow, repetitive, and there's no easy way to see all options side by side.

## 💡 The Solution

A single, lightweight app where you:

1. Browse or search for movies you want to watch
2. Multi-select your picks
3. Instantly see cinemas screening those movies — sorted by distance and price
4. Tap a cinema card to see photo, address, description, and travel time

---

## ✨ Key Features

- **Multi-movie selection** — Pick several movies and compare cinemas for each
- **Smart sorting** — Cinemas ranked by distance (nearest first) then price (cheapest first)
- **Tabbed results** — One tab per selected movie for quick comparison
- **Expandable cinema cards** — View full details inline without losing your place
- **Smart fallbacks** — Never a dead end; if a movie has no matches, popular nearby cinemas are shown instead
- **Location-aware** — Uses device geolocation for accurate travel distance (with a sensible fallback if denied)
- **No accounts required** — Open the app, find a cinema, done

---

## 📱 User Flow

```
Landing (movie selection)
    │
    │  ─ Browse horizontal rows: Now Showing, Coming Soon, Popular
    │  ─ Or search by title
    │  ─ Multi-select movie posters
    │
    ▼
Tap floating "Find Cinemas" button
    │
    ▼
Results page
    │
    │  ─ Tab per selected movie
    │  ─ Sorted cinema list (distance + price)
    │  ─ Tap card to expand inline details
    │
    ▼
Pick your cinema
```

---

## 🗂️ App Structure

The app has only **two routes** to keep the experience focused:

| Route | Purpose |
|-------|---------|
| `/` | Landing page — movie selection |
| `/results` | Cinema results, with tab per selected movie |

---

## 📊 Mock Data

The MVP runs on a curated, static dataset:

- **~20 movies** with real titles and poster URLs
- **~40 cinemas** with authentic Malaysian names (TGV, GSC, MBO, LFS, etc.) concentrated in the Klang Valley
- **~150–200 showings** linking cinemas to movies at varied prices

Distance is calculated using the Haversine formula against the user's geolocation (or a default Kuala Lumpur city-center fallback).

---

## 🎯 Target Users

Casual moviegoers in the Kuala Lumpur and Klang Valley area who want a fast, frictionless way to compare cinema options before heading out.

---

## 📦 MVP Scope

**In scope:**
- Mobile-first responsive UI
- Movie browsing + search
- Multi-movie selection
- Cinema comparison with sorting
- Expandable cinema details
- Geolocation-based distance
- Mock data only

**Out of scope (for now):**
- User accounts, login, profiles
- Saved cinemas / favorites
- Real cinema API integration
- Actual ticket booking
- Showtime selection
- Reviews or ratings
- Personalization

---

## 🛣️ Future Enhancements

- Swap mock data for live cinema APIs
- Add showtime listings per cinema
- Allow ticket booking redirection
- User accounts for saved preferences
- Push notifications for new releases
- Movie reviews and ratings integration

---

## 📝 License

MIT — feel free to use, modify, and learn from this project.
