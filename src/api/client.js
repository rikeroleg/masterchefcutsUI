import logger from '../utils/logger.js'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

// Fields that are implementation details and must never surface in the UI.
// Acts as a safety net even if the backend accidentally re-adds them.
const TECHNICAL_FIELDS = ['timestamp', 'status', 'path', 'trace']
function sanitizeErrorBody(data) {
  if (!data || typeof data !== 'object') return data
  return Object.fromEntries(
    Object.entries(data).filter(([k]) => !TECHNICAL_FIELDS.includes(k))
  )
}

// Read the XSRF-TOKEN cookie set by Spring's CookieCsrfTokenRepository and
// return the decoded value, or null if absent.
function readXsrfToken() {
  const cookie = document.cookie
    .split('; ')
    .find(c => c.startsWith('XSRF-TOKEN='))
    ?.split('=')[1]
  return cookie ? decodeURIComponent(cookie) : null
}

async function request(method, path, body) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  // Include XSRF token on every mutating request so CSRF protection passes.
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const xsrf = readXsrfToken()
    if (xsrf) headers['X-XSRF-TOKEN'] = xsrf
  }

  logger.debug('API', `${method} ${path}`, body !== undefined ? { body } : undefined)

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    credentials: 'include', // send httpOnly auth cookie with every request
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      // Non-JSON response (e.g. nginx HTML error page) — never surface raw HTML
      data = { message: res.ok ? text : `Request failed (${res.status})` }
    }
  }

  if (res.status === 401) {
    if (path.startsWith('/api/auth/')) {
      logger.warn('API', `401 auth failure: ${path}`)
      throw new Error(data?.error || data?.message || 'Invalid credentials')
    }
    // Only treat 401 as "session expired" when there actually was a session.
    // Anonymous visitors hitting an auth-required endpoint must NOT be forced
    // through a logout-and-redirect — they were never logged in.
    const hadSession = typeof localStorage !== 'undefined' && localStorage.getItem('mc_user') !== null
    if (hadSession) {
      logger.warn('API', `401 session expired: ${path}`)
      localStorage.removeItem('mc_user')
      localStorage.removeItem('mc_cart')
      window.dispatchEvent(new CustomEvent('session-expired'))
      throw new Error('Session expired — please sign in again.')
    }
    logger.warn('API', `401 unauthorized (no active session): ${path}`)
    throw new Error(data?.error || data?.message || 'Authentication required')
  }

  if (res.status === 403) {
    logger.warn('API', `403 access denied: ${path}`)
    throw new Error(data?.error || data?.message || 'Access denied — you do not have permission.')
  }

  if (!res.ok) {
    const safe = sanitizeErrorBody(data)
    const message = safe?.error || safe?.message || `Request failed (${res.status})`
    logger.error('API', `${res.status} error: ${method} ${path}`, { message })
    const err = new Error(message)
    if (safe?.fields && typeof safe.fields === 'object') err.fields = safe.fields
    throw err
  }

  return data
}

export const api = {
  get:    (path)        => request('GET',    path),
  post:   (path, body)  => request('POST',   path, body),
  patch:  (path, body)  => request('PATCH',  path, body),
  put:    (path, body)  => request('PUT',    path, body),
  delete: (path)        => request('DELETE', path),
  upload: (path, formData) => {
    const headers = {}
    const xsrf = readXsrfToken()
    if (xsrf) headers['X-XSRF-TOKEN'] = xsrf
    return fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: formData,
    })
      .then(async res => {
        const text = await res.text()
        const data = text ? JSON.parse(text) : null
        if (!res.ok) {
          const safe = sanitizeErrorBody(data)
          throw new Error(safe?.error || safe?.message || `Upload failed (${res.status})`)
        }
        return data
      })
  },
}
