import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

const ANIMAL_META = {
  BEEF: { emoji: '🐄', label: 'Beef' },
  PORK: { emoji: '🐷', label: 'Pork' },
  LAMB: { emoji: '🐑', label: 'Lamb' },
}

const STEPS = [
  { icon: '📋', title: 'Butcher lists',   body: 'Local shops post whole animals with breed, weight, date, and share prices.' },
  { icon: '🤝', title: 'Participants pool',     body: 'Nearby participants claim whole, half, or quarter shares until the animal is full.' },
  { icon: '🥩', title: 'Everyone wins',   body: 'Butcher processes. Participants collect fresh, traceable cuts — at 30–50% off retail.' },
]

function MiniListingCard({ listing }) {
  const meta      = ANIMAL_META[listing.animalType] || { emoji: '🥩', label: listing.animalType }
  const available = listing.totalCuts - listing.claimedCuts
  const pct       = listing.totalCuts > 0 ? Math.round((listing.claimedCuts / listing.totalCuts) * 100) : 0
  return (
    <div className="hp-mini-listing">
      <div className="hp-mini-listing-top">
        <span className="hp-mini-listing-emoji">{meta.emoji}</span>
        <div className="hp-mini-listing-info">
          <div className="hp-mini-listing-title">{listing.breed} {meta.label}</div>
          <div className="hp-mini-listing-farm">{listing.farmerShopName || listing.farmerName} · {listing.zipCode}</div>
        </div>
        <div className="hp-mini-listing-price">${listing.pricePerLb.toFixed(2)}<small>/lb</small></div>
      </div>
      <div className="hp-mini-listing-bar">
        <div className="hp-mini-listing-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="hp-mini-listing-footer">
        <span>{available} cut{available !== 1 ? 's' : ''} available</span>
        <Link to="/listings" className="hp-mini-listing-link">View →</Link>
      </div>
    </div>
  )
}

export default function Home() {
  const { user }                = useAuth()
  const [role, setRole]         = useState(null)
  const [listings, setListings] = useState([])

  useEffect(() => {
    const params = new URLSearchParams()
    if (user?.zipCode) params.set('zip', user.zipCode)
    const query = params.toString()
    api.get(`/api/listings${query ? `?${query}` : ''}`).then(setListings).catch(() => {})
  }, [user?.zipCode])

  const activeListings  = listings.filter(l => l.status === 'ACTIVE' || l.status === 'FULLY_CLAIMED')
  const availableCuts   = listings.reduce((a, l) => a + (l.totalCuts - l.claimedCuts), 0)
  const previewListings = activeListings.slice(0, 3)

  return (
    <div className="home-page">

      {/* ════ HERO ════ */}
      <section className="hp-hero">
        <div className="hp-hero-content">
          <div className="hp-badge">🐄 MasterChef Cuts Marketplace</div>
          <h1 className="hp-hero-h1">
            Farm-fresh meat,<br />
            <span className="hp-hero-red">shared by your street.</span>
          </h1>
          <p className="hp-hero-p">
            Local butchers list whole animals. Neighbors pool to claim shares.
            The butcher handles processing — we handle matching &amp; payments.
          </p>
          <div className="hp-hero-actions">
            <button className="hp-btn-primary" onClick={() => { setRole('buyer'); document.getElementById('hp-join')?.scrollIntoView({ behavior: 'smooth' }) }}>
              Find Meat Near Me
            </button>
            <button className="hp-btn-ghost" onClick={() => { setRole('farmer'); document.getElementById('hp-join')?.scrollIntoView({ behavior: 'smooth' }) }}>
              List an Animal →
            </button>
          </div>
          <div className="hp-hero-stats">
            <div className="hp-hero-stat"><strong>{activeListings.length || '—'}</strong><span>active listings</span></div>
            <div className="hp-hero-stat-sep" />
            <div className="hp-hero-stat"><strong>{availableCuts || '—'}</strong><span>cuts available</span></div>
          </div>
        </div>
      </section>

      {/* ════ HOW IT WORKS ════ */}
      <section className="hp-how">
        <div className="hp-section-inner">
          <span className="about-eyebrow">How it works</span>
          <h2 className="hp-h2">Three steps to better meat.</h2>
          <div className="hp-steps">
            {STEPS.map((s, i) => (
              <div key={s.title} className="hp-step">
                <span className="hp-step-num">0{i + 1}</span>
                <h3 className="hp-step-title">{s.title}</h3>
                <p className="hp-step-body">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ JOIN / ROLE ════ */}
      <section className="hp-join" id="hp-join">
        <div className="hp-section-inner">
          <p className="hp-label">Get started</p>
          <h2 className="hp-h2">Who are you?</h2>
          <div className="hp-role-grid">

            {/* Buyer card */}
            <div
              className={`hp-role-card hp-role-card--buyer${role === 'buyer' ? ' hp-role-card--open' : ''}`}
              onClick={() => role !== 'buyer' && setRole('buyer')}
            >
              <div className="hp-role-card-header">
                <span className="hp-role-emoji">🛒</span>
                <div>
                  <div className="hp-role-name">I&apos;m a Participant</div>
                  <div className="hp-role-tagline">Find &amp; claim a share near me</div>
                </div>
                <span className="hp-role-arrow">{role === 'buyer' ? '↑' : '↓'}</span>
              </div>

              {role === 'buyer' && (
                <div className="hp-role-body">
                  {previewListings.length > 0 ? (
                    <>
                      <p className="hp-role-preview-label">Recently posted near you</p>
                      <div className="hp-mini-listings">
                        {previewListings.map(l => <MiniListingCard key={l.id} listing={l} />)}
                      </div>
                    </>
                  ) : (
                    <div className="hp-mini-steps">
                      <div className="hp-mini-step"><span className="hp-mini-n">1</span><span>Browse nearby listings by animal, breed, and price.</span></div>
                      <div className="hp-mini-step"><span className="hp-mini-n">2</span><span>Claim a primal cut — chuck, rib, loin, and more.</span></div>
                      <div className="hp-mini-step"><span className="hp-mini-n">3</span><span>Once the pool fills, collect your fresh cuts.</span></div>
                    </div>
                  )}
                  <Link to="/listings" className="hp-btn-primary" style={{ display: 'inline-block', textDecoration: 'none', marginTop: '16px' }}>
                    Browse All Listings →
                  </Link>
                </div>
              )}
            </div>

            {/* Farmer card */}
            <div
              className={`hp-role-card hp-role-card--farmer${role === 'farmer' ? ' hp-role-card--open' : ''}`}
              onClick={() => role !== 'farmer' && setRole('farmer')}
            >
              <div className="hp-role-card-header">
                <span className="hp-role-emoji">🌾</span>
                <div>
                  <div className="hp-role-name">I&apos;m a Farmer / Butcher</div>
                  <div className="hp-role-tagline">List a whole animal for participants to pool</div>
                </div>
                <span className="hp-role-arrow">{role === 'farmer' ? '↑' : '↓'}</span>
              </div>

              {role === 'farmer' && (
                <div className="hp-role-body">
                  <div className="hp-mini-steps">
                    <div className="hp-mini-step"><span className="hp-mini-n">1</span><span>Sign in or create a farmer account.</span></div>
                    <div className="hp-mini-step"><span className="hp-mini-n">2</span><span>Fill in animal details, primal cuts, and your ZIP code.</span></div>
                    <div className="hp-mini-step"><span className="hp-mini-n">3</span><span>Participants in your area claim cuts — you set the processing date.</span></div>
                  </div>
                  <Link to="/post" className="hp-btn-submit" style={{ display: 'inline-block', textDecoration: 'none', marginTop: '16px', textAlign: 'center' }}>
                    Post a Listing →
                  </Link>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ════ BOTTOM CTA ════ */}
      <section className="hp-cta">
        <div className="hp-section-inner hp-cta-inner">
          <h2 className="hp-cta-h2">Ready to buy better meat?</h2>
          <p className="hp-cta-p">Join the network of butchers and participants building a better food system.</p>
          <div className="hp-cta-btns">
            <Link to="/listings" className="hp-btn-primary">Browse Animals →</Link>
            <Link to="/about" className="hp-btn-ghost">Learn more</Link>
          </div>
        </div>
      </section>

    </div>
  )
}
