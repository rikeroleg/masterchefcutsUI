import React from 'react'
import { Link } from 'react-router-dom'

const STATS = [
  { value: '2,400+', label: 'Local Butcher Shops' },
  { value: '$180B',  label: 'US Meat Market' },
  { value: '62%',   label: 'Shoppers Want Local Meat' },
  { value: '40%',   label: 'Savings vs. Retail' },
]

const STEPS = [
  { num: '01', title: 'Butcher lists an animal', body: 'Your neighborhood butcher posts a whole, half, or quarter animal with pricing, breed info, and processing date.' },
  { num: '02', title: 'Buyers claim their share', body: 'Neighbors browse available animals nearby, pick the cuts they want, and pool together until the animal is fully claimed.' },
  { num: '03', title: 'Everyone wins', body: 'The butcher gets a full order book. Buyers get whole-animal pricing. The community gets better meat and a stronger local economy.' },
]

export default function About() {
  return (
    <div className="about-page">

      {/* Hero */}
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

      {/* Stats bar */}
      <section className="about-stats">
        {STATS.map((s) => (
          <div key={s.label} className="about-stat">
            <span className="about-stat-value">{s.value}</span>
            <span className="about-stat-label">{s.label}</span>
          </div>
        ))}
      </section>

      {/* What we're building */}
      <section className="about-section">
        <div className="about-section-inner about-two-col">
          <div className="about-col-text">
            <span className="about-eyebrow">What We're Building</span>
            <h2 className="about-section-title">A marketplace built around the butcher.</h2>
            <p className="about-body">
              CowPool is a marketplace where local butcher shops list whole animals and nearby buyers
              pool together to claim shares. The butcher handles the sourcing and processing.
              We handle the matching and payments. Everyone gets better meat at better prices.
            </p>
            <p className="about-body">
              Unlike farm-direct services, CowPool works through established local butcher shops —
              giving buyers the trust and convenience of their neighborhood butcher while unlocking
              bulk pricing that's only ever been available to restaurants and large families.
            </p>
          </div>
          <div className="about-col-card">
            <div className="about-feature-card">
              <span className="about-feature-icon">🥩</span>
              <h3 className="about-feature-title">Butcher-first</h3>
              <p className="about-feature-body">We partner with established local shops, not farms. Your butcher knows the animal, the breed, and the best way to cut it for you.</p>
            </div>
            <div className="about-feature-card">
              <span className="about-feature-icon">🤝</span>
              <h3 className="about-feature-title">Community pooling</h3>
              <p className="about-feature-body">The person who wants ribeyes naturally connects with the person who wants ground beef. Whole-animal economics finally work for everyone.</p>
            </div>
            <div className="about-feature-card">
              <span className="about-feature-icon">💰</span>
              <h3 className="about-feature-title">Real savings</h3>
              <p className="about-feature-body">Whole-animal pricing passes up to 40% savings versus retail cuts. Better quality, lower cost, zero mystery about where it came from.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="about-section about-section--dark">
        <div className="about-section-inner">
          <span className="about-eyebrow">How It Works</span>
          <h2 className="about-section-title about-section-title--center">Three steps. One great meal.</h2>
          <div className="about-steps">
            {STEPS.map((s) => (
              <div key={s.num} className="about-step">
                <span className="about-step-num">{s.num}</span>
                <h3 className="about-step-title">{s.title}</h3>
                <p className="about-step-body">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Where we're headed */}
      <section className="about-section">
        <div className="about-section-inner about-vision">
          <span className="about-eyebrow">Where We're Headed</span>
          <h2 className="about-section-title">The butcher shop as the center of the neighborhood food economy.</h2>
          <blockquote className="about-vision-quote">
            "A future where every neighborhood butcher has a full order book and every family
            has access to whole-animal pricing. Where buying meat is a community act again,
            not a lonely trip down a fluorescent aisle."
          </blockquote>
          <p className="about-body">
            We're building toward a world where the slow cuts move because the right neighbor wants them,
            where the butcher sells entire animals instead of hoping for the best, and where fresh,
            traceable meat is the default — not the luxury.
          </p>
        </div>
      </section>

      {/* CTA footer */}
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
