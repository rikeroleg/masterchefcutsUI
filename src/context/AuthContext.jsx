/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { cartClearBridge } from './CartContext'
import logger from '../utils/logger.js'

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
    licenseUrl:               data.licenseUrl               || null,
    rejectionReason:          data.rejectionReason           || null,
    // Epoch-ms when the access token expires — used to schedule proactive refresh.
    // The token itself travels only in the httpOnly mc_auth cookie, not in JS.
    tokenExpiresAt: data.tokenExpiresAt || null,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Restore non-sensitive profile cache from localStorage.
    // The JWT lives only in the httpOnly mc_auth cookie — inaccessible to JS.
    // The first API call will produce a 401 if the cookie has expired, which
    // the session-expired handler will catch and clear user state.
    try {
      const saved = localStorage.getItem('mc_user')
      return saved ? JSON.parse(saved) : null
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
      logger.warn('AuthContext', 'session expired — clearing user and redirecting to login')
      setUser(null)
      cartClearBridge.clearCart()
      setSessionExpiredMsg('Your session expired — please sign in again.')
      navigate('/login')
    }
    window.addEventListener('session-expired', handleExpired)
    return () => window.removeEventListener('session-expired', handleExpired)
  }, [navigate])

  // Proactive token refresh — schedule a refresh 60s before the JWT expires.
  // tokenExpiresAt is stored in the mc_user cache (not in the httpOnly cookie itself).
  useEffect(() => {
    if (!user?.tokenExpiresAt) return
    let timerId
    const msUntilRefresh = user.tokenExpiresAt - Date.now() - 60_000
    const doRefresh = () => {
      logger.debug('AuthContext', 'proactive token refresh triggered')
      api.post('/api/auth/refresh')
        .then(data => {
          if (data?.tokenExpiresAt) {
            logger.debug('AuthContext', 'token refreshed successfully')
            setUser(u => u ? { ...u, tokenExpiresAt: data.tokenExpiresAt } : u)
          }
        })
        .catch(() => {
          logger.warn('AuthContext', 'token refresh failed — dispatching session-expired')
          window.dispatchEvent(new Event('session-expired'))
        })
    }
    if (msUntilRefresh <= 0) {
      doRefresh()
    } else {
      timerId = setTimeout(doRefresh, msUntilRefresh)
    }
    return () => clearTimeout(timerId)
  }, [user?.tokenExpiresAt])

  // Persist non-sensitive profile cache. Token is in httpOnly cookie — not stored here.
  useEffect(() => {
    if (user) localStorage.setItem('mc_user', JSON.stringify(user))
    else localStorage.removeItem('mc_user')
  }, [user])

  async function register({ name, email, password, role, shopName, street, apt, city, state, zipCode, referralCode }) {
    const [firstName, ...rest] = (name || '').trim().split(' ')
    const lastName = rest.join(' ')
    try {
      const data = await api.post('/api/auth/register', {
        firstName, lastName, email, password,
        role: role?.toUpperCase(),
        ...(shopName ? { shopName } : {}),
        ...(street?.trim()  ? { street }  : {}),
        ...(apt             ? { apt }     : {}),
        ...(city?.trim()    ? { city }    : {}),
        ...(state?.trim()   ? { state }   : {}),
        ...(zipCode         ? { zipCode } : {}),
        ...(referralCode    ? { referralCode } : {}),
      })
      // token is now in httpOnly cookie set by the server; tokenExpiresAt tells us when.
      if (!data.tokenExpiresAt) {
        logger.info('AuthContext', 'registration succeeded — email verification required', { email })
        return { verify: true }
      }
      logger.info('AuthContext', 'registration succeeded — user signed in', { email, role })
      setUser(mapUser(data))
      return { ok: true }
    } catch (err) {
      logger.warn('AuthContext', 'registration failed', { email, error: err.message })
      return { error: err.message, fields: err.fields || null }
    }
  }

  async function login({ email, password }) {
    try {
      const data = await api.post('/api/auth/login', { email, password })
      // JWT is in httpOnly cookie set by the server; tokenExpiresAt drives the refresh timer.
      const mapped = mapUser(data)
      logger.info('AuthContext', 'user signed in', { email, role: mapped.role })
      setUser(mapped)
      clearSessionMsg()
      return { ok: true, role: mapped.role }
    } catch (err) {
      logger.warn('AuthContext', 'sign-in failed', { email, error: err.message })
      return { error: err.message }
    }
  }

  async function logout() {
    // Tell the server to clear the httpOnly auth cookies, then clean up client state.
    logger.info('AuthContext', 'user signed out')
    try { await api.post('/api/auth/logout') } catch { /* ignore — clear locally regardless */ }
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
      if (fields.street   !== undefined && fields.street.trim())   payload.street   = fields.street
      if (fields.apt      !== undefined) payload.apt      = fields.apt
      if (fields.city     !== undefined && fields.city.trim())     payload.city     = fields.city
      if (fields.state    !== undefined && fields.state.trim())    payload.state    = fields.state
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
