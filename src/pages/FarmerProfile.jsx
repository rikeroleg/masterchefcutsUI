import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useFavorites } from '../utils/index'
import PaymentModal from '../components/PaymentModal'
import '../styles/listings.css'

const ANIMAL_META = {
  BEEF: { emoji: '🐄', label: 'Beef' },
  PORK: { emoji: '🐷', label: 'Pork' },
  LAMB: { emoji: '🐑', label: 'Lamb' },
}

export default function FarmerProfile() {
  const { id } = useParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [listings, setListings] = useState([])
  const [farmer, setFarmer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState([])
  const { isFav, toggle: toggleFav } = useFavorites()

  useEffect(() => {
    fetchListings()
    api.get(`/api/reviews/farmer/${encodeURIComponent(id)}`).then(setReviews).catch(() => {})
  }, [id])

  async function fetchListings() {
    setLoading(true)
    try {
      const data = await api.get(`/api/listings?farmerId=${encodeURIComponent(id)}&size=50`)
      setListings(data)
      if (data.length > 0) {
        setFarmer({
          name: data[0].farmerName,
          shopName: data[0].farmerShopName,
          zipCode: data[0].zipCode,
        })
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load farmer listings.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="listings-page">
      <div className="listings-inner">

        {/* Header */}
        <div className="listings-header">
          <div>
            <Link to="/listings" className="post-back" style={{ display: 'inline-block', marginBottom: 12 }}>← All Listings</Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1 className="listings-title">
                {farmer ? (farmer.shopName || farmer.name) : 'Farmer Storefront'}
              </h1>
              {farmer && (
                <button
                  className="fav-btn"
                  onClick={() => toggleFav({ id, name: farmer.name, shopName: farmer.shopName })}
                  title={isFav(id) ? 'Remove from favorites' : 'Save this farmer'}
                  aria-label={isFav(id) ? 'Unsave farmer' : 'Save farmer'}
                >
                  {isFav(id) ? '♥' : '♡'}
                </button>
              )}
              {user && user.role !== 'farmer' && farmer && (
                <Link
                  to={`/messages?with=${encodeURIComponent(id)}&name=${encodeURIComponent(farmer.shopName || farmer.name || '')}`}
                  className="fp-msg-btn"
                >
                  💬 Message Farmer
                </Link>
              )}
            </div>
            {farmer && (
              <p className="listings-sub">
                🌾 {farmer.name}{farmer.shopName ? ` · ${farmer.shopName}` : ''}
                {farmer.zipCode ? ` · ZIP ${farmer.zipCode}` : ''}
              </p>
            )}
            {reviews.length > 0 && (() => {
              const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
              return (
                <div className="fp-rating-badge">
                  <span className="fp-rating-stars">
                    {[1,2,3,4,5].map(i => (
                      <span key={i} style={{ color: i <= Math.round(avg) ? '#f39c12' : 'rgba(255,255,255,0.2)' }}>★</span>
                    ))}
                  </span>
                  <span className="fp-rating-value">{avg.toFixed(1)}</span>
                  <span className="fp-rating-count">({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
                </div>
              )
            })()}
          </div>
        </div>

        {loading && <p className="listings-loading">Loading listings…</p>}

        {/* Listings grid */}
        <div className="listings-grid">
          {!loading && listings.map(l => (
            <FarmerListingCard key={l.id} listing={l} onClaimed={fetchListings} user={user} navigate={navigate} toast={toast} />
          ))}
          {!loading && listings.length === 0 && (
            <p className="listings-empty">This farmer has no active listings right now.</p>
          )}
        </div>

        {/* Reviews panel */}
        {reviews.length > 0 && (
          <div className="fp-reviews-section">
            <h2 className="fp-reviews-title">Participant Reviews</h2>
            <div className="fp-reviews">
              {reviews.slice(0, 10).map(r => (
                <div key={r.id} className="fp-review">
                  <div className="fp-review-header">
                    <span className="fp-review-stars">
                      {[1,2,3,4,5].map(i => (
                        <span key={i} style={{ color: i <= r.rating ? '#f39c12' : 'rgba(20,6,0,0.2)' }}>★</span>
                      ))}
                    </span>
                    <span className="fp-review-date">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  {r.comment && <p className="fp-review-comment">{r.comment}</p>}
                  <p className="fp-review-author">— {r.buyerName}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

function FarmerListingCard({ listing, onClaimed, user, navigate, toast }) {
  const meta = ANIMAL_META[listing.animalType] || { emoji: '🥩', label: listing.animalType }
  const available = listing.cuts.filter(c => !c.claimed).length
  const [payingCut, setPayingCut] = useState(null)
  const [claimError, setClaimError] = useState('')

  function handleCutClick(cut) {
    if (!user) { navigate('/login'); return }
    if (user.role === 'farmer') return
    setClaimError('')
    setPayingCut(cut)
  }

  async function handlePaymentSuccess(paymentIntentId) {
    const cut = payingCut
    try {
      await api.post(`/api/listings/${listing.id}/claims`, { cutId: cut.id, paymentIntentId })
      setPayingCut(null)
      onClaimed()
    } catch (err) {
      setClaimError(err.message)
      setPayingCut(null)
    }
  }

  return (
    <div className="lc">
      {listing.imageUrl && (
        <div className="lc-photo">
          <img src={listing.imageUrl} alt={`${listing.breed || ''} ${meta.label}`} />
        </div>
      )}
      <div className="lc-header">
        <div className="lc-animal-badge">{meta.emoji}</div>
        <div className="lc-meta">
          <div className="lc-title">{listing.breed} {meta.label}</div>
          <div className="lc-farm">{listing.sourceFarm || listing.farmerShopName} · {listing.zipCode}</div>
        </div>
        <div className="lc-price-block">
          <span className="lc-price">${listing.pricePerLb.toFixed(2)}<small>/lb</small></span>
          <span className="lc-weight">{listing.weightLbs} lbs</span>
        </div>
      </div>

      {listing.description && <p className="lc-desc">{listing.description}</p>}

      <div className="lc-cuts-row" style={{ marginTop: 8 }}>
        {listing.cuts.map(cut => (
          <button
            key={cut.id}
            className={`lc-cut-btn${cut.claimed ? ' lc-cut-btn--claimed' : ''}`}
            disabled={cut.claimed || !available}
            onClick={() => !cut.claimed && handleCutClick(cut)}
          >
            {cut.claimed ? `✓ ${cut.label}` : cut.label}
          </button>
        ))}
      </div>

      {claimError && <p className="lc-claim-error">{claimError}</p>}

      <div style={{ marginTop: 8 }}>
        <Link to={`/listings/${listing.id}`} className="lc-detail-link" style={{ fontSize: '0.8rem', opacity: 0.7 }}>
          View Details →
        </Link>
      </div>

      {payingCut && (
        <PaymentModal
          listing={listing}
          cutLabel={payingCut.label}
          cutId={payingCut.id}
          onSuccess={handlePaymentSuccess}
          onClose={() => setPayingCut(null)}
        />
      )}
    </div>
  )
}
