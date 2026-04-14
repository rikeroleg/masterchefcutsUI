import React, { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../api/client'
import '../styles/auth.css'

export default function ResetPassword() {
  const [searchParams]        = useSearchParams()
  const navigate              = useNavigate()
  const token                 = searchParams.get('token') || ''
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [done,      setDone]      = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8)  { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    setError('')
    try {
      await api.post(`/api/auth/reset-password?token=${encodeURIComponent(token)}&password=${encodeURIComponent(password)}`)
      setDone(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError(err.message || 'Reset failed. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="auth-error">Invalid reset link. <Link to="/forgot-password" className="auth-link">Request a new one</Link></p>
      </div>
    </div>
  )

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Set new password</h1>
          <p className="auth-sub">Choose a strong password for your account.</p>
        </div>

        {done ? (
          <div className="auth-success">
            <p>✅ Password updated! Redirecting to sign in…</p>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <p className="auth-error">{error}</p>}
            <div className="auth-field">
              <label>New password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="auth-input"
              />
            </div>
            <div className="auth-field">
              <label>Confirm password</label>
              <input
                type="password"
                required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat password"
                className="auth-input"
              />
            </div>
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Saving…' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
