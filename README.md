# SPN Trucking Ltd. — Production Web & Dispatch Platform
### Calgary, Alberta, Canada

[![CI Suite](https://github.com/spn-trucking/website/actions/workflows/ci.yml/badge.svg)](https://github.com/spn-trucking/website/actions)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-gold.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/Node.js-22%2B%20%7C%2024%2B-blue.svg)](https://nodejs.org)

Official full-stack web and dispatch booking platform for **SPN Trucking Ltd.**, serving the Greater Calgary Region and Western Canadian transport corridors. Built with a high-end luxury dark aesthetic, responsive mobile-first layouts, parameter-protected SQLite storage, spam prevention, email/SMS dispatch routing, and a backoffice administrative control portal.

---

## 1. Verified Business Details

| Property | Verified Value | Policy & Notes |
| :--- | :--- | :--- |
| **Legal Company Name** | **SPN Trucking Ltd.** | Registered in Alberta, Canada |
| **Key Executive** | **Abbas**, Managing Director | Direct oversight of all dispatch operations |
| **Dispatch Line** | **778-302-8803** | Clickable `tel:7783028803` integrated across site |
| **Business Email** | **stntruckingltd@gmail.com** | Primary customer correspondence & quote routing |
| **Primary Core Market** | **Calgary, Alberta, Canada** | NW, SW, NE, SE, Airdrie, Cochrane, Okotoks, Chestermere |
| **Secondary Corridor** | **Lower Mainland & BC Corridor** | Scheduled linehaul & inter-provincial runs (by inquiry) |
| **Industry Leadership** | **5+ Years Experience** | Attributed to Managing Director Abbas |
| **Production Domain** | Configurable via `APP_DOMAIN` | Target domain pending final business registration |

---

## 2. Core Features & Capabilities

- **Luxury Dark Aesthetic:** Deep navy `#0B111E` & charcoal backgrounds, metallic gold accents (`#D4AF37`), Google Fonts (`Plus Jakarta Sans` & `Inter`), and high-resolution Calgary and highway imagery.
- **Hero Directives:**
  - **Exact Headline:** *“Your Load. Your Destination. We Deliver.”*
  - **Exact Supporting Copy:** *“From Small Loads to Long Hauls, We Handle Your Moving, Hauling and Transportation Needs Across Calgary and Beyond.”*
  - **Hero Actions:** *Get a Free Quote*, *Call Us Now (778-302-8803)*, *Explore Our Services*.
- **Comprehensive Service Divisions:**
  1. Residential Moving (`services-residential-moving.html`)
  2. Commercial Moving (`services-commercial-moving.html`)
  3. Industrial Moving (`services-industrial-moving.html`)
  4. Small Load Transportation (`services-small-load-transportation.html`)
  5. Long-Haul Trucking up to 53 ft (`services-trucking.html`)
  6. Flatbed Trucking (`services-flatbed-trucking.html`)
  7. Refrigerated & Beverage Transportation (`services-refrigerated-trucking.html`)
  8. Junk Removal (`services-junk-removal.html`)
  9. Garbage Removal (`services-garbage-removal.html`)
  10. Gardening & Yard Cleanup (`services-gardening.html`)
  11. Tools & Equipment Supply (`services-tool-services.html`)
- **Promotional Engines:**
  - **10% Calgary Student Discount:** Year-round discount for students at U of C, MRU, SAIT, and Bow Valley College.
  - **10% Statutory Holiday Discount:** Automatic detection engine for Canadian & Alberta holidays (Family Day, Victoria Day, Canada Day, Heritage Day, Labour Day, Thanksgiving, etc.).
- **Full-Stack Quote & Booking Engine:**
  - Unique sequential reference generation (`SPN-2026-XXXX`).
  - Secure photo uploads (JPEG, PNG, WEBP, PDF up to 5MB).
  - Honeypot spam defense + IP-based rate limiting (max 6 requests per 10 mins).
  - Duplicate detection preventing repeated clicks.
  - Status management: `PENDING`, `HOLD` (with expiration countdown), `APPROVED`, `REJECTED`, `RELEASED`.
  - Comprehensive audit trail recording every state change.
- **Authentic Customer Reviews System:**
  - Strict authenticity policy: zero fake review generation or fabricated counts.
  - Public submission modal that queues feedback into the admin moderation panel.
  - Public display renders approved reviews only.
- **Complete Admin Portal (`/admin`):**
  - Protected by Bcrypt password verification and JWT token authorization.
  - Real-time KPI counters (Total Quotes, Pending, Active Holds, Approved Bookings).
  - Quote viewer with customer details, photos, status change buttons, and internal notes.
  - Review moderation (Approve, Hide, Delete, Add Verified).
  - Site Settings and SEO metadata editor.
  - Notification delivery logs and system audit trail.

---

## 3. Technology Stack

- **Runtime:** Node.js v22+ or v24+
- **Backend Framework:** Express.js 5
- **Database:** SQLite via Node.js native `DatabaseSync` (zero compilation, WAL mode, ACID compliant)
- **Security:** Helmet, CORS, Multer, Bcrypt.js, JsonWebToken
- **Notifications:** Nodemailer (SMTP) & Twilio REST API
- **Testing:** Node.js native test runner (`node --test`) & Supertest

---

## 4. Quick Start & Local Setup

### Prerequisites
- Node.js v22.5.0+ or v24+
- npm v10+

### Installation Steps

1. **Clone the repository:**
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
   *Edit `.env` to configure your admin password, JWT secret, and notification credentials.*

4. **Run automated test suite:**
   ```bash
   npm test
   ```
   *Verifies health endpoint, quote validation, duplicate detection, honeypot, authentication, and status workflow.*

5. **Start development/production server:**
   ```bash
   npm start
   ```
   The site will be live at:
   - **Public Site:** [http://localhost:3000](http://localhost:3000)
   - **Admin Backoffice:** [http://localhost:3000/admin](http://localhost:3000/admin)
   - **Default Admin Username:** `admin`
   - **Default Admin Password:** Value of `ADMIN_DEFAULT_PASS` in `.env` (default: `SPNAdmin2026!`)

---

## 5. Environment Variables Guide

| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `PORT` | Listening server port | `3000` |
| `NODE_ENV` | Application environment mode | `production` |
| `APP_DOMAIN` | Production base URL for canonical tags & sitemap | `https://spntrucking.ca` |
| `JWT_SECRET` | 32+ character key for signing admin session tokens | `your-secure-random-jwt-key` |
| `ADMIN_DEFAULT_USER` | Initial admin username (seeded on first run) | `admin` |
| `ADMIN_DEFAULT_PASS` | Initial admin password (seeded on first run) | `YourSecurePassword2026!` |
| `DB_PATH` | Path to persistent SQLite database | `./data/spn_trucking.db` |
| `NOTIFICATION_EMAIL` | Destination email for new quote alerts | `stntruckingltd@gmail.com` |
| `NOTIFICATION_PHONE` | Destination SMS line for urgent alerts | `778-302-8803` |
| `SMTP_HOST` | Outgoing SMTP mail server | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username | `stntruckingltd@gmail.com` |
| `SMTP_PASS` | SMTP App Password (from Google Account) | `xxxx-xxxx-xxxx-xxxx` |
| `TWILIO_ACCOUNT_SID` | Optional: Twilio Account SID for SMS | `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TWILIO_AUTH_TOKEN` | Optional: Twilio Auth Token | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TWILIO_PHONE_NUMBER`| Optional: Twilio originating number | `+17783028803` |

*Note on Notifications: If SMTP or Twilio credentials are not set, the platform will continue running normally. New quote requests will be logged in `notifications_log` with status `PENDING_CONFIGURATION` without crashing or falsely claiming external delivery.*

---

## 6. Production Deployment Instructions

### Option A: Turnkey Docker Deployment
1. Build and run via Docker Compose:
   ```bash
   docker compose up -d --build
   ```
2. Your persistent data will be saved in `./data` and uploaded media in `./uploads`.

### Option B: Cloud Hosting (Render, Railway, DigitalOcean App Platform)
1. Link your GitHub repository to Render or Railway.
2. Select **Node** environment.
3. Set **Build Command:** `npm install`
4. Set **Start Command:** `node server.js`
5. Attach a persistent disk mapped to `/app/data` and `/app/uploads` so quotes and uploaded images survive re-deploys.
6. Configure the Environment Variables from your `.env` file in the hosting dashboard.

### Option C: Connecting Custom Domain & SSL
1. In your domain registrar (e.g., Cloudflare, GoDaddy, Namecheap):
   - Add a `CNAME` record pointing `www` to your cloud service domain (e.g. `spn-trucking.onrender.com`).
   - Add an `A` record pointing root `@` to the provided IP address.
2. In your hosting platform settings, add `spntrucking.ca` and enable automatic Let's Encrypt SSL.
3. Update `APP_DOMAIN=https://spntrucking.ca` in your environment variables.

---

## 7. Google Search Console & SEO Checklist

1. **Verify Site in Google Search Console:**
   - Log into [Google Search Console](https://search.google.com/search-console).
   - Add property `https://spntrucking.ca`.
   - Choose DNS TXT record verification or HTML meta tag verification.
2. **Submit Sitemap:**
   - Go to **Sitemaps** in Google Search Console.
   - Enter `sitemap.xml` and submit (dynamically served at `https://spntrucking.ca/sitemap.xml`).
3. **Structured Data Validation:**
   - Test `index.html` via the [Google Rich Results Test](https://search.google.com/test/rich-results) to verify `MovingCompany` schema.

---

## 8. License & Confidentiality

© 2026 SPN Trucking Ltd. All rights reserved. Registered in Alberta, Canada.  
Proprietary software developed exclusively for SPN Trucking Ltd.
