import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { api } from '../api/client'

/**
 * Referral landing page — /refer
 *
 * When a visitor lands here with ?ref=USER_ID, we store the referrer code
 * in localStorage so the registration flow can pick it up.
 * Authenticated users see their own shareable link and referral stats.
 */
export default function Referral() {
  const [searchParams] = useSearchParams()
  const inboundRef     = searchParams.get('ref')
  const { user }       = useAuth()
  const { toast }      = useToast()
  const [stats, setStats] = useState(null)
  const [copied, setCopied] = useState(false)

  // Store inbound referral code for use at signup
  useEffect(() => {
    if (inboundRef && !user) {
      localStorage.setItem('mcc_ref', inboundRef)
    }
  }, [inboundRef, user])

  useEffect(() => {
    document.title = 'Invite Friends — MasterChef Cuts'
    if (user) {
      api.get('/api/referrals/my')
        .then(setStats)
        .catch(() => {}) // optional endpoint — graceful fail
    }
  }, [user])

  const referralLink = user
    ? `${window.location.origin}/refer?ref=${user.id}`
    : ''

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
      toast.success('Link copied to clipboard!')
    } catch {
      toast.error('Could not copy. Try selecting the link manually.')
    }
  }

  async function handleShare() {
    if (!navigator.share) { handleCopy(); return }
    try {
      await navigator.share({
        title: 'Join MasterChef Cuts',
        text: 'Get farm-fresh meat at 30–50% off retail by pooling with neighbors. Use my link:',
        url: referralLink,
      })
    } catch { /* user dismissed */ }
  }

  // ── Inbound referral — visitor not yet signed in ──
  if (inboundRef && !user) {
    return (
      <div className="refer-page">
        <div className="refer-inner">
          <div className="refer-hero">
            <span className="refer-hero-icon">🐄</span>
            <h1 className="refer-hero-title">You&apos;ve been invited to MasterChef Cuts!</h1>
            <p className="refer-hero-sub">
              Get farm-fresh, whole-animal meat at 30–50% off retail by splitting with your neighbors.
              Your friend thinks you&apos;d love it.
            </p>
            <div className="refer-hero-actions">
              <Link to="/login" className="hp-btn-primary">Create Free Account →</Link>
              <Link to="/listings" className="hp-btn-ghost">Browse Listings First</Link>
            </div>
          </div>

          <div className="refer-features">
            {[
              { icon: '🥩', title: 'Real butchers', body: 'Professional shops, not industrial suppliers.' },
              { icon: '💰', title: '30–50% savings', body: 'Buy direct, in bulk. Skip the middlemen.' },
              { icon: '🤝', title: 'Pool with neighbors', body: 'Split a whole animal and pay less per cut.' },
            ].map(f => (
              <div key={f.title} className="refer-feature-card">
                <span className="refer-feature-icon">{f.icon}</span>
                <div className="refer-feature-title">{f.title}</div>
                <div className="refer-feature-body">{f.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Authenticated — show your referral link ──
  if (!user) {
    return (
      <div className="refer-page">
        <div className="refer-inner">
          <div className="refer-hero">
            <span className="refer-hero-icon">🔗</span>
            <h1 className="refer-hero-title">Invite Friends to MasterChef Cuts</h1>
            <p className="refer-hero-sub">Sign in to get your personal referral link.</p>
            <Link to="/login" className="hp-btn-primary">Sign In →</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="refer-page">
      <div className="refer-inner">

        <div className="refer-hero refer-hero--small">
          <span className="refer-hero-icon">🔗</span>
          <h1 className="refer-hero-title">Invite Friends</h1>
          <p className="refer-hero-sub">
            Share your link. Every friend who joins grows the community and fills pools faster.
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="refer-stats">
            <div className="refer-stat">
              <span className="refer-stat-value">{stats.totalReferrals ?? 0}</span>
              <span className="refer-stat-label">Friends joined</span>
            </div>
            <div className="refer-stat">
              <span className="refer-stat-value">{stats.activeReferrals ?? 0}</span>
              <span className="refer-stat-label">Active participants</span>
            </div>
          </div>
        )}

        {/* Referral link box */}
        <div className="refer-link-card">
          <div className="refer-link-label">Your referral link</div>
          <div className="refer-link-row">
            <input
              className="refer-link-input"
              readOnly
              value={referralLink}
              onFocus={e => e.target.select()}
            />
            <button className="refer-copy-btn" onClick={handleCopy}>
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <button className="refer-share-btn" onClick={handleShare}>
            📤 Share Link
          </button>
        </div>

        {/* How it works */}
        <div className="refer-how">
          <div className="refer-how-title">How it works</div>
          <div className="refer-how-steps">
            {[
              { n: '1', text: 'Share your link with friends, family, or neighbors.' },
              { n: '2', text: 'They sign up and browse listings near them.' },
              { n: '3', text: 'More participants = faster pool fills for everyone!' },
            ].map(s => (
              <div key={s.n} className="refer-how-step">
                <span className="refer-how-num">{s.n}</span>
                <span className="refer-how-text">{s.text}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
