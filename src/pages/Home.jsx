import React, { useState } from 'react'
import { Link } from 'react-router-dom'

const ANIMAL_TYPES = [
  { id: 'beef', label: 'Beef', emoji: '🐄' },
  { id: 'pork', label: 'Pork', emoji: '🐷' },
  { id: 'lamb', label: 'Lamb', emoji: '🐑' },
]

const PRIMAL_CUTS = {
  beef: [
    { id: 'chuck',   label: 'Chuck',    sub: 'Shoulder — roasts, ground beef' },
    { id: 'rib',     label: 'Rib',      sub: 'Prime rib, ribeye steaks' },
    { id: 'loin',    label: 'Loin',     sub: 'T-bone, NY strip, tenderloin' },
    { id: 'round',   label: 'Round',    sub: 'Hindquarter — lean roasts' },
    { id: 'brisket', label: 'Brisket',  sub: 'Chest — BBQ & braise' },
    { id: 'plate',   label: 'Plate',    sub: 'Short ribs, skirt steak' },
    { id: 'flank',   label: 'Flank',    sub: 'Flank steak, stir-fry' },
    { id: 'shank',   label: 'Shank',    sub: 'Fore & hind — osso buco' },
  ],
  pork: [
    { id: 'shoulder', label: 'Shoulder',   sub: 'Boston butt & picnic — pulled pork' },
    { id: 'loin',     label: 'Loin',       sub: 'Chops, tenderloin, baby back ribs' },
    { id: 'belly',    label: 'Belly',      sub: 'Bacon, pancetta' },
    { id: 'leg',      label: 'Leg (Ham)',  sub: 'Hind leg — fresh or cured' },
    { id: 'jowl',     label: 'Jowl',       sub: 'Cheek & neck — guanciale' },
    { id: 'hock',     label: 'Hock',       sub: 'Fore & hind — soups & braise' },
  ],
  lamb: [
    { id: 'shoulder', label: 'Shoulder', sub: 'Bone-in or boneless — slow roast' },
    { id: 'rack',     label: 'Rack',     sub: 'Rib chops — crown roast' },
    { id: 'loin',     label: 'Loin',     sub: 'Loin chops — quick-cook' },
    { id: 'leg',      label: 'Leg',      sub: 'Hind leg — roast or butterflied' },
    { id: 'breast',   label: 'Breast',   sub: 'Breast & flank — slow braise' },
    { id: 'shank',    label: 'Shank',    sub: 'Fore & hind — osso buco' },
  ],
}

const STEPS = [
  { icon: '📋', title: 'Butcher lists',   body: 'Local shops post whole animals with breed, weight, date, and share prices.' },
  { icon: '🤝', title: 'Buyers pool',     body: 'Nearby buyers claim whole, half, or quarter shares until the animal is full.' },
  { icon: '🥩', title: 'Everyone wins',   body: 'Butcher processes. Buyers collect fresh, traceable cuts — at 30–50% off retail.' },
]

const EMPTY_FORM = {
  animalType: 'beef', breed: '', hangingWeight: '', pricePerLb: '',
  sourceFarm: '', description: '',
  shares: {}, prices: {},
  yourName: '', shopName: '', email: '', phone: '',
}

export default function Home() {
  const [role, setRole]        = useState(null)
  const [form, setForm]        = useState(EMPTY_FORM)
  const [submitted, setSubmit] = useState(false)

  function handleField(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }
  function handleShare(id) {
    setForm(f => {
      const next = { ...f.shares, [id]: !f.shares[id] }
      const nextPrices = { ...f.prices }
      if (!next[id]) delete nextPrices[id]
      return { ...f, shares: next, prices: nextPrices }
    })
  }
  function handlePrice(id, val) {
    setForm(f => ({ ...f, prices: { ...f.prices, [id]: val } }))
  }
  function handleSubmit(e) {
    e.preventDefault()
    setSubmit(true)
  }

  return (
    <div className="home-page">

      {/* ════ HERO ════ */}
      <section className="hp-hero">
        <div className="hp-hero-content">
          <div className="hp-badge">🐄 CowPool Marketplace</div>
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
            <div className="hp-hero-stat"><strong>2,400+</strong><span>butcher shops</span></div>
            <div className="hp-hero-stat-sep" />
            <div className="hp-hero-stat"><strong>40%</strong><span>avg savings</span></div>
            <div className="hp-hero-stat-sep" />
            <div className="hp-hero-stat"><strong>62%</strong><span>want local sourcing</span></div>
          </div>
        </div>
      </section>

      {/* ════ HOW IT WORKS ════ */}
      <section className="hp-how">
        <div className="hp-section-inner">
          <p className="hp-label">How it works</p>
          <h2 className="hp-h2">Three steps to better meat.</h2>
          <div className="hp-steps">
            {STEPS.map((s, i) => (
              <div key={s.title} className="hp-step">
                <div className="hp-step-icon">{s.icon}</div>
                <div className="hp-step-num">0{i + 1}</div>
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
                  <div className="hp-role-name">I&apos;m a Buyer</div>
                  <div className="hp-role-tagline">Find &amp; claim a share near me</div>
                </div>
                <span className="hp-role-arrow">{role === 'buyer' ? '↑' : '↓'}</span>
              </div>

              {role === 'buyer' && (
                <div className="hp-role-body">
                  <div className="hp-mini-steps">
                    <div className="hp-mini-step"><span className="hp-mini-n">1</span><span>Browse nearby listings by animal, breed, and price.</span></div>
                    <div className="hp-mini-step"><span className="hp-mini-n">2</span><span>Pick your share — whole, half, or quarter.</span></div>
                    <div className="hp-mini-step"><span className="hp-mini-n">3</span><span>Once the pool fills, collect your fresh cuts.</span></div>
                  </div>
                  <Link to="/listings" className="hp-btn-primary" style={{ display: 'inline-block', textDecoration: 'none', marginTop: '8px' }}>
                    Browse Available Animals →
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
                  <div className="hp-role-tagline">List a whole animal for buyers to pool</div>
                </div>
                <span className="hp-role-arrow">{role === 'farmer' ? '↑' : '↓'}</span>
              </div>

              {role === 'farmer' && (
                <div className="hp-role-body" onClick={e => e.stopPropagation()}>
                  {submitted ? (
                    <div className="hp-success">
                      <div className="hp-success-check">✓</div>
                      <h3>Listing submitted!</h3>
                      <p>We&apos;ll review and reach out to <strong>{form.email}</strong> within 24 hours.</p>
                      <button className="hp-btn-ghost" onClick={() => { setSubmit(false); setForm(EMPTY_FORM) }}>
                        List another animal
                      </button>
                    </div>
                  ) : (
                    <form className="hp-form" onSubmit={handleSubmit}>

                      <div className="hp-form-section-label">Animal Details</div>

                      <div className="hp-form-field">
                        <label>Animal type *</label>
                        <div className="hp-animal-row">
                          {ANIMAL_TYPES.map(a => (
                            <button type="button" key={a.id}
                              className={`hp-animal-btn${form.animalType === a.id ? ' active' : ''}`}
                              onClick={() => setForm(f => ({ ...f, animalType: a.id, shares: {}, prices: {} }))}>
                              {a.emoji} {a.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="hp-form-row">
                        <div className="hp-form-field">
                          <label>Breed <span className="hp-opt">(optional)</span></label>
                          <input name="breed" value={form.breed} onChange={handleField} placeholder="e.g. Angus, Berkshire" />
                        </div>
                        <div className="hp-form-field">
                          <label>Hanging weight (lbs) *</label>
                          <input name="hangingWeight" type="number" min="1" value={form.hangingWeight}
                            onChange={handleField} placeholder="e.g. 600" required />
                          <span className="hp-field-hint">Weight after slaughter, before cutting</span>
                        </div>
                      </div>

                      <div className="hp-form-row">
                        <div className="hp-form-field">
                          <label>Price per lb ($) *</label>
                          <input name="pricePerLb" type="number" min="0.01" step="0.01" value={form.pricePerLb}
                            onChange={handleField} placeholder="e.g. 5.50" required />
                          <span className="hp-field-hint">Includes processing costs</span>
                        </div>
                        <div className="hp-form-field">
                          <label>Source Farm *</label>
                          <input name="sourceFarm" value={form.sourceFarm} onChange={handleField}
                            placeholder="e.g. Meadow Creek Farm, Lancaster PA" required />
                        </div>
                      </div>

                      <div className="hp-form-field">
                        <label>Description <span className="hp-opt">(optional)</span></label>
                        <textarea name="description" value={form.description} onChange={handleField} rows={3}
                          placeholder="Tell buyers about this animal. Grass-fed? Heritage breed? Special diet? Anything that makes this listing stand out." />
                      </div>

                      <div className="hp-form-field">
                        <label>Primal cuts available *</label>
                        <p className="hp-field-hint" style={{ marginBottom: '8px' }}>Select each cut you&apos;re offering and set a price per cut.</p>
                        <div className="hp-shares">
                          {PRIMAL_CUTS[form.animalType].map(s => (
                            <label key={s.id} className={`hp-share${form.shares[s.id] ? ' checked' : ''}`}>
                              <input type="checkbox" checked={!!form.shares[s.id]}
                                onChange={() => handleShare(s.id)} style={{ display: 'none' }} />
                              <span className="hp-share-check">{form.shares[s.id] ? '✓' : ''}</span>
                              <span className="hp-share-info">
                                <span className="hp-share-name">{s.label}</span>
                                <span className="hp-share-sub">{s.sub}</span>
                              </span>
                              {form.shares[s.id] && (
                                <span className="hp-share-price-wrap" onClick={e => e.stopPropagation()}>
                                  <span className="hp-dollar">$</span>
                                  <input className="hp-price-in" type="number" min="1"
                                    value={form.prices[s.id] || ''}
                                    onChange={e => handlePrice(s.id, e.target.value)}
                                    placeholder="0" required />
                                </span>
                              )}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="hp-form-section-label" style={{ marginTop: '8px' }}>Your Info</div>

                      <div className="hp-form-row">
                        <div className="hp-form-field">
                          <label>Your name *</label>
                          <input name="yourName" value={form.yourName} onChange={handleField}
                            placeholder="Your full name" required />
                        </div>
                        <div className="hp-form-field">
                          <label>Shop name <span className="hp-opt">(optional)</span></label>
                          <input name="shopName" value={form.shopName} onChange={handleField}
                            placeholder="e.g. Joe's Meats" />
                        </div>
                      </div>

                      <div className="hp-form-row">
                        <div className="hp-form-field">
                          <label>Email <span className="hp-opt">(optional)</span></label>
                          <input name="email" type="email" value={form.email} onChange={handleField}
                            placeholder="you@shop.com" />
                        </div>
                        <div className="hp-form-field">
                          <label>Phone <span className="hp-opt">(optional)</span></label>
                          <input name="phone" type="tel" value={form.phone} onChange={handleField}
                            placeholder="(555) 123-4567" />
                        </div>
                      </div>

                      <button type="submit" className="hp-btn-submit">Post Listing →</button>
                    </form>
                  )}
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
          <p className="hp-cta-p">Join the network of butchers and buyers building a better food system.</p>
          <div className="hp-cta-btns">
            <Link to="/listings" className="hp-btn-primary">Browse Animals →</Link>
            <Link to="/about" className="hp-btn-ghost">Learn more</Link>
          </div>
        </div>
      </section>

    </div>
  )
}
