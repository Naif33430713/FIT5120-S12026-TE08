## FIT5120-S12026-TE08 – UV Protection Web App

### Problem this project tackles

In Australia, Gen Z and Gen Alpha are increasingly abandoning sun‑safety habits in favour of a “dangerous” tanning trend that prioritises aesthetic tan lines over long‑term health. Severe sunburns are being intentionally pursued for a viral, sun‑kissed look, fuelled by social media algorithms and a sense of invincibility. This turns sun damage into a status symbol rather than a warning sign of melanoma and premature ageing, making it harder for traditional public health messaging to cut through.

This project explores how a digital experience can **raise awareness and nudge young adults to rethink their relationship with UV exposure**, by turning abstract UV risk into clear, personalised, and actionable protection advice.

### What this web app delivers (top‑down)

At a high level, the app is a **UV protection dashboard** that:

- **Reads the current UV conditions** for a chosen location.
- **Translates UV levels into human‑readable risk messages**, using evidence‑based guidance rules stored in a database.
- **Recommends sunscreen dosage and re‑application timing** tailored to the current UV conditions.
- **Recommends protective clothing** based on the same UV guidance.
- **Lets users set and manage sunscreen reminders**, which are persisted on the backend and delivered to the browser as notifications.

The experience is optimised for young adults: quick sign‑in with Google, type a city or use current location, and immediately see “what should I do right now to protect myself?” rather than abstract health messaging.

---

### User stories and how the current implementation satisfies them

#### US1.1 – Real‑Time UV Level Alerts (AC1: View UV Information)

- **Given** the user is on the homepage and wants to check UV conditions for a particular location  
- **When** the user inputs a valid location in the search box on the dashboard  
- **Then** the system displays:
  - The **current UV index** for that location.
  - Its **risk category and colour**.
  - A **human‑readable warning/advice message** based on that UV index.

**How the code implements this**

- On the **Dashboard** (`/dashboard`, `frontend/src/views/Dashboard.vue`):
  - The user enters a city name or chooses **Use My Location**.
  - The frontend looks up latitude/longitude via the OpenWeather **Geo API**, then calls the backend:
    - `GET /api/uv?lat={lat}&lon={lon}` (`backend/routes/uv.js`).
  - The dashboard shows:
    - `uvData.uv_index` (UV Index value).
    - `uvData.risk_level` and a colour derived from `getUVColor(uvData.uv_index)`.
    - Textual guidance fields (`clothing`, `sunscreen`, `reapply_minutes`) that form the human‑readable warning/advice.

- On the **Backend** (`backend/routes/uv.js`):
  - Uses environment variable `OPENWEATHER_API_KEY` to call the OpenWeather **Weather API**.
  - Approximates a UV index from the response (due to free‑tier limitations).
  - Looks up a matching guidance rule in the `UVGuidance` table (`backend/prisma/schema.prisma`) based on `uv_min`/`uv_max`.
  - Returns a JSON payload:
    - `uv_index`, `risk_level`, `clothing`, `sunscreen`, `reapply_minutes`.

This behaviour satisfies **US1.1 / AC1 View UV Information**.

#### US3.1 – Sunscreen Dosage Recommendation (AC1: View Sunscreen Advice)

- **Given** the user is on the dashboard after entering their location and wants sunscreen dosage recommendations  
- **When** the user views the **sun protection recommendations** section of the dashboard  
- **Then** the system displays a **sunscreen dosage recommendation based on the current UV index** for that location.

**How the code implements this**

- `UVGuidance` rows in the database include `sunscreen_dosage_text` and `reapply_minutes`.
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
    - Returns the user’s active reminder record, if any.
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

- `UVGuidance` rows include `clothing_text`.
- `/api/uv` returns `clothing: guidance.clothing_text`.
- The dashboard (`Dashboard.vue`) shows:
  - **👕 Clothing Advice:** `uvData.clothing`

This fulfils **US3.3 / AC1 View Clothing Advice**.

---

### High‑level architecture

- **Frontend** – Vue 3 + Vite SPA (`frontend/`)
  - Route: `/` (UV Protection Dashboard homepage).
  - Talks to the backend via Axios with `baseURL: http://localhost:3000`.
  - Uses the **Geolocation API**, **OpenWeather Geo API**, and **Web Notifications API** in the browser.

- **Backend** – Express server (`backend/server.js`)
  - Listens on port **3000**.
  - Handles CORS for `http://localhost:5173` (the Vite dev server).
  - Exposes routes:
    - `/api/uv` – UV + guidance endpoint.
    - `/api/onboarding` – onboarding/health-check endpoint.
    - `/test` – simple health check.

- **Database** – PostgreSQL via Prisma (`backend/prisma/schema.prisma`)
  - `UVGuidance` – UV ranges and their associated risk level, clothing, sunscreen dosage, and reapply minutes.


### Tech stack

- **Frontend**
  - Vue 3 (`vue`)
  - Vite (`vite`) dev server/build tool
  - Vue Router (`vue-router`)
  - Axios (`axios`) for HTTP calls

- **Backend**
  - Node.js / Express (`express`)
  - CORS (`cors`)
  - Sessions (`express-session`)
  - Passport + Google OAuth 2.0 (`passport`, `passport-google-oauth20`)
  - Prisma ORM (`@prisma/client`, `prisma`)
  - Axios for server‑side HTTP calls

- **Database**
  - PostgreSQL

---

### Repository structure (simplified)

- `frontend/`
  - `src/main.js` – Vue app entrypoint.
  - `src/router/index.js` – routes for Login and Dashboard.
  - `src/views/Login.vue` – Google sign‑in screen.
  - `src/views/Dashboard.vue` – main UV dashboard, search & current‑location, recommendations, reminders.
  - `src/services/api.js` – Axios instance configured for the backend.

- `backend/`
  - `server.js` – Express app, CORS, sessions, auth routes, API routes.
  - `auth/googleAuth.js` – Passport GoogleStrategy and user (de)serialisation.
  - `routes/uv.js` – `/api/uv` endpoint – integrates OpenWeather + UVGuidance.
  - `routes/reminder.js` – `/api/reminder` + `/api/reminder/disable`.
  - `routes/onboarding.js` – simple “Onboarding API working” test route.
  - `prisma/schema.prisma` – Prisma data models for `User`, `Reminder`, `UVGuidance`.
  - `prisma/migrations/` – SQL migrations to create/alter DB tables.

---

### Environment configuration

#### Backend required environment variables

Create a `.env` file inside `backend/` (next to `server.js`) with at least:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME?schema=public"
OPENWEATHER_API_KEY="your_openweather_api_key"
```

- `DATABASE_URL` – standard PostgreSQL connection string.
- `OPENWEATHER_API_KEY` – used on the backend for weather/UV approximation.

#### Frontend configuration

Currently, the OpenWeather **Geo API** key is hard‑coded in `frontend/src/views/Dashboard.vue`:

- For production/long‑term usage, this should be moved into a Vite environment variable (e.g. `VITE_OPENWEATHER_API_KEY`).
- For local demos, the hard‑coded key will “just work” as long as it is valid.

No additional frontend `.env` is strictly required to run the project locally in its current form.

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

This will create the `UVGuidance` table as defined in `backend/prisma/schema.prisma`.

### 3. Seed `UVGuidance` with guidance rules

The app expects at least five rows in `UVGuidance`, covering standard UV ranges. Run the following SQL against your database (for example via `psql`):

```sql
-- Optional: clear existing guidance
-- DELETE FROM "UVGuidance";

INSERT INTO "UVGuidance"
  (guidance_id, uv_min, uv_max, risk_level, human_alert_template,
   clothing_text, sunscreen_dosage_text, reapply_minutes)
VALUES
  -- 0–2 Low
  (1, 0, 2, 'Low',
   'Minimal risk. No protection required unless outside for extended periods or near reflective surfaces (snow/water).',
   'Normal clothing is usually sufficient. Consider covering up if you are outside for a long time, especially near water or snow.',
   'Sunscreen is generally not required for short exposure. Use SPF 50+ if you are outside for extended periods.',
   60),

  -- 3–5 Moderate
  (2, 3, 5, 'Moderate',
   'Moderate risk. Seek shade, wear clothing, hat, and sunglasses, and apply SPF 50+ sunscreen.',
   'Wear long sleeves or a light overshirt, a broad‑brimmed hat and UV‑blocking sunglasses when outdoors.',
   'Apply SPF 50+ broad‑spectrum sunscreen to all exposed skin.',
   60),

  -- 6–7 High
  (3, 6, 7, 'High',
   'High risk. Same as moderate, but take extra care, especially between 10 am and 4 pm.',
   'Choose loose‑fitting, long‑sleeved tops and long shorts or pants, plus a wide‑brimmed hat and UV‑blocking sunglasses.',
   'Apply SPF 50+ generously and reapply regularly when outdoors.',
   45),

  -- 8–10 Very High
  (4, 8, 10, 'Very High',
   'Very high risk. Avoid sun between 10 am and 4 pm, use all protection measures.',
   'Maximise skin coverage with UPF‑rated clothing, long sleeves and pants, plus a broad‑brimmed hat and wrap‑around sunglasses.',
   'Apply SPF 50+ sunscreen and reapply frequently, especially if sweating or swimming.',
   30),

  -- 11+ Extreme
  (5, 11, 50, 'Extreme',
   'Extreme risk. Take all precautions. Unprotected skin burns in minutes.',
   'Wear UPF 50+ clothing where possible, including long sleeves, long pants, a high‑coverage hat and UV‑blocking sunglasses. Avoid being outdoors in peak UV periods where you can.',
   'Apply SPF 50+ sunscreen often; even brief unprotected exposure can cause burns.',
   20);
```

After seeding, restart the backend if it is already running. The dashboard should now display risk level, clothing advice, sunscreen dosage and re‑apply timings for any location with a valid UV reading.

---

### How to run the project locally

#### Prerequisites

- **Node.js** (LTS recommended)
- **npm**
- **PostgreSQL** running locally or in the cloud
  - Make sure you have a database created and that `DATABASE_URL` in `backend/.env` points to it.

#### 1. Set up and migrate the database

From the `backend/` directory:

```bash
cd backend
npm install

# Generate the Prisma client based on schema.prisma
npx prisma generate

# Apply pending migrations to your Postgres database
npx prisma migrate dev
```

This will create/update the `User`, `Reminder`, and `UVGuidance` tables according to `backend/prisma/schema.prisma`.

> **Important:** The app expects `UVGuidance` to contain rows covering the UV ranges you care about. If this table is empty, `/api/uv` will return `"No UV guidance rule found"` and the dashboard will not be able to show clothing/sunscreen/reapply recommendations. Insert guidance rules via SQL or a seed script according to your research (e.g. UV 0–2: low risk, UV 3–5: moderate, etc.).

#### 2. Start the backend server

From `backend/`:

```bash
node server.js
```

The backend will start on **http://localhost:3000**.

- `http://localhost:3000/test` – simple health check (“Server is working”).

#### 3. Start the frontend (Vite dev server)

In a separate terminal, from the repo root:

```bash
cd frontend
npm install
npm run dev
```

Vite will serve the app on **http://localhost:5173** by default.

#### 4. Use the dashboard

1. Open `http://localhost:5173` in your browser.  
2. On the **Dashboard** (homepage):
   - **Search city**: enter a city name and click **Search**.
   - **Use My Location**: click **Use My Location** to request browser geolocation.
   - View:
     - Current **UV Index** and coloured risk label.
     - **Clothing advice**.
     - **Sunscreen advice** and **reapply interval**.
   - Use **🔔 Enable Reminder** to start re‑application reminders in this browser (you may be prompted to allow notifications).
   - Use **🔕 Disable Reminder** to stop them and clear reminder preferences from this browser.

---

### Known limitations and future enhancements

- **UV approximation**:  
  - The current implementation approximates UV index from the OpenWeather **Weather API** (e.g. using cloud coverage) because the free tier does not expose a dedicated UV endpoint.
  - For higher fidelity, a future enhancement could integrate a more precise UV or solar radiation API.

- **Reminder delivery**:  
  - Reminders are delivered via **browser notifications** and a local timer; if the browser is closed, notifications stop.
  - A future enhancement could introduce a server‑side scheduler or push notification service for cross‑device, persistent reminders.

- **OpenWeather Geo key location**:  
  - The Geo API key is presently hard‑coded in the frontend and should be moved behind environment variables and/or a backend proxy before going to production.

Despite these limitations, the current app already demonstrates how **real‑time UV awareness, tailored recommendations, and behavioural nudges (reminders)** can be combined to help young Australians protect themselves from harmful UV radiation.

