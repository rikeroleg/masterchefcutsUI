---
applyTo: "**/*.{jsx,js,css}"
---

# React / Vite Conventions — masterchefcutsUI

## Component Rules

- Functional components only — no class components
- One component per file; filename matches component name (PascalCase)
- Props destructured in function signature; no propTypes needed (TypeScript optional)
- Custom hooks in `src/utils/` prefixed with `use` (e.g. `useAuth`, `useListings`)

## API Calls

- All backend fetch calls go in `src/api/` — never inline `fetch` in components or pages
- Base URL from `import.meta.env.VITE_API_URL` — never hardcode `localhost:8080`
- Include JWT `Authorization: Bearer <token>` header from auth context
- Handle 401 → trigger logout/redirect in the API layer, not scattered in components

## State & Effects

- `useEffect` must list all dependencies — no empty arrays to suppress warnings
- Never mutate state directly — always use the setter function
- Shared state goes in `src/context/` as a React context + provider

## 3D Scenes (`@react-three/fiber`)

- Wrap 3D content in `<Canvas>` from `@react-three/fiber`
- Heavy geometry/material objects: wrap in `useMemo` to prevent per-frame recreation
- Animations: use `@react-spring/three` springs — not manual `requestAnimationFrame`
- Dispose geometry and materials in cleanup if dynamically created

## Stripe

- `loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)` called once at module level
- Wrap checkout UI in `<Elements stripe={stripePromise}>`
- Never log card numbers, CVCs, or any `PaymentMethod` raw data

## Testing (Vitest)

- Test files in `src/__tests__/` mirroring the source structure
- Use `@testing-library/react` — test behavior, not implementation
- Mock `src/api/` modules in tests — never hit the real backend
- Run before pushing: `npm run test`

## Styling

- Global styles: `src/index.css`
- Component styles: CSS Modules (`.module.css`) or `src/styles/`
- No inline styles for layout — use CSS classes
