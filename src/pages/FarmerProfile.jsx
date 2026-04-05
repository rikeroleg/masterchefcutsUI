import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
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

  useEffect(() => {
    fetchListings()
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
            <h1 className="listings-title">
              {farmer ? (farmer.shopName || farmer.name) : 'Farmer Storefront'}
            </h1>
            {farmer && (
              <p className="listings-sub">
                🌾 {farmer.name}{farmer.shopName ? ` · ${farmer.shopName}` : ''}
                {farmer.zipCode ? ` · ZIP ${farmer.zipCode}` : ''}
              </p>
            )}
          </div>
        </div>

        {loading && <p className="listings-loading">Loading listings…</p>}

        <div className="listings-grid">
          {!loading && listings.map(l => (
            <FarmerListingCard key={l.id} listing={l} onClaimed={fetchListings} user={user} navigate={navigate} toast={toast} />
          ))}
          {!loading && listings.length === 0 && (
            <p className="listings-empty">This farmer has no active listings right now.</p>
          )}
        </div>

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
