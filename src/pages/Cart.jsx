import React from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Trash2, ArrowLeft, Package } from 'lucide-react'
import { useCart } from '../context/CartContext'

const ANIMAL_INFO = {
  beef: { label: 'Beef', emoji: '🐄' },
  pork: { label: 'Pork', emoji: '🐷' },
  lamb: { label: 'Lamb', emoji: '🐑' },
}

export default function Cart() {
  const { items, removeFromCart, updateQty, totalPrice, clearCart } = useCart()

  if (items.length === 0) {
    return (
      <div className="cart-empty">
        <ShoppingCart size={64} color="rgba(255,255,255,0.12)" />
        <h2 className="cart-empty-title">Your cart is empty</h2>
        <p className="cart-empty-sub">Browse our premium cuts and add them to your order.</p>
        <Link to="/" className="cart-browse-btn">← Browse Cuts</Link>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <div className="cart-container">

        {/* Left — items list */}
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
              const animal = ANIMAL_INFO[item.animal] ?? { label: item.animal, emoji: '🥩' }
              const subtotal = item.price * item.qty
              return (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-accent" style={{ background: item.color }} />
                  <div className="cart-item-body">
                    <div className="cart-item-top">
                      <div className="cart-item-info">
                        <span className="cart-item-animal">{animal.emoji} {animal.label}</span>
                        <h3 className="cart-item-name" style={{ color: item.color }}>{item.name}</h3>
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
                        <button className="cart-qty-btn" onClick={() => updateQty(item.id, item.qty - 1)}>−</button>
                        <span className="cart-qty-val">{item.qty}</span>
                        <button className="cart-qty-btn" onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
                      </div>
                      <span className="cart-item-subtotal" style={{ color: item.color }}>
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

        {/* Right — order summary */}
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
                    <span style={{ color: item.color }}>●</span> {item.name} × {item.qty}
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

            <button className="cart-checkout-btn">
              Place Order — ${totalPrice.toLocaleString()}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
