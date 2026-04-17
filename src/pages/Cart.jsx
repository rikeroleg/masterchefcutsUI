import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ShoppingCart, Trash2, ArrowLeft, Package } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import CartPaymentModal from '../Components/CartPaymentModal'
import '../styles/cart.css'

const ANIMAL_INFO = {
  beef: { label: 'Beef',  emoji: '\uD83D\uDC04' },
  pork: { label: 'Pork',  emoji: '\uD83D\uDC37' },
  lamb: { label: 'Lamb',  emoji: '\uD83D\uDC11' },
}

export default function Cart() {
  const { items, removeFromCart, removeItems, updateQty, totalPrice, clearCart } = useCart()
  const { user } = useAuth()
  const location = useLocation()
  const selectListingId = location.state?.selectListingId
  
  const [paying, setPaying]         = useState(false)
  const [confirmed, setConfirmed]   = useState(false)
  const [selected, setSelected]     = useState(() => new Set(items.map(i => i.id)))
  const [initialFilterApplied, setInitialFilterApplied] = useState(false)
  const [checkoutInProgress, setCheckoutInProgress] = useState(false) // Prevent double-clicks

  // Apply initial filter for selectListingId from Profile navigation
  React.useEffect(() => {
    if (selectListingId && !initialFilterApplied && items.length > 0) {
      const matchingIds = items.filter(i => i.listingId === selectListingId).map(i => i.id)
      if (matchingIds.length > 0) {
        setSelected(new Set(matchingIds))
        setInitialFilterApplied(true)
      }
    }
  }, [selectListingId, items, initialFilterApplied])

  // Keep selected set in sync when items change (remove deleted items)
  React.useEffect(() => {
    setSelected(prev => {
      const ids = new Set(items.map(i => i.id))
      return new Set([...prev].filter(id => ids.has(id)))
    })
  }, [items])

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  function toggleAll() {
    if (selected.size === items.length) setSelected(new Set())
    else setSelected(new Set(items.map(i => i.id)))
  }

  const selectedItems = items.filter(i => selected.has(i.id))
  const selectedTotal = selectedItems.reduce((s, i) => s + i.price * i.qty, 0)

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

          <div className="cart-select-all-row">
            <label className="cart-checkbox-label">
              <input type="checkbox" checked={selected.size === items.length && items.length > 0} onChange={toggleAll} />
              <span>Select all</span>
            </label>
          </div>

          <div className="cart-items">
            {items.map((item) => {
              const animal  = ANIMAL_INFO[item.animal] ?? { label: item.animal, emoji: '\uD83E\uDD69' }
              const isClaimCut = Number.isInteger(Number(item.cutId)) && Number(item.cutId) > 0
              const subtotal = item.price * item.qty
              const checked = selected.has(item.id)
              return (
                <div key={item.id} className={`cart-item${checked ? '' : ' cart-item--dim'}`}>
                  <div className="cart-item-accent" style={{ background: item.color }} />
                  <div className="cart-item-body">
                    <div className="cart-item-top">
                      <label className="cart-item-check">
                        <input type="checkbox" checked={checked} onChange={() => toggleSelect(item.id)} />
                      </label>
                      <div className="cart-item-info">
                        <span className="cart-item-animal">{animal.emoji} {animal.label}</span>
                        <h3 className="cart-item-name">{item.name}</h3>
                        {item.breed && (
                          <span className="cart-item-listing">{item.breed}{item.sourceFarm ? ` \u00b7 ${item.sourceFarm}` : ''}</span>
                        )}
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

            {selectedItems.length === 0 ? (
              <p className="cart-summary-empty">Select items to checkout</p>
            ) : (
              <>
                <div className="cart-summary-lines">
                  {selectedItems.map((item) => (
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
                  <span className="cart-summary-total-val">${selectedTotal.toLocaleString()}</span>
                </div>

                {/* Delivery address snapshot */}
                {(() => {
                  const street = user?.street
                    ? (user.apt ? `${user.street}, ${user.apt}` : user.street)
                    : null
                  const cityState = [user?.city, user?.state].filter(Boolean).join(', ') || null
                  const zip = user?.zipCode || null
                  const parts = [street, cityState, zip].filter(Boolean)
                  const addressComplete = user?.street?.trim() && user?.city?.trim() && user?.state?.trim()
                  return (
                    <div className="cart-delivery-address">
                      <div className="cart-delivery-label">
                        📍 Delivering to
                        <Link to="/profile" className="cart-delivery-edit">Edit →</Link>
                      </div>
                      {parts.length > 0 ? (
                        <div className="cart-delivery-value">
                          {parts.map((p, i) => <span key={i}>{p}</span>)}
                        </div>
                      ) : (
                        <p className="cart-delivery-missing">
                          No address on file —{' '}
                          <Link to="/profile" className="cart-delivery-edit">add one in your profile</Link>
                        </p>
                      )}
                      {!addressComplete && parts.length > 0 && (
                        <p className="cart-delivery-missing">
                          Street, city, and state are required —{' '}
                          <Link to="/profile" className="cart-delivery-edit">update your profile</Link>
                        </p>
                      )}
                    </div>
                  )
                })()}

                <button 
                  className="cart-checkout-btn" 
                  onClick={() => { setCheckoutInProgress(true); setPaying(true) }}
                  disabled={checkoutInProgress || !(user?.street?.trim() && user?.city?.trim() && user?.state?.trim())}
                >
                  {checkoutInProgress 
                    ? 'Opening checkout…'
                    : !(user?.street?.trim() && user?.city?.trim() && user?.state?.trim())
                      ? 'Add address to checkout'
                      : `Place Order \u2014 $${selectedTotal.toLocaleString()}`}
                </button>
              </>
            )}
          </div>
        </div>

      </div>

      {paying && (
        <CartPaymentModal
          items={selectedItems}
          onSuccess={() => { removeItems(selectedItems.map(i => i.id)); setPaying(false); setConfirmed(true); setCheckoutInProgress(false) }}
          onClose={() => { setPaying(false); setCheckoutInProgress(false) }}
        />
      )}
    </div>
  )
}
