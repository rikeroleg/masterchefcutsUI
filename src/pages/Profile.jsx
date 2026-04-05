import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'

const ANIMAL_EMOJI = { BEEF: '🐄', PORK: '🐷', LAMB: '🐑' }

const STATUS_STYLE = {
  ACTIVE:         { color: '#27ae60', label: 'Active' },
  FULLY_CLAIMED:  { color: '#e67e22', label: 'Claimed — awaiting processing' },
  PROCESSING:     { color: '#3498db', label: 'Processing soon' },
  COMPLETE:       { color: '#95a5a6', label: 'Complete' },
  claimed:        { color: '#e67e22', label: 'Claimed — awaiting pool' },
  processing:     { color: '#27ae60', label: 'Processing soon' },
  complete:       { color: '#3498db', label: 'Complete — ready for pickup' },
}

function Avatar({ name, size = 56 }) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div className="profile-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials}
    </div>
  )
}

export default function Profile() {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()
  const isFarmerUser = user?.role === 'farmer'
  const [editing, setEditing]             = useState(false)
  const [myListings, setMyListings]         = useState([])
  const [myClaims, setMyClaims]             = useState([])
  const [dateInputs, setDateInputs]         = useState({})
  const [dateLoading, setDateLoading]       = useState(null)
  const [dateError, setDateError]           = useState('')
  const [reviewInputs, setReviewInputs]     = useState({})
  const [reviewLoading, setReviewLoading]   = useState(null)
  const [reviewedSet, setReviewedSet]       = useState(new Set())
  const [reviewError, setReviewError]       = useState('')

  useEffect(() => {
    if (!user) return
    if (isFarmerUser) {
      api.get('/api/listings/my').then(setMyListings).catch(() => {})
    } else {
      api.get('/api/claims/my').then(setMyClaims).catch(() => {})
    }
  }, [user])
  const [form, setForm] = useState({
    name: user?.name || '', shopName: user?.shopName || '',
    street: user?.street || '', apt: user?.apt || '',
    city: user?.city || '', state: user?.state || '', zipCode: user?.zipCode || '',
  })

  async function handleSubmitReview(listingId) {
    const { rating, comment } = reviewInputs[listingId] || {}
    if (!rating) return
    setReviewLoading(listingId)
    setReviewError('')
    try {
      await api.post('/api/reviews', { listingId, rating: Number(rating), comment: comment || '' })
      setReviewedSet(s => new Set([...s, listingId]))
    } catch (err) {
      setReviewError(err.message || 'Failed to submit review')
    } finally {
      setReviewLoading(null)
    }
  }

  async function handleSetProcessingDate(listingId) {
    const date = dateInputs[listingId]
    if (!date) return
    setDateLoading(listingId)
    setDateError('')
    try {
      await api.patch(`/api/listings/${listingId}/processing-date?date=${date}`)
      const updated = await api.get('/api/listings/my')
      setMyListings(updated)
    } catch (err) {
      setDateError(err.message || 'Failed to set date')
    } finally {
      setDateLoading(null)
    }
  }

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-unauth">
          <p className="profile-unauth-msg">You are not signed in.</p>
          <Link to="/login" className="hp-btn-primary">Sign In →</Link>
        </div>
      </div>
    )
  }

  function handleLogout() {
    logout()
    navigate('/')
  }

  function handleSave(e) {
    e.preventDefault()
    updateUser(form)
    setEditing(false)
  }

  const isFarmer = isFarmerUser
  const joinDate = user.joinedAt
    ? new Date(user.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null

  return (
    <div className="profile-page">
      <div className="profile-inner">

        {/* ── Header card ── */}
        <div className="profile-header-card">
          <Avatar name={user.name} size={72} />
          <div className="profile-header-info">
            <div className="profile-name">{user.name}</div>
            <div className="profile-role-badge">
              {isFarmer ? '🌾 Farmer / Butcher' : '🛒 Participant'}
            </div>
            {user.shopName && <div className="profile-shop">{user.shopName}</div>}
            {(user.street || user.city || user.zipCode) && (
              <div className="profile-address">
                <span className="profile-address-icon">📦</span>
                <div className="profile-address-lines">
                  {user.street && <span>{user.street}{user.apt ? `, ${user.apt}` : ''}</span>}
                  {(user.city || user.state || user.zipCode) && (
                    <span>{[user.city, user.state].filter(Boolean).join(', ')}{user.zipCode ? ` ${user.zipCode}` : ''}</span>
                  )}
                </div>
              </div>
            )}
            <div className="profile-joined">Member since {joinDate}</div>
          </div>
          <div className="profile-header-actions">
            <button className="profile-edit-btn" onClick={() => setEditing(e => !e)}>
              {editing ? 'Cancel' : 'Edit Profile'}
            </button>
            <button className="profile-logout-btn" onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        </div>

        {/* ── Edit form ── */}
        {editing && (
          <form className="profile-edit-form" onSubmit={handleSave}>
            <div className="profile-edit-title">Edit Profile</div>
            <div className="profile-edit-row">
              <div className="login-field">
                <label>Full name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              {isFarmer && (
                <div className="login-field">
                  <label>Shop / Farm name</label>
                  <input value={form.shopName} onChange={e => setForm(f => ({ ...f, shopName: e.target.value }))} placeholder="e.g. Green Pastures Farm" />
                </div>
              )}
            </div>
            <div className="profile-edit-title" style={{ marginTop: '4px' }}>Shipping Address</div>
            <div className="login-field">
              <label>Street address</label>
              <input value={form.street} onChange={e => setForm(f => ({ ...f, street: e.target.value }))} placeholder="123 Main St" />
            </div>
            <div className="profile-edit-row">
              <div className="login-field">
                <label>Apt / Suite <span className="login-opt">(optional)</span></label>
                <input value={form.apt} onChange={e => setForm(f => ({ ...f, apt: e.target.value }))} placeholder="Apt 4B" />
              </div>
              <div className="login-field">
                <label>ZIP Code</label>
                <input value={form.zipCode} onChange={e => setForm(f => ({ ...f, zipCode: e.target.value }))} placeholder="17601" maxLength={10} />
                <span className="login-hint">Used to match you with local listings</span>
              </div>
            </div>
            <div className="profile-edit-row">
              <div className="login-field">
                <label>City</label>
                <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Lancaster" />
              </div>
              <div className="login-field">
                <label>State</label>
                <input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} placeholder="PA" maxLength={2} />
              </div>
            </div>
            <button type="submit" className="login-submit" style={{ marginTop: '8px' }}>Save Changes</button>
          </form>
        )}

        {/* ── Stats row ── */}
        <div className="profile-stats">
          {isFarmer ? (
            <>
              <div className="profile-stat"><strong>{myListings.length}</strong><span>Listings posted</span></div>
              <div className="profile-stat-sep" />
              <div className="profile-stat"><strong>{myListings.reduce((a, l) => a + l.claimedCuts, 0)}</strong><span>Cuts claimed</span></div>
              <div className="profile-stat-sep" />
              <div className="profile-stat"><strong>{myListings.reduce((a, l) => a + (l.totalCuts - l.claimedCuts), 0)}</strong><span>Cuts remaining</span></div>
            </>
          ) : (
            <>
              <div className="profile-stat"><strong>{myClaims.length}</strong><span>Cuts claimed</span></div>
              <div className="profile-stat-sep" />
              <div className="profile-stat"><strong>{myClaims.filter(c => c.listingStatus === 'PROCESSING').length}</strong><span>In processing</span></div>
              <div className="profile-stat-sep" />
              <div className="profile-stat"><strong>$0</strong><span>Total spent</span></div>
            </>
          )}
        </div>

        {/* ── Buyer: My Claims ── */}
        {!isFarmer && (
          <div className="profile-section">
            <div className="profile-section-header">
              <h2 className="profile-section-title">My Claims</h2>
              <Link to="/listings" className="profile-section-link">Browse listings →</Link>
            </div>
            {myClaims.length === 0 ? (
              <div className="profile-empty">
                <p>You haven&apos;t claimed any cuts yet.</p>
                <Link to="/listings" className="hp-btn-primary">Browse Available Animals →</Link>
              </div>
            ) : (
              <div className="profile-claims">
                {myClaims.map(c => (
                  <div key={c.id} className="profile-claim-card">
                    <div className="profile-claim-animal">{ANIMAL_EMOJI[c.animalType] || '🥩'} {c.breed}</div>
                    <div className="profile-claim-cut">{c.cutLabel}</div>
                    <div className="profile-claim-farm">{c.sourceFarm} &middot; {c.zipCode}</div>
                    <div className="profile-claim-status" style={{ color: STATUS_STYLE[c.listingStatus]?.color }}>
                      ● {STATUS_STYLE[c.listingStatus]?.label}
                    </div>
                    <div className="profile-claim-date">Claimed {c.claimedAt ? new Date(c.claimedAt).toLocaleDateString() : ''}</div>
                    {(c.listingStatus === 'PROCESSING' || c.listingStatus === 'COMPLETE') && !reviewedSet.has(c.listingId) && (
                      <div className="profile-review-form">
                        <p className="profile-review-label">Leave a review</p>
                        {reviewError && reviewLoading === null && <p className="profile-date-error" style={{marginBottom:6}}>{reviewError}</p>}
                        <div className="profile-review-stars">
                          {[1,2,3,4,5].map(n => (
                            <button
                              key={n}
                              type="button"
                              className={`profile-star-btn${(reviewInputs[c.listingId]?.rating || 0) >= n ? ' active' : ''}`}
                              onClick={() => setReviewInputs(r => ({ ...r, [c.listingId]: { ...(r[c.listingId] || {}), rating: n } }))}
                            >★</button>
                          ))}
                        </div>
                        <textarea
                          className="profile-review-text"
                          placeholder="Optional comment…"
                          rows={2}
                          value={reviewInputs[c.listingId]?.comment || ''}
                          onChange={e => setReviewInputs(r => ({ ...r, [c.listingId]: { ...(r[c.listingId] || {}), comment: e.target.value } }))}
                        />
                        <button
                          className="profile-date-btn"
                          disabled={!reviewInputs[c.listingId]?.rating || reviewLoading === c.listingId}
                          onClick={() => handleSubmitReview(c.listingId)}
                        >
                          {reviewLoading === c.listingId ? 'Submitting…' : 'Submit Review'}
                        </button>
                      </div>
                    )}
                    {reviewedSet.has(c.listingId) && (
                      <div className="profile-review-done">✅ Review submitted</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Farmer: My Listings ── */}
        {isFarmer && (
          <div className="profile-section">
            <div className="profile-section-header">
              <h2 className="profile-section-title">My Listings</h2>
              <Link to="/post" className="profile-section-link">Post new listing →</Link>
            </div>
            {myListings.length === 0 ? (
              <div className="profile-empty">
                <p>You haven&apos;t posted any listings yet.</p>
                <Link to="/post" className="hp-btn-primary">Post Your First Animal →</Link>
              </div>
            ) : (
              <>
              {dateError && <p className="profile-date-error">{dateError}</p>}
              <div className="profile-listings">
                {myListings.map(l => {
                  const pct          = l.totalCuts > 0 ? Math.round((l.claimedCuts / l.totalCuts) * 100) : 0
                  const canSetDate   = (l.status === 'FULLY_CLAIMED' || l.status === 'PROCESSING') && !l.processingDate
                  const hasDate      = !!l.processingDate
                  return (
                    <div key={l.id} className="profile-listing-card">
                      <div className="profile-listing-top">
                        <div>
                          <div className="profile-listing-title">{ANIMAL_EMOJI[l.animalType] || '🥩'} {l.breed}</div>
                          <div className="profile-listing-meta">{l.weightLbs} lbs &middot; ${l.pricePerLb.toFixed(2)}/lb</div>
                        </div>
                        <div className="profile-listing-status" style={{ color: STATUS_STYLE[l.status]?.color }}>
                          ● {STATUS_STYLE[l.status]?.label}
                        </div>
                      </div>
                      {/* Mini progress bar */}
                      <div className="profile-listing-bar-wrap">
                        <div className="profile-listing-bar">
                          <div className="profile-listing-bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="profile-listing-bar-label">{l.claimedCuts}/{l.totalCuts} cuts claimed ({pct}%)</span>
                      </div>
                      {/* Processing date */}
                      {hasDate && (
                        <div className="profile-listing-date">
                          🗓 Processing: <strong>{new Date(l.processingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
                        </div>
                      )}
                      {canSetDate && (
                        <div className="profile-listing-date-row">
                          <input
                            type="date"
                            className="profile-date-input"
                            value={dateInputs[l.id] || ''}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={e => setDateInputs(d => ({ ...d, [l.id]: e.target.value }))}
                          />
                          <button
                            className="profile-date-btn"
                            disabled={!dateInputs[l.id] || dateLoading === l.id}
                            onClick={() => handleSetProcessingDate(l.id)}
                          >
                            {dateLoading === l.id ? 'Saving…' : 'Set Processing Date'}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
