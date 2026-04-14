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

function CheckoutForm({ cutLabel, amountCents, onSuccess, onCancel }) {
  const stripe   = useStripe()
  const elements = useElements()
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)

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
      <div className="pm-cut-summary">
        <span className="pm-cut-name">{cutLabel}</span>
        <span className="pm-cut-amount">${dollars}</span>
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

export default function PaymentModal({ listing, cutLabel, onSuccess, onClose }) {
  const [clientSecret, setClientSecret] = useState(null)
  const [amountCents,  setAmountCents]  = useState(0)
  const [error,        setError]        = useState('')

  useEffect(() => {
    api.post('/api/payments/intent', { listingId: listing.id, cutLabel })
      .then(res => {
        setClientSecret(res.clientSecret)
        setAmountCents(res.amountCents)
      })
      .catch(err => setError(err.message || 'Could not initialize payment.'))
  }, [listing.id, cutLabel])

  return (
    <div className="pm-overlay" onClick={onClose}>
      <div className="pm-modal" onClick={e => e.stopPropagation()}>
        <div className="pm-header">
          <div className="pm-header-info">
            <h2 className="pm-title">Claim Cut</h2>
            <p className="pm-subtitle">{listing.breed} {listing.animalType} · {listing.farmerShopName || listing.farmerName}</p>
          </div>
          <button className="pm-close-btn" onClick={onClose}>✕</button>
        </div>

        {error && <p className="pm-error" style={{ padding: '0 24px 16px' }}>{error}</p>}

        {!clientSecret && !error && (
          <div className="pm-loading">Preparing payment…</div>
        )}

        {clientSecret && (
          <Elements
            stripe={stripePromise}
            options={{ clientSecret, appearance: STRIPE_APPEARANCE }}
          >
            <CheckoutForm
              cutLabel={cutLabel}
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
