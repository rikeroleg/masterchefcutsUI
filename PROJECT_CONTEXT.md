<!-- SPDX-License-Identifier: MIT -->
<!-- AI-CONTEXT: Comprehensive project context for all AI agents working on the MasterChef Cuts frontend -->

# MasterChef Cuts — Frontend Project Context for AI Agents

> **Last updated**: May 19, 2026
> **Purpose**: Single source of truth for any AI agent (Copilot, Claude, etc.) working on this codebase. Read this file first before touching any code.
> **Backend context**: See `../MasterCheifCuts/PROJECT_CONTEXT.md` for backend domain model, API, and full environment variable reference.

---

## 1. What Is This Repo?

`rikeroleg/masterchefcutsUI` is the **React/Vite SPA frontend** for MasterChef Cuts — a farm-to-table meat marketplace. It communicates with the Spring Boot backend (`rikeroleg/MasterCheifCuts`) via a REST API.

Both repos live as subfolders inside the `marcusquinn/aidevops` monorepo workspace:
```
c:\DEV Repos\aidevops\
├── masterchefcutsUI/   ← this repo (frontend)
└── MasterCheifCuts/    ← backend repo
```

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + Vite 7 |
| Routing | react-router-dom v7 |
| 3D Models | `@react-three/fiber` + `@react-three/drei` + Three.js 0.183 |
| Payments | `@stripe/react-stripe-js` + `@stripe/stripe-js` |
| Maps | Leaflet + react-leaflet |
| Icons | lucide-react |
| Error Monitoring | `@sentry/react` |
| Build Bundler | Vite (SWC transform via `@vitejs/plugin-react-swc`) |
| Tests | Vitest + jsdom + @testing-library/react |
| Linter | ESLint 10 |
| Container | Docker → nginx:alpine (production) |
| CI/CD | GitHub Actions → Google Cloud Run |

---

## 3. Repository Layout

```
masterchefcutsUI/
├── src/
│   ├── App.jsx                    ← root layout, router, nav bar
│   ├── main.jsx                   ← ReactDOM.createRoot + BrowserRouter + AuthProvider
│   ├── api/                       ← API client modules (one per domain)
│   ├── Components/
│   │   ├── 3DModel/
│   │   │   ├── cow/Cow.jsx        ← beef primal cut 3D viewer (10 zones)
│   │   │   ├── pig/Pig.jsx        ← pork primal cut 3D viewer (7 zones)
│   │   │   ├── lamb/Lamb.jsx      ← lamb primal cut 3D viewer (6 zones)
│   │   │   └── ListingAnimalViewer.jsx  ← wrapper used in listing detail
│   │   ├── AnimalRequestModal.jsx
│   │   ├── CartPaymentModal.jsx
│   │   ├── CookieConsent.jsx
│   │   ├── DisputeModal.jsx
│   │   ├── ErrorBoundary.jsx
│   │   ├── Footer.jsx
│   │   ├── ListingsMap.jsx        ← Leaflet map for browsing listings by zip
│   │   ├── NotificationBell.jsx   ← SSE-based real-time notification badge
│   │   ├── PaymentModal.jsx       ← Stripe Elements single-cut checkout
│   │   ├── WholeAnimalPanel.jsx
│   │   ├── products/              ← product card components
│   │   └── shop/                  ← shop-specific components
│   ├── context/
│   │   └── AuthContext.jsx        ← global auth state (user, token, login/logout)
│   ├── data/                      ← static lookup data
│   ├── pages/                     ← one file per route (see Routes section)
│   ├── styles/                    ← global CSS
│   ├── test/setup.js              ← Vitest setup (jest-dom matchers)
│   ├── utils/                     ← shared helpers
│   └── __tests__/                 ← test files
├── public/
│   ├── 3DCow.glb                  ← beef 3D model (loaded via /gcs-static/ proxy)
│   ├── 3DPig.glb                  ← pork 3D model
│   └── 3DLamb.glb                 ← lamb 3D model
├── .env                           ← dev secrets (gitignored) — Stripe publishable key
├── .env.development               ← dev non-secrets (committed) — VITE_GLB_BASE, VITE_LOG_LEVEL
├── .env.production                ← prod non-secrets (committed) — VITE_API_URL, placeholder Stripe key
├── .env.local                     ← local overrides (gitignored)
├── vite.config.js                 ← proxy config, test config, manual chunks
├── nginx.conf                     ← production container nginx config
├── Dockerfile                     ← multi-stage: node:22-alpine build → nginx:alpine serve
├── package.json
└── .github/workflows/
    ├── ci.yml                     ← lint + build on develop PRs
    └── gcp-cloudrun-frontend.yml  ← Docker build → Artifact Registry → Cloud Run on main push
```

---

## 4. Routes

All routes are defined in `src/App.jsx`.

| Path | Component | Auth Required | Role |
|------|-----------|--------------|------|
| `/` | `HomePage` | No | — |
| `/listings` | `ListingsPage` | No | — |
| `/listings/:id` | `ListingDetailPage` | No | — |
| `/farmer/:id` | `FarmerProfilePage` | No | — |
| `/login` | `LoginPage` | No | — |
| `/forgot-password` | `ForgotPasswordPage` | No | — |
| `/reset-password` | `ResetPasswordPage` | No | — |
| `/verify-email` | `VerifyEmailPage` | No | — |
| `/shop` | 3D model shop panel | No | — |
| `/cart` | `CartPage` | Yes | BUYER |
| `/post-listing` | `PostListingPage` | Yes | FARMER |
| `/profile` | `ProfilePage` | Yes | — |
| `/messages` | `MessagesPage` | Yes | — |
| `/demand-board` | `DemandBoardPage` | Yes | — |
| `/admin` | `AdminPage` | Yes | ADMIN |
| `/admin/users/:id` | `AdminUserDetailPage` | Yes | ADMIN |
| `/referral` | `ReferralPage` | Yes | — |
| `/about` | `AboutPage` | No | — |
| `/faq` | `FaqPage` | No | — |
| `/contact` | `ContactPage` | No | — |
| `/terms` | `TermsPage` | No | — |
| `/privacy` | `PrivacyPage` | No | — |
| `/order-receipt` | `OrderReceiptPage` | Yes | — |
| `*` | `NotFoundPage` | No | — |

---

## 5. Auth Architecture

Managed by `src/context/AuthContext.jsx`.

- **JWT in httpOnly cookie** `mc_auth` — set by backend on login; sent automatically on every API call
- **CSRF**: `XSRF-TOKEN` cookie (non-httpOnly) read by frontend; sent as `X-XSRF-TOKEN` header on mutations
- **Non-sensitive profile** in `localStorage` as `mc_user` (role, name, id — never token)
- **Proactive refresh** 60 seconds before token expiry via `setTimeout`
- **401 handling**: dispatches `session-expired` custom event → auth context clears state → redirect to login
- **Registration/login**: call `POST /api/auth/login` → backend sets cookie → frontend stores profile in `mc_user`

---

## 6. 3D Model System

Models: `public/3DCow.glb`, `public/3DPig.glb`, `public/3DLamb.glb`

**Loading**: GLBs are loaded via `useGLTF(${VITE_GLB_BASE}/3DCow.glb)` where `VITE_GLB_BASE=/gcs-static`. The Vite dev proxy rewrites `/gcs-static/*` → `https://storage.googleapis.com/masterchefcuts-static/*`. This avoids CORS white-texture issues in dev.

**Cut-zone detection** (`findCutByPosition(lp)`): Uses Y and Z coordinates normalized to [-0.95, +0.95] space to map mesh positions to primal cut zones.

**Material handling**: In the `clonedScene` useMemo, each mesh's material is cloned and `metalness`/`roughness` adjusted. The original GLB textures are preserved — do NOT call `material.color.set()` as this overwrites the embedded texture with a flat colour.

### Beef (Cow.jsx) — 10 primal zones
chuck, rib, short-loin, sirloin, round, brisket, plate, flank, shank, head

### Pork (Pig.jsx) — 7 primal zones
head, jowl, shoulder, loin, belly, ham, hock

### Lamb (Lamb.jsx) — 6 primal zones
shoulder, rack, loin, leg, breast, shank

---

## 7. API Client

**Base URL**: `VITE_API_URL` (empty in dev → uses Vite proxy; `https://masterchefcuts-eqilqj43qa-uc.a.run.app` in prod).

**Dev proxy** in `vite.config.js`:
- `/api/*` → `http://localhost:8080` (backend)
- `/gcs-static/*` → `https://storage.googleapis.com` (GLB models, rewrites path to `/masterchefcuts-static/*`)

**Headers**: All mutation requests include `X-XSRF-TOKEN` from the cookie. Auth is via the httpOnly `mc_auth` cookie (credentials: 'include' in fetch).

---

## 8. Environment Variables

### `.env` (gitignored — create locally with actual keys)
```
VITE_STRIPE_PUBLIC_KEY=pk_test_51TGUfSFX1TWoP0rmph512E6Yq0pw4sgUTcBKGIQBiFkT1QhuGubUdVn1CYOjK6sU1RwV6RShbdkByDyBPwZnSQ4y00p8hB0o2W
```
> The test key above is committed in the existing `.env` file. It is a Stripe **test** key only — not a live payment key.

### `.env.development` (committed, no secrets)
```
VITE_GLB_BASE=/gcs-static
VITE_LOG_LEVEL=debug
```

### `.env.production` (committed, placeholder)
```
VITE_API_URL=https://masterchefcuts-eqilqj43qa-uc.a.run.app
VITE_GLB_BASE=/gcs-static
VITE_STRIPE_PUBLIC_KEY=pk_live_REPLACE_ME   ← injected by CI secret
VITE_SENTRY_DSN=                            ← injected by CI secret
```

---

## 9. Running Locally

### Prerequisites
- Node 22+
- Backend running on `:8080` (see `../MasterCheifCuts/PROJECT_CONTEXT.md` section 15)

### Commands
```bash
cd masterchefcutsUI

npm install          # first time only
npm run dev          # dev server at http://localhost:5173
npm run test         # 26 tests across 5 files
npm run build        # production build to dist/
npm run lint         # ESLint check
```

### The `.env` file
The `.env` file is gitignored. A copy already exists locally with the Stripe test key. If it's missing, create:
```
VITE_STRIPE_PUBLIC_KEY=pk_test_51TGUfSFX1TWoP0rmph512E6Yq0pw4sgUTcBKGIQBiFkT1QhuGubUdVn1CYOjK6sU1RwV6RShbdkByDyBPwZnSQ4y00p8hB0o2W
```

---

## 10. CI/CD

### `ci.yml` — runs on PR to `develop`
- `npm ci`
- `npm run lint`
- `npm run build`

### `gcp-cloudrun-frontend.yml` — runs on push to `main`
1. `npm ci && npm run build` (injects `VITE_STRIPE_PUBLIC_KEY` + `VITE_SENTRY_DSN` from GitHub secrets)
2. Docker build (multi-stage: node build → nginx serve)
3. Push to Artifact Registry (`us-central1-docker.pkg.dev/gen-lang-client-0273518275/mastercheifcuts/masterchefcuts-ui`)
4. Deploy to Cloud Run (`us-central1`)

---

## 11. Key Conventions

- **No TypeScript** — plain JS with JSDoc comments where useful
- **Vite env vars**: must be prefixed `VITE_` to be exposed in the browser
- **No `.env` secrets in git** — `.env` and `.env.local` are gitignored
- **Three.js models**: always load via `VITE_GLB_BASE` env var, never hardcoded GCS URLs (CORS)
- **`useGLTF.preload()`** called at module level for each model file
- **`@react-three/drei`** `<Environment>` / `<Bounds>` / `<Center>` used for model framing
- **Stripe**: `loadStripe()` called once at module level with `VITE_STRIPE_PUBLIC_KEY`
- **Active PR**: `feat/prod-ready` → https://github.com/rikeroleg/masterchefcutsUI/pull/47

---

## 12. Agent-Specific Guidance

1. **Read backend PROJECT_CONTEXT.md first** when touching API integration, auth, or data models: `../MasterCheifCuts/PROJECT_CONTEXT.md`
2. **Run Codacy analysis** after any file edit (`codacy_cli_analyze` with rootPath = workspace path)
3. **Run security scan** (`codacy_cli_analyze` with `tool=trivy`) after any `npm install` or `package.json` change
4. **Never commit secrets** — `.env` is gitignored; add new secrets to `.env.example` pattern or GitHub Actions secrets
5. **3D model changes**: test locally at `http://localhost:5173/shop` — models load from `/gcs-static/` proxy in dev
6. **Test coverage**: `npm run test` — 26 tests, 5 files — must all pass before committing
7. **Background style**: warm golden/orange farm photo — always use strong `text-shadow` or dark overlays on text for readability
