import React, { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { api } from '../api/client'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)

const STRIPE_APPEARANCE = {
  theme: 'night',
  variables: {
    colorPrimary: '#f39c12',
    colorBackground: '#0e0e16',
    colorText: '#ffffff',
    colorDanger: '#e74c3c',
    fontFamily: 'inherit',
    borderRadius: '10px',
  },
}

function CartCheckoutForm({ items, totalPrice, amountCents, onSuccess, onCancel }) {
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
          <span>${totalPrice.toLocaleString()}</span>
        </div>
      </div>

      <PaymentElement />

      {error && <p className="pm-error">{error}</p>}

      <div className="pm-actions">
        <button type="button" className="pm-cancel-btn" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="pm-pay-btn" disabled={!stripe || loading}>
          {loading ? 'Processing\u2026' : `Pay $${dollars}`}
        </button>
      </div>
    </form>
  )
}

export default function CartPaymentModal({ items, totalPrice, onSuccess, onClose }) {
  const [clientSecret, setClientSecret] = useState(null)
  const [amountCents,  setAmountCents]  = useState(0)
  const [error,        setError]        = useState('')

  useEffect(() => {
    const cents = Math.round(totalPrice * 100)
    api.post('/api/payments/cart-intent', { amountCents: cents })
      .then(res => {
        setClientSecret(res.clientSecret)
        setAmountCents(res.amountCents)
      })
      .catch(err => setError(err.message || 'Could not initialize payment.'))
  }, [totalPrice])

  return (
    <div className="pm-overlay" onClick={onClose}>
      <div className="pm-modal" onClick={e => e.stopPropagation()}>
        <div className="pm-header">
          <div className="pm-header-info">
            <h2 className="pm-title">Complete Order</h2>
            <p className="pm-subtitle">{items.length} {items.length === 1 ? 'item' : 'items'} &mdash; whole animal purchase</p>
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
              totalPrice={totalPrice}
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
