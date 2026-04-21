import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import '../styles/auth.css'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const emailParam = searchParams.get('email')

  const [status,  setStatus]  = useState('loading') // loading | success | error
  const [message, setMessage] = useState('')
  const [resendEmail, setResendEmail] = useState(emailParam || '')
  const [resendStatus, setResendStatus] = useState('') // '' | 'sending' | 'sent' | 'error'

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token found. Check your email for the correct link.')
      return
    }

    api.get(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(() => setStatus('success'))
      .catch(err => {
        setStatus('error')
        setMessage(err.message || 'Invalid or expired verification link.')
      })
  }, [token])

  async function handleResend(e) {
    e.preventDefault()
    if (!resendEmail.trim()) return
    setResendStatus('sending')
    try {
      await api.post('/api/auth/resend-verification', { email: resendEmail.trim() })
      setResendStatus('sent')
    } catch {
      setResendStatus('error')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand-icon">&#127859;</span>
          <span className="auth-brand-name">MasterChef Cuts</span>
        </div>

        {status === 'loading' && (
          <div className="auth-info">
            <p>Verifying your email&hellip;</p>
          </div>
        )}

        {status === 'success' && (
          <div className="auth-success-wrap">
            <div className="auth-success-icon">&#10003;</div>
            <h2 className="auth-heading">Email verified!</h2>
            <p className="auth-subtext">Your account is now active. You can sign in and start browsing premium cuts.</p>
            <Link to="/login" className="auth-submit-btn">Go to Sign In &#8594;</Link>
          </div>
        )}

        {status === 'error' && (
          <div className="auth-error-wrap">
            <div className="auth-error-icon">&#10005;</div>
            <h2 className="auth-heading">Verification failed</h2>
            <p className="auth-subtext">{message}</p>

            {resendStatus === 'sent' ? (
              <p className="auth-info">A new verification email has been sent. Please check your inbox.</p>
            ) : (
              <form className="auth-form" onSubmit={handleResend} style={{ marginTop: '16px' }}>
                <p className="auth-subtext" style={{ marginBottom: '8px' }}>Resend the verification email:</p>
                <input
                  className="auth-input"
                  type="email"
                  placeholder="Your email address"
                  value={resendEmail}
                  onChange={e => setResendEmail(e.target.value)}
                  required
                />
                {resendStatus === 'error' && (
                  <p className="auth-error">Failed to resend. Please try again.</p>
                )}
                <button
                  className="auth-submit-btn"
                  type="submit"
                  disabled={resendStatus === 'sending'}
                  style={{ marginTop: '8px' }}
                >
                  {resendStatus === 'sending' ? 'Sending…' : 'Resend verification email'}
                </button>
              </form>
            )}

            <Link to="/login" className="auth-link" style={{ marginTop: '12px', display: 'block' }}>Back to Sign In</Link>
          </div>
        )}
      </div>
    </div>
  )
}
