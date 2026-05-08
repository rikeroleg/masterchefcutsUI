FROM node:20-slim

# Install Chromium (system-managed, much lighter than the bundled puppeteer binary)
RUN apt-get update && apt-get install -y \
    chromium \
    --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY server.js ./

ENV NODE_ENV=production \
    PORT=8080 \
    CHROME_PATH=/usr/bin/chromium \
    ALLOWED_HOST=masterchefcuts.com

EXPOSE 8080

# Run as non-root — Chrome --no-sandbox is required inside containers
USER node

CMD ["node", "server.js"]
