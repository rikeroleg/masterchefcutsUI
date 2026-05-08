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

function getToken() {
  return localStorage.getItem('mc_token')
}

async function request(method, path, body) {
  const token = getToken()
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { message: text }
    }
  }

  if (res.status === 401) {
    if (path.startsWith('/api/auth/')) {
      throw new Error(data?.error || data?.message || 'Invalid credentials')
    }
    if (!token) {
      throw new Error(data?.error || data?.message || 'Unauthorized')
    }
    localStorage.removeItem('mc_token')
    localStorage.removeItem('mc_user')
    localStorage.removeItem('mc_cart')
    window.dispatchEvent(new CustomEvent('session-expired'))
    throw new Error('Session expired — please sign in again.')
  }

  if (res.status === 403) {
    throw new Error(data?.error || data?.message || 'Access denied — you do not have permission.')
  }

  if (!res.ok) {
    const safe = sanitizeErrorBody(data)
    const message = safe?.error || safe?.message || `Request failed (${res.status})`
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
    const token = getToken()
    const headers = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    return fetch(`${BASE_URL}${path}`, { method: 'POST', headers, body: formData })
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
