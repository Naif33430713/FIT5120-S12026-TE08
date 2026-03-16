## FIT5120-S12026-TE08 – SunShield UV Protection Web App

### Problem this project tackles

In Australia, Gen Z and Gen Alpha are increasingly abandoning sun‑safety habits in favour of a "dangerous" tanning trend that prioritises aesthetic tan lines over long‑term health. Severe sunburns are being intentionally pursued for a viral, sun‑kissed look, fuelled by social media algorithms and a sense of invincibility. This turns sun damage into a status symbol rather than a warning sign of melanoma and premature ageing, making it harder for traditional public health messaging to cut through.

This project explores how a digital experience can **raise awareness and nudge young adults to rethink their relationship with UV exposure**, by turning abstract UV risk into clear, personalised, and actionable protection advice.

---

### What this web app delivers

At a high level, the app is a **UV protection dashboard** that:

- **Reads the current UV conditions** for a chosen location via the OpenWeatherMap One Call 3.0 API.
- **Translates UV levels into human‑readable risk messages**, using evidence‑based guidance rules (derived from Cancer Council Australia guidelines) stored in a database.
- **Displays today's peak UV index**, its risk label, and the approximate hour it occurs.
- **Shows a 5‑day weather forecast strip** with weather conditions, max temperature, and daily UV index.
- **Renders an interactive map** (Leaflet + OpenStreetMap tiles) centred on the chosen location.
- **Recommends sunscreen dosage and re‑application timing** tailored to the current UV conditions.
- **Recommends protective clothing** based on the same UV guidance.
- **Lets users set and manage sunscreen reminders**, which are persisted on the backend and delivered to the browser as notifications.
- **Provides typeahead search suggestions** (via Nominatim / OpenStreetMap geocoding) filtered to Australian locations.

The experience is optimised for young adults: quick sign‑in with Google, type a city or use current location, and immediately see "what should I do right now to protect myself?" rather than abstract health messaging.

---

### Data sources

| Source | What it provides | Used in |
|---|---|---|
| [OpenWeatherMap One Call API 3.0](https://openweathermap.org/api/one-call-3) | Current UV index, hourly & daily forecast (UV, temperature, weather conditions, sunrise/sunset) | `backend/routes/uv.js` |
| [Nominatim / OpenStreetMap](https://nominatim.openstreetmap.org/) | Free, open geocoding – powers the typeahead location search | `frontend/src/views/Dashboard.vue` |
| [OpenStreetMap tiles](https://www.openstreetmap.org/) (via Leaflet) | Base map imagery rendered on the dashboard | `frontend/src/views/Dashboard.vue` |
| [Cancer Council Australia – SunSmart](https://www.cancer.org.au/cancer-information/causes-and-prevention/sun-safety) | Evidence‑based sun protection guidance: sunscreen SPF/dosage, clothing, re‑application intervals, risk categories | `UVGuidance` database table (seeded SQL) |
| [WHO UV Index classification](https://www.who.int/news-room/questions-and-answers/item/radiation-the-ultraviolet-(uv)-index) | UV risk thresholds (Low 0–2, Moderate 3–5, High 6–7, Very High 8–10, Extreme 11+) | `UVGuidance` table / `backend/routes/uv.js` |

---

### User stories and how the current implementation satisfies them

#### US1.1 – Real‑Time UV Level Alerts (AC1: View UV Information)

- **Given** the user is on the homepage and wants to check UV conditions for a particular location  
- **When** the user inputs a valid location in the search box on the dashboard  
- **Then** the system displays:
  - The **current UV index** for that location.
  - Its **risk category and colour**.
  - A **human‑readable warning/advice message** based on that UV index.
  - **Today's peak UV index**, its risk label, and approximate time.
  - A **5‑day forecast strip** showing weather, max temperature, and UV index per day.
  - An **interactive map** centred on the selected location.

**How the code implements this**

- On the **Dashboard** (`/dashboard`, `frontend/src/views/Dashboard.vue`):
  - The user enters a city name (typeahead suggestions from Nominatim filter to Australian locations) or chooses **Use My Location**.
  - On suggestion selection or manual search, the frontend resolves coordinates, then calls the backend:
    - `GET /api/uv?lat={lat}&lon={lon}` (`backend/routes/uv.js`).
  - The dashboard shows:
    - `uvData.uv_index` (current UV Index value) and `uvData.peak_uv_index` / `uvData.peak_uv_label` / `uvData.peak_uv_time`.
    - `uvData.risk_level` and a colour derived from `getUVColor(uvData.uv_index)`.
    - Textual guidance fields (`clothing`, `sunscreen`, `reapply_minutes`).
    - Forecast strip from `uvData.forecast` (5 daily entries).
    - Leaflet map initialised/updated at the resolved lat/lon.

- On the **Backend** (`backend/routes/uv.js`):
  - Calls the **OpenWeatherMap One Call API 3.0** (`data/3.0/onecall`) using `OPENWEATHER_API_KEY`.
  - Reads `current.uvi` for the live UV index.
  - Scans up to 24 hours of hourly data to find the daily UV peak hour.
  - Returns `daily[0..4]` as the forecast array with `dt`, `weather_id`, `max_temp`, and `uvi`.
  - Looks up a matching guidance rule in the `UVGuidance` table based on `uv_min`/`uv_max`.
  - Returns a JSON payload: `uv_index`, `risk_level`, `clothing`, `sunscreen`, `reapply_minutes`, `peak_uv_index`, `peak_uv_label`, `peak_uv_time`, `forecast`, `temperature`, `max_temperature`, `sunrise`, `sunset`, `weather_id`, `timezone`.

This behaviour satisfies **US1.1 / AC1 View UV Information**.

#### US3.1 – Sunscreen Dosage Recommendation (AC1: View Sunscreen Advice)

- **Given** the user is on the dashboard after entering their location and wants sunscreen dosage recommendations  
- **When** the user views the **sun protection recommendations** section of the dashboard  
- **Then** the system displays a **sunscreen dosage recommendation based on the current UV index** for that location.

**How the code implements this**

- `UVGuidance` rows in the database include `sunscreen_dosage_text` and `reapply_minutes`.
  - Guidance text is aligned with **Cancer Council Australia SunSmart** recommendations (SPF 50+, teaspoon/pump amounts, re‑application intervals).
- `/api/uv` returns:
  - `sunscreen`: sunscreen dosage/advice text (`sunscreen_dosage_text`).
  - `reapply_minutes`: recommended re‑application interval.
- The dashboard (`Dashboard.vue`) binds these fields into:
  - **🧴 Sunscreen Advice:** `uvData.sunscreen`  
  - **⏱ Reapply Every:** `uvData.reapply_minutes` minutes

Together, this fulfils **US3.1 / AC1 View Sunscreen Advice**.

#### US3.2 – Sunscreen Reminder (AC1: Reminder, AC2: Disable Reminder)

- **AC1 – Reminder**  
  - **Given** the user has applied sunscreen and wants to track re‑application  
  - **When** the user enables the **sunscreen application reminder**  
  - **Then** the system schedules a reminder.

- **AC2 – Disable Reminder**  
  - **Given** sunscreen reminders are enabled  
  - **When** the user disables the reminder feature  
  - **Then** the system stops sending reminder notifications.

**How the code implements this**

- On the **Dashboard** (`Dashboard.vue`):
  - When UV guidance has been loaded, the user can:
    - Click **🔔 Enable Reminder** → calls `enableReminder()`:
      - Requests permission for browser **Notifications**.
      - Sends a `POST /api/reminder` with `interval_minutes` from the UV guidance.
      - Starts a browser‑side timer that fires `new Notification("Sunscreen Reminder", { body: "Time to reapply sunscreen ☀" })` at that interval.
      - Sets `reminderEnabled = true`.
    - Click **🔕 Disable Reminder** → calls `disableReminder()`:
      - Clears the browser timer.
      - Sends `POST /api/reminder/disable` to mark reminders **inactive** in the database.
      - Sets `reminderEnabled = false`.
  - On mount, the dashboard calls `GET /api/reminder` and, if there is an active reminder for the logged‑in user, re‑enables the timer locally.

- On the **Backend** (`backend/routes/reminder.js`):
  - `GET /api/reminder`  
    - Requires an authenticated user (`req.user`).  
    - Returns the user's active reminder record, if any.
  - `POST /api/reminder`  
    - Validates `interval_minutes` and the authenticated user.  
    - Creates a `Reminder` row with `interval_minutes`, `is_active = true`, `next_trigger_time` and `status = "active"`.
  - `POST /api/reminder/disable`  
    - Marks all reminders for that user as `is_active = false`, `status = "disabled"`.

This satisfies **US3.2 / AC1‑AC2 Reminder** in terms of enabling/disabling reminders and persisting that choice.

> **Note:** Actual reminder *delivery* is implemented via **browser notifications**, not server‑side push services or cron jobs. The backend persists the reminder configuration and its status.

#### US3.3 – Clothing Recommendation (AC1: View Clothing Advice)

- **Given** the user is on the dashboard after entering their location and wants clothing recommendations for sun protection  
- **When** the user views the **sun protection section** of the dashboard  
- **Then** the system displays **clothing recommendations based on the UV index** for that location.

**How the code implements this**

- `UVGuidance` rows include `clothing_text` (aligned with Cancer Council Australia guidelines).
- `/api/uv` returns `clothing: guidance.clothing_text`.
- The dashboard (`Dashboard.vue`) shows:
  - **👕 Clothing Advice:** `uvData.clothing`

This fulfils **US3.3 / AC1 View Clothing Advice**.

---

### High‑level architecture

- **Frontend** – Vue 3 + Vite SPA (`frontend/`)
  - Route: `/` (UV Protection Dashboard homepage).
  - Talks to the backend via Axios with `baseURL` from `VITE_API_BASE_URL`.
  - Uses the **Geolocation API**, **Nominatim geocoding API**, **Leaflet** (interactive maps), and **Web Notifications API** in the browser.

- **Backend** – Express server (`backend/server.js`)
  - Listens on port **3000**.
  - Handles CORS for the configured frontend origin.
  - Exposes routes:
    - `/api/uv` – UV + guidance endpoint (OpenWeatherMap One Call 3.0).
    - `/api/reminder` / `/api/reminder/disable` – reminder persistence.
    - `/api/onboarding` – onboarding/health‑check endpoint.
    - `/test` – simple health check.

- **Database** – PostgreSQL via Prisma (`backend/prisma/schema.prisma`)
  - `UVGuidance` – UV ranges and their associated risk level, clothing, sunscreen dosage, and reapply minutes (seeded from Cancer Council / WHO guidance).
  - `User` – Google OAuth user profiles.
  - `Reminder` – user reminder preferences and status.

---

### Tech stack

- **Frontend**
  - Vue 3 (`vue`)
  - Vite (`vite`) dev server/build tool
  - Vue Router (`vue-router`)
  - Axios (`axios`) for backend HTTP calls
  - Leaflet (`leaflet`) for interactive maps

- **Backend**
  - Node.js / Express (`express`)
  - CORS (`cors`)
  - Sessions (`express-session`)
  - Passport + Google OAuth 2.0 (`passport`, `passport-google-oauth20`)
  - Prisma ORM (`@prisma/client`, `prisma`)
  - Axios for server‑side HTTP calls to OpenWeatherMap

- **Database**
  - PostgreSQL

- **External APIs / Services**
  - OpenWeatherMap One Call API 3.0 (UV index, weather, forecast)
  - Nominatim / OpenStreetMap (geocoding, location typeahead)
  - OpenStreetMap tiles via Leaflet (map rendering)

---

### Repository structure (simplified)

- `frontend/`
  - `src/main.js` – Vue app entrypoint.
  - `src/router/index.js` – routes for Login, Dashboard, and About.
  - `src/views/Login.vue` – Google sign‑in screen.
  - `src/views/Dashboard.vue` – main UV dashboard: search (Nominatim typeahead), current‑location, UV stats, forecast strip, map, recommendations, reminders.
  - `src/views/About.vue` – about page with data sources and legal notices.
  - `src/services/api.js` – Axios instance configured for the backend.
  - `.env.development` – frontend environment variables (API base URL, OpenWeather key for geo fallback).

- `backend/`
  - `server.js` – Express app, CORS, sessions, auth routes, API routes.
  - `auth/googleAuth.js` – Passport GoogleStrategy and user (de)serialisation.
  - `routes/uv.js` – `/api/uv` endpoint – OpenWeatherMap One Call 3.0 + UVGuidance lookup.
  - `routes/reminder.js` – `/api/reminder` + `/api/reminder/disable`.
  - `routes/onboarding.js` – simple onboarding test route.
  - `prisma/schema.prisma` – Prisma data models for `User`, `Reminder`, `UVGuidance`.
  - `prisma/migrations/` – SQL migrations.
  - `.env` – backend secrets (`DATABASE_URL`, `OPENWEATHER_API_KEY`, OAuth credentials).

---

### Environment configuration

#### Backend required environment variables

Create a `.env` file inside `backend/` (next to `server.js`) with at least:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME?schema=public"
OPENWEATHER_API_KEY="your_openweather_api_key"
GOOGLE_CLIENT_ID="your_google_oauth_client_id"
GOOGLE_CLIENT_SECRET="your_google_oauth_client_secret"
SESSION_SECRET="a_random_session_secret"
```

- `DATABASE_URL` – standard PostgreSQL connection string.
- `OPENWEATHER_API_KEY` – used for the **One Call API 3.0** calls (requires a paid/subscribed plan for `data/3.0/onecall`).

#### Frontend environment variables

Create (or update) `frontend/.env.development`:

```bash
VITE_API_BASE_URL=http://localhost:3000
VITE_GEO_APPID=your_openweather_api_key
```

- `VITE_API_BASE_URL` – points the Axios instance at your local (or deployed) backend.
- `VITE_GEO_APPID` – OpenWeather API key used by the frontend for a geocoding fallback (same key as the backend).

> **Note:** The typeahead search suggestions use the free **Nominatim** API (no key required). `VITE_GEO_APPID` is only used as a fallback for coordinate resolution when Nominatim cannot be reached.

---

## Database setup (PostgreSQL)

The backend uses PostgreSQL via Prisma. You will need a database and some initial `UVGuidance` rows for the dashboard to show clothing/sunscreen recommendations.

### 1. Create a database

In `psql` (or your preferred client), create a database, for example:

```sql
CREATE DATABASE fit5120;
```

Update `DATABASE_URL` in `backend/.env` so it points at this database.

### 2. Apply Prisma migrations

From the `backend/` directory:

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
```

This will create the `User`, `Reminder`, and `UVGuidance` tables as defined in `backend/prisma/schema.prisma`.

### 3. Seed `UVGuidance` with guidance rules

The app expects at least five rows in `UVGuidance`, covering standard UV ranges derived from the **WHO UV Index classification** and **Cancer Council Australia SunSmart** guidance. Run the following SQL against your database:

```sql
-- Optional: clear existing guidance
-- DELETE FROM "UVGuidance";

INSERT INTO "UVGuidance"
  (guidance_id, uv_min, uv_max, risk_level, human_alert_template,
   clothing_text, sunscreen_dosage_text, reapply_minutes)
VALUES
  -- 0.0–2.99 Low
  (1, 0.0, 2.99, 'Low',
   'Minimal risk. No protection required unless outside for extended periods or near reflective surfaces (snow/water).',
   'Normal clothing is usually sufficient. Consider covering up if you are outside for a long time, especially near water or snow.',
   'Sunscreen is generally not required for short exposure. Use SPF 50+ if you are outside for extended periods.',
   120),

  -- 3.0–5.99 Moderate
  (2, 3.0, 5.99, 'Moderate',
   'Moderate risk. Seek shade, wear clothing, hat, and sunglasses, and apply SPF 50+ sunscreen.',
   'Wear long sleeves or a light overshirt, a broad‑brimmed hat and UV‑blocking sunglasses when outdoors.',
   'Apply SPF 50+ broad‑spectrum sunscreen to all exposed skin.',
   120),

  -- 6.0–7.99 High
  (3, 6.0, 7.99, 'High',
   'High risk. Same as moderate, but take extra care, especially between 10 am and 4 pm.',
   'Choose loose‑fitting, long‑sleeved tops and long shorts or pants, plus a wide‑brimmed hat and UV‑blocking sunglasses.',
   'Apply SPF 50+ generously and reapply regularly when outdoors.',
   120),

  -- 8.0–10.99 Very High
  (4, 8.0, 10.99, 'Very High',
   'Very high risk. Avoid sun between 10 am and 4 pm, use all protection measures.',
   'Maximise skin coverage with UPF‑rated clothing, long sleeves and pants, plus a broad‑brimmed hat and wrap‑around sunglasses.',
   'Apply SPF 50+ sunscreen and reapply frequently, especially if sweating or swimming.',
   120),

  -- 11.0–50.0 Extreme
  (5, 11.0, 50.0, 'Extreme',
   'Extreme risk. Take all precautions. Unprotected skin burns in minutes.',
   'Wear UPF 50+ clothing where possible, including long sleeves, long pants, a high‑coverage hat and UV‑blocking sunglasses. Avoid being outdoors in peak UV periods where you can.',
   'Apply SPF 50+ sunscreen often; even brief unprotected exposure can cause burns.',
   120);

After seeding, restart the backend if it is already running.

---

### How to run the project locally

#### Prerequisites

- **Node.js** (LTS recommended)
- **npm**
- **PostgreSQL** running locally or in the cloud

#### 1. Set up and migrate the database

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
```

Then seed the `UVGuidance` table with the SQL above.

#### 2. Start the backend server

```bash
cd backend
node server.js
```

The backend will start on **http://localhost:3000**.

- `http://localhost:3000/test` – simple health check.

#### 3. Start the frontend (Vite dev server)

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite will serve the app on **http://localhost:5173** by default.

#### 4. Use the dashboard

1. Open `http://localhost:5173` in your browser.
2. Sign in with Google.
3. On the **Dashboard**:
   - **Search city**: start typing to see typeahead suggestions (powered by Nominatim, filtered to Australia), then click a suggestion or press Enter.
   - **Use My Location**: click to use browser geolocation.
   - View the **current UV index**, **today's peak UV**, **5‑day forecast strip**, and the **interactive map**.
   - Read **clothing** and **sunscreen** recommendations.
   - Use **🔔 Enable Reminder** to start re‑application reminders (browser notifications).
   - Use **🔕 Disable Reminder** to stop them.

---

### Known limitations and future enhancements

- **OpenWeatherMap One Call 3.0 subscription**:
  - The backend now uses the One Call API 3.0 which provides real UV index data (`current.uvi`). This endpoint requires subscribing to the One Call plan on your OpenWeatherMap account (free tier with usage limits applies).

- **Reminder delivery**:
  - Reminders are delivered via **browser notifications** and a local timer; if the browser is closed, notifications stop.
  - A future enhancement could introduce a server‑side scheduler or push notification service for cross‑device, persistent reminders.

- **Nominatim usage policy**:
  - Nominatim is a free, open service. The app respects its usage policy by debouncing requests (150 ms) and limiting results. For high‑traffic production use, consider self‑hosting or a commercial geocoder.

Despite these limitations, the current app demonstrates how **real‑time UV awareness, tailored recommendations, and behavioural nudges (reminders)** can be combined to help young Australians protect themselves from harmful UV radiation.
