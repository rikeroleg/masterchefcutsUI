import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import '../styles/admin.css'

const ROLE_COLOR = { BUYER: '#2b00ec', FARMER: '#cc1a1a', ADMIN: '#faf8fa' }

export default function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab,        setTab]       = useState('stats')
  const [stats,      setStats]     = useState(null)
  const [users,      setUsers]     = useState([])
  const [listings,   setListings]  = useState([])
  const [disputes,   setDisputes]  = useState([])
  const [orders,     setOrders]    = useState([])
  const [resolutionText, setResolutionText] = useState({})
  const [refundingId,    setRefundingId]    = useState(null)
  const [refundReason,   setRefundReason]   = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [financials,      setFinancials]      = useState(null)
  const [financialOrders, setFinancialOrders] = useState([])
  const [finFrom,         setFinFrom]         = useState('')
  const [finTo,           setFinTo]           = useState('')
  const [finStatus,       setFinStatus]       = useState('ALL')
  const [finLoading,      setFinLoading]      = useState(false)
  const [adminComments,   setAdminComments]   = useState([])
  const [commentsPage,    setCommentsPage]    = useState(0)
  const [commentsHasMore, setCommentsHasMore] = useState(false)
  const [deletingCommentId, setDeletingCommentId] = useState(null)
  const [adminReviews,    setAdminReviews]    = useState([])
  const [reviewsPage,     setReviewsPage]     = useState(0)
  const [reviewsHasMore,  setReviewsHasMore]  = useState(false)
  const [togglingReviewId, setTogglingReviewId] = useState(null)
  const [deletingReviewId, setDeletingReviewId] = useState(null)
  const [adminSettings,   setAdminSettings]   = useState(null)
  const [togglingSettings, setTogglingSettings] = useState(false)

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return }
    loadStats()
    loadUsers()
    loadListings()
    loadAdminSettings()
  }, [user])

  async function loadAdminSettings() {
    try {
      const data = await api.get('/api/admin/settings')
      setAdminSettings(data)
    } catch { /* silent */ }
  }

  async function toggleOrderNotifications() {
    setTogglingSettings(true)
    try {
      const data = await api.post('/api/admin/settings/order-notifications/toggle')
      setAdminSettings(data)
    } catch (err) { setError(err.message || 'Failed to update setting') }
    setTogglingSettings(false)
  }

  async function loadComments(pg = 0) {
    try {
      const data = await api.get(`/api/admin/comments?page=${pg}&size=25`)
      if (pg === 0) setAdminComments(data.content || [])
      else setAdminComments(prev => [...prev, ...(data.content || [])])
      setCommentsPage(pg)
      setCommentsHasMore(data.hasNext || false)
    } catch (err) { setError(err.message || 'Failed to load comments') }
  }

  async function deleteAdminComment(id) {
    if (!window.confirm('Delete this comment?')) return
    setDeletingCommentId(id)
    try {
      await api.delete(`/api/admin/comments/${id}`)
      setAdminComments(prev => prev.filter(c => c.id !== id))
    } catch (err) { setError(err.message || 'Failed to delete comment') }
    setDeletingCommentId(null)
  }

  async function loadReviews(pg = 0) {
    try {
      const data = await api.get(`/api/admin/reviews?page=${pg}&size=25`)
      if (pg === 0) setAdminReviews(data.content || [])
      else setAdminReviews(prev => [...prev, ...(data.content || [])])
      setReviewsPage(pg)
      setReviewsHasMore(data.hasNext || false)
    } catch (err) { setError(err.message || 'Failed to load reviews') }
  }

  async function toggleReviewFeatured(id) {
    setTogglingReviewId(id)
    try {
      const updated = await api.patch(`/api/admin/reviews/${id}/featured`)
      setAdminReviews(prev => prev.map(r => r.id === id ? updated : r))
    } catch (err) { setError(err.message || 'Failed to toggle featured') }
    setTogglingReviewId(null)
  }

  async function deleteAdminReview(id) {
    if (!window.confirm('Delete this review?')) return
    setDeletingReviewId(id)
    try {
      await api.delete(`/api/admin/reviews/${id}`)
      setAdminReviews(prev => prev.filter(r => r.id !== id))
    } catch (err) { setError(err.message || 'Failed to delete review') }
    setDeletingReviewId(null)
  }

  async function loadStats() {
    try { setStats(await api.get('/api/admin/stats')) } catch {}
  }

  async function loadUsers() {
    try { setUsers(await api.get('/api/admin/users')) } catch {}
  }

  async function loadListings() {
    try { setListings(await api.get('/api/listings')) } catch {}
  }

  async function loadDisputes() {
    try { setDisputes(await api.get('/api/admin/disputes')) } catch {}
  }

  async function loadOrders() {
    try { setOrders(await api.get('/api/admin/orders')) } catch {}
  }

  async function loadFinancials() {
    setFinLoading(true)
    try {
      const params = new URLSearchParams()
      if (finFrom) params.set('from', finFrom)
      if (finTo)   params.set('to',   finTo)
      if (finStatus && finStatus !== 'ALL') params.set('status', finStatus)
      const [summary, orders] = await Promise.all([
        api.get(`/api/admin/financials/summary?${params}`),
        api.get(`/api/admin/financials/orders?${params}`),
      ])
      setFinancials(summary)
      setFinancialOrders(orders)
    } catch (err) { setError(err.message || 'Failed to load financials') }
    setFinLoading(false)
  }

  function exportCSV() {
    const headers = ['Order ID', 'Date', 'Status', 'Total ($)', 'Platform Fee ($)', 'Farmer Payout ($)', 'Buyer']
    const rows = financialOrders.map(o => [
      o.id,
      o.orderDate ? new Date(o.orderDate).toLocaleDateString() : '',
      o.status || '',
      (o.totalAmount || 0).toFixed(2),
      (o.platformFee || 0).toFixed(2),
      (o.farmerPayout || 0).toFixed(2),
      o.buyerName || o.participantId || '',
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `financials-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function issueRefund(orderId) {
    const reason = refundReason.trim() || 'Admin-initiated refund'
    setLoading(true)
    setError('')
    try {
      await api.post(`/api/admin/orders/${orderId}/refund`, { reason })
      setRefundingId(null)
      setRefundReason('')
      await loadOrders()
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  async function resolveDispute(id) {
    const resolution = (resolutionText[id] || '').trim()
    if (!resolution) return
    setLoading(true)
    try {
      await api.patch(`/api/admin/disputes/${id}/resolve`, { resolution })
      await loadDisputes()
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  async function approveFarmer(id) {
    setLoading(true)
    try {
      await api.patch(`/api/admin/users/${id}/approve`)
      await loadUsers()
      await loadStats()
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  async function rejectFarmer(id) {
    setLoading(true)
    try {
      await api.patch(`/api/admin/users/${id}/reject`)
      await loadUsers()
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  async function deleteListing(id) {
    if (!window.confirm('Remove this listing?')) return
    setLoading(true)
    try {
      await api.delete(`/api/admin/listings/${id}`)
      await loadListings()
      await loadStats()
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  const farmers = users.filter(u => u.role === 'FARMER')
  const pending = farmers.filter(u => !u.approved)
  const openDisputes = disputes.filter(d => d.status !== 'RESOLVED')

  return (
    <div className="admin-page">
      <div className="admin-inner">
        <div className="admin-header">
          <h1 className="admin-title">Admin Panel</h1>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {pending.length > 0 && (
              <span className="admin-badge">{pending.length} pending farmer{pending.length !== 1 ? 's' : ''}</span>
            )}
            {openDisputes.length > 0 && (
              <span className="admin-badge admin-badge--dispute">{openDisputes.length} open dispute{openDisputes.length !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>

        {error && <p className="admin-error">{error}</p>}

        <div className="admin-tabs">
          {['stats', 'users', 'listings', 'orders', 'disputes', 'financials', 'comments', 'reviews'].map(t => (
            <button
              key={t}
              className={`admin-tab${tab === t ? ' active' : ''}`}
              onClick={() => { setTab(t); if (t === 'orders') loadOrders(); if (t === 'financials') loadFinancials(); if (t === 'comments') loadComments(0); if (t === 'reviews') loadReviews(0) }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {t === 'users' && pending.length > 0 && <span className="admin-tab-dot" />}
              {t === 'disputes' && openDisputes.length > 0 && <span className="admin-tab-dot" />}
            </button>
          ))}
        </div>

        {/* ── Stats ── */}
        {tab === 'stats' && stats && (
          <>
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <strong>{stats.totalUsers}</strong><span>Total users</span>
            </div>
            <div className="admin-stat-card">
              <strong>{stats.totalListings}</strong><span>Total listings</span>
            </div>
            <div className="admin-stat-card">
              <strong>{stats.totalClaims}</strong><span>Total claims</span>
            </div>
            <div className="admin-stat-card admin-stat-card--warn">
              <strong>{stats.pendingFarmers}</strong><span>Pending farmers</span>
            </div>
          </div>

          {/* ── Admin Settings ── */}
          {adminSettings !== null && (
            <div className="admin-table-wrap" style={{ marginTop: '24px' }}>
              <p className="admin-section-label">⚙️ Notification Settings</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: 'rgba(0,0,0,0.12)', border: '1px solid rgba(0,0,0,0.2)', borderRadius: '10px' }}>
                <span style={{ flex: 1, fontSize: '0.88rem', color: 'rgba(20,6,0,0.75)' }}>
                  <strong>Admin order notifications</strong>
                  <span style={{ display: 'block', fontSize: '0.78rem', marginTop: '2px', color: 'rgba(20,6,0,0.5)' }}>
                    Receive an in-app notification when a new order is paid.
                  </span>
                </span>
                <button
                  onClick={toggleOrderNotifications}
                  disabled={togglingSettings}
                  style={{
                    padding: '7px 18px',
                    borderRadius: '20px',
                    border: 'none',
                    cursor: togglingSettings ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    background: adminSettings.adminOrderNotificationsEnabled ? '#27ae60' : 'rgba(0,0,0,0.25)',
                    color: '#fff',
                    opacity: togglingSettings ? 0.6 : 1,
                    transition: 'background 0.2s',
                  }}
                >
                  {adminSettings.adminOrderNotificationsEnabled ? '✓ On' : '✕ Off'}
                </button>
              </div>
            </div>
          )}
          </>
        )}

        {/* ── Users ── */}
        {tab === 'users' && (
          <div className="admin-table-wrap">
            {pending.length > 0 && (
              <div className="admin-pending-section">
                <p className="admin-section-label">⏳ Pending approval</p>
                {pending.map(u => (
                  <div key={u.id} className="admin-user-row admin-user-row--pending">
                    <div className="admin-user-info">
                      <Link to={`/admin/user/${u.id}`} className="admin-user-name admin-user-link">{u.firstName} {u.lastName}</Link>
                      <span className="admin-user-email">{u.email}</span>
                      <span className="admin-user-shop">{u.shopName}</span>
                      {u.licenseUrl && (
                        <a href={u.licenseUrl} target="_blank" rel="noopener noreferrer" className="admin-license-link">📄 View License</a>
                      )}
                    </div>
                    <div className="admin-user-actions">
                      <button className="admin-approve-btn" disabled={loading} onClick={() => approveFarmer(u.id)}>Approve</button>
                      <button className="admin-reject-btn"  disabled={loading} onClick={() => rejectFarmer(u.id)}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="admin-section-label">All users ({users.length})</p>
            <div className="admin-users-list">
              {users.map(u => (
                <div key={u.id} className="admin-user-row">
                  <div className="admin-user-info">
                    <Link to={`/admin/user/${u.id}`} className="admin-user-name admin-user-link">{u.firstName} {u.lastName}</Link>
                    <span className="admin-user-email">{u.email}</span>
                    <span className="admin-role-badge" style={{ background: ROLE_COLOR[u.role] + '22', color: ROLE_COLOR[u.role] }}>
                      {u.role}
                    </span>
                    {u.role === 'FARMER' && !u.approved && (
                      <span className="admin-pending-badge">Pending</span>
                    )}
                  </div>
                  {u.role === 'FARMER' && !u.approved && (
                    <button className="admin-approve-btn" disabled={loading} onClick={() => approveFarmer(u.id)}>Approve</button>
                  )}
                  {u.role === 'FARMER' && u.approved && (
                    <button className="admin-reject-btn" disabled={loading} onClick={() => rejectFarmer(u.id)}>Suspend</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Listings ── */}
        {tab === 'listings' && (
          <div className="admin-table-wrap">
            <p className="admin-section-label">All listings ({listings.length})</p>
            <div className="admin-listings-list">
              {listings.map(l => (
                <div key={l.id} className="admin-listing-row">
                  <div className="admin-listing-info">
                    <span className="admin-listing-title">{l.breed} {l.animalType}</span>
                    <span className="admin-listing-meta">{l.farmerShopName || l.farmerName} · ZIP {l.zipCode}</span>
                    <span className="admin-listing-status">{l.status}</span>
                  </div>
                  <button className="admin-delete-btn" disabled={loading} onClick={() => deleteListing(l.id)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Orders ── */}
        {tab === 'orders' && (
          <div className="admin-table-wrap">
            <p className="admin-section-label">All orders ({orders.length})</p>
            {orders.length === 0 && <p style={{ fontSize: '0.85rem', color: 'rgba(20,6,0,0.5)', margin: 0 }}>No orders yet.</p>}
            <div className="admin-orders-list">
              {orders.map(o => {
                const st = (o.status || '').toUpperCase()
                const refundable = ['PAID', 'ACCEPTED', 'PROCESSING', 'READY', 'COMPLETED'].includes(st)
                const isExpanding = refundingId === o.id
                return (
                  <div key={o.id} className="admin-order-row">
                    <div className="admin-order-info">
                      <span className={`admin-order-status admin-order-status--${st.toLowerCase()}`}>{st.replace('_', ' ')}</span>
                      <span className="admin-order-amount">${(o.totalAmount || 0).toFixed(2)}</span>
                      <span className="admin-order-meta">Buyer: {o.participantId}</span>
                      {o.orderDate && (
                        <span className="admin-order-meta">{new Date(o.orderDate).toLocaleDateString()}</span>
                      )}
                    </div>
                    {refundable && !isExpanding && (
                      <button
                        className="admin-refund-btn"
                        disabled={loading}
                        onClick={() => { setRefundingId(o.id); setRefundReason('') }}
                      >
                        Refund
                      </button>
                    )}
                    {isExpanding && (
                      <div className="admin-refund-form">
                        <textarea
                          className="admin-resolve-textarea"
                          placeholder="Reason for refund…"
                          rows={2}
                          value={refundReason}
                          onChange={e => setRefundReason(e.target.value)}
                        />
                        <div className="admin-refund-form-actions">
                          <button
                            className="admin-approve-btn"
                            disabled={loading}
                            onClick={() => issueRefund(o.id)}
                          >
                            Confirm Refund
                          </button>
                          <button
                            className="admin-delete-btn"
                            disabled={loading}
                            onClick={() => setRefundingId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Disputes ── */}
        {tab === 'disputes' && (
          <div className="admin-table-wrap">
            {openDisputes.length === 0 && disputes.filter(d => d.status === 'RESOLVED').length === 0 && (
              <p className="admin-section-label">No disputes submitted yet.</p>
            )}
            {openDisputes.length > 0 && (
              <>
                <p className="admin-section-label">⚠️ Open disputes ({openDisputes.length})</p>
                {openDisputes.map(d => (
                  <div key={d.id} className="admin-dispute-row">
                    <div className="admin-dispute-header">
                      <span className={`admin-dispute-type admin-dispute-type--${(d.type || 'other').toLowerCase()}`}>{d.type || 'OTHER'}</span>
                      <span className="admin-dispute-date">{d.createdAt ? new Date(d.createdAt).toLocaleDateString() : ''}</span>
                    </div>
                    <p className="admin-dispute-desc">{d.description}</p>
                    <div className="admin-dispute-meta">
                      <span>Buyer: {d.buyerName || d.buyerId}</span>
                      <span>Farmer: {d.farmerName || d.farmerId}</span>
                      {d.listingId && <span>Listing #{d.listingId}</span>}
                    </div>
                    <div className="admin-resolve-form">
                      <textarea
                        className="admin-resolve-textarea"
                        placeholder="Enter resolution notes…"
                        rows={2}
                        value={resolutionText[d.id] || ''}
                        onChange={e => setResolutionText(prev => ({ ...prev, [d.id]: e.target.value }))}
                      />
                      <button
                        className="admin-approve-btn"
                        disabled={loading || !(resolutionText[d.id] || '').trim()}
                        onClick={() => resolveDispute(d.id)}
                      >
                        Mark Resolved
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
            {disputes.filter(d => d.status === 'RESOLVED').length > 0 && (
              <>
                <p className="admin-section-label" style={{ marginTop: '20px' }}>Resolved disputes</p>
                {disputes.filter(d => d.status === 'RESOLVED').map(d => (
                  <div key={d.id} className="admin-dispute-row admin-dispute-row--resolved">
                    <div className="admin-dispute-header">
                      <span className={`admin-dispute-type admin-dispute-type--${(d.type || 'other').toLowerCase()}`}>{d.type || 'OTHER'}</span>
                      <span className="admin-resolved-badge">✓ Resolved</span>
                    </div>
                    <p className="admin-dispute-desc">{d.description}</p>
                    {d.resolution && <p className="admin-dispute-resolution">“{d.resolution}”</p>}
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ── Financials ── */}
        {tab === 'financials' && (
          <div className="admin-table-wrap">
            {/* Filter bar */}
            <div className="admin-fin-filters">
              <div className="admin-fin-filter-group">
                <label className="admin-section-label">From</label>
                <input type="date" className="admin-fin-input" value={finFrom} onChange={e => setFinFrom(e.target.value)} />
              </div>
              <div className="admin-fin-filter-group">
                <label className="admin-section-label">To</label>
                <input type="date" className="admin-fin-input" value={finTo} onChange={e => setFinTo(e.target.value)} />
              </div>
              <div className="admin-fin-filter-group">
                <label className="admin-section-label">Status</label>
                <select className="admin-fin-input" value={finStatus} onChange={e => setFinStatus(e.target.value)}>
                  <option value="ALL">All paid</option>
                  <option value="PAID">Paid</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="READY">Ready</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
              <button className="admin-approve-btn" onClick={loadFinancials} disabled={finLoading} style={{ alignSelf: 'flex-end' }}>
                {finLoading ? 'Loading…' : 'Apply'}
              </button>
              {financialOrders.length > 0 && (
                <button className="admin-fin-export-btn" onClick={exportCSV} style={{ alignSelf: 'flex-end' }}>
                  ↓ Export CSV
                </button>
              )}
            </div>

            {/* Revenue cards */}
            {financials && (
              <div className="admin-fin-cards">
                <div className="admin-fin-card">
                  <span className="admin-fin-card-value">${financials.totalRevenue.toFixed(2)}</span>
                  <span className="admin-fin-card-label">Total Revenue</span>
                </div>
                <div className="admin-fin-card admin-fin-card--fee">
                  <span className="admin-fin-card-value">${financials.platformFees.toFixed(2)}</span>
                  <span className="admin-fin-card-label">Platform Fees (15%)</span>
                </div>
                <div className="admin-fin-card admin-fin-card--payout">
                  <span className="admin-fin-card-value">${financials.farmerPayouts.toFixed(2)}</span>
                  <span className="admin-fin-card-label">Farmer Payouts (85%)</span>
                </div>
                <div className="admin-fin-card">
                  <span className="admin-fin-card-value">{financials.orderCount}</span>
                  <span className="admin-fin-card-label">Orders</span>
                </div>
              </div>
            )}

            {/* Orders table */}
            {financialOrders.length > 0 ? (
              <div className="admin-fin-table-wrap">
                <table className="admin-fin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Order ID</th>
                      <th>Status</th>
                      <th>Total</th>
                      <th>Fee (15%)</th>
                      <th>Payout (85%)</th>
                      <th>Buyer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financialOrders.map(o => (
                      <tr key={o.id}>
                        <td>{o.orderDate ? new Date(o.orderDate).toLocaleDateString() : '—'}</td>
                        <td className="admin-fin-id">{(o.id || '').slice(0, 8)}</td>
                        <td><span className={`admin-order-status admin-order-status--${(o.status || '').toLowerCase()}`}>{o.status}</span></td>

                        <td className="admin-fin-num">${(o.totalAmount || 0).toFixed(2)}</td>
                        <td className="admin-fin-num admin-fin-num--fee">${(o.platformFee || 0).toFixed(2)}</td>
                        <td className="admin-fin-num admin-fin-num--payout">${(o.farmerPayout || 0).toFixed(2)}</td>
                        <td className="admin-fin-buyer">{o.buyerName || (o.participantId || '').slice(0, 8)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              !finLoading && financials && (
                <p style={{ fontSize: '0.85rem', color: 'rgba(20,6,0,0.5)', margin: 0 }}>No orders match the selected filters.</p>
              )
            )}
            {!financials && !finLoading && (
              <p style={{ fontSize: '0.85rem', color: 'rgba(20,6,0,0.45)', margin: 0 }}>Select filters and click Apply to load financials.</p>
            )}
          </div>
        )}

        {/* ── Comments ── */}
        {tab === 'comments' && (
          <div className="admin-table-wrap">
            <p className="admin-section-label">All comments ({adminComments.length}{commentsHasMore ? '+' : ''})</p>
            {adminComments.length === 0 && <p style={{ fontSize: '0.85rem', color: 'rgba(20,6,0,0.5)', margin: 0 }}>No comments yet.</p>}
            <div className="admin-comments-list">
              {adminComments.map(c => (
                <div key={c.id} className="admin-comment-row">
                  <div className="admin-comment-info">
                    <span className="admin-comment-author">{c.authorName}</span>
                    <span className="admin-comment-listing">Listing #{c.listingId}</span>
                    <span className="admin-comment-date">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}</span>
                    <p className="admin-comment-body">{c.body}</p>
                  </div>
                  <button
                    className="admin-delete-btn"
                    disabled={deletingCommentId === c.id}
                    onClick={() => deleteAdminComment(c.id)}
                  >
                    {deletingCommentId === c.id ? '…' : 'Delete'}
                  </button>
                </div>
              ))}
            </div>
            {commentsHasMore && (
              <button className="admin-approve-btn" style={{ marginTop: '12px' }} onClick={() => loadComments(commentsPage + 1)}>
                Load more
              </button>
            )}
          </div>
        )}

        {/* ── Reviews ── */}
        {tab === 'reviews' && (
          <div className="admin-table-wrap">
            <p className="admin-section-label">All reviews ({adminReviews.length}{reviewsHasMore ? '+' : ''})</p>
            {adminReviews.length === 0 && <p style={{ fontSize: '0.85rem', color: 'rgba(20,6,0,0.5)', margin: 0 }}>No reviews yet.</p>}
            <div className="admin-comments-list">
              {adminReviews.map(r => (
                <div key={r.id} className="admin-comment-row">
                  <div className="admin-comment-info">
                    <span className="admin-comment-author">{r.buyerName}</span>
                    {r.animalType && <span className="admin-comment-listing">{r.animalType}</span>}
                    {r.farmerShopName && <span className="admin-comment-listing">@ {r.farmerShopName}</span>}
                    <span className="admin-comment-date">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</span>
                    <span style={{ color: '#f59e0b', fontSize: '0.85rem' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                    <p className="admin-comment-body">{r.comment && r.comment.length > 100 ? r.comment.slice(0, 100) + '…' : r.comment}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button
                      className={r.featured ? 'admin-approve-btn' : 'admin-reject-btn'}
                      disabled={togglingReviewId === r.id}
                      onClick={() => toggleReviewFeatured(r.id)}
                      title={r.featured ? 'Remove from featured' : 'Feature on homepage'}
                    >
                      {togglingReviewId === r.id ? '…' : r.featured ? '⭐ Featured' : '☆ Feature'}
                    </button>
                    <button
                      className="admin-delete-btn"
                      disabled={deletingReviewId === r.id}
                      onClick={() => deleteAdminReview(r.id)}
                    >
                      {deletingReviewId === r.id ? '…' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {reviewsHasMore && (
              <button className="admin-approve-btn" style={{ marginTop: '12px' }} onClick={() => loadReviews(reviewsPage + 1)}>
                Load more
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
