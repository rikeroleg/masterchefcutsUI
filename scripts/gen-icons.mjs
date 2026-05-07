/**
 * gen-icons.mjs — generate PWA PNG icons from scratch using only Node built-ins.
 * Run: node scripts/gen-icons.mjs
 * Writes: public/icon-192.png, public/icon-512.png, public/og-image.jpg (JPEG via raw bitmap)
 *
 * Icon design: brand orange (#b84a00) background, white stylised "M" letterform.
 */
import zlib from 'zlib'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(__dirname, '..', 'public')

// ── colours ────────────────────────────────────────────────────────────────
const BG  = [184, 74, 0]    // #b84a00 brand orange
const FG  = [255, 255, 255] // white
const DARK = [20, 12, 6]    // #140c06

// ── CRC32 ─────────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let crc = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8)
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

/**
 * Render a pixel buffer (Uint8Array of R,G,B triples, row-major) as a PNG Buffer.
 */
function toPNG(pixels, w, h) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8; ihdr[9] = 2 // 8-bit depth, RGB

  // Filter type 0 (None) prepended to each scanline
  const raw = Buffer.alloc(h * (1 + w * 3))
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 3)] = 0 // filter byte
    for (let x = 0; x < w; x++) {
      const src = (y * w + x) * 3
      const dst = y * (1 + w * 3) + 1 + x * 3
      raw[dst] = pixels[src]; raw[dst + 1] = pixels[src + 1]; raw[dst + 2] = pixels[src + 2]
    }
  }

  const idat = zlib.deflateSync(raw)
  return Buffer.concat([sig, pngChunk('IHDR', ihdr), pngChunk('IDAT', idat), pngChunk('IEND', Buffer.alloc(0))])
}

// ── draw helpers ───────────────────────────────────────────────────────────
function setPixel(pixels, w, x, y, rgb) {
  if (x < 0 || y < 0 || x >= w || y >= pixels.length / 3 / w) return
  const i = (y * w + x) * 3
  pixels[i] = rgb[0]; pixels[i + 1] = rgb[1]; pixels[i + 2] = rgb[2]
}

function fillRect(pixels, w, x0, y0, x1, y1, rgb) {
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) setPixel(pixels, w, x, y, rgb)
}

function fillCircle(pixels, w, cx, cy, r, rgb) {
  const r2 = r * r
  for (let y = cy - r; y <= cy + r; y++)
    for (let x = cx - r; x <= cx + r; x++)
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r2) setPixel(pixels, w, x, y, rgb)
}

function fillDiagStroke(pixels, w, x0, y0, x1, y1, thickness, rgb) {
  // Draw a thick line from (x0,y0) to (x1,y1) using Bresenham + perpendicular spread
  const dx = x1 - x0, dy = y1 - y0
  const len = Math.hypot(dx, dy)
  const ux = dx / len, uy = dy / len     // unit vector along line
  const nx = -uy, ny = ux               // unit normal (perpendicular)
  const half = thickness / 2
  const steps = Math.ceil(len) * 2
  for (let s = 0; s <= steps; s++) {
    const t = s / steps
    const cx = x0 + t * dx, cy = y0 + t * dy
    for (let d = -half; d <= half; d++) {
      const px = Math.round(cx + d * nx)
      const py = Math.round(cy + d * ny)
      setPixel(pixels, w, px, py, rgb)
    }
  }
}

// ── icon renderer ──────────────────────────────────────────────────────────
function renderIcon(size) {
  const pixels = new Uint8Array(size * size * 3)

  // Background: brand orange
  pixels.fill(0)
  fillRect(pixels, size, 0, 0, size - 1, size - 1, BG)

  const s = size / 192  // scale relative to 192px reference design

  // White rounded inner circle for contrast
  const cr = Math.round(80 * s)
  const cx = Math.round(size / 2)
  const cy = Math.round(size / 2)
  fillCircle(pixels, size, cx, cy, cr, FG)

  // Orange disc inside (smaller), creating a ring effect
  const ir = Math.round(68 * s)
  fillCircle(pixels, size, cx, cy, ir, BG)

  // Stylised "M" in white inside the ring
  const strokeW = Math.round(10 * s)
  const left   = Math.round(cx - 30 * s)
  const right  = Math.round(cx + 30 * s)
  const top    = Math.round(cy - 28 * s)
  const bottom = Math.round(cy + 32 * s)
  const mid    = Math.round(cy + 4 * s)  // V-bottom of the M

  // Left vertical bar
  fillRect(pixels, size, left, top, left + strokeW - 1, bottom, FG)
  // Right vertical bar
  fillRect(pixels, size, right - strokeW + 1, top, right, bottom, FG)
  // Left diagonal: top-left corner → centre-mid
  fillDiagStroke(pixels, size, left + strokeW / 2, top, Math.round(cx - 1), mid, strokeW, FG)
  // Right diagonal: centre-mid → top-right corner
  fillDiagStroke(pixels, size, Math.round(cx + 1), mid, right - strokeW / 2, top, strokeW, FG)

  return pixels
}

// ── generate 192 & 512 PNGs ────────────────────────────────────────────────
for (const size of [192, 512]) {
  const pixels = renderIcon(size)
  const png = toPNG(pixels, size, size)
  const out = path.join(publicDir, `icon-${size}.png`)
  fs.writeFileSync(out, png)
  console.log(`Written ${out} (${png.length} bytes)`)
}

// ── also write a proper icon.svg ───────────────────────────────────────────
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192">
  <rect width="192" height="192" fill="#b84a00"/>
  <circle cx="96" cy="96" r="80" fill="#fff"/>
  <circle cx="96" cy="96" r="68" fill="#b84a00"/>
  <!-- M letterform -->
  <line x1="66" y1="68" x2="66" y2="128" stroke="#fff" stroke-width="10" stroke-linecap="round"/>
  <line x1="126" y1="68" x2="126" y2="128" stroke="#fff" stroke-width="10" stroke-linecap="round"/>
  <polyline points="66,68 96,100 126,68" fill="none" stroke="#fff" stroke-width="10" stroke-linejoin="round" stroke-linecap="round"/>
</svg>`
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svg)
console.log('Written public/icon.svg')

console.log('Done.')
