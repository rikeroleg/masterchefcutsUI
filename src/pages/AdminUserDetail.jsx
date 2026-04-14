import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import '../styles/admin.css'

const STATUS_STYLE = {
  PAID:             { bg: '#e6f9ee', color: '#1a7a3a' },
  PENDING_PAYMENT:  { bg: '#fff4e0', color: '#b87a00' },
  PAYMENT_FAILED:   { bg: '#fde8e8', color: '#c0392b' },
}

export default function AdminUserDetail() {
  const { id } = useParams()
  const { user: me } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!me || me.role !== 'admin') { navigate('/'); return }
    api.get(`/api/admin/users/${id}`)
      .then(setData)
      .catch(() => navigate('/admin'))
      .finally(() => setLoading(false))
  }, [id, me])

  if (loading) return <div className="admin-page"><div className="admin-inner"><p>Loading…</p></div></div>
  if (!data) return null

  const u = data
  const orders = data.orders || []

  return (
    <div className="admin-page">
      <div className="admin-inner">
        <div style={{ marginBottom: '16px' }}>
          <Link to="/admin" className="aud-back">← Back to Admin</Link>
        </div>

        <div className="aud-header">
          <div className="aud-avatar">
            {(u.firstName?.[0] || '')}{(u.lastName?.[0] || '')}
          </div>
          <div>
            <h1 className="aud-name">{u.firstName} {u.lastName}</h1>
            <span className="aud-role" data-role={u.role}>{u.role}</span>
            {u.role === 'FARMER' && (
              <span className={`aud-status ${u.approved ? 'aud-status--ok' : 'aud-status--pending'}`}>
                {u.approved ? 'Approved' : 'Pending'}
              </span>
            )}
          </div>
        </div>

        {/* Contact & Address */}
        <div className="aud-grid">
          <div className="aud-card">
            <h3 className="aud-card-title">Contact</h3>
            <div className="aud-field"><label>Email</label><span>{u.email}</span></div>
            <div className="aud-field"><label>Phone</label><span>{u.phone || '—'}</span></div>
            <div className="aud-field"><label>Email Verified</label><span>{u.emailVerified ? 'Yes' : 'No'}</span></div>
            <div className="aud-field"><label>Notifications</label><span>{u.notificationPreference || '—'}</span></div>
          </div>

          <div className="aud-card">
            <h3 className="aud-card-title">Address</h3>
            <div className="aud-field"><label>Street</label><span>{u.street || '—'}</span></div>
            <div className="aud-field"><label>Apt</label><span>{u.apt || '—'}</span></div>
            <div className="aud-field"><label>City</label><span>{u.city || '—'}</span></div>
            <div className="aud-field"><label>State</label><span>{u.state || '—'}</span></div>
            <div className="aud-field"><label>ZIP</label><span>{u.zipCode || '—'}</span></div>
          </div>

          {u.role === 'FARMER' && u.shopName && (
            <div className="aud-card">
              <h3 className="aud-card-title">Shop</h3>
              <div className="aud-field"><label>Shop Name</label><span>{u.shopName}</span></div>
            </div>
          )}

          <div className="aud-card">
            <h3 className="aud-card-title">Financials</h3>
            <div className="aud-field"><label>Total Spent</label><span>${(u.totalSpent || 0).toFixed(2)}</span></div>
            <div className="aud-field"><label>Orders</label><span>{orders.length}</span></div>
          </div>
        </div>

        {/* Orders */}
        {orders.length > 0 && (
          <div className="aud-section">
            <h3 className="aud-section-title">Order History ({orders.length})</h3>
            <div className="aud-orders">
              {orders.map(o => {
                const st = STATUS_STYLE[o.status] || { bg: '#f0f0f0', color: '#333' }
                return (
                  <div key={o.id} className="aud-order-row">
                    <div className="aud-order-left">
                      <span className="aud-order-id">{o.id.slice(0, 8)}…</span>
                      <span className="aud-order-date">{o.orderDate || '—'}</span>
                    </div>
                    <div className="aud-order-right">
                      <span className="aud-order-amount">${((o.amountCents || 0) / 100).toFixed(2)}</span>
                      <span className="aud-order-status" style={{ background: st.bg, color: st.color }}>{o.status}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
