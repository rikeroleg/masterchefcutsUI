/**
 * logger.js — Centralized, level-aware logger for MasterChef Cuts
 *
 * In development (VITE_LOG_LEVEL=debug or unset): all levels print.
 * In production (NODE_ENV=production): only warn/error print unless
 *   VITE_LOG_LEVEL=debug is explicitly set.
 *
 * Usage:
 *   import logger from '../utils/logger'
 *   logger.debug('CartContext', 'item added', { id, qty })
 *   logger.info('AuthContext', 'user signed in', { userId })
 *   logger.warn('API', 'retrying request', { url, attempt })
 *   logger.error('Checkout', 'payment failed', err)
 */

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 }

const isProd   = import.meta.env.PROD
const envLevel = import.meta.env.VITE_LOG_LEVEL?.toLowerCase() ?? (isProd ? 'warn' : 'debug')
const threshold = LEVELS[envLevel] ?? (isProd ? LEVELS.warn : LEVELS.debug)

function fmt(level, ctx, msg) {
  const ts  = new Date().toISOString().slice(11, 23) // HH:mm:ss.mmm
  const tag = `[${ts}] [${level.toUpperCase()}] [${ctx}]`
  return `${tag} ${msg}`
}

function log(level, levelNum, ctx, msg, ...args) {
  if (levelNum < threshold) return
  const text = fmt(level, ctx, msg)
  // eslint-disable-next-line no-console
  switch (level) {
    case 'error': console.error(text, ...args); break
    case 'warn':  console.warn(text, ...args);  break
    case 'info':  console.info(text, ...args);  break
    default:      console.log(text, ...args);   break
  }
}

const logger = {
  debug: (ctx, msg, ...args) => log('debug', LEVELS.debug, ctx, msg, ...args),
  info:  (ctx, msg, ...args) => log('info',  LEVELS.info,  ctx, msg, ...args),
  warn:  (ctx, msg, ...args) => log('warn',  LEVELS.warn,  ctx, msg, ...args),
  error: (ctx, msg, ...args) => log('error', LEVELS.error, ctx, msg, ...args),
}

export default logger
