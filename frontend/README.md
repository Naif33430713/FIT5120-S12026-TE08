## Frontend (Vue 3 + Vite)

This `frontend/` app is the client for the **UV Protection Web App** described in the root `README.md`.

### What lives here

- Vue 3 single‑page app served by Vite (`npm run dev`).
- Routes:
  - `/` – Google login screen (`src/views/Login.vue`).
  - `/dashboard` – UV Protection Dashboard (`src/views/Dashboard.vue`).
- API client:
  - `src/services/api.js` – Axios instance pointing at the backend on `http://localhost:3000` with `withCredentials: true`.

### Local development

From the repo root:

```bash
cd frontend
npm install
npm run dev
```

The app will be available on `http://localhost:5173`.

For backend setup, database configuration, and a full explanation of the user stories and architecture, see the root `README.md`.

