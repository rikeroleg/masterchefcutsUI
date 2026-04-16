import React, { useState, useEffect } from 'react'
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
  const [fieldErrors, setFieldErrors] = useState(null)
  const [loading, setLoad]  = useState(false)
  const [verified, setVerified] = useState(false)
  const [registered, setRegistered] = useState(false) // Show email verification prompt
  const { login, register, sessionExpiredMsg, clearSessionMsg } = useAuth()
  const navigate            = useNavigate()
  const { toast }           = useToast()

  useEffect(() => () => clearSessionMsg(), [clearSessionMsg])

  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showTerms, setShowTerms]         = useState(false)

  const [signin, setSignin] = useState({ email: '', password: '' })
  const [signup, setSignup] = useState({
    name: '', email: '', password: '', confirm: '',
    role: 'buyer', shopName: '',
    street: '', apt: '', city: '', state: '', zipCode: '',
  })

  async function handleSignin(e) {
    e.preventDefault()
    setError('')
    setFieldErrors(null)
    setLoad(true)
    const res = await login({ email: signin.email, password: signin.password })
    setLoad(false)
    if (res.error) {
      setError(res.error)
      setFieldErrors(res.fields || null)
    } else navigate(res.role === 'admin' ? '/admin' : '/profile')
  }

  async function handleSignup(e) {
    e.preventDefault()
    setError('')
    setFieldErrors(null)
    if (!termsAccepted) { setError('You must accept the Terms & Conditions to create an account.'); return }
    if (signup.password !== signup.confirm) { setError('Passwords do not match.'); return }
    if (signup.password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoad(true)
    const refCode = localStorage.getItem('mcc_ref')
    const res = await register({
      name: signup.name, email: signup.email, password: signup.password,
      role: signup.role, shopName: signup.shopName,
      street: signup.street, apt: signup.apt,
      city: signup.city, state: signup.state, zipCode: signup.zipCode,
      ...(refCode ? { referralCode: refCode } : {}),
    })
    setLoad(false)
    if (res.error) {
      setError(res.error)
      setFieldErrors(res.fields || null)
    } else if (res.verify) {
      // Email verification required - show confirmation
      localStorage.removeItem('mcc_ref')
      setRegistered(true)
    } else {
      // Immediate login (no email verification)
      localStorage.removeItem('mcc_ref')
      toast.success('Account created successfully! Welcome to MasterChef Cuts.')
      navigate('/profile')
    }
  }

  function fieldSignin(e) { setSignin(f => ({ ...f, [e.target.name]: e.target.value })) }
  function fieldSignup(e) { setSignup(f => ({ ...f, [e.target.name]: e.target.value })) }

  return (
    <>
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
            <button className={`login-tab${tab === 'signin' ? ' active' : ''}`} onClick={() => { setTab('signin'); setError(''); setFieldErrors(null) }}>
              Sign In
            </button>
            <button className={`login-tab${tab === 'signup' ? ' active' : ''}`} onClick={() => { setTab('signup'); setError(''); setFieldErrors(null) }}>
              Create Account
            </button>
          </div>
        )}

        {/* Session expired banner */}
        {sessionExpiredMsg && <div className="login-error" style={{ background: 'rgba(180,120,0,0.18)', borderColor: '#c9922a' }}>{sessionExpiredMsg}</div>}

        {/* Error */}
        {!registered && error && (
          <div className="login-error">
            {fieldErrors ? (
              <ul className="login-error-list">
                {Object.entries(fieldErrors).map(([field, msg]) => (
                  <li key={field}><strong>{field}:</strong> {msg}</li>
                ))}
              </ul>
            ) : error}
          </div>
        )}

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

            {/* Buyer: ZIP only — full address collected at checkout */}
            {signup.role === 'buyer' && (
              <div className="login-field">
                <label>ZIP Code *</label>
                <input name="zipCode" value={signup.zipCode} onChange={fieldSignup}
                  placeholder="17601" maxLength={10} required />
                <span className="login-hint">Used to match you with local listings — full address collected at checkout</span>
              </div>
            )}

            {/* Farmer: full business address required */}
            {signup.role === 'farmer' && (
              <>
                <div className="login-section-label">Business Address</div>

                <div className="login-field">
                  <label>Street address *</label>
                  <input name="street" value={signup.street} onChange={fieldSignup}
                    placeholder="123 Main St" required />
                </div>

                <div className="login-row">
                  <div className="login-field">
                    <label>Apt / Suite <span className="login-opt">(optional)</span></label>
                    <input name="apt" value={signup.apt} onChange={fieldSignup}
                      placeholder="Suite 4B" />
                  </div>
                  <div className="login-field">
                    <label>ZIP Code *</label>
                    <input name="zipCode" value={signup.zipCode} onChange={fieldSignup}
                      placeholder="17601" maxLength={10} required />
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
              </>
            )}

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

            <label className="login-terms-row">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={e => setTermsAccepted(e.target.checked)}
              />
              <span>
                I have read and agree to the{' '}
                <button type="button" className="login-link" onClick={() => setShowTerms(true)}>
                  Terms &amp; Conditions
                </button>
              </span>
            </label>

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

    {/* ── Terms & Conditions Modal ── */}
    {showTerms && (
      <div className="tc-overlay" onClick={() => setShowTerms(false)}>
        <div className="tc-modal" onClick={e => e.stopPropagation()}>
          <div className="tc-header">
            <h2>Terms &amp; Conditions</h2>
            <button type="button" className="tc-close" onClick={() => setShowTerms(false)}>✕</button>
          </div>
          <div className="tc-body">
            <p className="tc-date">Last updated: April 5, 2026</p>

            <h3>1. Acceptance of Terms</h3>
            <p>By creating an account or using MasterChef Cuts, you agree to be bound by these Terms &amp; Conditions. If you do not agree, you may not use the platform.</p>

            <h3>2. Eligibility</h3>
            <p>You must be at least 18 years old and legally capable of entering into binding contracts to use MasterChef Cuts.</p>

            <h3>3. Account Responsibilities</h3>
            <p>You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account. Notify us immediately of any unauthorized use.</p>

            <h3>4. Buyer (Participant) Terms</h3>
            <ul>
              <li>Buyers may browse listings, claim individual cuts, and pay for those cuts through our secure checkout.</li>
              <li>All sales are final once an order is placed and payment is captured. Refunds are at the discretion of the Farmer and MasterChef Cuts staff.</li>
              <li>Buyers are responsible for coordinating pickup or delivery with the Farmer.</li>
            </ul>

            <h3>5. Farmer / Butcher Terms</h3>
            <ul>
              <li>Farmers and Butchers must accurately describe animals, weights, breeds, and available cuts.</li>
              <li>All listings must comply with applicable local, state, and federal food-safety regulations. MasterChef Cuts is not liable for regulatory non-compliance by the Farmer/Butcher.</li>
              <li>Farmers are responsible for fulfillment, communication, and timely delivery or pickup coordination.</li>
              <li>MasterChef Cuts charges a <strong>15% platform fee</strong> on the sale price, deducted from the payout to the Farmer. This fee covers payment processing, platform maintenance, and customer support.</li>
            </ul>

            <h3>6. Payments</h3>
            <ul>
              <li>All payments are processed through Stripe. MasterChef Cuts does not store full card numbers.</li>
              <li>Payouts to Farmers are subject to Stripe&apos;s standard processing timelines and the deduction of the 15% platform fee.</li>
              <li>Any applicable taxes are the responsibility of the Farmer.</li>
            </ul>

            <h3>7. Pickup &amp; Delivery</h3>
            <p>Fulfillment logistics (pickup location, delivery, processing dates) are coordinated between Buyer and Farmer through the platform. MasterChef Cuts is not responsible for missed pickups, spoilage, or disputes arising from fulfillment.</p>

            <h3>8. Prohibited Conduct</h3>
            <p>Users may not post fraudulent listings, manipulate pricing, harass other users, or attempt to circumvent the platform&apos;s payment system. Violation may result in immediate account termination.</p>

            <h3>9. Limitation of Liability</h3>
            <p>MasterChef Cuts provides a marketplace platform and is not a party to transactions between Buyers and Farmers. To the fullest extent permitted by law, MasterChef Cuts shall not be liable for indirect, incidental, or consequential damages arising from use of the platform.</p>

            <h3>10. Privacy</h3>
            <p>Your personal information (name, email, shipping address) is used solely to facilitate transactions and account management. We do not sell your data to third parties. See our Privacy Policy for full details.</p>

            <h3>11. Changes to Terms</h3>
            <p>We reserve the right to update these Terms at any time. Continued use of the platform after changes constitutes acceptance of the revised Terms.</p>

            <h3>12. Contact</h3>
            <p>Questions? Contact us at <strong>support@masterchefcuts.com</strong>.</p>
          </div>
          <div className="tc-footer">
            <button
              type="button"
              className="login-submit"
              onClick={() => { setTermsAccepted(true); setShowTerms(false) }}
            >
              I Accept
            </button>
            <button
              type="button"
              className="tc-decline"
              onClick={() => { setTermsAccepted(false); setShowTerms(false) }}
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  )
}
