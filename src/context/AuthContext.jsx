import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { cartClearBridge } from './CartContext'

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
    bio:              data.bio              || '',
    certifications:   data.certifications   || '',
    stripeAccountId:          data.stripeAccountId          || null,
    stripeOnboardingComplete: data.stripeOnboardingComplete ?? false,
  }
}

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    // exp is in seconds; Date.now() is in ms
    return payload.exp * 1000 < Date.now()
  } catch {
    return true // treat unparseable tokens as expired
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem('mc_token')
      const saved = localStorage.getItem('mc_user')
      if (!token || !saved) return null
      if (isTokenExpired(token)) {
        // Silent clear on init — no session-expired event, just a fresh logged-out state
        localStorage.removeItem('mc_token')
        localStorage.removeItem('mc_user')
        localStorage.removeItem('mc_cart')
        return null
      }
      return JSON.parse(saved)
    } catch { return null }
  })
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState(null)
  const navigate = useNavigate()
  const handledExpiryRef = useRef(false)
  const clearSessionMsg = useCallback(() => {
    setSessionExpiredMsg(null)
    handledExpiryRef.current = false
  }, [])

  // Listen for 401s from the API client and handle session expiry gracefully
  useEffect(() => {
    function handleExpired() {
      if (handledExpiryRef.current) return
      handledExpiryRef.current = true
      setUser(null)
      cartClearBridge.clearCart()
      setSessionExpiredMsg('Your session expired — please sign in again.')
      navigate('/login')
    }
    window.addEventListener('session-expired', handleExpired)
    return () => window.removeEventListener('session-expired', handleExpired)
  }, [navigate])

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
      const mapped = mapUser(data)
      setUser(mapped)
      clearSessionMsg()
      return { ok: true, role: mapped.role }
    } catch (err) {
      return { error: err.message }
    }
  }

  function logout() {
    setUser(null)
    localStorage.removeItem('mc_cart')
    cartClearBridge.clearCart()
    clearSessionMsg()
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
      if (fields.bio       !== undefined) payload.bio       = fields.bio
      if (fields.certifications !== undefined) payload.certifications = fields.certifications

      const data = await api.patch('/api/auth/me', payload)
      setUser(mapUser(data))
      return { ok: true }
    } catch (err) {
      return { error: err.message }
    }
  }

  async function refreshConnectStatus() {
    try {
      const data = await api.get('/api/connect/status')
      setUser(u => ({
        ...u,
        stripeAccountId:          data.stripeAccountId          || null,
        stripeOnboardingComplete: data.stripeOnboardingComplete ?? false,
      }))
    } catch {
      // silently ignore
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, register, updateUser, refreshConnectStatus, sessionExpiredMsg, clearSessionMsg }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
