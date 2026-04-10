const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/participant'

function getToken() {
  return localStorage.getItem('mc_token')
}

async function request(method, path, body) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  const data = text ? JSON.parse(text) : null

  if (res.status === 401) {
    localStorage.removeItem('mc_token')
    localStorage.removeItem('mc_user')
    localStorage.removeItem('mc_cart')
    window.location.href = '/login'
    return null
  }

  if (res.status === 403) {
    throw new Error('Access denied — you do not have permission.')
  }

  if (!res.ok) {
    const message = data?.error || data?.message || `Request failed (${res.status})`
    throw new Error(message)
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
        if (!res.ok) throw new Error(data?.error || data?.message || `Upload failed (${res.status})`)
        return data
      })
  },
}
