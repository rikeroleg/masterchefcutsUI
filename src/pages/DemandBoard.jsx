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

/** Panel shown on FULFILLED cards — loads listing cuts, lets buyers claim/unclaim */
function FulfilledPanel({ listingId, currentUserId }) {
  const [listing, setListing]     = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error,   setError]       = useState('')
  const [working, setWorking]     = useState(null) // cutId or claimId being acted on

  useEffect(() => {
    api.get(`/api/listings/${listingId}`)
      .then(setListing)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [listingId])

  async function handleClaim(cutId) {
    setWorking(cutId)
    try {
      const updated = await api.post(`/api/listings/${listingId}/claims`, { cutId })
      setListing(updated)
    } catch (err) {
      setError(err.message)
    } finally {
      setWorking(null)
    }
  }

  async function handleUnclaim(claimId, cutId) {
    setWorking(claimId)
    try {
      await api.delete(`/api/claims/${claimId}`)
      // Refresh listing
      const updated = await api.get(`/api/listings/${listingId}`)
      setListing(updated)
    } catch (err) {
      setError(err.message)
    } finally {
      setWorking(null)
    }
  }

  if (loading) return <p className="db-panel-loading">Loading cuts…</p>
  if (error)   return <p className="db-panel-error">{error}</p>
  if (!listing) return null

  const available = listing.cuts.filter(c => !c.claimed).length
  const listingActive = listing.status === 'ACTIVE'

  return (
    <div className="db-fulfilled-panel">
      <div className="db-panel-header">
        <span className="db-panel-title">
          {listing.breed} {ANIMAL_META[listing.animalType]?.label || listing.animalType} &mdash; by {listing.farmerShopName || listing.farmerName}
        </span>
        <span className={`db-panel-badge db-panel-badge--${listing.status.toLowerCase().replace('_', '-')}`}>
          {listing.status === 'FULLY_CLAIMED' ? 'Fully Claimed' : listing.status === 'ACTIVE' ? `${available} cut${available !== 1 ? 's' : ''} left` : listing.status}
        </span>
      </div>

      {listing.cuts.length > 0 && (
        <div className="db-panel-cuts">
          {listing.cuts.map(cut => {
            const isMine = cut.claimed && cut.claimedByName && currentUserId
            // We can only detect "mine" if there's a claimId. We'll fetch my claims separately OR rely on claimedByName matching
            // For now: show unclaim for any claimed cut if the user has a claim — we look it up below
            return (
              <div key={cut.id} className={`db-panel-cut${cut.claimed ? ' claimed' : ' available'}`}>
                <span className="db-panel-cut-label">{cut.label}</span>
                {cut.weightLbs && <span className="db-panel-cut-weight">{cut.weightLbs} lbs</span>}
                {cut.claimed ? (
                  <span className="db-panel-cut-status">✓ Claimed</span>
                ) : listingActive && currentUserId ? (
                  <button
                    className="db-panel-claim-btn"
                    disabled={working === cut.id}
                    onClick={() => handleClaim(cut.id)}
                  >
                    {working === cut.id ? '…' : 'Claim'}
                  </button>
                ) : (
                  <span className="db-panel-cut-status db-panel-cut-status--avail">Available</span>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="db-panel-footer">
        <Link to={`/listings/${listingId}`} className="db-panel-link">
          View full listing & manage your claims →
        </Link>
      </div>
    </div>
  )
}

function RequestCard({ request, onFulfilled, onCancelled, onEdited }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showFulfill,   setShowFulfill]   = useState(false)
  const [showEdit,      setShowEdit]      = useState(false)
  const [showPanel,     setShowPanel]     = useState(false)
  const [cancelling,    setCancelling]    = useState(false)
  const meta = ANIMAL_META[request.animalType] || { emoji: '🐄', label: request.animalType }

  const isOwner   = user?.id === request.buyerId
  const isFarmer  = user?.role === 'farmer'

  async function handleCancel() {
    setCancelling(true)
    try {
      await api.delete(`/api/animal-requests/${request.id}`)
      onCancelled(request.id)
    } catch {}
    setCancelling(false)
  }

  return (
    <div className={`db-card db-card--${request.status.toLowerCase()}`}>
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

      {/* OPEN actions */}
      {request.status === 'OPEN' && (
        <div className="db-card-actions">
          {isFarmer && user?.approved && (
            <button className="db-btn-primary" onClick={() => {
              if (!user) { navigate('/login'); return }
              setShowFulfill(true)
            }}>
              Fulfill this request →
            </button>
          )}
          {isOwner && (
            <>
              <button className="db-btn-edit" onClick={() => setShowEdit(true)}>Edit</button>
              <button className="db-btn-cancel" disabled={cancelling} onClick={handleCancel}>
                {cancelling ? 'Cancelling…' : 'Cancel'}
              </button>
            </>
          )}
          {isFarmer && !user?.approved && (
            <span className="db-approval-note">Your account needs admin approval before fulfilling requests.</span>
          )}
        </div>
      )}

      {/* FULFILLED — show panel toggle */}
      {request.status === 'FULFILLED' && request.fulfilledListingId && (
        <div className="db-card-actions">
          <button
            className="db-btn-secondary db-btn-toggle"
            onClick={() => setShowPanel(p => !p)}
          >
            {showPanel ? 'Hide cuts ▲' : 'View & claim cuts ▼'}
          </button>
          <Link to={`/listings/${request.fulfilledListingId}`} className="db-listing-link-btn">
            Full listing →
          </Link>
        </div>
      )}

      {/* FULFILLED expanded panel */}
      {request.status === 'FULFILLED' && showPanel && request.fulfilledListingId && (
        <FulfilledPanel listingId={request.fulfilledListingId} currentUserId={user?.id} />
      )}

      {showFulfill && (
        <FulfillModal
          request={request}
          onClose={() => setShowFulfill(false)}
          onFulfilled={() => { setShowFulfill(false); onFulfilled() }}
        />
      )}

      {showEdit && (
        <AnimalRequestModal
          existingRequest={request}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => { setShowEdit(false); onEdited(updated) }}
        />
      )}
    </div>
  )
}

export default function DemandBoard() {
  const { user } = useAuth()
  const [requests, setRequests]   = useState([])
  const [filter,   setFilter]     = useState('All')
  const [statusFilter, setStatusFilter] = useState('Open') // Open | Fulfilled | All
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

  function handleEdited(updated) {
    setRequests(prev => prev.map(r => r.id === updated.id ? updated : r))
  }

  const openCount      = requests.filter(r => r.status === 'OPEN').length
  const fulfilledCount = requests.filter(r => r.status === 'FULFILLED').length

  const visible = requests.filter(r => {
    if (filter !== 'All' && r.animalType !== filter.toUpperCase()) return false
    if (statusFilter === 'Open'      && r.status !== 'OPEN')      return false
    if (statusFilter === 'Fulfilled' && r.status !== 'FULFILLED')  return false
    if (myOnly && r.buyerId !== user?.id) return false
    return true
  })

  return (
    <div className="db-page">
      <div className="db-inner">

        <div className="db-header">
          <div>
            <p className="db-label">Participant requests</p>
            <h1 className="db-title">Demand Board</h1>
            <p className="db-sub">Participants post what they need. Farmers fulfill requests to create a listing and auto-reserve the buyer's cuts. Other buyers can then claim any remaining cuts.</p>
          </div>
          {(user?.role === 'buyer' || !user) && (
            <button className="db-btn-new" onClick={() => setShowNew(true)}>
              + Request an Animal
            </button>
          )}
        </div>

        {/* Stats row */}
        {!loading && (
          <div className="db-stats">
            <span className="db-stat"><strong>{openCount}</strong> open</span>
            <span className="db-stat-sep">·</span>
            <span className="db-stat"><strong>{fulfilledCount}</strong> fulfilled</span>
          </div>
        )}

        <div className="db-toolbar">
          {/* Animal filters */}
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

          {/* Status filters */}
          <div className="db-filters">
            {['Open', 'Fulfilled', 'All'].map(s => (
              <button
                key={s}
                className={`db-filter-btn db-filter-btn--status${statusFilter === s ? ' active' : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {s}
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
              onEdited={handleEdited}
            />
          ))}
          {!loading && !error && visible.length === 0 && (
            <p className="db-empty">
              {myOnly ? "You have no requests matching this filter." : "No requests match this filter."}
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
