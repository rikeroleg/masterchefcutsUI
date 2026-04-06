import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const ROLES = [
  { id: 'buyer',  label: 'Participant',       emoji: '🛒', desc: 'Browse listings and claim shares.' },
  { id: 'farmer', label: 'Farmer / Butcher', emoji: '🌾', desc: 'List whole animals for participants to pool.' },
]

export default function Login() {
  const [tab, setTab]       = useState('signin')
  const [error, setError]   = useState('')
  const [loading, setLoad]  = useState(false)
  const [verified, setVerified] = useState(false)
  const [registered, setRegistered] = useState(false) // Show email verification prompt
  const { login, register } = useAuth()
  const navigate            = useNavigate()
  const { toast }           = useToast()

  const [signin, setSignin] = useState({ email: '', password: '' })
  const [signup, setSignup] = useState({
    name: '', email: '', password: '', confirm: '',
    role: 'buyer', shopName: '',
    street: '', apt: '', city: '', state: '', zipCode: '',
  })

  async function handleSignin(e) {
    e.preventDefault()
    setError('')
    setLoad(true)
    const res = await login({ email: signin.email, password: signin.password })
    setLoad(false)
    if (res.error) {
      setError(res.error)
    } else navigate(res.role === 'admin' ? '/admin' : '/profile')
  }

  async function handleSignup(e) {
    e.preventDefault()
    setError('')
    if (signup.password !== signup.confirm) { setError('Passwords do not match.'); return }
    if (signup.password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoad(true)
    const res = await register({
      name: signup.name, email: signup.email, password: signup.password,
      role: signup.role, shopName: signup.shopName,
      street: signup.street, apt: signup.apt,
      city: signup.city, state: signup.state, zipCode: signup.zipCode,
    })
    setLoad(false)
    if (res.error) {
      setError(res.error)
    } else if (res.verify) {
      // Email verification required - show confirmation
      setRegistered(true)
    } else {
      // Immediate login (no email verification)
      toast.success('Account created successfully! Welcome to MasterChef Cuts.')
      navigate('/profile')
    }
  }

  function fieldSignin(e) { setSignin(f => ({ ...f, [e.target.name]: e.target.value })) }
  function fieldSignup(e) { setSignup(f => ({ ...f, [e.target.name]: e.target.value })) }

  return (
    <div className="login-page">
      <div className="login-card">

        {/* Logo / brand */}
        <div className="login-brand">
          <span className="login-brand-icon">🐄</span>
          <span className="login-brand-name">MasterChef Cuts</span>
        </div>

        {/* Tabs */}
        {!registered && (
          <div className="login-tabs">
            <button className={`login-tab${tab === 'signin' ? ' active' : ''}`} onClick={() => { setTab('signin'); setError('') }}>
              Sign In
            </button>
            <button className={`login-tab${tab === 'signup' ? ' active' : ''}`} onClick={() => { setTab('signup'); setError('') }}>
              Create Account
            </button>
          </div>
        )}

        {/* Error */}
        {!registered && error && <div className="login-error">{error}</div>}

        {/* ── Registration Confirmation ── */}
        {registered && (
          <div className="login-confirmed">
            <div className="login-confirmed-icon">✉️</div>
            <h2 className="login-confirmed-title">Check your email!</h2>
            <p className="login-confirmed-text">
              We&apos;ve sent a verification link to <strong>{signup.email}</strong>. 
              Click the link in your email to activate your account.
            </p>
            <p className="login-confirmed-subtext">
              Didn&apos;t receive it? Check your spam folder or{' '}
              <button type="button" className="login-link" onClick={() => { setRegistered(false); setTab('signup') }}>
                try again
              </button>
            </p>
            <button 
              type="button" 
              className="login-submit" 
              onClick={() => { setRegistered(false); setTab('signin') }}
            >
              Go to Sign In →
            </button>
          </div>
        )}

        {/* ── Sign In ── */}
        {!registered && tab === 'signin' && (
          <form className="login-form" onSubmit={handleSignin}>
            <div className="login-field">
              <label>Email</label>
              <input name="email" type="email" value={signin.email} onChange={fieldSignin}
                placeholder="you@example.com" required autoFocus />
            </div>
            <div className="login-field">
              <label>Password</label>
              <input name="password" type="password" value={signin.password} onChange={fieldSignin}
                placeholder="••••••••" required />
            </div>
            <p className="login-forgot">
              <Link to="/forgot-password" className="login-link">Forgot password?</Link>
            </p>
            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
            <p className="login-switch">
              No account?{' '}
              <button type="button" className="login-link" onClick={() => { setTab('signup'); setError('') }}>
                Create one
              </button>
            </p>
          </form>
        )}

        {/* ── Sign Up ── */}
        {!registered && tab === 'signup' && (
          <form className="login-form" onSubmit={handleSignup}>

            <div className="login-field">
              <label>I am a…</label>
              <div className="login-role-row">
                {ROLES.map(r => (
                  <button type="button" key={r.id}
                    className={`login-role-btn${signup.role === r.id ? ' active' : ''}`}
                    onClick={() => setSignup(f => ({ ...f, role: r.id }))}>
                    <span className="login-role-emoji">{r.emoji}</span>
                    <span className="login-role-label">{r.label}</span>
                    <span className="login-role-desc">{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="login-row">
              <div className="login-field">
                <label>Full name *</label>
                <input name="name" value={signup.name} onChange={fieldSignup}
                  placeholder="Jane Smith" required />
              </div>
              {signup.role === 'farmer' && (
                <div className="login-field">
                  <label>Shop / Farm name</label>
                  <input name="shopName" value={signup.shopName} onChange={fieldSignup}
                    placeholder="Green Pastures Farm" />
                </div>
              )}
            </div>

            <div className="login-field">
              <label>Email *</label>
              <input name="email" type="email" value={signup.email} onChange={fieldSignup}
                placeholder="you@example.com" required />
            </div>

            <div className="login-section-label">Shipping Address</div>

            <div className="login-field">
              <label>Street address *</label>
              <input name="street" value={signup.street} onChange={fieldSignup}
                placeholder="123 Main St" required />
            </div>

            <div className="login-row">
              <div className="login-field">
                <label>Apt / Suite <span className="login-opt">(optional)</span></label>
                <input name="apt" value={signup.apt} onChange={fieldSignup}
                  placeholder="Apt 4B" />
              </div>
              <div className="login-field">
                <label>ZIP Code *</label>
                <input name="zipCode" value={signup.zipCode} onChange={fieldSignup}
                  placeholder="17601" maxLength={10} required />
                <span className="login-hint">Used to match you with local listings</span>
              </div>
            </div>

            <div className="login-row">
              <div className="login-field">
                <label>City *</label>
                <input name="city" value={signup.city} onChange={fieldSignup}
                  placeholder="Lancaster" required />
              </div>
              <div className="login-field">
                <label>State *</label>
                <input name="state" value={signup.state} onChange={fieldSignup}
                  placeholder="PA" maxLength={2} required />
              </div>
            </div>

            <div className="login-row">
              <div className="login-field">
                <label>Password *</label>
                <input name="password" type="password" value={signup.password} onChange={fieldSignup}
                  placeholder="Min 6 characters" required />
              </div>
              <div className="login-field">
                <label>Confirm password *</label>
                <input name="confirm" type="password" value={signup.confirm} onChange={fieldSignup}
                  placeholder="••••••••" required />
              </div>
            </div>

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account →'}
            </button>

            <p className="login-switch">
              Already have an account?{' '}
              <button type="button" className="login-link" onClick={() => { setTab('signin'); setError('') }}>
                Sign in
              </button>
            </p>
          </form>
        )}

      </div>
    </div>
  )
}
