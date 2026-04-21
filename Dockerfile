# Stage 1 — build the Vite app
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* .npmrc ./
RUN npm ci --legacy-peer-deps

# Build-time env vars — Vite bakes these into the bundle at build time.
# Pass via: docker build --build-arg VITE_API_URL=... --build-arg VITE_STRIPE_PUBLIC_KEY=...
# In CI, source from GitHub secrets (never hardcode live keys here).
ARG VITE_API_URL
ARG VITE_STRIPE_PUBLIC_KEY
ARG VITE_SENTRY_DSN
ARG VITE_GLB_BASE_URL
ENV VITE_API_URL=$VITE_API_URL \
    VITE_STRIPE_PUBLIC_KEY=$VITE_STRIPE_PUBLIC_KEY \
    VITE_SENTRY_DSN=$VITE_SENTRY_DSN \
    VITE_GLB_BASE_URL=$VITE_GLB_BASE_URL

COPY . .
RUN npm run build

# Stage 2 — serve with nginx
FROM nginx:alpine AS final

# Re-declare so the value is available in this stage (ARGs don't cross stage boundaries)
ARG VITE_GLB_BASE_URL

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# Cloud Run has a 32 MiB HTTP response body limit; 3DCow.glb (32.17 MiB) and
# 3DLamb.glb (31.87 MiB) are at or above that threshold and must be served from GCS.
# When VITE_GLB_BASE_URL is set the JS bundle fetches models from GCS, so strip them
# from the nginx container entirely to prevent Cloud Run from serving them directly.
RUN if [ -n "$VITE_GLB_BASE_URL" ]; then rm -f /usr/share/nginx/html/*.glb; fi

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
