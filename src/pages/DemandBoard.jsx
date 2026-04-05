import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import AnimalRequestModal from '../Components/AnimalRequestModal'
import '../styles/demand-board.css'

const ANIMAL_FILTERS = ['All', 'Beef', 'Pork', 'Lamb']

const ANIMAL_META = {
  BEEF: { emoji: '🐄', label: 'Beef' },
  PORK: { emoji: '🐷', label: 'Pork' },
  LAMB: { emoji: '🐑', label: 'Lamb' },
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr)
  const mins = Math.floor(diff / 60000)
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function FulfillModal({ request, onClose, onFulfilled }) {
  const [form, setForm] = useState({ weightLbs: '', pricePerLb: '', sourceFarm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.weightLbs || parseFloat(form.weightLbs) <= 0) { setError('Enter a valid weight.'); return }
    if (!form.pricePerLb || parseFloat(form.pricePerLb) <= 0) { setError('Enter a valid price per lb.'); return }
    setLoading(true)
    try {
      await api.post(`/api/animal-requests/${request.id}/fulfill`, {
        weightLbs:  parseFloat(form.weightLbs),
        pricePerLb: parseFloat(form.pricePerLb),
        sourceFarm: form.sourceFarm.trim() || null,
      })
      onFulfilled()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="db-modal-overlay" onClick={onClose}>
      <div className="db-modal" onClick={e => e.stopPropagation()}>
        <button className="db-modal-close" onClick={onClose}>✕</button>
        <h3 className="db-modal-title">Fulfill Request</h3>
        <p className="db-modal-sub">
          You're taking on <strong>{request.buyerName}</strong>'s request for a <strong>{request.breed} {ANIMAL_META[request.animalType]?.label}</strong>.
          Their cuts ({request.cutLabels.join(', ')}) will be auto-reserved for them.
        </p>

        <form className="db-modal-form" onSubmit={handleSubmit}>
          <div className="db-modal-row">
            <div className="db-modal-field">
              <label>Hanging Weight (lbs)</label>
              <input
                type="number"
                min="1"
                step="0.1"
                placeholder="e.g. 650"
                value={form.weightLbs}
                onChange={e => setForm(f => ({ ...f, weightLbs: e.target.value }))}
              />
            </div>
            <div className="db-modal-field">
              <label>Price per lb ($)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="e.g. 4.50"
                value={form.pricePerLb}
                onChange={e => setForm(f => ({ ...f, pricePerLb: e.target.value }))}
              />
            </div>
          </div>
          <div className="db-modal-field">
            <label>Source Farm <span>(optional)</span></label>
            <input
              type="text"
              placeholder="Farm name or location"
              value={form.sourceFarm}
              onChange={e => setForm(f => ({ ...f, sourceFarm: e.target.value }))}
            />
          </div>

          {error && <p className="db-modal-error">{error}</p>}

          <div className="db-modal-actions">
            <button type="button" className="db-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="db-btn-primary" disabled={loading}>
              {loading ? 'Fulfilling…' : 'Confirm & Fulfill →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function RequestCard({ request, onFulfilled, onCancelled }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showFulfill, setShowFulfill] = useState(false)
  const [cancelling,  setCancelling]  = useState(false)
  const meta = ANIMAL_META[request.animalType] || { emoji: '🐄', label: request.animalType }

  async function handleCancel() {
    setCancelling(true)
    try {
      await api.delete(`/api/animal-requests/${request.id}`)
      onCancelled(request.id)
    } catch {}
    setCancelling(false)
  }

  return (
    <div className="db-card">
      <div className="db-card-header">
        <span className="db-animal-badge">{meta.emoji}</span>
        <div className="db-card-meta">
          <span className="db-card-title">{request.breed} {meta.label}</span>
          <span className="db-card-buyer">Requested by {request.buyerName} · {request.zipCode} · {timeAgo(request.createdAt)}</span>
        </div>
        <span className={`db-status db-status--${request.status.toLowerCase()}`}>{request.status}</span>
      </div>

      <div className="db-cuts">
        {request.cutLabels.map(c => (
          <span key={c} className="db-cut-pill">{c}</span>
        ))}
      </div>

      {request.description && (
        <p className="db-desc">{request.description}</p>
      )}

      {request.status === 'FULFILLED' && request.fulfilledListingId && (
        <div className="db-fulfilled-note">
          ✓ Fulfilled by {request.fulfilledByFarmerName} &nbsp;·&nbsp;
          <Link to={`/listings/${request.fulfilledListingId}`} className="db-listing-link">View listing →</Link>
        </div>
      )}

      {request.status === 'OPEN' && (
        <div className="db-card-actions">
          {user?.role === 'farmer' && user?.approved && (
            <button className="db-btn-primary" onClick={() => {
              if (!user) { navigate('/login'); return }
              setShowFulfill(true)
            }}>
              Fulfill this request →
            </button>
          )}
          {user?.id === request.buyerId && (
            <button className="db-btn-cancel" disabled={cancelling} onClick={handleCancel}>
              {cancelling ? 'Cancelling…' : 'Cancel'}
            </button>
          )}
          {user?.role === 'farmer' && !user?.approved && (
            <span className="db-approval-note">Your account needs admin approval before fulfilling requests.</span>
          )}
        </div>
      )}

      {showFulfill && (
        <FulfillModal
          request={request}
          onClose={() => setShowFulfill(false)}
          onFulfilled={() => { setShowFulfill(false); onFulfilled() }}
        />
      )}
    </div>
  )
}

export default function DemandBoard() {
  const { user } = useAuth()
  const [requests, setRequests]   = useState([])
  const [filter,   setFilter]     = useState('All')
  const [myOnly,   setMyOnly]     = useState(false)
  const [loading,  setLoading]    = useState(true)
  const [error,    setError]      = useState('')
  const [showNew,  setShowNew]    = useState(false)

  useEffect(() => { fetchRequests() }, [])

  async function fetchRequests() {
    setLoading(true)
    setError('')
    try {
      const data = await api.get('/api/animal-requests')
      setRequests(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleCancelled(id) {
    setRequests(prev => prev.filter(r => r.id !== id))
  }

  const visible = requests.filter(r => {
    if (filter !== 'All' && r.animalType !== filter.toUpperCase()) return false
    if (myOnly && r.buyerId !== user?.id) return false
    return true
  })

  return (
    <div className="db-page">
      <div className="db-inner">

        <div className="db-header">
          <div>
            <p className="db-label">Open participant requests</p>
            <h1 className="db-title">Demand Board</h1>
            <p className="db-sub">Participants have specified what they need. Farmers — fulfill a request to create the listing and auto-reserve the participant's cuts.</p>
          </div>
          {user?.role === 'buyer' && (
            <button className="db-btn-new" onClick={() => setShowNew(true)}>
              + Request an Animal
            </button>
          )}
          {!user && (
            <button className="db-btn-new" onClick={() => setShowNew(true)}>
              + Request an Animal
            </button>
          )}
        </div>

        <div className="db-toolbar">
          <div className="db-filters">
            {ANIMAL_FILTERS.map(f => (
              <button
                key={f}
                className={`db-filter-btn${filter === f ? ' active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'Beef' ? '🐄 ' : f === 'Pork' ? '🐷 ' : f === 'Lamb' ? '🐑 ' : ''}{f}
              </button>
            ))}
          </div>
          {user?.role === 'buyer' && (
            <button
              className={`db-filter-btn${myOnly ? ' active' : ''}`}
              onClick={() => setMyOnly(p => !p)}
            >
              My requests
            </button>
          )}
        </div>

        {loading && <p className="db-loading">Loading…</p>}
        {error   && <p className="db-error">{error}</p>}

        <div className="db-grid">
          {!loading && visible.map(r => (
            <RequestCard
              key={r.id}
              request={r}
              onFulfilled={fetchRequests}
              onCancelled={handleCancelled}
            />
          ))}
          {!loading && !error && visible.length === 0 && (
            <p className="db-empty">
              {myOnly ? "You have no open requests." : "No open requests right now."}
            </p>
          )}
        </div>

      </div>

      {showNew && (
        <AnimalRequestModal
          onClose={() => { setShowNew(false); fetchRequests() }}
        />
      )}
    </div>
  )
}
