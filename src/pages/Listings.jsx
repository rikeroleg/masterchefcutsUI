import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { cartBridge } from '../context/CartContext'

const ANIMAL_FILTERS = ['All', 'Beef', 'Pork', 'Lamb']

const ANIMAL_META = {
  BEEF: { emoji: '�', label: 'Beef' },
  PORK: { emoji: '🐷', label: 'Pork' },
  LAMB: { emoji: '🐑', label: 'Lamb' },
}
/** Simple debounce hook — returns value after delay ms of stability. */
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}
function postedAgo(dateStr) {
  if (!dateStr) return ''
  const days = Math.floor((Date.now() - new Date(dateStr)) / (1000 * 60 * 60 * 24))
  return days === 0 ? 'today' : `${days}d ago`
}

function ShareProgressBar({ cuts }) {
  const total   = cuts.length
  const claimed = cuts.filter(c => c.claimed).length
  const pct     = total > 0 ? Math.round((claimed / total) * 100) : 0

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
  const { toast }                       = useToast()
  const [expanded, setExpanded]         = useState(false)
  const [claiming,  setClaiming]        = useState(null)
  const [claimError, setClaimError]     = useState('')
  const [onWaitlist, setOnWaitlist]     = useState(false)
  const [waitlistLoading, setWLLoading] = useState(false)

  const meta      = ANIMAL_META[listing.animalType] || { emoji: '🐄', label: listing.animalType }
  const available = listing.cuts.filter(c => !c.claimed).length

  async function handleCutClick(cut) {
    if (!user) { navigate('/login'); return }
    setClaimError('')
    setClaiming(cut.id)
    try {
      const updated = await api.post(`/api/listings/${listing.id}/claims`, { cutId: cut.id })
      cartBridge.addToCart({
        animal: listing.animalType.toLowerCase(),
        cutId:  cut.id,
        name:   cut.label,
        color:  '#f5c97a',
        price:  Math.round(listing.pricePerLb * listing.weightLbs / listing.totalCuts),
        qty:    1,
        listingId: listing.id,
        breed: listing.breed,
        sourceFarm: listing.sourceFarm,
      })
      toast.success(`${cut.label} added to cart!`)
      setExpanded(false)
      onClaimed(updated)
    } catch (err) {
      setClaimError(err.message || 'Failed to claim cut.')
    } finally {
      setClaiming(null)
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

  if (false) {
    // confirmed state removed — toast + inline update replaces this
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
                onClick={() => handleCutClick(c)}
                disabled={claiming === c.id}>
                <span className="lc-claim-cut-name">{c.label}</span>
                <span className="lc-claim-cut-action">{claiming === c.id ? '…' : 'Claim →'}</span>
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

export default function Listings() {
  const { user }                    = useAuth()
  const { toast }                   = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  // ── Filters from URL params (source of truth) ──────────────────────────
  const animal   = searchParams.get('animal')   || 'All'
  const zip      = searchParams.get('zip')      || ''
  const maxPrice = searchParams.get('maxPrice') || ''
  const radius   = searchParams.get('radius')   || '25'
  const breedFilter = searchParams.get('breed') || ''
  const sortBy   = searchParams.get('sort')     || 'newest'

  // ── Local input state (raw; debounced → URL params) ─────────────────────
  const [zipInput,      setZipInput]      = useState(zip)
  const [maxPriceInput, setMaxPriceInput] = useState(maxPrice)
  const [breedInput,    setBreedInput]    = useState(breedFilter)

  const debouncedZip      = useDebounce(zipInput,      450)
  const debouncedMaxPrice = useDebounce(maxPriceInput, 550)
  const debouncedBreed    = useDebounce(breedInput,    450)

  // ── Data state ───────────────────────────────────────────────────────────
  const [listings,    setListings]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [page,        setPage]        = useState(0)
  const [hasMore,     setHasMore]     = useState(true)
  const [moreFilters, setMoreFilters] = useState(false)

  // Track last-fetched server params to detect resets vs appends
  const lastServerParams = useRef({ animal, zip, maxPrice })

  // ── Push debounced inputs → URL params ───────────────────────────────────
  function updateParam(key, value) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value); else next.delete(key)
      return next
    }, { replace: true })
  }

  useEffect(() => { updateParam('zip',      debouncedZip)      }, [debouncedZip])
  useEffect(() => { updateParam('maxPrice', debouncedMaxPrice) }, [debouncedMaxPrice])
  useEffect(() => { updateParam('breed',    debouncedBreed)    }, [debouncedBreed])

  // ── Fetch whenever server-side filter params change ──────────────────────
  useEffect(() => {
    lastServerParams.current = { animal, zip, maxPrice }
    setPage(0)
    fetchListings(animal, zip, maxPrice, 0, true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animal, zip, maxPrice])

  async function fetchListings(animalVal, zipVal, maxPriceVal, pageNum, reset) {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (animalVal && animalVal !== 'All') params.set('animal', animalVal.toUpperCase())
      if (zipVal)      params.set('zip',      zipVal)
      if (maxPriceVal) params.set('maxPrice', maxPriceVal)
      params.set('page', String(pageNum))
      params.set('size', '12')
      const data = await api.get(`/api/listings?${params.toString()}`)
      if (reset) setListings(data)
      else       setListings(prev => [...prev, ...data])
      setPage(pageNum)
      setHasMore(data.length === 12)
    } catch (err) {
      setError(err.message)
      toast.error(err.message || 'Failed to load listings.')
    } finally {
      setLoading(false)
    }
  }

  function handleLoadMore() {
    const nextPage = page + 1
    fetchListings(animal, zip, maxPrice, nextPage, false)
  }

  function setAnimal(value) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (value && value !== 'All') next.set('animal', value); else next.delete('animal')
      return next
    }, { replace: true })
  }

  function setSortBy(value) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (value && value !== 'newest') next.set('sort', value); else next.delete('sort')
      return next
    }, { replace: true })
  }

  function setRadius(value) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (value && value !== '25') next.set('radius', value); else next.delete('radius')
      return next
    }, { replace: true })
  }

  function clearAllFilters() {
    setZipInput('')
    setMaxPriceInput('')
    setBreedInput('')
    setSearchParams({}, { replace: true })
  }

  const hasActiveFilters = animal !== 'All' || zip || maxPrice || breedFilter || sortBy !== 'newest'

  // Client-side breed filter + sort (server handles animal/zip/maxPrice)
  const visible = listings
    .filter(l => {
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
            {/* ZIP + radius row */}
            <div className="listings-zip-form">
              <input
                className="listings-zip-input"
                value={zipInput}
                onChange={e => setZipInput(e.target.value)}
                placeholder="ZIP code"
                maxLength={10}
              />
              <select
                className="listings-radius-select"
                value={radius}
                onChange={e => setRadius(e.target.value)}
                title="Search radius (exact ZIP for now)"
              >
                <option value="25">25 mi</option>
                <option value="50">50 mi</option>
                <option value="100">100 mi</option>
              </select>
              {zip && (
                <button type="button" className="listings-zip-clear"
                  onClick={() => { setZipInput(''); updateParam('zip', '') }}>✕</button>
              )}
            </div>

            {/* Animal filter pills */}
            <div className="listings-filters">
              {ANIMAL_FILTERS.map(f => (
                <button
                  key={f}
                  className={`listings-filter-btn${animal === f ? ' active' : ''}`}
                  onClick={() => setAnimal(f)}
                >
                  {f === 'Beef' ? '🐄 ' : f === 'Pork' ? '🐷 ' : f === 'Lamb' ? '🐑 ' : ''}{f}
                </button>
              ))}
              <button
                className={`listings-filter-btn${moreFilters ? ' active' : ''}`}
                onClick={() => setMoreFilters(p => !p)}
              >
                ⋯ Filters{(maxPrice || breedFilter || sortBy !== 'newest') ? ' •' : ''}
              </button>
            </div>
          </div>

          {/* Advanced filter panel */}
          {moreFilters && (
            <div className="listings-more-filters">
              <div className="listings-filter-group">
                <label className="listings-filter-label">Max price/lb ($)</label>
                <input className="listings-filter-input" type="number" min="0" step="0.01"
                  placeholder="Any" value={maxPriceInput}
                  onChange={e => setMaxPriceInput(e.target.value)} />
              </div>
              <div className="listings-filter-group">
                <label className="listings-filter-label">Breed</label>
                <input className="listings-filter-input" type="text"
                  placeholder="e.g. Angus" value={breedInput}
                  onChange={e => setBreedInput(e.target.value)} />
              </div>
              <div className="listings-filter-group">
                <label className="listings-filter-label">Sort by</label>
                <select className="listings-sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="newest">Newest first</option>
                  <option value="price-asc">Price: low → high</option>
                  <option value="price-desc">Price: high → low</option>
                </select>
              </div>
              {hasActiveFilters && (
                <button className="listings-filter-clear" onClick={clearAllFilters}>
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        {zip && (
          <p className="listings-zip-label">
            📍 Showing listings near <strong>{zip}</strong>
            <span className="listings-radius-label"> · {radius} mi radius</span>
          </p>
        )}

        {loading && listings.length === 0 && <p className="listings-loading">Loading listings…</p>}
        {error   && <p className="listings-error">{error}</p>}

        <div className="listings-grid">
          {!loading && visible.map(l => (
            <ListingCard key={l.id} listing={l} onClaimed={(updated) => {
              if (updated?.id) setListings(prev => prev.map(x => x.id === updated.id ? updated : x))
              else fetchListings(animal, zip, maxPrice, 0, true)
            }} />
          ))}
          {!loading && !error && visible.length === 0 && (
            <p className="listings-empty">No listings found. Check back soon.</p>
          )}
        </div>

        {hasMore && !loading && !error && visible.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '28px' }}>
            <button className="listings-load-more" onClick={handleLoadMore}>
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
