import React, { useState, useEffect, useRef } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { api } from '../api/client'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)

const STRIPE_APPEARANCE = {
  theme: 'flat',
  variables: {
    colorPrimary: '#b84a00',
    colorBackground: '#ffffff',
    colorText: '#1e0800',
    colorDanger: '#c0392b',
    fontFamily: 'inherit',
    borderRadius: '10px',
  },
}

function CartCheckoutForm({ items, amountCents, onSuccess, onCancel }) {
  const stripe   = useStripe()
  const elements = useElements()
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setError('')

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    })

    if (stripeError) {
      setError(stripeError.message)
      setLoading(false)
      return
    }

    if (paymentIntent?.status === 'succeeded') {
      onSuccess(paymentIntent.id)
    } else {
      setError('Payment did not complete. Please try again.')
      setLoading(false)
    }
  }

  const dollars = (amountCents / 100).toFixed(2)

  return (
    <form className="pm-form" onSubmit={handleSubmit}>
      <div className="pm-cart-lines">
        {items.map(item => (
          <div key={item.id} className="pm-cart-line">
            <span className="pm-cart-line-name">{item.name} &times; {item.qty}</span>
            <span className="pm-cart-line-price">${(item.price * item.qty).toLocaleString()}</span>
          </div>
        ))}
        <div className="pm-cart-total">
          <span>Total</span>
          <span>${dollars}</span>
        </div>
      </div>

      <PaymentElement />

      {error && <p className="pm-error">{error}</p>}

      <div className="pm-actions">
        <button type="button" className="pm-cancel-btn" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="pm-pay-btn" disabled={!stripe || loading}>
          {loading ? 'Processing…' : `Pay $${dollars}`}
        </button>
      </div>
    </form>
  )
}

export default function CartPaymentModal({ items, onSuccess, onClose }) {
  const [clientSecret, setClientSecret] = useState(null)
  const [amountCents,  setAmountCents]  = useState(0)
  const [error,        setError]        = useState('')
  const intentCreatedRef = useRef(false) // Prevent duplicate intent creation

  useEffect(() => {
    // Guard against duplicate calls (React StrictMode, rapid re-renders, etc.)
    if (intentCreatedRef.current) return
    
    const parsedCutIds = items.map(item => Number(item.cutId))
    const hasInvalidItem = parsedCutIds.some(id => !Number.isInteger(id) || id <= 0)
    const hasInvalidQty = items.some(item => Number(item.qty) !== 1)

    if (hasInvalidItem || hasInvalidQty) {
      setError('This checkout currently supports claimed listing cuts only. Remove non-claim items and set each quantity to 1.')
      return
    }

    const cutIds = parsedCutIds

    if (new Set(cutIds).size !== cutIds.length) {
      setError('Cart contains duplicate cuts. Please refresh your cart and try again.')
      return
    }

    // Mark as in-progress to prevent duplicate calls
    intentCreatedRef.current = true

    api.post('/api/payments/cart-intent', { cutIds })
      .then(res => {
        setClientSecret(res.clientSecret)
        setAmountCents(res.amountCents)
      })
      .catch(err => {
        setError(err.message || 'Could not initialize payment.')
        intentCreatedRef.current = false // Allow retry on error
      })
  }, [items])

  return (
    <div className="pm-overlay" onClick={onClose}>
      <div className="pm-modal" onClick={e => e.stopPropagation()}>
        <div className="pm-header">
          <div className="pm-header-info">
            <h2 className="pm-title">Complete Order</h2>
            <p className="pm-subtitle">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
          </div>
          <button className="pm-close-btn" onClick={onClose}>&times;</button>
        </div>

        {error && <p className="pm-error" style={{ padding: '0 24px 16px' }}>{error}</p>}

        {!clientSecret && !error && (
          <div className="pm-loading">Preparing payment\u2026</div>
        )}

        {clientSecret && (
          <Elements
            stripe={stripePromise}
            options={{ clientSecret, appearance: STRIPE_APPEARANCE }}
          >
            <CartCheckoutForm
              items={items}
              amountCents={amountCents}
              onSuccess={onSuccess}
              onCancel={onClose}
            />
          </Elements>
        )}
      </div>
    </div>
  )
}
