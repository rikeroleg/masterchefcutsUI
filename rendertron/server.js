'use strict';

const express = require('express');
const puppeteer = require('puppeteer-core');

const app = express();
const PORT = process.env.PORT || 8080;
const CHROME_PATH = process.env.CHROME_PATH || '/usr/bin/chromium';
const CACHE_TTL_MS = parseInt(process.env.CACHE_TTL_MS || '300000', 10); // 5 min
const MAX_CACHE_SIZE = parseInt(process.env.MAX_CACHE_SIZE || '100', 10);
const ALLOWED_HOST = process.env.ALLOWED_HOST || 'masterchefcuts.com';

// ---------------------------------------------------------------------------
// Simple in-memory FIFO cache
// ---------------------------------------------------------------------------
const cache = new Map();

function getCached(url) {
  const entry = cache.get(url);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cache.delete(url);
    return null;
  }
  return entry.html;
}

function setCache(url, html) {
  if (cache.size >= MAX_CACHE_SIZE) {
    cache.delete(cache.keys().next().value); // evict oldest
  }
  cache.set(url, { html, ts: Date.now() });
}

// ---------------------------------------------------------------------------
// Browser lifecycle — lazy singleton; auto-restarts on disconnect
// ---------------------------------------------------------------------------
let browserPromise = null;

function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer
      .launch({
        executablePath: CHROME_PATH,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
        ],
        headless: true,
      })
      .then((browser) => {
        browser.on('disconnected', () => {
          browserPromise = null;
        });
        return browser;
      })
      .catch((err) => {
        browserPromise = null;
        throw err;
      });
  }
  return browserPromise;
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/render', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'url query parameter is required' });
  }

  // SSRF prevention: only render URLs on our own domain
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }
  if (!parsed.hostname.endsWith(ALLOWED_HOST)) {
    return res.status(403).json({ error: 'Host not allowed' });
  }

  const cached = getCached(url);
  if (cached) {
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.set('X-Prerender-Cache', 'HIT');
    return res.send(cached);
  }

  let page;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();

    // Skip images, media, and fonts to speed up rendering
    await page.setRequestInterception(true);
    page.on('request', (intercepted) => {
      const type = intercepted.resourceType();
      if (['image', 'media', 'font'].includes(type)) {
        intercepted.abort();
      } else {
        intercepted.continue();
      }
    });

    // Use a non-bot UA so the SPA doesn't re-detect itself as a bot (infinite loop guard)
    await page.setUserAgent('MasterChefCutsPrerenderer/1.0');

    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

    const html = await page.content();
    setCache(url, html);

    res.set('Content-Type', 'text/html; charset=utf-8');
    res.set('X-Prerender-Cache', 'MISS');
    res.send(html);
  } catch (err) {
    console.error(`[rendertron] failed to render ${url}:`, err.message);
    res.status(500).json({ error: 'Render failed' });
  } finally {
    if (page) page.close().catch(() => {});
  }
});

app.listen(PORT, () => {
  console.log(`[rendertron] listening on port ${PORT}`);
});
