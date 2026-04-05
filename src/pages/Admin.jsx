import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import '../styles/admin.css'

const ROLE_COLOR = { BUYER: '#3498db', FARMER: '#27ae60', ADMIN: '#9b59b6' }

export default function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab,        setTab]       = useState('stats')
  const [stats,      setStats]     = useState(null)
  const [users,      setUsers]     = useState([])
  const [listings,   setListings]  = useState([])
  const [disputes,   setDisputes]  = useState([])
  const [resolutionText, setResolutionText] = useState({})
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return }
    loadStats()
    loadUsers()
    loadListings()
    loadDisputes()
  }, [user])

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
          {['stats', 'users', 'listings', 'disputes'].map(t => (
            <button key={t} className={`admin-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {t === 'users' && pending.length > 0 && <span className="admin-tab-dot" />}
              {t === 'disputes' && openDisputes.length > 0 && <span className="admin-tab-dot" />}
            </button>
          ))}
        </div>

        {/* ── Stats ── */}
        {tab === 'stats' && stats && (
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
                      <span className="admin-user-name">{u.firstName} {u.lastName}</span>
                      <span className="admin-user-email">{u.email}</span>
                      <span className="admin-user-shop">{u.shopName}</span>
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
                    <span className="admin-user-name">{u.firstName} {u.lastName}</span>
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

      </div>
    </div>
  )
}
