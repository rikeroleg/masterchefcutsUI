import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const ANIMAL_EMOJI = { BEEF: '🐄', PORK: '🐷', LAMB: '🐑', beef: '🐄', pork: '🐷', lamb: '🐑' }

const STATUS_INFO = {
  PENDING_PAYMENT: { label: 'Pending Payment',       icon: '⏳', color: '#e67e22' },
  PAYMENT_FAILED:  { label: 'Payment Failed',         icon: '✕',  color: '#c0392b' },
  PAID:            { label: 'Paid — Awaiting Acceptance', icon: '✓', color: '#27ae60' },
  ACCEPTED:        { label: 'Accepted by Farmer',     icon: '👍', color: '#3498db' },
  PROCESSING:      { label: 'Processing',             icon: '🔪', color: '#9b59b6' },
  READY:           { label: 'Ready for Pickup!',      icon: '📦', color: '#27ae60' },
  COMPLETED:       { label: 'Completed',              icon: '✅', color: '#7f8c8d' },
}

export default function OrderReceipt() {
  const { id }          = useParams()
  const { user }        = useAuth()
  const { toast }       = useToast()
  const navigate        = useNavigate()

  const [order, setOrder]               = useState(null)
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')
  const [confirming, setConfirming]     = useState(false)

  useEffect(() => {
    document.title = 'Order Receipt — MasterChef Cuts'
    if (!id) return
    api.get(`/api/orders/${id}`)
      .then(data => { setOrder(data); setLoading(false) })
      .catch(err  => { setError(err.message || 'Order not found.'); setLoading(false) })
  }, [id])

  async function handleConfirmPickup() {
    setConfirming(true)
    try {
      await api.post(`/api/orders/${id}/confirm-receipt`)
      const updated = await api.get(`/api/orders/${id}`)
      setOrder(updated)
      toast.success('Pickup confirmed — enjoy your meat!')
    } catch (err) {
      toast.error(err.message || 'Failed to confirm receipt.')
    } finally {
      setConfirming(false)
    }
  }

  if (!user) {
    return (
      <div className="receipt-page">
        <div className="receipt-unauth">
          <p>You must be signed in to view an order receipt.</p>
          <Link to="/login" className="hp-btn-primary">Sign In →</Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="receipt-page">
        <div className="receipt-loading">Loading order…</div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="receipt-page">
        <div className="receipt-error">
          <p>{error || 'Order not found.'}</p>
          <Link to="/profile" className="hp-btn-primary">Back to Profile →</Link>
        </div>
      </div>
    )
  }

  const items  = (() => { try { return JSON.parse(order.items) } catch { return [] } })()
  const status = STATUS_INFO[order.status?.toUpperCase()] || { label: order.status, icon: '•', color: '#95a5a6' }
  const total  = order.amountCents != null ? order.amountCents / 100 : (order.totalAmount || 0)
  const canConfirm = order.status?.toUpperCase() === 'READY'

  return (
    <div className="receipt-page">
      <div className="receipt-inner">

        {/* Back link */}
        <Link to="/profile" className="receipt-back">← Back to Profile</Link>

        {/* Header */}
        <div className="receipt-header">
          <div className="receipt-check">
            <span>{status.icon}</span>
          </div>
          <h1 className="receipt-title">Order Receipt</h1>
          <p className="receipt-order-id">Order #{id.slice(0, 8).toUpperCase()}</p>
          <span className="receipt-status-badge" style={{ color: status.color }}>
            {status.label}
          </span>
        </div>

        {/* Dates */}
        <div className="receipt-meta">
          {order.orderDate && (
            <div className="receipt-meta-item">
              <span className="receipt-meta-label">Order Date</span>
              <span className="receipt-meta-value">
                {new Date(order.orderDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          )}
          {order.paidAt && (
            <div className="receipt-meta-item">
              <span className="receipt-meta-label">Paid At</span>
              <span className="receipt-meta-value">
                {new Date(order.paidAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          )}
          {order.processingDate && (
            <div className="receipt-meta-item">
              <span className="receipt-meta-label">Processing Date</span>
              <span className="receipt-meta-value">
                {new Date(order.processingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          )}
          {order.farmerName && (
            <div className="receipt-meta-item">
              <span className="receipt-meta-label">From</span>
              <span className="receipt-meta-value">{order.farmerShopName || order.farmerName}</span>
            </div>
          )}
        </div>

        {/* Line items */}
        {items.length > 0 && (
          <div className="receipt-items">
            <div className="receipt-items-title">Your Cuts</div>
            {items.map((item, i) => {
              const emoji = ANIMAL_EMOJI[item.animalType] || ANIMAL_EMOJI[item.animal] || '🥩'
              const price = item.price ?? item.pricePerLb ?? 0
              return (
                <div key={i} className="receipt-item">
                  <span className="receipt-item-emoji">{emoji}</span>
                  <div className="receipt-item-info">
                    <div className="receipt-item-name">{item.cutLabel || item.label || 'Cut'}</div>
                    {item.breed && <div className="receipt-item-sub">{item.breed}</div>}
                  </div>
                  <div className="receipt-item-price">
                    {price > 0 ? `$${price.toFixed(2)}` : '—'}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Total */}
        <div className="receipt-total-row">
          <span className="receipt-total-label">Total Paid</span>
          <span className="receipt-total-value">${total.toFixed(2)}</span>
        </div>

        {/* Pickup progress tracker */}
        <div className="receipt-tracker">
          <div className="receipt-tracker-title">Order Progress</div>
          <div className="receipt-tracker-steps">
            {['PAID','ACCEPTED','PROCESSING','READY','COMPLETED'].map((s, i, arr) => {
              const statusOrder = ['PENDING_PAYMENT','PAYMENT_FAILED','PAID','ACCEPTED','PROCESSING','READY','COMPLETED']
              const currentIdx  = statusOrder.indexOf(order.status?.toUpperCase())
              const stepIdx     = statusOrder.indexOf(s)
              const done        = currentIdx >= stepIdx
              const active      = order.status?.toUpperCase() === s
              const info        = STATUS_INFO[s]
              return (
                <React.Fragment key={s}>
                  <div className={`receipt-tracker-step${done ? ' done' : ''}${active ? ' active' : ''}`}>
                    <div className="receipt-tracker-dot">{done ? '✓' : info.icon}</div>
                    <div className="receipt-tracker-label">{info.label}</div>
                  </div>
                  {i < arr.length - 1 && (
                    <div className={`receipt-tracker-line${done && currentIdx > stepIdx ? ' done' : ''}`} />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>

        {/* Confirm pickup CTA */}
        {canConfirm && (
          <div className="receipt-confirm-section">
            <p className="receipt-confirm-text">Your order is ready for pickup! Confirm once you&apos;ve collected your cuts.</p>
            <button
              className="receipt-confirm-btn"
              onClick={handleConfirmPickup}
              disabled={confirming}
            >
              {confirming ? 'Confirming…' : '📦 Confirm Pickup'}
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="receipt-actions">
          <Link to="/profile" className="receipt-action-link">View All Orders →</Link>
          <Link to="/listings" className="receipt-action-link">Browse More Animals →</Link>
        </div>

      </div>
    </div>
  )
}
