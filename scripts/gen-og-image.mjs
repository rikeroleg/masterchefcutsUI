/**
 * gen-og-image.mjs — generate a 1200×630 OG image as a JPEG.
 * Uses only Node built-ins (no external deps).
 * Run: node scripts/gen-og-image.mjs
 * Writes: public/og-image.jpg
 *
 * Design:
 *  - Deep dark brown background (#140c06)
 *  - Large orange circle / badge (brand #b84a00) left-of-centre
 *  - "MasterChef Cuts" wordmark (rendered as thick pixel rectangles)
 *  - Tagline strip: "Farm-Fresh Meat · Direct from Local Farmers"
 *
 * Note: output is a BMP-encoded file renamed .jpg. Most social crawlers
 * (OpenGraph) accept the content regardless of encoding as long as the
 * dimensions and visual content are correct. For production, replace with
 * a design tool export (Figma/Canva/Photoshop → real JPEG).
 *
 * Actually we encode as PNG first, saved as og-image.jpg — works fine
 * because the og:image spec only requires a raster image (MIME type is
 * inferred from the URL, but crawlers sniff the bytes too). Real JPEG
 * would be smaller; this PNG placeholder is functionally equivalent for
 * crawlers.
 */
import zlib from 'zlib'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(__dirname, '..', 'public')

const W = 1200, H = 630

// ── CRC32 (same as gen-icons.mjs) ─────────────────────────────────────────
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
function toPNG(pixels, w, h) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8; ihdr[9] = 2
  const raw = Buffer.alloc(h * (1 + w * 3))
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 3)] = 0
    for (let x = 0; x < w; x++) {
      const src = (y * w + x) * 3
      const dst = y * (1 + w * 3) + 1 + x * 3
      raw[dst] = pixels[src]; raw[dst + 1] = pixels[src + 1]; raw[dst + 2] = pixels[src + 2]
    }
  }
  const idat = zlib.deflateSync(raw, { level: 6 })
  return Buffer.concat([sig, pngChunk('IHDR', ihdr), pngChunk('IDAT', idat), pngChunk('IEND', Buffer.alloc(0))])
}

// ── draw helpers ───────────────────────────────────────────────────────────
function idx(x, y) { return (y * W + x) * 3 }
function setpx(px, x, y, r, g, b) {
  if (x < 0 || y < 0 || x >= W || y >= H) return
  const i = idx(x, y); px[i] = r; px[i + 1] = g; px[i + 2] = b
}
function fillRect(px, x0, y0, x1, y1, r, g, b) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) setpx(px, x, y, r, g, b)
}
function fillCircle(px, cx, cy, rad, r, g, b) {
  for (let y = cy - rad; y <= cy + rad; y++)
    for (let x = cx - rad; x <= cx + rad; x++)
      if ((x - cx) ** 2 + (y - cy) ** 2 <= rad ** 2) setpx(px, x, y, r, g, b)
}
function line(px, x0, y0, x1, y1, thick, r, g, b) {
  const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy)
  const ux = dx / len, uy = dy / len, nx = -uy, ny = ux, half = thick / 2
  const steps = Math.ceil(len) * 2
  for (let s = 0; s <= steps; s++) {
    const t = s / steps, cx = x0 + t * dx, cy = y0 + t * dy
    for (let d = -half; d <= half; d++) setpx(px, Math.round(cx + d * nx), Math.round(cy + d * ny), r, g, b)
  }
}

// ── pixel font — 5×7 bitmap ────────────────────────────────────────────────
// Each char is 5 columns × 7 rows, stored as 7 row-bitmasks (MSB = leftmost col)
const FONT5x7 = {
  'A': [0b01110,0b10001,0b10001,0b11111,0b10001,0b10001,0b10001],
  'B': [0b11110,0b10001,0b10001,0b11110,0b10001,0b10001,0b11110],
  'C': [0b01110,0b10001,0b10000,0b10000,0b10000,0b10001,0b01110],
  'D': [0b11100,0b10010,0b10001,0b10001,0b10001,0b10010,0b11100],
  'E': [0b11111,0b10000,0b10000,0b11110,0b10000,0b10000,0b11111],
  'F': [0b11111,0b10000,0b10000,0b11110,0b10000,0b10000,0b10000],
  'G': [0b01110,0b10001,0b10000,0b10111,0b10001,0b10001,0b01110],
  'H': [0b10001,0b10001,0b10001,0b11111,0b10001,0b10001,0b10001],
  'I': [0b11111,0b00100,0b00100,0b00100,0b00100,0b00100,0b11111],
  'J': [0b11111,0b00010,0b00010,0b00010,0b00010,0b10010,0b01100],
  'K': [0b10001,0b10010,0b10100,0b11000,0b10100,0b10010,0b10001],
  'L': [0b10000,0b10000,0b10000,0b10000,0b10000,0b10000,0b11111],
  'M': [0b10001,0b11011,0b10101,0b10001,0b10001,0b10001,0b10001],
  'N': [0b10001,0b11001,0b10101,0b10011,0b10001,0b10001,0b10001],
  'O': [0b01110,0b10001,0b10001,0b10001,0b10001,0b10001,0b01110],
  'P': [0b11110,0b10001,0b10001,0b11110,0b10000,0b10000,0b10000],
  'Q': [0b01110,0b10001,0b10001,0b10001,0b10101,0b10010,0b01101],
  'R': [0b11110,0b10001,0b10001,0b11110,0b10100,0b10010,0b10001],
  'S': [0b01111,0b10000,0b10000,0b01110,0b00001,0b00001,0b11110],
  'T': [0b11111,0b00100,0b00100,0b00100,0b00100,0b00100,0b00100],
  'U': [0b10001,0b10001,0b10001,0b10001,0b10001,0b10001,0b01110],
  'V': [0b10001,0b10001,0b10001,0b10001,0b01010,0b01010,0b00100],
  'W': [0b10001,0b10001,0b10001,0b10101,0b10101,0b11011,0b10001],
  'X': [0b10001,0b01010,0b00100,0b00100,0b00100,0b01010,0b10001],
  'Y': [0b10001,0b10001,0b01010,0b00100,0b00100,0b00100,0b00100],
  'Z': [0b11111,0b00001,0b00010,0b00100,0b01000,0b10000,0b11111],
  '-': [0b00000,0b00000,0b00000,0b11111,0b00000,0b00000,0b00000],
  ' ': [0b00000,0b00000,0b00000,0b00000,0b00000,0b00000,0b00000],
  '·': [0b00000,0b00000,0b00100,0b01110,0b00100,0b00000,0b00000],
  "'": [0b00100,0b00100,0b00000,0b00000,0b00000,0b00000,0b00000],
}

function drawText(px, text, startX, startY, scale, r, g, b) {
  let x = startX
  for (const ch of text.toUpperCase()) {
    const rows = FONT5x7[ch] || FONT5x7[' ']
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        if (rows[row] & (1 << (4 - col))) {
          fillRect(px, x + col * scale, startY + row * scale,
                       x + col * scale + scale - 1, startY + row * scale + scale - 1, r, g, b)
        }
      }
    }
    x += (5 + 1) * scale // 5 wide + 1 kerning
  }
}

// ── render ─────────────────────────────────────────────────────────────────
const pixels = new Uint8Array(W * H * 3)

// Background gradient — simulate dark-to-slightly-less-dark horizontal
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const t = x / W          // 0..1 left to right
    const r = Math.round(20 + t * 12)
    const g = Math.round(12 + t * 4)
    const b = Math.round(6 + t * 6)
    setpx(pixels, x, y, r, g, b)
  }
}

// Decorative large circle — orange glow left-of-centre
fillCircle(pixels, 380, 315, 260, 184, 74, 0)
fillCircle(pixels, 380, 315, 210, 20, 12, 6)   // cut out centre

// Icon "M" ring (white) inside circle
fillCircle(pixels, 380, 315, 130, 255, 255, 255)
fillCircle(pixels, 380, 315, 110, 184, 74, 0)

// M letterform in white inside the inner circle
const mCX = 380, mCY = 315, mSW = 18
line(pixels, mCX - 46, mCY - 52, mCX - 46, mCY + 52, mSW, 255, 255, 255)
line(pixels, mCX + 46, mCY - 52, mCX + 46, mCY + 52, mSW, 255, 255, 255)
line(pixels, mCX - 46, mCY - 52, mCX,      mCY,       mSW, 255, 255, 255)
line(pixels, mCX,      mCY,      mCX + 46, mCY - 52,  mSW, 255, 255, 255)

// Right half — text block
// "MASTERCHEF" on first line
drawText(pixels, 'MASTERCHEF', 640, 190, 14, 255, 255, 255)
// "CUTS" on second line (larger)
drawText(pixels, 'CUTS', 640, 310, 20, 184, 74, 0)
// tagline
drawText(pixels, 'FARM-FRESH MEAT', 640, 440, 7, 200, 200, 200)
drawText(pixels, 'DIRECT FROM LOCAL FARMERS', 640, 466, 7, 160, 160, 160)

// Bottom orange accent bar
fillRect(pixels, 0, H - 8, W - 1, H - 1, 184, 74, 0)

// Write PNG (saved as .jpg — crawlers accept this; replace with real JPEG for production)
const png = toPNG(pixels, W, H)
const out = path.join(publicDir, 'og-image.jpg')
fs.writeFileSync(out, png)
console.log(`Written ${out} (${png.length} bytes)`)
console.log('Note: file is PNG-encoded; rename/re-export as real JPEG for best compression in production.')
