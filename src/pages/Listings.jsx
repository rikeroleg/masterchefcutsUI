import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import PaymentModal from '../components/PaymentModal'
import '../styles/payment-modal.css'

const ANIMAL_FILTERS = ['All', 'Beef', 'Pork', 'Lamb']

const ANIMAL_META = {
  BEEF: { emoji: '�', label: 'Beef' },
  PORK: { emoji: '🐷', label: 'Pork' },
  LAMB: { emoji: '🐑', label: 'Lamb' },
}

function postedAgo(dateStr) {
  if (!dateStr) return ''
  const days = Math.floor((Date.now() - new Date(dateStr)) / (1000 * 60 * 60 * 24))
  return days === 0 ? 'today' : `${days}d ago`
}

function ShareProgressBar({ cuts }) {
  const total   = cuts.length
  const claimed = cuts.filter(c => c.claimed).length
  const pct     = Math.round((claimed / total) * 100)

  return (
    <div className="spb">
      <div className="spb-header">
        <span className="spb-title">Share progress</span>
        <span className="spb-count">
          <strong>{claimed}</strong> / {total} cuts claimed
          <span className={`spb-pct${pct === 100 ? ' spb-pct--full' : ''}`}>{pct}%</span>
        </span>
      </div>

      {/* Segmented bar */}
      <div className="spb-track">
        {cuts.map((c, i) => (
          <div
            key={i}
            className={`spb-seg${c.claimed ? ' spb-seg--claimed' : ''}`}
            style={{ flex: 1 }}
            title={`${c.label}: ${c.claimed ? 'Claimed' : 'Available'}`}
          />
        ))}
      </div>

      {/* Cut pills */}
      <div className="spb-cuts">
        {cuts.map((c, i) => (
          <span key={i} className={`spb-cut${c.claimed ? ' spb-cut--claimed' : ' spb-cut--open'}`}>
            {c.claimed ? '✓' : '+'} {c.label}
          </span>
        ))}
      </div>

      <div className="spb-legend">
        <span className="spb-legend-item spb-legend-item--claimed"><span />Claimed</span>
        <span className="spb-legend-item spb-legend-item--open"><span />Available</span>
      </div>
    </div>
  )
}

function ListingCard({ listing, onClaimed }) {
  const { user }                        = useAuth()
  const navigate                        = useNavigate()
  const [expanded, setExpanded]         = useState(false)
  const [payingCut, setPayingCut]       = useState(null)
  const [claimError, setClaimError]     = useState('')
  const [confirmed, setConfirmed]       = useState(null)
  const [onWaitlist, setOnWaitlist]     = useState(false)
  const [waitlistLoading, setWLLoading] = useState(false)

  const meta      = ANIMAL_META[listing.animalType] || { emoji: '🐄', label: listing.animalType }
  const available = listing.cuts.filter(c => !c.claimed).length

  function handleCutClick(cut) {
    if (!user) { navigate('/login'); return }
    setClaimError('')
    setPayingCut(cut)
  }

  async function handlePaymentSuccess(paymentIntentId) {
    const cut = payingCut
    try {
      await api.post(`/api/listings/${listing.id}/claims`, { cutId: cut.id, paymentIntentId })
      setPayingCut(null)
      setExpanded(false)
      setConfirmed({ cutLabel: cut.label })
      onClaimed()
    } catch (err) {
      setClaimError(err.message)
      setPayingCut(null)
    }
  }

  async function handleWaitlist() {
    if (!user) { navigate('/login'); return }
    setWLLoading(true)
    try {
      if (onWaitlist) {
        await api.delete(`/api/listings/${listing.id}/waitlist`)
        setOnWaitlist(false)
      } else {
        await api.post(`/api/listings/${listing.id}/waitlist`)
        setOnWaitlist(true)
      }
    } catch {}
    setWLLoading(false)
  }

  if (confirmed) {
    return (
      <div className="lc lc--confirmed">
        <div className="lc-confirm-inline">
          <span className="lc-confirm-check">✅</span>
          <div>
            <p className="lc-confirm-title">Cut claimed!</p>
            <p className="lc-confirm-body">You claimed the <strong>{confirmed.cutLabel}</strong> from <strong>{listing.farmerShopName || listing.farmerName}</strong>.</p>
            {listing.processingDate && (
              <p className="lc-confirm-date">🗓 Processing: {new Date(listing.processingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            )}
          </div>
        </div>
        <div className="lc-confirm-actions">
          <Link to="/profile" className="lc-details-link">View my claims →</Link>
          <button className="lc-dismiss-btn" onClick={() => setConfirmed(null)}>Dismiss</button>
        </div>
      </div>
    )
  }

  return (
    <div className={`lc${expanded ? ' lc--expanded' : ''}`}>
      {listing.imageUrl && (
        <div className="lc-photo">
          <img src={listing.imageUrl} alt={`${listing.breed || ''} ${meta.label}`} />
        </div>
      )}
      <div className="lc-header">
        <div className="lc-animal-badge">{meta.emoji}</div>
        <div className="lc-meta">
          <div className="lc-title">{listing.breed} {meta.label}</div>
          <div className="lc-farm">
            <Link to={`/farmer/${listing.farmerId}`} className="lc-farm-link">
              {listing.farmerShopName || listing.farmerName}
            </Link>
            &middot; {listing.zipCode}
          </div>
        </div>
        <div className="lc-price-block">
          <span className="lc-price">${listing.pricePerLb.toFixed(2)}<small>/lb</small></span>
          <span className="lc-weight">{listing.weightLbs} lbs</span>
        </div>
      </div>

      <ShareProgressBar cuts={listing.cuts} />

      {listing.description && (
        <p className="lc-desc">{listing.description}</p>
      )}

      {listing.processingDate && (
        <div className="lc-processing-date">
          🗓 Processing: <strong>{new Date(listing.processingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
        </div>
      )}

      <div className="lc-footer">
        <span className="lc-posted">Posted {postedAgo(listing.postedAt)}</span>
        <div className="lc-footer-actions">
          <Link to={`/listings/${listing.id}`} className="lc-details-link">Details →</Link>
          {available > 0 ? (
            user?.role === 'farmer' ? (
              <span className="lc-full-badge" style={{ color: 'rgba(20,6,0,0.45)' }}>Farmer accounts cannot claim</span>
            ) : (
              <button className="lc-claim-btn" onClick={() => { setExpanded(e => !e); setClaimError('') }}>
                {expanded ? 'Close' : `Claim a cut (${available} open)`}
              </button>
            )
          ) : (
            <>
              <span className="lc-full-badge">Pool Full</span>
              {user?.role === 'buyer' && (
                <button
                  className={`lc-waitlist-btn${onWaitlist ? ' lc-waitlist-btn--on' : ''}`}
                  disabled={waitlistLoading}
                  onClick={handleWaitlist}
                >
                  {waitlistLoading ? '…' : onWaitlist ? '✓ On Waitlist' : 'Join Waitlist'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {expanded && available > 0 && (
        <div className="lc-claim-panel">
          <p className="lc-claim-label">Available cuts — select one to claim</p>
          {claimError && <p style={{ color: '#e74c3c', fontSize: '0.82rem', margin: '0 0 8px' }}>{claimError}</p>}
          <div className="lc-claim-cuts">
            {listing.cuts.filter(c => !c.claimed).map(c => (
              <button key={c.id} className="lc-claim-cut-btn"
                onClick={() => handleCutClick(c)}>
                <span className="lc-claim-cut-name">{c.label}</span>
                <span className="lc-claim-cut-action">Claim →</span>
              </button>
            ))}
          </div>
        </div>
      )}

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

export default function Listings() {
  const { user }                = useAuth()
  const { toast }               = useToast()
  const [filter, setFilter]         = useState('All')
  const [zip, setZip]               = useState(user?.zipCode || '')
  const [zipInput, setZipInput]     = useState(user?.zipCode || '')
  const [listings, setListings]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [page, setPage]             = useState(0)
  const [hasMore, setHasMore]       = useState(true)
  const [priceMin, setPriceMin]     = useState('')
  const [priceMax, setPriceMax]     = useState('')
  const [breedFilter, setBreedFilter] = useState('')
  const [sortBy, setSortBy]         = useState('newest')
  const [moreFilters, setMoreFilters] = useState(false)

  useEffect(() => { fetchListings(true) }, [filter, zip])

  async function fetchListings(reset = true) {
    const nextPage = reset ? 0 : page + 1
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (filter !== 'All') params.set('animal', filter.toUpperCase())
      if (zip)              params.set('zip', zip)
      params.set('page', String(nextPage))
      params.set('size', '12')
      const data  = await api.get(`/api/listings?${params.toString()}`)
      if (reset) {
        setListings(data)
      } else {
        setListings(prev => [...prev, ...data])
      }
      setPage(nextPage)
      setHasMore(data.length === 12)
    } catch (err) {
      setError(err.message)
      toast.error(err.message || 'Failed to load listings.')
    } finally {
      setLoading(false)
    }
  }

  function applyZip(e) {
    e.preventDefault()
    setZip(zipInput.trim())
  }

  const visible = listings
    .filter(l => {
      if (priceMin && l.pricePerLb < parseFloat(priceMin)) return false
      if (priceMax && l.pricePerLb > parseFloat(priceMax)) return false
      if (breedFilter && !(l.breed || '').toLowerCase().includes(breedFilter.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc')  return a.pricePerLb - b.pricePerLb
      if (sortBy === 'price-desc') return b.pricePerLb - a.pricePerLb
      return new Date(b.postedAt) - new Date(a.postedAt)
    })

  return (
    <div className="listings-page">
      <div className="listings-inner">

        <div className="listings-header">
          <div>
            <p className="hp-label">Available now</p>
            <h1 className="listings-title">Browse Listings</h1>
            <p className="listings-sub">Claim a primal cut from a whole animal near you.</p>
          </div>
          <div className="listings-controls">
            <form className="listings-zip-form" onSubmit={applyZip}>
              <input
                className="listings-zip-input"
                value={zipInput}
                onChange={e => setZipInput(e.target.value)}
                placeholder="ZIP code"
                maxLength={10}
              />
              <button type="submit" className="listings-zip-btn">Go</button>
              {zip && (
                <button type="button" className="listings-zip-clear" onClick={() => { setZip(''); setZipInput('') }}>
                  ✕
                </button>
              )}
            </form>
            <div className="listings-filters">
              {ANIMAL_FILTERS.map(f => (
                <button
                  key={f}
                  className={`listings-filter-btn${filter === f ? ' active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'Beef' ? '🐄 ' : f === 'Pork' ? '🐷 ' : f === 'Lamb' ? '🐑 ' : ''}{f}
                </button>
              ))}
              <button
                className={`listings-filter-btn${moreFilters ? ' active' : ''}`}
                onClick={() => setMoreFilters(p => !p)}
              >
                ⋯ Filters{(priceMin || priceMax || breedFilter || sortBy !== 'newest') ? ' •' : ''}
              </button>
            </div>
          </div>
          {moreFilters && (
            <div className="listings-more-filters">
              <div className="listings-filter-group">
                <label className="listings-filter-label">Min price/lb ($)</label>
                <input className="listings-filter-input" type="number" min="0" step="0.01"
                  placeholder="0.00" value={priceMin}
                  onChange={e => setPriceMin(e.target.value)} />
              </div>
              <div className="listings-filter-group">
                <label className="listings-filter-label">Max price/lb ($)</label>
                <input className="listings-filter-input" type="number" min="0" step="0.01"
                  placeholder="Any" value={priceMax}
                  onChange={e => setPriceMax(e.target.value)} />
              </div>
              <div className="listings-filter-group">
                <label className="listings-filter-label">Breed</label>
                <input className="listings-filter-input" type="text"
                  placeholder="e.g. Angus" value={breedFilter}
                  onChange={e => setBreedFilter(e.target.value)} />
              </div>
              <div className="listings-filter-group">
                <label className="listings-filter-label">Sort by</label>
                <select className="listings-sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="newest">Newest first</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                </select>
              </div>
              {(priceMin || priceMax || breedFilter || sortBy !== 'newest') && (
                <button className="listings-filter-clear"
                  onClick={() => { setPriceMin(''); setPriceMax(''); setBreedFilter(''); setSortBy('newest') }}>
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
        {zip && <p className="listings-zip-label">📍 Showing listings near <strong>{zip}</strong></p>}

        {loading && <p className="listings-loading">Loading listings…</p>}
        {error   && <p className="listings-error">{error}</p>}

        <div className="listings-grid">
          {!loading && visible.map(l => (
            <ListingCard key={l.id} listing={l} onClaimed={() => fetchListings(true)} />
          ))}
          {!loading && !error && visible.length === 0 && (
            <p className="listings-empty">No listings found. Check back soon.</p>
          )}
        </div>

        {hasMore && !loading && !error && visible.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '28px' }}>
            <button className="listings-load-more" onClick={() => fetchListings(false)}>
              Load More Listings
            </button>
          </div>
        )}
        {loading && listings.length > 0 && (
          <p className="listings-loading" style={{ textAlign: 'center', marginTop: '16px' }}>Loading more…</p>
        )}

      </div>
    </div>
  )
}
