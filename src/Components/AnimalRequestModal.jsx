import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import '../styles/animal-request-modal.css'

const ANIMAL_TYPES = [
  { id: 'beef', label: 'Beef', emoji: '🐄' },
  { id: 'pork', label: 'Pork', emoji: '🐷' },
  { id: 'lamb', label: 'Lamb', emoji: '🐑' },
]

const PRIMAL_CUTS = {
  beef: [
    { id: 'Chuck',     sub: 'Shoulder — roasts, ground beef' },
    { id: 'Rib',       sub: 'Prime rib, ribeye steaks' },
    { id: 'Short Loin', sub: 'T-bone, NY strip, tenderloin' },
    { id: 'Sirloin',   sub: 'Rear upper back' },
    { id: 'Round',     sub: 'Hindquarter — lean roasts' },
    { id: 'Brisket',   sub: 'Chest — BBQ & braise' },
    { id: 'Plate',     sub: 'Short ribs, skirt steak' },
    { id: 'Flank',     sub: 'Flank steak, stir-fry' },
    { id: 'Shank',     sub: 'Fore & hind — osso buco' },
  ],
  pork: [
    { id: 'Shoulder',  sub: 'Boston butt & picnic — pulled pork' },
    { id: 'Loin',      sub: 'Chops, tenderloin, baby back ribs' },
    { id: 'Belly',     sub: 'Bacon, pancetta' },
    { id: 'Leg',       sub: 'Hind leg — fresh or cured' },
    { id: 'Jowl',      sub: 'Cheek & neck — guanciale' },
    { id: 'Hock',      sub: 'Fore & hind — soups & braise' },
  ],
  lamb: [
    { id: 'Shoulder',  sub: 'Bone-in or boneless — slow roast' },
    { id: 'Rack',      sub: 'Rib chops — crown roast' },
    { id: 'Loin',      sub: 'Loin chops — quick-cook' },
    { id: 'Leg',       sub: 'Hind leg — roast or butterflied' },
    { id: 'Breast',    sub: 'Breast & flank — slow braise' },
    { id: 'Shank',     sub: 'Fore & hind — osso buco' },
  ],
}

export default function AnimalRequestModal({ onClose }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(1) // 1 = animal/cuts, 2 = details
  const [animalType, setAnimalType] = useState('beef')
  const [selectedCuts, setSelectedCuts] = useState({})
  const [form, setForm] = useState({ breed: '', description: '', zipCode: user?.zipCode || '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  if (!user) {
    return (
      <div className="arm-overlay" onClick={onClose}>
        <div className="arm-modal" onClick={e => e.stopPropagation()}>
          <button className="arm-close" onClick={onClose}>✕</button>
          <p className="arm-unauth">You need to be signed in as a buyer to request an animal.</p>
          <button className="arm-btn-primary" onClick={() => { onClose(); navigate('/login') }}>Sign In →</button>
        </div>
      </div>
    )
  }

  if (user.role !== 'buyer') {
    return (
      <div className="arm-overlay" onClick={onClose}>
        <div className="arm-modal" onClick={e => e.stopPropagation()}>
          <button className="arm-close" onClick={onClose}>✕</button>
          <p className="arm-unauth">Only buyer accounts can submit animal requests.</p>
          <button className="arm-btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    )
  }

  function toggleCut(id) {
    setSelectedCuts(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function handleAnimalChange(id) {
    setAnimalType(id)
    setSelectedCuts({})
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const cuts = Object.keys(selectedCuts).filter(k => selectedCuts[k])
    if (cuts.length === 0) { setError('Select at least one cut.'); return }
    if (!form.breed.trim()) { setError('Please enter a breed.'); return }
    if (!form.zipCode.trim()) { setError('Please enter your ZIP code.'); return }
    setLoading(true)
    try {
      await api.post('/api/animal-requests', {
        animalType: animalType.toUpperCase(),
        breed: form.breed.trim(),
        description: form.description.trim() || null,
        zipCode: form.zipCode.trim(),
        cutLabels: cuts,
      })
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="arm-overlay" onClick={onClose}>
        <div className="arm-modal" onClick={e => e.stopPropagation()}>
          <div className="arm-success">
            <div className="arm-success-icon">✓</div>
            <h3>Request submitted!</h3>
            <p>A farmer will be notified and can fulfill your request. You'll get a notification when it's accepted and your cuts are reserved.</p>
            <div className="arm-success-actions">
              <button className="arm-btn-primary" onClick={() => { onClose(); navigate('/demand') }}>View Demand Board</button>
              <button className="arm-btn-secondary" onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const cuts = PRIMAL_CUTS[animalType] || []

  return (
    <div className="arm-overlay" onClick={onClose}>
      <div className="arm-modal" onClick={e => e.stopPropagation()}>
        <button className="arm-close" onClick={onClose}>✕</button>

        <div className="arm-header">
          <h2 className="arm-title">Request an Animal</h2>
          <p className="arm-sub">Tell farmers what you need — they can fulfill your request directly.</p>
        </div>

        <form className="arm-form" onSubmit={handleSubmit}>

          {/* Animal type */}
          <div className="arm-field">
            <label className="arm-label">Animal Type</label>
            <div className="arm-animal-tabs">
              {ANIMAL_TYPES.map(a => (
                <button
                  key={a.id}
                  type="button"
                  className={`arm-animal-tab${animalType === a.id ? ' active' : ''}`}
                  onClick={() => handleAnimalChange(a.id)}
                >
                  {a.emoji} {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cut selection */}
          <div className="arm-field">
            <label className="arm-label">Cuts You Want <span className="arm-label-hint">({Object.values(selectedCuts).filter(Boolean).length} selected)</span></label>
            <div className="arm-cuts-grid">
              {cuts.map(c => (
                <button
                  key={c.id}
                  type="button"
                  className={`arm-cut-btn${selectedCuts[c.id] ? ' selected' : ''}`}
                  onClick={() => toggleCut(c.id)}
                >
                  <span className="arm-cut-name">{c.id}</span>
                  <span className="arm-cut-sub">{c.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Breed */}
          <div className="arm-field">
            <label className="arm-label">Breed</label>
            <input
              className="arm-input"
              type="text"
              placeholder="e.g. Angus, Berkshire, Merino"
              value={form.breed}
              onChange={e => setForm(f => ({ ...f, breed: e.target.value }))}
            />
          </div>

          {/* ZIP */}
          <div className="arm-field">
            <label className="arm-label">Your ZIP Code</label>
            <input
              className="arm-input"
              type="text"
              placeholder="ZIP code"
              value={form.zipCode}
              maxLength={10}
              onChange={e => setForm(f => ({ ...f, zipCode: e.target.value }))}
            />
          </div>

          {/* Description */}
          <div className="arm-field">
            <label className="arm-label">Notes <span className="arm-label-hint">(optional)</span></label>
            <textarea
              className="arm-textarea"
              placeholder="Any specific preferences — pasture-raised, dry-aged, weight range, etc."
              value={form.description}
              rows={3}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          {error && <p className="arm-error">{error}</p>}

          <div className="arm-actions">
            <button type="button" className="arm-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="arm-btn-primary" disabled={loading}>
              {loading ? 'Submitting…' : 'Submit Request →'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
