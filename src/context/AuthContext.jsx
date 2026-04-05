import React, { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../api/client'

const AuthContext = createContext(null)

function mapUser(data) {
  return {
    id:        data.id,
    name:      `${data.firstName} ${data.lastName}`.trim(),
    firstName: data.firstName,
    lastName:  data.lastName,
    email:     data.email,
    role:      data.role?.toLowerCase(),
    approved:  data.approved ?? null,
    shopName:  data.shopName  || '',
    street:    data.street    || '',
    apt:       data.apt       || '',
    city:      data.city      || '',
    state:     data.state     || '',
    zipCode:   data.zipCode   || '',
    notificationPreference: data.notificationPreference || 'ALL',
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('mc_user')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })

  useEffect(() => {
    if (user) localStorage.setItem('mc_user', JSON.stringify(user))
    else { localStorage.removeItem('mc_user'); localStorage.removeItem('mc_token') }
  }, [user])

  async function register({ name, email, password, role, shopName, street, apt, city, state, zipCode }) {
    const [firstName, ...rest] = (name || '').trim().split(' ')
    const lastName = rest.join(' ')
    try {
      const data = await api.post('/api/auth/register', {
        firstName, lastName, email, password,
        role: role?.toUpperCase(),
        shopName, street, apt, city, state, zipCode,
      })
      if (!data.token) {
        return { verify: true }
      }
      localStorage.setItem('mc_token', data.token)
      setUser(mapUser(data))
      return { ok: true }
    } catch (err) {
      return { error: err.message }
    }
  }

  async function login({ email, password }) {
    try {
      const data = await api.post('/api/auth/login', { email, password })
      localStorage.setItem('mc_token', data.token)
      setUser(mapUser(data))
      return { ok: true }
    } catch (err) {
      return { error: err.message }
    }
  }

  function logout() {
    setUser(null)
  }

  async function updateUser(fields) {
    try {
      const payload = {}
      if (fields.name) {
        const [fn, ...rest] = fields.name.trim().split(' ')
        payload.firstName = fn
        payload.lastName  = rest.join(' ')
      }
      if (fields.shopName !== undefined) payload.shopName = fields.shopName
      if (fields.street   !== undefined) payload.street   = fields.street
      if (fields.apt      !== undefined) payload.apt      = fields.apt
      if (fields.city     !== undefined) payload.city     = fields.city
      if (fields.state    !== undefined) payload.state    = fields.state
      if (fields.zipCode  !== undefined) payload.zipCode  = fields.zipCode

      const data = await api.patch('/api/auth/me', payload)
      setUser(mapUser(data))
      return { ok: true }
    } catch (err) {
      return { error: err.message }
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, register, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
