import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useCart } from '../context/CartContext'
import { api } from '../api/client'
import DisputeModal from '../Components/DisputeModal'
import BalancePaymentModal from '../Components/BalancePaymentModal'

const ANIMAL_EMOJI = { BEEF: '🐄', PORK: '🐷', LAMB: '🐑' }

function parseExpiry(v) {
  if (Array.isArray(v)) {
    return new Date(v[0], v[1] - 1, v[2], v[3] || 0, v[4] || 0, v[5] || 0)
  }
  return new Date(v)
}

function ClaimCountdown({ expiresAt }) {
  const [remaining, setRemaining] = useState('')
  const [urgent, setUrgent] = useState(false)

  useEffect(() => {
    function tick() {
      const diff = parseExpiry(expiresAt) - Date.now()
      if (diff <= 0) { setRemaining('Expired'); setUrgent(true); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      setRemaining(`${h}h ${m}m left to pay`)
      setUrgent(h < 2)
    }
    tick()
    const id = setInterval(tick, 30000)
    return () => clearInterval(id)
  }, [expiresAt])

  return (
    <div className={`profile-claim-expiry${urgent ? ' profile-claim-expiry--urgent' : ''}`}>
      ⏰ {remaining}
    </div>
  )
}

const STATUS_STYLE = {
  ACTIVE:         { color: '#0d5c2f', label: 'Active' },
  FULLY_CLAIMED:  { color: '#8b4513', label: 'Claimed — awaiting processing' },
  PROCESSING:     { color: '#1a5276', label: 'Processing soon' },
  COMPLETE:       { color: '#4a4a4a', label: 'Complete' },
  claimed:        { color: '#8b4513', label: 'Claimed — awaiting pool' },
  processing:     { color: '#0d5c2f', label: 'Processing soon' },
  complete:       { color: '#1a5276', label: 'Complete — ready for pickup' },
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
  const { toast } = useToast()
  const { addToCart, items: cartItems } = useCart()
  const navigate = useNavigate()
  const isFarmerUser = user?.role === 'farmer'
  const [editing, setEditing]             = useState(false)
  const [myListings, setMyListings]         = useState([])
  const [myClaims, setMyClaims]             = useState([])
  const [claimsError, setClaimsError]       = useState('')
  const [dateInputs, setDateInputs]         = useState({})
  const [dateLoading, setDateLoading]       = useState(null)
  const [dateError, setDateError]           = useState('')
  const [reviewInputs, setReviewInputs]     = useState({})
  const [reviewLoading, setReviewLoading]   = useState(null)
  const [reviewedSet, setReviewedSet]       = useState(new Set())
  const [reviewError, setReviewError]       = useState('')
  const [disputeClaim, setDisputeClaim]             = useState(null)
  const [myOrders, setMyOrders]                     = useState([])
  const [ordersLoading, setOrdersLoading]           = useState(false)
  const [farmerOrders, setFarmerOrders]             = useState([])
  const [farmerOrdersLoading, setFarmerOrdersLoading] = useState(false)
  const [updatingOrderId, setUpdatingOrderId]       = useState(null)
  const [confirmingOrderId, setConfirmingOrderId]   = useState(null)
  const [balanceOrder, setBalanceOrder]             = useState(null)
  const [editListingId, setEditListingId]           = useState(null)
  const [editListingForm, setEditListingForm]       = useState({})
  const [editListingLoading, setEditListingLoading] = useState(false)
  const [closingId, setClosingId]                   = useState(null)
  const [deleteConfirm, setDeleteConfirm]           = useState(false)
  const [deleteLoading, setDeleteLoading]           = useState(false)
  const [pwForm, setPwForm]             = useState({ currentPassword: '', newPassword: '', confirmNew: '' })
  const [pwLoading, setPwLoading]       = useState(false)
  const [notifPref, setNotifPref]       = useState(user?.notificationPreference || 'ALL')
  const [notifPrefLoading, setNotifPrefLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    if (isFarmerUser) {
      api.get('/api/listings/my').then(setMyListings).catch(() => {})
      // Load farmer orders
      setFarmerOrdersLoading(true)
      api.get('/api/orders/farmer').then(setFarmerOrders).catch(() => {}).finally(() => setFarmerOrdersLoading(false))
    } else {
      setClaimsError('')
      api.get('/api/claims/my')
        .then(setMyClaims)
        .catch(err => {
          setMyClaims([])
          setClaimsError(err.message || 'Failed to load your claims.')
        })
      setOrdersLoading(true)
      api.get('/api/orders/my').then(setMyOrders).catch(() => {}).finally(() => setOrdersLoading(false))
    }
  }, [user, isFarmerUser])
  const [form, setForm] = useState({
    name: user?.name || '', shopName: user?.shopName || '',
    street: user?.street || '', apt: user?.apt || '',
    city: user?.city || '', state: user?.state || '', zipCode: user?.zipCode || '',
  })

  // Add all unpaid claims from same listing to cart and navigate to checkout
  function handlePayClaims(claim) {
    // Find all unpaid claims from the same listing
    const unpaidFromListing = myClaims.filter(c => c.listingId === claim.listingId && !c.paid)
    
    // Add each claim to cart (if not already there)
    unpaidFromListing.forEach(c => {
      const cartId = `${c.animalType.toLowerCase()}-${c.cutId}`
      const alreadyInCart = cartItems.some(item => item.id === cartId)
      if (!alreadyInCart) {
        addToCart({
          animal: c.animalType.toLowerCase(),
          cutId: c.cutId,
          name: c.cutLabel,
          color: '#b84a00',
          price: c.price || 0,
          qty: 1,
          listingId: c.listingId,
          breed: c.breed,
          sourceFarm: c.sourceFarm
        })
      }
    })
    
    // Navigate to cart with listingId to pre-select only those items
    toast.success(`${unpaidFromListing.length} claim${unpaidFromListing.length > 1 ? 's' : ''} added to cart`)
    navigate('/cart', { state: { selectListingId: claim.listingId } })
  }

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

  // Farmer: update order status
  async function handleUpdateOrderStatus(orderId, newStatus) {
    setUpdatingOrderId(orderId)
    try {
      await api.patch(`/api/orders/${orderId}/status`, { status: newStatus })
      toast.success(`Order marked as ${newStatus.toLowerCase()}`)
      // Refresh farmer orders
      const updated = await api.get('/api/orders/farmer')
      setFarmerOrders(updated)
    } catch (err) {
      toast.error(err.message || 'Failed to update order status')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  // Buyer: confirm receipt of order
  async function handleConfirmReceipt(orderId) {
    setConfirmingOrderId(orderId)
    try {
      await api.post(`/api/orders/${orderId}/confirm-receipt`)
      toast.success('Order marked as completed. Thank you!')
      // Refresh buyer orders
      const updated = await api.get('/api/orders/my')
      setMyOrders(updated)
    } catch (err) {
      toast.error(err.message || 'Failed to confirm receipt')
    } finally {
      setConfirmingOrderId(null)
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

  async function handleEditListing(e, id) {
    e.preventDefault()
    setEditListingLoading(true)
    try {
      await api.patch(`/api/listings/${id}`, {
        pricePerLb:  parseFloat(editListingForm.pricePerLb),
        description: editListingForm.description || null,
      })
      toast.success('Listing updated.')
      setEditListingId(null)
      const updated = await api.get('/api/listings/my')
      setMyListings(updated)
    } catch (err) {
      toast.error(err.message || 'Failed to update listing.')
    } finally {
      setEditListingLoading(false)
    }
  }

  async function handleCloseListing(id) {
    if (closingId !== id) { setClosingId(id); return }
    try {
      await api.delete(`/api/listings/${id}`)
      toast.info('Listing closed.')
      setClosingId(null)
      setMyListings(prev => prev.filter(l => l.id !== id))
    } catch (err) {
      toast.error(err.message || 'Failed to close listing.')
      setClosingId(null)
    }
  }

  async function handleNotifPrefChange(pref) {
    setNotifPrefLoading(true)
    try {
      await api.patch('/api/participants/me/notification-preference', { preference: pref })
      setNotifPref(pref)
      toast.success('Notification preference saved.')
    } catch (err) {
      toast.error(err.message || 'Failed to update preference.')
    } finally {
      setNotifPrefLoading(false)
    }
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true)
    try {
      await api.delete('/api/users/me')
      logout()
      navigate('/')
    } catch (err) {
      toast.error(err.message || 'Failed to delete account.')
      setDeleteLoading(false)
      setDeleteConfirm(false)
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirmNew) {
      toast.error('New passwords do not match.')
      return
    }
    setPwLoading(true)
    try {
      await api.post('/api/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      })
      toast.success('Password changed successfully.')
      setPwForm({ currentPassword: '', newPassword: '', confirmNew: '' })
    } catch (err) {
      toast.error(err.message || 'Failed to change password.')
    } finally {
      setPwLoading(false)
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

  // Helper functions for order status workflow
  function getNextStatus(status) {
    if (!status) return null
    const s = status.toUpperCase()
    if (s === 'PAID' || s === 'DEPOSIT_PAID' || s === 'SHIPPED') return 'ACCEPTED'
    if (s === 'ACCEPTED') return 'PROCESSING'
    if (s === 'PROCESSING') return 'READY'
    return null // READY and COMPLETED have no next status for farmer
  }

  function getActionLabel(status) {
    if (!status) return ''
    const s = status.toUpperCase()
    if (s === 'PAID' || s === 'DEPOSIT_PAID' || s === 'SHIPPED') return 'Accept Order →'
    if (s === 'ACCEPTED') return 'Start Processing →'
    if (s === 'PROCESSING') return 'Mark Ready for Pickup →'
    return ''
  }

  function getStatusLabel(status) {
    if (!status) return 'Unknown'
    const s = status.toUpperCase()
    const labels = {
      'PAID': 'Paid - Awaiting Acceptance',
      'DEPOSIT_PAID': 'Deposit Paid',
      'ACCEPTED': 'Accepted',
      'PROCESSING': 'Processing',
      'READY': 'Ready for Pickup',
      'COMPLETED': 'Completed',
      'SHIPPED': 'Shipped - Balance Due'
    }
    return labels[s] || status
  }

  function getStatusColor(status) {
    if (!status) return '#666'
    const s = status.toUpperCase()
    const colors = {
      'PAID': '#e67e22',
      'DEPOSIT_PAID': '#e67e22',
      'ACCEPTED': '#3498db',
      'PROCESSING': '#9b59b6',
      'READY': '#27ae60',
      'COMPLETED': '#7f8c8d',
      'SHIPPED': '#e67e22'
    }
    return colors[s] || '#666'
  }

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
              {user.approved === false && (
                <>
                  <div className="profile-stat-sep" />
                  <div className="profile-stat profile-stat--pending">
                    <span>⏳ Pending admin approval</span>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <div className="profile-stat"><strong>{myClaims.length}</strong><span>Cuts claimed</span></div>
              <div className="profile-stat-sep" />
              <div className="profile-stat"><strong>{myClaims.filter(c => c.listingStatus === 'PROCESSING').length}</strong><span>In processing</span></div>
              <div className="profile-stat-sep" />
              <div className="profile-stat"><strong>${myClaims.reduce((s, c) => s + (c.pricePaid || 0), 0).toFixed(0)}</strong><span>Total spent</span></div>
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
            {claimsError && <p className="profile-date-error">{claimsError}</p>}
            {myClaims.length === 0 ? (
              <div className="profile-empty">
                <p>You haven&apos;t claimed any cuts yet.</p>
                <Link to="/listings" className="hp-btn-primary">Browse Available Animals →</Link>
              </div>
            ) : (
              <div className="profile-claims">
                {myClaims.map(c => (
                  <div key={c.id} className="profile-claim-card">
                    {/* Header row */}
                    <div className="profile-claim-header">
                      <span className="profile-claim-animal">{ANIMAL_EMOJI[c.animalType] || '🥩'} {c.breed}</span>
                      {c.paid ? (
                        <span className="profile-claim-badge paid">✓ Paid</span>
                      ) : (
                        <button
                          type="button"
                          className="profile-claim-badge unpaid clickable"
                          onClick={() => handlePayClaims(c)}
                        >
                          Pay Now →
                        </button>
                      )}
                    </div>

                    {/* Cut name + view link */}
                    <div className="profile-claim-cut-row">
                      <div className="profile-claim-cut">{c.cutLabel}</div>
                      <Link to={`/listings/${c.listingId}`} className="profile-claim-view-link">View Listing →</Link>
                    </div>

                    {/* Info grid */}
                    <div className="profile-claim-info">
                      <div className="profile-claim-info-item">
                        <span className="profile-claim-info-label">Farm</span>
                        <span className="profile-claim-info-value">{c.sourceFarm}</span>
                      </div>
                      <div className="profile-claim-info-item">
                        <span className="profile-claim-info-label">Location</span>
                        <span className="profile-claim-info-value">{c.zipCode}</span>
                      </div>
                      {c.weight && (
                        <div className="profile-claim-info-item">
                          <span className="profile-claim-info-label">Weight</span>
                          <span className="profile-claim-info-value">{c.weight} lbs</span>
                        </div>
                      )}
                      {c.price && (
                        <div className="profile-claim-info-item">
                          <span className="profile-claim-info-label">Price</span>
                          <span className="profile-claim-info-value">${c.price.toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    {/* Status + timer row */}
                    <div className="profile-claim-footer">
                      <div className="profile-claim-status" style={{ color: STATUS_STYLE[c.listingStatus]?.color }}>
                        ● {STATUS_STYLE[c.listingStatus]?.label}
                      </div>
                      <div className="profile-claim-date">Claimed {c.claimedAt ? new Date(c.claimedAt).toLocaleDateString() : ''}</div>
                    </div>

                    {/* Timer for unpaid claims */}
                    {!c.paid && c.expiresAt && (
                      <ClaimCountdown expiresAt={c.expiresAt} />
                    )}
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
                    <button className="profile-dispute-btn" onClick={() => setDisputeClaim(c)}>
                      ⚠ Report an issue
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Farmer: Customer Orders ── */}
        {isFarmer && (
          <div className="profile-section">
            <div className="profile-section-header">
              <h2 className="profile-section-title">Customer Orders</h2>
            </div>
            {farmerOrdersLoading ? (
              <p className="profile-loading">Loading orders...</p>
            ) : farmerOrders.length === 0 ? (
              <div className="profile-empty">
                <p>No paid orders yet. Orders will appear here once customers pay.</p>
              </div>
            ) : (
              <div className="profile-orders">
                {farmerOrders.map(order => {
                  const items = order.items ? JSON.parse(order.items) : []
                  const nextStatus = getNextStatus(order.status)
                  const statusLabel = getStatusLabel(order.status)
                  const statusColor = getStatusColor(order.status)
                  return (
                    <div key={order.id} className="profile-order-card">
                      <div className="profile-order-header">
                        <span className="profile-order-id">Order #{order.id.slice(0, 8)}</span>
                        <span className="profile-order-status" style={{ color: statusColor }}>
                          ● {statusLabel}
                        </span>
                      </div>
                      <div className="profile-order-amount">
                        ${order.totalAmount?.toFixed(2) || '0.00'}
                        {order.paymentType === 'DEPOSIT' && order.remainingAmountCents > 0 && (
                          <span className="profile-order-deposit"> (deposit paid, ${(order.remainingAmountCents / 100).toFixed(2)} balance due)</span>
                        )}
                      </div>
                      <div className="profile-order-items">
                        {items.map((item, idx) => (
                          <span key={idx} className="profile-order-item">{item.cutLabel}</span>
                        ))}
                      </div>
                      <div className="profile-order-date">
                        Ordered {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : ''}
                      </div>
                      {nextStatus && (
                        <button
                          className="profile-order-action-btn"
                          onClick={() => handleUpdateOrderStatus(order.id, nextStatus)}
                          disabled={updatingOrderId === order.id}
                        >
                          {updatingOrderId === order.id ? 'Updating...' : getActionLabel(order.status)}
                        </button>
                      )}
                    </div>
                  )
                })}
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
                      {/* Inline edit form */}
                      {editListingId === l.id && (
                        <form className="profile-listing-edit-form" onSubmit={e => handleEditListing(e, l.id)}>
                          <div className="profile-listing-edit-row">
                            <div className="login-field">
                              <label>Price per lb ($)</label>
                              <input
                                type="number" min="0.01" step="0.01"
                                className="profile-date-input"
                                style={{ width: '100%' }}
                                value={editListingForm.pricePerLb || ''}
                                onChange={e => setEditListingForm(f => ({ ...f, pricePerLb: e.target.value }))}
                              />
                            </div>
                          </div>
                          <div className="login-field">
                            <label>Description</label>
                            <textarea
                              className="profile-review-text"
                              rows={2}
                              value={editListingForm.description || ''}
                              onChange={e => setEditListingForm(f => ({ ...f, description: e.target.value }))}
                              placeholder="Update description…"
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                            <button type="submit" className="profile-date-btn" disabled={editListingLoading}>
                              {editListingLoading ? 'Saving…' : 'Save Changes'}
                            </button>
                            <button type="button" className="profile-listing-sec-btn" onClick={() => setEditListingId(null)}>Cancel</button>
                          </div>
                        </form>
                      )}
                      {/* Listing actions */}
                      {editListingId !== l.id && l.status !== 'COMPLETE' && (
                        <div className="profile-listing-actions">
                          <button
                            className="profile-listing-edit-btn"
                            onClick={() => {
                              setEditListingId(l.id)
                              setEditListingForm({ pricePerLb: l.pricePerLb.toFixed(2), description: l.description || '' })
                            }}
                          >
                            ✎ Edit
                          </button>
                          <button
                            className="profile-listing-close-btn"
                            onClick={() => handleCloseListing(l.id)}
                          >
                            {closingId === l.id ? '⚠ Confirm close' : '✕ Close Listing'}
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

        {/* ── Buyer: My Orders ── */}
        {!isFarmer && (
          <div className="profile-section">
            <div className="profile-section-header">
              <h2 className="profile-section-title">My Orders</h2>
            </div>
            {ordersLoading ? (
              <p style={{ color: 'rgba(20,6,0,0.5)', fontSize: '0.88rem' }}>Loading orders…</p>
            ) : myOrders.length === 0 ? (
              <div className="profile-empty">
                <p>No orders yet.</p>
              </div>
            ) : (
              <div className="profile-orders">
                {myOrders.map(o => {
                  const items = (() => { try { return JSON.parse(o.items) } catch { return [] } })()
                  const statusInfo = {
                    PENDING_PAYMENT:  { color: '#e67e22', label: 'Pending', icon: '⏳' },
                    PAYMENT_FAILED:   { color: '#c0392b', label: 'Failed', icon: '✕' },
                    DEPOSIT_PAID:     { color: '#3498db', label: 'Deposit Paid', icon: '½' },
                    PAID:             { color: '#27ae60', label: 'Paid — Awaiting Acceptance', icon: '✓' },
                    ACCEPTED:         { color: '#3498db', label: 'Accepted by Farmer', icon: '👍' },
                    PROCESSING:       { color: '#9b59b6', label: 'Processing', icon: '🔪' },
                    READY:            { color: '#27ae60', label: 'Ready for Pickup!', icon: '📦' },
                    COMPLETED:        { color: '#7f8c8d', label: 'Completed', icon: '✅' },
                    SHIPPED:          { color: '#8e44ad', label: 'Shipped — Balance Due', icon: '📦' },
                  }[o.status] || { color: '#95a5a6', label: o.status, icon: '•' }
                  const canPayBalance = (o.status === 'DEPOSIT_PAID' || o.status === 'SHIPPED')
                    && o.remainingAmountCents > 0
                  const canConfirmReceipt = o.status === 'READY'
                  return (
                    <div key={o.id} className="profile-order-card">
                      <div className="profile-order-header">
                        <span className="profile-order-date">
                          {o.orderDate ? new Date(o.orderDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </span>
                        <span className="profile-order-status" style={{ color: statusInfo.color }}>
                          {statusInfo.icon} {statusInfo.label}
                        </span>
                      </div>
                      {items.length > 0 && (
                        <ul className="profile-order-items">
                          {items.map((it, i) => (
                            <li key={i}>{it.cutLabel || it.label || 'Cut'}{it.breed ? ` — ${it.breed}` : ''}</li>
                          ))}
                        </ul>
                      )}
                      <div className="profile-order-footer">
                        <span className="profile-order-total">
                          ${o.amountCents != null ? (o.amountCents / 100).toFixed(2) : o.totalAmount?.toFixed(2) || '0.00'}
                        </span>
                        {o.paidAt && (
                          <span className="profile-order-paid-at">
                            Paid {new Date(o.paidAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {canPayBalance && (
                        <button
                          className="profile-pay-balance-btn"
                          onClick={() => setBalanceOrder(o)}
                        >
                          Pay Remaining ${(o.remainingAmountCents / 100).toFixed(2)} →
                        </button>
                      )}
                      {canConfirmReceipt && (
                        <button
                          className="profile-order-action-btn"
                          onClick={() => handleConfirmReceipt(o.id)}
                          disabled={confirmingOrderId === o.id}
                        >
                          {confirmingOrderId === o.id ? 'Confirming...' : 'Confirm Receipt ✓'}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Notification Preferences ── */}
        <div className="profile-section">
          <div className="profile-section-header">
            <h2 className="profile-section-title">🔔 Notification Preferences</h2>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', marginBottom: '12px' }}>
            Choose which notifications you receive.
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {['ALL', 'IMPORTANT_ONLY'].map(opt => (
              <button
                key={opt}
                disabled={notifPrefLoading}
                className={`profile-date-btn${notifPref === opt ? ' profile-date-btn--active' : ''}`}
                style={notifPref === opt ? { background: '#f5c97a', color: '#1a0a00', fontWeight: 700, border: 'none' } : {}}
                onClick={() => notifPref !== opt && handleNotifPrefChange(opt)}
              >
                {opt === 'ALL' ? '🔔 All notifications' : '⭐ Important only'}
              </button>
            ))}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', marginTop: '8px' }}>
            Important: pool full, processing set, order complete.
          </p>
        </div>

        {/* ── Security ── */}
        <div className="profile-section profile-pw-section">
          <div className="profile-section-header">
            <h2 className="profile-section-title">Security</h2>
          </div>
          <form className="profile-pw-form" onSubmit={handleChangePassword}>
            <div className="login-field">
              <label>Current password</label>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={pwForm.currentPassword}
                onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
              />
            </div>
            <div className="profile-edit-row">
              <div className="login-field">
                <label>New password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={pwForm.newPassword}
                  onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                />
              </div>
              <div className="login-field">
                <label>Confirm new password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={pwForm.confirmNew}
                  onChange={e => setPwForm(f => ({ ...f, confirmNew: e.target.value }))}
                />
              </div>
            </div>
            <button type="submit" className="login-submit" disabled={pwLoading} style={{ marginTop: '8px' }}>
              {pwLoading ? 'Saving…' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* ── Danger zone ── */}
        <div className="profile-section profile-danger-zone">
          <div className="profile-section-header">
            <h2 className="profile-section-title">Account</h2>
          </div>
          <p className="profile-danger-desc">Permanently delete your account and all associated data. This cannot be undone.</p>
          {!deleteConfirm ? (
            <button className="profile-delete-btn" onClick={() => setDeleteConfirm(true)}>Delete Account</button>
          ) : (
            <div className="profile-delete-confirm">
              <p>Are you sure? This will permanently remove your account.</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button className="profile-delete-confirm-btn" onClick={handleDeleteAccount} disabled={deleteLoading}>
                  {deleteLoading ? 'Deleting…' : 'Yes, delete my account →'}
                </button>
                <button className="profile-date-btn" onClick={() => setDeleteConfirm(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>

      </div>
      {disputeClaim && (
        <DisputeModal claim={disputeClaim} onClose={() => setDisputeClaim(null)} />
      )}
      {balanceOrder && (
        <BalancePaymentModal
          order={balanceOrder}
          onSuccess={() => {
            setBalanceOrder(null)
            api.get('/api/orders/my').then(setMyOrders).catch(() => {})
          }}
          onClose={() => setBalanceOrder(null)}
        />
      )}
    </div>
  )
}
