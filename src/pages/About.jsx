import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'

const FEATURES = [
  { icon: '🥩', title: 'Butcher-first',      body: 'We partner with local shops — not big-box suppliers. Every animal is sourced and processed by a professional you can trust.' },
  { icon: '🤝', title: 'Community pooling',  body: 'Split a whole animal with neighbors. Lower cost, zero waste, stronger community ties.' },
  { icon: '💰', title: 'Real savings',       body: 'Buying in bulk direct from the butcher cuts out middlemen. Expect 30–50% off typical retail prices.' },
]

const STEPS = [
  { n: '01', title: 'Butcher lists an animal', body: 'A local shop posts a whole animal — breed, weight, processing date, and available shares.' },
  { n: '02', title: 'Participants claim shares',     body: 'Neighbors browse nearby listings and claim whole, half, or quarter shares to fill the pool.' },
  { n: '03', title: 'Everyone wins',           body: 'Once the pool fills, the butcher processes the animal and participants collect fresh, traceable cuts.' },
]

export default function About() {
  const [listings, setListings] = useState([])

  useEffect(() => {
    api.get('/api/listings').then(setListings).catch(() => {})
  }, [])

  const activeListings = listings.filter(l => l.status === 'ACTIVE' || l.status === 'FULLY_CLAIMED').length
  const cutsClaimed    = listings.reduce((a, l) => a + l.claimedCuts, 0)

  return (
    <div className="about-page">

      <section className="about-hero">
        <div className="about-hero-inner">
          <span className="about-eyebrow">Our Mission</span>
          <h1 className="about-hero-title">
            Make whole-animal buying as easy as<br />
            <span className="about-hero-accent">splitting an Uber.</span>
          </h1>
          <p className="about-hero-sub">
            Bring neighbors together around real meat from real butchers.
          </p>
          <Link to="/shop" className="about-cta-btn">Browse Cuts →</Link>
        </div>
      </section>

      <section className="about-stats">
        <div className="about-stat">
          <span className="about-stat-value">{activeListings || '—'}</span>
          <span className="about-stat-label">Active listings</span>
        </div>
        <div className="about-stat">
          <span className="about-stat-value">{cutsClaimed || '—'}</span>
          <span className="about-stat-label">Cuts claimed</span>
        </div>
        <div className="about-stat">
          <span className="about-stat-value">$180B</span>
          <span className="about-stat-label">US meat market</span>
        </div>
        <div className="about-stat">
          <span className="about-stat-value">40%</span>
          <span className="about-stat-label">Avg participant savings</span>
        </div>
      </section>

      <section className="about-section">
        <div className="about-section-inner about-two-col">
          <div className="about-col-text">
            <span className="about-eyebrow">What we&apos;re building</span>
            <h2 className="about-section-title">A marketplace for the whole animal.</h2>
            <p className="about-body">
              MasterChef Cuts connects local butcher shops with nearby participants who want better meat without the full commitment of buying an entire animal alone.
            </p>
            <p className="about-body">
              Butchers list whole animals — beef, pork, lamb. Participants browse, claim shares, and pool together until the animal is fully spoken for. Then the butcher processes it and everyone picks up their fresh cuts.
            </p>
            <p className="about-body">
              No industrial supply chains. No mystery sourcing. Just a straightforward transaction between people who care about food.
            </p>
          </div>
          <div className="about-col-card">
            {FEATURES.map(f => (
              <div key={f.title} className="about-feature-card">
                <span className="about-feature-icon">{f.icon}</span>
                <p className="about-feature-title">{f.title}</p>
                <p className="about-feature-body">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="about-section about-section--dark">
        <div className="about-section-inner">
          <span className="about-eyebrow">How it works</span>
          <h2 className="about-section-title about-section-title--center">Three steps. Real meat.</h2>
          <div className="about-steps">
            {STEPS.map(s => (
              <div key={s.n} className="about-step">
                <span className="about-step-num">{s.n}</span>
                <p className="about-step-title">{s.title}</p>
                <p className="about-step-body">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="about-section-inner">
          <div className="about-vision">
            <span className="about-eyebrow">Where we&apos;re headed</span>
            <h2 className="about-section-title">A future where knowing your butcher is normal.</h2>
            <p className="about-body">
              We believe the relationship between people and their food should be direct, transparent, and local. MasterChef Cuts is building the infrastructure to make that possible at scale.
            </p>
            <blockquote className="about-vision-quote">
              "Imagine a world where every neighborhood has a trusted butcher, every family knows exactly where their meat comes from, and buying in bulk with your community is as easy as splitting a dinner tab."
            </blockquote>
            <p className="about-body">
              We&apos;re starting with whole animals because that&apos;s where the biggest gap is — and the biggest opportunity. Our goal is a future where locally sourced, traceable meat is the default, not the luxury.
            </p>
          </div>
        </div>
      </section>

      <section className="about-section about-section--cta">
        <div className="about-section-inner about-cta-inner">
          <h2 className="about-cta-title">Ready to buy better meat?</h2>
          <p className="about-cta-sub">Explore our 3D cut selector and build your order today.</p>
          <Link to="/shop" className="about-cta-btn about-cta-btn--lg">Start Shopping →</Link>
        </div>
      </section>

    </div>
  )
}
