# Güngören FK – Product & Tech Plan

## 1. What This Site Will Do (Summary)

| Area | What we do |
|------|------------|
| **Public site** | Club identity, news, matches, squad, photos, fan zones. Responsive (mobile, tablet, desktop). Ready to behave like an app later (PWA). |
| **Visitor / fan registration** | Anyone entering (e.g. “rakip taraftar” or general visitors) can register. We store who they are and where they’re from (city, region). |
| **Data for strategy** | Admin sees meaningful analytics: e.g. 81 cities in Turkey, which city supports which “taraf/parti”, so the district team can plan strategy (which city, which audience). |
| **Fans’ own areas** | Logged-in or segmented fans get a dedicated area (e.g. “Taraftar alanı”) with relevant content and maybe later loyalty/benefits. |
| **Match scores & data** | Show the team’s matches and scores. Ideally pull from an API; if no API for amateur league, we use manual input + optional future API. |
| **Rich content** | Matches, photos, squad (kadro), news – strong, easy-to-update content. |

---

## 2. Feature Ideas (What We Can Do)

### 2.1 Core features

- **Home**: Hero, next match, latest news, short squad highlight, CTA to register or fan area.
- **Matches**: List and detail; score, date, opponent, venue, result. Source: API if available, else admin input.
- **Squad (Kadro)**: Players with photo, name, number, position, bio.
- **News / Haberler**: Articles with image, title, excerpt, date, category.
- **Gallery**: Photos by event/match/season.
- **Fan registration**: Form (city, name, contact, optional “taraf/parti” or fan group). Stored in DB; admin can analyse by city/region.
- **Fan area (Taraftar alanı)**: After login or “member” check, show exclusive content (e.g. behind-the-scenes, special news, loyalty later).

### 2.2 Strategy & analytics (admin)

- **81 cities**: Registration and engagement by city (dropdown: 81 il). **Taraf/parti alanı yok** – sadece memleket ve ikamet.
- **Dashboards**: Counts, charts (e.g. registrations per city, per month), export for strategy meetings.

### 2.3 Match score API (reality check)

- **Professional leagues**: APIs exist (e.g. API-Football, Football-Data.org) but often paid and for pro leagues.
- **Amateur / district leagues**: Usually no public API. Options:
  1. **Manual input**: Admin panel to add/edit matches and scores (reliable, we do this first).
  2. **Scraping / custom integration**: If a federation or league site publishes results, we could later build a small scraper or use their feed if they offer one.
  3. **Third-party API**: If you find a Turkish amateur league API or open data source, we plug it in later.

So: we **design for “match” and “score” in our own database** and an admin UI to manage them; we add an API integration when a concrete source is available.

### 2.4 Content strength

- **Matches**: Clear layout, filters (season, competition), optional “live” badge.
- **Squad**: Grid/list with photos and roles.
- **Photos**: By album (match, event, season); lightbox.
- **News**: Categories, featured image, SEO-friendly URLs.

---

## 3. Tech Stack & Infrastructure (Latest, App-Ready)

We already have: **Next.js 16**, **Supabase**, **Vercel**, **TypeScript**, **Tailwind**.

| Layer | Choice | Why |
|-------|--------|-----|
| **Frontend** | Next.js App Router, React, TypeScript | SSR, SEO, one codebase for web and future app-like experience. |
| **Styling** | Tailwind CSS | Fast, responsive, easy theming. |
| **DB & Auth** | Supabase (Postgres + Auth) | Data, future login for fan area, real-time if needed. |
| **Hosting** | Vercel | Push = deploy, serverless, edge. |
| **Responsive** | Mobile-first, breakpoints | All writings and UI work on phone, tablet, desktop (you said “VD” and tablet – we treat as viewport/device). |
| **Future app** | PWA-ready setup | Next.js + manifest + service worker later; same codebase can be “installed” as app. |

We’ll keep:

- **One codebase** for web (and later PWA).
- **API routes** in Next.js for any custom endpoints (e.g. match feed for future app).
- **Environment-based config** so we can add staging/production and later app-specific builds if needed.

---

## 4. Data Model (Supabase) – First Version

### 4.1 Tables (high level)

- **cities**  
  - id, name_tr, plate_no (81 il).  
  - Optional: region for grouping.

- **registrations** (visitor/fan sign-ups)  
  - id, name, email/phone, city_id, fan_group_or_party (optional), source, created_at.  
  - Gives: “who came from which city” and “which taraf/parti”.

- **matches**  
  - id, opponent_name, home_away, venue, match_date, competition, season, goals_for, goals_against, status, created_at.  
  - Scores = goals_for, goals_against. API can fill this later or admin only.

- **squad** (kadro)  
  - id, name, shirt_number, position, photo_url, bio, order, is_active, created_at.

- **news**  
  - id, title, slug, excerpt, body, image_url, category, published_at, created_at.

- **galleries**  
  - id, title, slug, event_date, created_at.

- **gallery_photos**  
  - id, gallery_id, image_url, caption, order.

- **users** (Supabase Auth)  
  - For admin and later for “fan area” login (optional: link to registrations).

We’ll add **Row Level Security (RLS)** and an **admin** role so only admins see sensitive data and edit content.

---

## 5. Admin Panel (Strategy & Content)

- **Dashboard**: KPIs (registrations, by city, by time); simple charts (e.g. city distribution).
- **Registrations**: List, filter by city / fan group, export CSV (for strategy meetings).
- **81 cities view**: Count per city; “which city → which party/taraf” if we store that.
- **Matches**: CRUD; bulk import later if API exists.
- **Squad, News, Galleries**: CRUD with rich forms and images (Supabase Storage).

Auth: Supabase Auth; admin users in a dedicated table or role so only they can access `/admin`.

---

## 6. Fan Area (Taraftar alanı)

- **Who gets in**: Option A – anyone with a link. Option B – only registered (we have their city/group). Option C – login (Supabase Auth) later.
- **What they see**: Exclusive news, maybe match reminders, photos, and later loyalty or rewards.
- We design the **route and permissions** so we can switch from “open link” to “login required” without changing the whole structure.

---

## 7. Responsive & “App Tomorrow”

- **Responsive**: All text and UI readable and usable on mobile, tablet, desktop (breakpoints: e.g. 640, 768, 1024, 1280).
- **Touch-friendly**: Buttons and links sized for fingers on tablet/phone.
- **PWA later**: We’ll add `manifest.json` and service worker so the site can be “Add to Home Screen” and behave like an app; same codebase, no separate app repo for now.

---

## 8. Suggested Order of Work (After We Agree)

1. **Supabase**: Create tables (cities, registrations, matches, squad, news, galleries, gallery_photos); seed 81 cities; RLS.
2. **Public site**: Home, layout, nav, footer (responsive). Then: Matches (list/detail), Squad, News (list/detail), Gallery.
3. **Registration**: Form (city dropdown from 81, name, contact, optional group); save to `registrations`; thank-you page.
4. **Admin**: Auth + dashboard; registrations list and city analytics; matches/squad/news/gallery CRUD.
5. **Match scores**: Admin form first; later optional API or scraper.
6. **Fan area**: Dedicated area (content + optional login later).
7. **PWA**: Manifest + service worker when the main site is stable.

---

## 9. What I Need From You Before We Start Coding

1. **Confirm**: Does this plan match what you want (especially: “opponent entering = recorded”, 81 cities, strategy by city/party, fan area, match scores)?
2. **Fan group / “parti”**: Is this a political party, a fan group name, or something else? So we name the field correctly.
3. **Match data**: Do you have a specific site or API for your amateur league scores, or should we go 100% admin input for now?
4. **Content**: Do you already have logo, colours, and sample text (e.g. “Güngören FK – resmi site”) so we can design the first page properly?

Once you confirm and answer these, we start with the infrastructure (DB + 81 cities) and the first pages. We’ll use the latest stack we set up and keep everything ready for push-to-publish and future app.
