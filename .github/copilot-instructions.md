# masterchefcutsUI — Copilot Instructions

React 19 + Vite frontend for the MasterChef Cuts farm-to-table marketplace.

## Architecture

- **Backend API**: `rikeroleg/MasterCheifCuts` — Spring Boot at `http://localhost:8080` (local) / `masterchefcuts.com` (production)
- **Router**: React Router v7 (`react-router-dom`)
- **3D Models**: Three.js + `@react-three/fiber` + `@react-three/drei` + `@react-spring/three`
- **Maps**: React Leaflet (listing location/proximity browsing)
- **Payments**: `@stripe/react-stripe-js` + `@stripe/stripe-js`
- **Icons**: Lucide React
- **Error monitoring**: Sentry (`@sentry/react`)
- **Build**: Vite 7, `npm run dev` → `http://localhost:5173`
- **Tests**: Vitest + `@testing-library/react`

## Project Layout

```
src/
├── api/          — API client functions (all backend calls here, not inline)
├── Components/   — Reusable UI components
├── context/      — React context providers (auth, cart, etc.)
├── data/         — Static/seed data
├── pages/        — Route-level page components
├── styles/       — CSS modules / global styles
├── utils/        — Pure utility functions
├── __tests__/    — Vitest unit tests (mirrors src structure)
└── test/         — Test utilities, mocks, setup files
App.jsx           — Root component + router setup
main.jsx          — Vite entry point
```

## Code Conventions

- Functional components only — no class components
- React 19 hooks; custom hooks in `utils/` prefixed with `use`
- All API calls go through `src/api/` — never `fetch`/`axios` directly in components
- Stripe: load via `loadStripe()` at module level, wrap checkout in `<Elements>`; never log card data
- 3D scenes: use `<Canvas>` from `@react-three/fiber`; keep geometry and materials modular
- Route protection: auth-gated routes via context; redirect to `/login` when unauthenticated

## Build & Test

```bash
npm run dev       # dev server → http://localhost:5173
npm run build     # production Vite build → dist/
npm run test      # Vitest run (all tests)
npm run lint      # ESLint check
```

## Local Full-Stack Setup

Start both services together:

```powershell
# Terminal 1 — Backend
cd "c:\DEV Repos\aidevops\MasterCheifCuts"
docker compose up sqlserver sqlserver-setup --detach
./mvnw spring-boot:run -Dspring-boot.run.profiles=local

# Terminal 2 — Frontend
cd "c:\DEV Repos\aidevops\masterchefcutsUI"
npm run dev
```

Backend: `http://localhost:8080` | Frontend: `http://localhost:5173`

## Environment Variables

- `.env.local` (gitignored) — dev overrides (`VITE_API_URL`, `VITE_STRIPE_PUBLISHABLE_KEY`, etc.)
- `.env.production` — production values (non-secret only — secrets stay in GCP/Cloud Run)
- Never commit `.env.local` or any file containing private keys

## Deployment

GitHub Actions → `gcp-cloudrun-frontend.yml` → Google Cloud Run on push to `main`.  
Static assets served via Nginx (`nginx.conf`).
