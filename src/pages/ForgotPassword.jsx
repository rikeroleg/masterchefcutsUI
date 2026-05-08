import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import '../styles/auth.css'

export default function ForgotPassword() {
  const [email,   setEmail]   = useState('')
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/api/auth/forgot-password', { email })
      setSent(true)
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Reset password</h1>
          <p className="auth-sub">Enter your email and we'll send a reset link.</p>
        </div>

        {sent ? (
          <div className="auth-success">
            <p>✅ Check your inbox — a reset link is on its way.</p>
            <Link to="/login" className="auth-link">Back to sign in</Link>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <p className="auth-error">{error}</p>}
            <div className="auth-field">
              <label>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="auth-input"
              />
            </div>
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
            <p className="auth-footer-link"><Link to="/login" className="auth-link">Back to sign in</Link></p>
          </form>
        )}
      </div>
    </div>
  )
}
