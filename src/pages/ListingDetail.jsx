import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import PaymentModal from '../components/PaymentModal'
import '../styles/payment-modal.css'
import '../styles/listing-animal-viewer.css'
import ListingAnimalViewer from '../Components/3DModel/ListingAnimalViewer'
import '../styles/listing-detail.css'

const ANIMAL_META = {
  BEEF: { emoji: '🐄', label: 'Beef' },
  PORK: { emoji: '🐷', label: 'Pork' },
  LAMB: { emoji: '🐑', label: 'Lamb' },
}

const STATUS_META = {
  ACTIVE:        { color: '#27ae60', label: 'Active — accepting claims' },
  FULLY_CLAIMED: { color: '#e67e22', label: 'Fully Claimed' },
  PROCESSING:    { color: '#3498db', label: 'Processing' },
  COMPLETE:      { color: '#95a5a6', label: 'Complete' },
}

function StarRating({ value, count }) {
  return (
    <span className="ld-stars">
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= Math.round(value) ? '#f39c12' : 'rgba(255,255,255,0.2)' }}>★</span>
      ))}
      <span className="ld-stars-label">{value.toFixed(1)} ({count})</span>
    </span>
  )
}

export default function ListingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [listing,   setListing]   = useState(null)
  const [reviews,   setReviews]   = useState([])
  const [payingCut, setPayingCut] = useState(null)
  const [confirmed, setConfirmed] = useState(null)
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      api.get(`/api/listings/${id}`),
      api.get(`/api/listings/${id}/reviews`).catch(() => []),
    ]).then(([l, r]) => {
      setListing(l)
      setReviews(r)
    }).catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  async function handlePaymentSuccess(paymentIntentId) {
    try {
      await api.post(`/api/listings/${listing.id}/claims`, {
        cutId: payingCut.id,
        paymentIntentId,
      })
      const updated = await api.get(`/api/listings/${id}`)
      setListing(updated)
      setConfirmed({ cut: payingCut, listing: updated })
      setPayingCut(null)
    } catch (err) {
      setError(err.message)
      setPayingCut(null)
    }
  }

  function handleCutClick(cut) {
    if (!user) { navigate('/login'); return }
    setPayingCut(cut)
  }

  if (loading) return <div className="ld-loading">Loading listing…</div>
  if (error)   return <div className="ld-error">{error} <Link to="/listings">← Back</Link></div>
  if (!listing) return null

  const meta      = ANIMAL_META[listing.animalType] || { emoji: '🥩', label: listing.animalType }
  const status    = STATUS_META[listing.status] || { color: '#ccc', label: listing.status }
  const available = listing.cuts.filter(c => !c.claimed).length
  const claimed   = listing.cuts.filter(c => c.claimed).length
  const pct       = listing.totalCuts > 0 ? Math.round((claimed / listing.totalCuts) * 100) : 0
  const avgRating = reviews.length > 0 ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : null

  if (confirmed) {
    return (
      <div className="ld-page">
        <div className="ld-confirm">
          <div className="ld-confirm-icon">✅</div>
          <h2>Cut claimed!</h2>
          <p>You claimed the <strong>{confirmed.cut.label}</strong> cut from <strong>{confirmed.listing.farmerShopName || confirmed.listing.farmerName}</strong>.</p>
          {confirmed.listing.processingDate && (
            <p className="ld-confirm-date">🗓 Processing date: <strong>{new Date(confirmed.listing.processingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong></p>
          )}
          <p className="ld-confirm-farm">📍 {confirmed.listing.sourceFarm} · ZIP {confirmed.listing.zipCode}</p>
          <p className="ld-confirm-sub">A confirmation email has been sent to you. Check your profile for claim details.</p>
          <div className="ld-confirm-actions">
            <Link to="/profile" className="hp-btn-primary">View My Claims →</Link>
            <Link to="/listings" className="hp-btn-ghost">Browse More</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="ld-page">
      <div className="ld-inner">

        <Link to="/listings" className="ld-back">← Back to Listings</Link>

        {/* Hero card */}
        <div className="ld-hero">
          <div className="ld-hero-left">
            <div className="ld-emoji">{meta.emoji}</div>
            <div>
              <h1 className="ld-title">{listing.breed} {meta.label}</h1>
              <p className="ld-farm">{listing.farmerShopName || listing.farmerName} · {listing.sourceFarm}</p>
              <p className="ld-location">📍 ZIP {listing.zipCode}</p>
            </div>
          </div>
          <div className="ld-hero-right">
            <div className="ld-price">${listing.pricePerLb.toFixed(2)}<small>/lb</small></div>
            <div className="ld-weight">{listing.weightLbs} lbs total</div>
            <div className="ld-status" style={{ color: status.color }}>● {status.label}</div>
          </div>
        </div>

        {/* Stats row */}
        <div className="ld-stats">
          <div className="ld-stat"><strong>{listing.totalCuts}</strong><span>total cuts</span></div>
          <div className="ld-stat-sep" />
          <div className="ld-stat"><strong>{claimed}</strong><span>claimed</span></div>
          <div className="ld-stat-sep" />
          <div className="ld-stat"><strong>{available}</strong><span>available</span></div>
          <div className="ld-stat-sep" />
          <div className="ld-stat"><strong>${(listing.pricePerLb * listing.weightLbs / listing.totalCuts).toFixed(0)}</strong><span>est. per cut</span></div>
          {avgRating !== null && (
            <>
              <div className="ld-stat-sep" />
              <div className="ld-stat"><StarRating value={avgRating} count={reviews.length} /></div>
            </>
          )}
        </div>

        {/* Progress bar */}
        <div className="ld-progress-wrap">
          <div className="ld-progress-header">
            <span>Share progress</span>
            <span>{pct}% claimed</span>
          </div>
          <div className="ld-progress-track">
            {listing.cuts.map((c, i) => (
              <div key={i} className={`ld-seg${c.claimed ? ' ld-seg--claimed' : ''}`} style={{ flex: 1 }}
                title={`${c.label}: ${c.claimed ? 'Claimed' : 'Available'}`} />
            ))}
          </div>
        </div>

        {listing.description && (
          <p className="ld-description">{listing.description}</p>
        )}

        {listing.processingDate && (
          <div className="ld-processing-badge">
            🗓 Processing date: <strong>{new Date(listing.processingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
          </div>
        )}

        <ListingAnimalViewer animalType={listing.animalType} cuts={listing.cuts} />

        {/* Cuts grid */}
        <div className="ld-cuts-section">
          <h2 className="ld-section-title">Available Cuts</h2>
          {error && <p className="ld-claim-error">{error}</p>}
          <div className="ld-cuts-grid">
            {listing.cuts.map(c => (
              <div key={c.id} className={`ld-cut${c.claimed ? ' ld-cut--claimed' : ''}`}>
                <div className="ld-cut-label">{c.label}</div>
                {c.claimed ? (
                  <span className="ld-cut-status ld-cut-status--claimed">✓ Claimed</span>
                ) : listing.status === 'ACTIVE' ? (
                  <button className="ld-cut-claim-btn" onClick={() => handleCutClick(c)}>
                    Claim →
                  </button>
                ) : (
                  <span className="ld-cut-status ld-cut-status--closed">Unavailable</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Reviews section */}
        {reviews.length > 0 && (
          <div className="ld-reviews-section">
            <h2 className="ld-section-title">Buyer Reviews</h2>
            <div className="ld-reviews">
              {reviews.map(r => (
                <div key={r.id} className="ld-review">
                  <div className="ld-review-header">
                    <span className="ld-review-stars">
                      {[1,2,3,4,5].map(i => (
                        <span key={i} style={{ color: i <= r.rating ? '#f39c12' : 'rgba(255,255,255,0.2)' }}>★</span>
                      ))}
                    </span>
                    <span className="ld-review-date">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  {r.comment && <p className="ld-review-comment">{r.comment}</p>}
                  <p className="ld-review-author">— {r.buyerName}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {payingCut && (
        <PaymentModal
          listing={listing}
          cutLabel={payingCut.label}
          onSuccess={handlePaymentSuccess}
          onClose={() => setPayingCut(null)}
        />
      )}
    </div>
  )
}
