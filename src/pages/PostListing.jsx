import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { api } from '../api/client'

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
    { id: 'shoulder', label: 'Shoulder',  sub: 'Boston butt & picnic — pulled pork' },
    { id: 'loin',     label: 'Loin',      sub: 'Chops, tenderloin, baby back ribs' },
    { id: 'belly',    label: 'Belly',     sub: 'Bacon, pancetta' },
    { id: 'leg',      label: 'Leg (Ham)', sub: 'Hind leg — fresh or cured' },
    { id: 'jowl',     label: 'Jowl',      sub: 'Cheek & neck — guanciale' },
    { id: 'hock',     label: 'Hock',      sub: 'Fore & hind — soups & braise' },
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

export default function PostListing() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    animalType: 'beef', breed: '', hangingWeight: '', pricePerLb: '',
    sourceFarm: '', description: '',
    zipCode: user?.zipCode || '',
    shares: {}, prices: {}, weights: {},
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [photoFile, setPhotoFile]     = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)

  function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Photo must be under 5 MB.'); return }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
    setError('')
  }

  function handleField(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }
  function handleShare(id) {
    setForm(f => {
      const next = { ...f.shares, [id]: !f.shares[id] }
      const nextPrices = { ...f.prices }
      const nextWeights = { ...f.weights }
      if (!next[id]) { delete nextPrices[id]; delete nextWeights[id] }
      return { ...f, shares: next, prices: nextPrices, weights: nextWeights }
    })
  }
  function handlePrice(id, val) {
    setForm(f => ({ ...f, prices: { ...f.prices, [id]: val } }))
  }
  function handleWeight(id, val) {
    setForm(f => ({ ...f, weights: { ...f.weights, [id]: val } }))
  }
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const selectedCuts = Object.keys(form.shares).filter(id => form.shares[id])
    if (selectedCuts.length === 0) { setError('Select at least one primal cut.'); return }
    setLoading(true)
    try {
      const created = await api.post('/api/listings', {
        animalType:  form.animalType.toUpperCase(),
        breed:       form.breed       || null,
        weightLbs:   parseFloat(form.hangingWeight),
        pricePerLb:  parseFloat(form.pricePerLb),
        sourceFarm:  form.sourceFarm  || null,
        description: form.description || null,
        zipCode:     form.zipCode,
        cuts: selectedCuts.map(id => ({
          label:     PRIMAL_CUTS[form.animalType].find(c => c.id === id)?.label,
          weightLbs: form.weights[id] ? parseFloat(form.weights[id]) : null,
        })).filter(c => c.label),
      })
      if (photoFile && created?.id) {
        try {
          const fd = new FormData()
          fd.append('file', photoFile)
          await api.upload(`/api/listings/${created.id}/photo`, fd)
        } catch (_) {}
      }
      setSubmitted(true)
      toast.success('Listing posted successfully!')
    } catch (err) {
      toast.error(err.message || 'Failed to post listing.')
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!user || user.role !== 'farmer') {
    return (
      <div className="post-page">
        <div className="post-unauth">
          <p>You need a Farmer / Butcher account to post a listing.</p>
          <Link to="/login" className="hp-btn-primary">Sign In →</Link>
        </div>
      </div>
    )
  }

  if (user.approved === false) {
    return (
      <div className="post-page">
        <div className="post-unauth" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>⏳</div>
          <h2 style={{ color: '#f5c97a', marginBottom: '8px' }}>Pending Admin Approval</h2>
          <p style={{ opacity: 0.75, marginBottom: '20px' }}>Your farmer account is waiting for admin review. You&apos;ll be able to post listings once approved.</p>
          <Link to="/profile" className="hp-btn-primary">← Back to Profile</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="post-page">
      <div className="post-inner">

        {/* Back nav */}
        <Link to="/profile" className="post-back">← Back to profile</Link>

        <div className="post-header">
          <h1 className="post-title">Post a New Listing</h1>
          <p className="post-sub">List a whole animal for participants in your area to pool together.</p>
        </div>

        {/* Block unboarded farmers */}
        {!user?.stripeOnboardingComplete && (
          <div className="post-connect-gate">
            <div className="post-connect-gate-icon">🏦</div>
            <h2 className="post-connect-gate-title">Connect your bank account first</h2>
            <p className="post-connect-gate-text">
              You need to connect a bank account via Stripe before posting listings.
              This ensures you receive your 85% payout automatically when buyers pay.
            </p>
            <Link to="/profile" className="hp-btn-primary">Go to Profile to Connect →</Link>
          </div>
        )}

        {user?.stripeOnboardingComplete && submitted ? (
          <div className="post-success">
            <div className="post-success-check">✓</div>
            <h2>Listing submitted!</h2>
            <p>Your listing has been posted. Participants near <strong>{form.sourceFarm}</strong> will be able to find and claim cuts.</p>
            <div className="post-success-actions">
              <button className="hp-btn-primary" onClick={() => { setSubmitted(false); setForm(f => ({ ...f, animalType: 'beef', breed: '', hangingWeight: '', pricePerLb: '', sourceFarm: '', description: '', shares: {}, prices: {}, weights: {} })) }}>
                Post another listing
              </button>
              <Link to="/profile" className="hp-btn-ghost">View my listings →</Link>
            </div>
          </div>
        ) : (
          <form className="post-form hp-form" onSubmit={handleSubmit}>

            {/* ── Animal Details ── */}
            <div className="hp-form-section-label">Animal Details</div>

            <div className="hp-form-field">
              <label>Animal type *</label>
              <div className="hp-animal-row">
                {ANIMAL_TYPES.map(a => (
                  <button type="button" key={a.id}
                    className={`hp-animal-btn${form.animalType === a.id ? ' active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, animalType: a.id, shares: {}, prices: {}, weights: {} }))}>
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
                placeholder="Grass-fed? Heritage breed? Special diet? Anything that makes this listing stand out." />
            </div>

            <div className="hp-form-field">
              <label>Animal Photo <span className="hp-opt">(optional)</span></label>
              <div
                className={`post-photo-drop${photoPreview ? ' post-photo-drop--filled' : ''}`}
                onClick={() => document.getElementById('post-photo-input').click()}
              >
                {photoPreview ? (
                  <img src={photoPreview} className="post-photo-preview" alt="preview" />
                ) : (
                  <div className="post-photo-placeholder">
                    <span className="post-photo-icon">📷</span>
                    <span className="post-photo-label">Click to add a photo</span>
                    <span className="post-photo-hint">JPEG, PNG or WEBP · max 5 MB</span>
                  </div>
                )}
              </div>
              {photoPreview && (
                <button
                  type="button"
                  className="post-photo-remove"
                  onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
                >
                  ✕ Remove photo
                </button>
              )}
              <input
                id="post-photo-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handlePhotoChange}
              />
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
                        <input className="hp-weight-in" type="number" min="0.1" step="0.1"
                          value={form.weights[s.id] || ''}
                          onChange={e => handleWeight(s.id, e.target.value)}
                          placeholder="lbs (opt)" title="Weight in lbs for this cut (optional)" />
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            <div className="hp-form-row">
              <div className="hp-form-field">
                <label>ZIP Code *</label>
                <input name="zipCode" value={form.zipCode} onChange={handleField}
                  placeholder="17601" maxLength={10} required />
                <span className="hp-field-hint">Participants searching near this ZIP will find your listing</span>
              </div>
            </div>

            {error && <div className="login-error">{error}</div>}

            <button type="submit" className="hp-btn-submit" disabled={loading}>
              {loading ? 'Posting…' : 'Post Listing →'}
            </button>

          </form>
        )}

      </div>
    </div>
  )
}
