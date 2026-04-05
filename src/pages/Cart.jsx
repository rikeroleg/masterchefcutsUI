import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Trash2, ArrowLeft, Package } from 'lucide-react'
import { useCart } from '../context/CartContext'
import CartPaymentModal from '../components/CartPaymentModal'
import '../styles/cart.css'

const ANIMAL_INFO = {
  beef: { label: 'Beef',  emoji: '\uD83D\uDC04' },
  pork: { label: 'Pork',  emoji: '\uD83D\uDC37' },
  lamb: { label: 'Lamb',  emoji: '\uD83D\uDC11' },
}

export default function Cart() {
  const { items, removeFromCart, updateQty, totalPrice, clearCart } = useCart()
  const [paying, setPaying]     = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  if (confirmed) {
    return (
      <div className="cart-page">
        <div className="cart-confirmed">
          <div className="cart-confirmed-icon">&#10003;</div>
          <h2>Order placed!</h2>
          <p>Your payment was processed successfully. We&apos;ll be in touch shortly to coordinate delivery.</p>
          <Link to="/" className="cart-browse-btn">&#8592; Continue Shopping</Link>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-empty">
          <ShoppingCart size={64} color="rgba(255,255,255,0.12)" />
          <h2 className="cart-empty-title">Your cart is empty</h2>
          <p className="cart-empty-sub">Browse our premium cuts and add them to your order.</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/listings" className="cart-browse-btn">&#8592; Browse Listings</Link>
            <Link to="/shop" className="cart-browse-btn">Browse Shop →</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <div className="cart-container">

        {/* Left - items list */}
        <div className="cart-items-col">
          <div className="cart-heading-row">
            <h1 className="cart-title">
              <ShoppingCart size={24} style={{ verticalAlign: 'middle', marginRight: 10, opacity: 0.8 }} />
              Your Cart
            </h1>
            <span className="cart-count">{items.length} {items.length === 1 ? 'cut' : 'cuts'}</span>
          </div>

          <div className="cart-items">
            {items.map((item) => {
              const animal  = ANIMAL_INFO[item.animal] ?? { label: item.animal, emoji: '\uD83E\uDD69' }
              const isClaimCut = Number.isInteger(Number(item.cutId)) && Number(item.cutId) > 0
              const subtotal = item.price * item.qty
              return (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-accent" style={{ background: item.color }} />
                  <div className="cart-item-body">
                    <div className="cart-item-top">
                      <div className="cart-item-info">
                        <span className="cart-item-animal">{animal.emoji} {animal.label}</span>
                        <h3 className="cart-item-name">{item.name}</h3>
                        <span className="cart-item-unit-price">${item.price.toLocaleString()} / cut</span>
                      </div>
                      <button
                        className="cart-item-remove"
                        onClick={() => removeFromCart(item.id)}
                        aria-label="Remove item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="cart-item-bottom">
                      <div className="cart-item-qty">
                        <button
                          className="cart-qty-btn"
                          onClick={() => updateQty(item.id, isClaimCut ? Math.max(1, item.qty - 1) : item.qty - 1)}
                          disabled={isClaimCut ? item.qty <= 1 : false}
                        >&#8722;</button>
                        <span className="cart-qty-val">{item.qty}</span>
                        <button
                          className="cart-qty-btn"
                          onClick={() => updateQty(item.id, item.qty + 1)}
                          disabled={isClaimCut}
                        >+</button>
                      </div>
                      <span className="cart-item-subtotal">
                        ${subtotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="cart-actions-row">
            <Link to="/" className="cart-continue-link">
              <ArrowLeft size={14} style={{ marginRight: 6 }} />
              Continue Shopping
            </Link>
            <button className="cart-clear-link" onClick={clearCart}>Clear Cart</button>
          </div>
        </div>

        {/* Right - order summary */}
        <div className="cart-summary-col">
          <div className="cart-summary">
            <h2 className="cart-summary-title">
              <Package size={17} style={{ marginRight: 8, verticalAlign: 'middle', opacity: 0.7 }} />
              Order Summary
            </h2>

            <div className="cart-summary-lines">
              {items.map((item) => (
                <div key={item.id} className="cart-summary-line">
                  <span className="cart-summary-name">
                    <span className="cart-summary-dot" style={{ background: item.color }} /> {item.name} &times; {item.qty}
                  </span>
                  <span className="cart-summary-val">${(item.price * item.qty).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="cart-summary-divider" />

            <div className="cart-summary-total-row">
              <span className="cart-summary-total-label">Total</span>
              <span className="cart-summary-total-val">${totalPrice.toLocaleString()}</span>
            </div>

            <button className="cart-checkout-btn" onClick={() => setPaying(true)}>
              Place Order &#8212; ${totalPrice.toLocaleString()}
            </button>
          </div>
        </div>

      </div>

      {paying && (
        <CartPaymentModal
          items={items}
          onSuccess={() => { clearCart(); setPaying(false); setConfirmed(true) }}
          onClose={() => setPaying(false)}
        />
      )}
    </div>
  )
}
