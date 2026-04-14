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
ENV VITE_API_URL=$VITE_API_URL \
    VITE_STRIPE_PUBLIC_KEY=$VITE_STRIPE_PUBLIC_KEY

COPY . .
RUN npm run build

# Stage 2 — serve with nginx
FROM nginx:alpine AS final

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
