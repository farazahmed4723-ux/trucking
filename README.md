# STN TRUCKING LTD. — Premium Transportation Platform
### Surrey, Vancouver & Lower Mainland, British Columbia, Canada

[![CI Suite](https://github.com/spn-trucking/website/actions/workflows/ci.yml/badge.svg)](https://github.com/spn-trucking/website/actions)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-gold.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/Node.js-22%2B%20%7C%2024%2B-blue.svg)](https://nodejs.org)

Official full-stack web and dispatch booking platform for **STN TRUCKING LTD.**, serving Surrey, Vancouver, the Lower Mainland, and connecting British Columbia highway corridors. Built with a cinematic dark navy and gold aesthetic, responsive mobile-first layouts, parameter-protected SQLite storage, spam prevention, email/SMS dispatch routing, dynamic filterable vehicle galleries, and a secure backoffice administrative control portal.

---

## 1. Verified Business Details

| Property | Verified Value | Policy & Operational Notes |
| :--- | :--- | :--- |
| **Legal Company Name** | **STN TRUCKING LTD.** | Operating in British Columbia, Canada |
| **Key Executive** | **Abbas**, Managing Director | Direct oversight of dispatch, pricing, and client care |
| **Direct Dispatch Line** | **778-302-8803** | Clickable `tel:7783028803` integrated across site |
| **Official Email** | **stntruckingltd@gmail.com** | Primary correspondence, load manifests, and quote routing |
| **Primary Core Market** | **Surrey, Vancouver, Lower Mainland, BC** | Surrey, Vancouver, Burnaby, Richmond, Delta, Langley, Coquitlam, Abbotsford |
| **Secondary BC Corridors** | **British Columbia Highway Corridors** | Scheduled linehaul (Hwy 1, Hwy 5, Hwy 97) only upon dispatch confirmation |
| **Industry Leadership** | **5+ Years Experience** | Attributed to verified industry experience of Abbas, Managing Director |
| **Production Domain** | Configurable via `APP_DOMAIN` | Default target `https://spntrucking.ca` (configurable until selected) |

> **Transparency Commitment:** No fabricated street addresses, fleet counts, insurance coverage amounts, awards, or fake testimonials are created. All customer reviews are authentic and subject to dispatch verification.

---

## 2. Core Features & Architecture

### Branding & Visual Identity
- **Palette:** Deep navy (`#0B111E`), charcoal (`#161F30`), metallic gold (`#D4AF37`), slate accents, and crisp white.
- **Typography:** Google Fonts (`Plus Jakarta Sans` & `Inter`) with responsive scaling and high-contrast accessibility.
- **Cinematic Hero:** Features high-resolution Surrey/Vancouver bridge and skyline imagery (`assets/surrey-vancouver-skyline-hero.jpg`).
  - **Headline:** *“Your Load. Your Destination. We Deliver.”*
  - **Description:** *“From Small Loads to Long Hauls, We Handle Your Moving, Hauling and Transportation Needs Across Surrey, Vancouver, the Lower Mainland and Beyond.”*
  - **Hero Actions:** *Get a Free Quote*, *Call Us Now (778-302-8803)*, *Explore Our Services*.

### Filterable Vehicle & Service Image Gallery
- Sliced from high-resolution fleet reference cards (`assets/fleet/`):
  1. `fleet_10ft_truck.jpg` — 10 ft Small Truck
  2. `fleet_15ft_truck.jpg` — 15 ft Medium Truck
  3. `fleet_20_26ft_truck.jpg` — 20–26 ft Heavy Box Truck
  4. `fleet_53ft_long_haul.jpg` — 53 ft Long-Haul Tractor-Trailer
  5. `fleet_flatbed_truck.jpg` — Flatbed Truck
  6. `fleet_refrigerated_truck.jpg` — Refrigerated Truck
  7. `fleet_insulated_truck.jpg` — Insulated Cargo Truck
  8. `fleet_beverage_transport.jpg` — Beverage Transportation
  9. `fleet_junk_removal_truck.jpg` — Junk Removal Dump Truck
  10. `fleet_garbage_removal.jpg` — Garbage Removal Vehicle
  11. `fleet_residential_moving.jpg` — Residential Moving Truck
  12. `fleet_commercial_moving.jpg` — Commercial Moving Truck
  13. `fleet_industrial_moving.jpg` — Industrial Moving Truck
  14. `fleet_gardening_yard_cleanup.jpg` — Gardening & Yard Cleanup
  15. `fleet_tools_equipment.jpg` — Tools & Equipment Supply
- **8 Gallery Category Filters:** All Services, Flatbed Trucks, Small Trucks, Long-Haul Trucks, Moving, Junk Removal, Garbage Removal, Yard Cleanup.
- **Interactive Lightbox:** Full-screen zoom modal with image captions and distinction between verified fleet references and illustrative category assets.

### Comprehensive Service Divisions
1. **Flatbed Trucking** (`services-flatbed-trucking.html`): Medium & heavy-duty flatbeds, construction lumber, steel, pipe.
2. **Small Load Transportation** (`services-small-load-transportation.html`): 10'–15' trucks, furniture, appliances, pallet courier.
3. **Long-Haul Transportation** (`services-trucking.html`): Highway tractor-trailers up to 53 ft connecting BC corridors.
4. **Insulated & Refrigerated Transportation** (`services-refrigerated-trucking.html`): Temperature-controlled freight (*subject to confirmed unit availability*).
5. **Beverage Transportation** (`services-beverage-transportation.html`): Palletized beverage freight (*advertised upon business confirmation*).
6. **Junk Removal** (`services-junk-removal.html`): Pickup and dump-body trucks, household junk, mattresses, estate cleanouts.
7. **Garbage Removal** (`services-garbage-removal.html`): Commercial & residential waste carting to authorized transfer stations.
8. **Residential Moving** (`services-residential-moving.html`): House, apartment, and condo relocations with blankets, dollies, and floor protection.
9. **Commercial & Industrial Moving** (`services-commercial-moving.html`, `services-industrial-moving.html`): Office relocations and light machinery (*on confirmation*).
10. **Gardening & Yard Cleanup** (`services-gardening.html`): Green waste, storm branches, leaf bagging, composting carting.
11. **Tools & Equipment Supply** (`services-tool-services.html`): Dollies, ramps, straps (*rentals subject to confirmation*).

### Full-Stack Quote & Booking Engine
- **Unique Reference Numbers:** Automatically generated format `STN-2026-XXXX`.
- **Database Backed:** Saved into SQLite database under `PENDING` review status (quotes are never automatically confirmed).
- **Validation & Spam Defense:**
  - Client and server-side validation.
  - Hidden honeypot field (`website_hp`) silently trapping automated bots.
  - IP-based rate limiting (max 6 quote requests per 10 minutes).
  - Secure file uploads (JPEG, PNG, WEBP, PDF up to 10MB) stored in `/uploads`.
  - Duplicate submission lockout preventing double-clicks.

### Promotions Engine
- **10% Student Discount:** Valid for BC post-secondary students (UBC, SFU, BCIT, KPU, Langara, Douglas College) upon presentation of student ID.
- **10% Statutory Holiday Discount:** Dynamic Pacific Time (`America/Vancouver`) calculation for BC statutory holidays (Family Day, Victoria Day, Canada Day, BC Day, Labour Day, National Day for Truth & Reconciliation, Thanksgiving, Remembrance Day, Christmas).

### Admin Backoffice Portal (`/admin`)
- **Protected by:** Bcrypt hashing, secure HTTP-only cookies/JWT bearer tokens, audit logging.
- **8 Dedicated Modules:**
  1. **Quotes & Bookings:** Filter by status (`ALL`, `PENDING`, `HOLD`, `APPROVED`, `REJECTED`, `RELEASED`), search by customer or reference, apply 48-hour temporary holds, add internal dispatch notes.
  2. **Services Management:** Real-time editing of service titles, descriptions, icons, image URLs, service area designations, and confirmation notes.
  3. **Fleet Specifications:** Update truck dimensions, payload capacities, and display order.
  4. **Gallery & Hero Management:** Upload and manage gallery imagery, toggle hero status, flag verified fleet vs illustrative imagery.
  5. **Promotions:** Configure discount percentages, active terms, and promotional banners.
  6. **Settings & Local SEO:** Edit core contact info, company description, and target search phrases.
  7. **Customer Reviews Moderation:** Approve, feature, or remove submitted reviews.
  8. **Audit Trail & Notifications:** Inspect chronological logs of every admin status transition and dispatch notification.

---

## 3. Technology Stack

- **Runtime:** Node.js v22+ or v24+
- **Backend Framework:** Express.js 5
- **Database Engine:** SQLite via Node.js built-in `node:sqlite` (`DatabaseSync` - zero compilation, WAL mode, parameter-bound queries)
- **Security:** Helmet, CORS, Multer, Bcrypt.js, JsonWebToken
- **Notifications:** Nodemailer (SMTP) & Twilio REST API
- **Testing:** Node.js native test runner (`node --test test/api.test.js`) & Supertest

---

## 4. Local Setup & Development

### Prerequisites
- Node.js v22.5.0+ or v24+
- npm v10+

### Steps

1. **Clone repository:**
   ```bash
   git clone https://github.com/spn-trucking/website.git
   cd website
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` to provide secure secrets:
   ```env
   PORT=3000
   NODE_ENV=development
   APP_DOMAIN=http://localhost:3000
   JWT_SECRET=super-secret-jwt-key-min-32-chars-long
   ADMIN_DEFAULT_USER=admin
   ADMIN_DEFAULT_PASS=SPNAdmin2026!
   ```

4. **Run database migrations (automatic on server start):**
   ```bash
   node -e "require('./db/database')"
   ```

5. **Start development server:**
   ```bash
   npm start
   ```
   Navigate to `http://localhost:3000` (Public site) or `http://localhost:3000/admin` (Admin dashboard).

---

## 5. Automated Testing

Run the automated test suite covering health checks, quote validation, honeypot mitigation, review moderation, admin authentication, CRUD endpoints, and dynamic SEO sitemaps:

```bash
npm test
```
*or directly:*
```bash
node --test test/api.test.js
```

---

## 6. Local SEO & Optimization

Optimized for target BC search phrases:
- *moving company Surrey*
- *residential movers Vancouver*
- *commercial moving BC*
- *small load delivery Surrey*
- *flatbed trucking BC*
- *long haul trucking British Columbia*
- *junk removal Surrey*
- *junk removal Vancouver*
- *garbage removal Lower Mainland*
- *yard cleanup Surrey*

Dynamic & static endpoints:
- Sitemap: `/sitemap.xml` (includes all 17 public pages)
- Robots: `/robots.txt` (allows search crawlers, protects `/admin` and `/api/`)
- Structured Data: `LocalBusiness` / `AutomotiveBusiness` schema with verified contact info.

---

## 7. Deployment Instructions

### Option A: Render.com (Recommended Full-Stack)
1. Link your GitHub repository in the Render dashboard.
2. Select **Web Service**, Node runtime.
3. Configure settings via `render.yaml` or manually:
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Set Environment Variables:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: (generated random 32+ char key)
   - `ADMIN_DEFAULT_PASS`: (strong password)
   - `APP_DOMAIN`: `https://your-custom-domain.ca`
   - `SMTP_USER`, `SMTP_PASS`, `NOTIFICATION_EMAIL`

### Option B: Docker / Container
Build and run the containerized application:
```bash
docker build -t spn-trucking .
docker run -d -p 3000:3000 -v $(pwd)/data:/app/data --name spn-trucking-app spn-trucking
```

---

## 8. Credentials & Admin Access

- **Admin Portal URL:** `/admin`
- **Default Username:** `admin` (or `ADMIN_DEFAULT_USER` in `.env`)
- **Default Password:** Set via `ADMIN_DEFAULT_PASS` (default fallback `SPNAdmin2026!`)

---

## 9. License & Integrity

© 2026 STN TRUCKING LTD. All rights reserved.
Operating in British Columbia, Canada.
