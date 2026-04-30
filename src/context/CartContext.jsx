import React, { createContext, useContext, useState, useEffect } from 'react'

const noop = () => {}
const CartContext = createContext({
  items: [], addToCart: noop, removeFromCart: noop, removeItems: noop,
  updateQty: noop, clearCart: noop, totalItems: 0, totalPrice: 0,
})

export const cartBridge = { addToCart: noop }
export const cartClearBridge = { clearCart: noop }
export const shopBridge = { openRequestModal: noop }

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      if (!localStorage.getItem('mc_user')) return []
      const stored = localStorage.getItem('mc_cart')
      return stored ? JSON.parse(stored) : []
    } catch (_) { return [] }
  })

  React.useEffect(() => {
    try { localStorage.setItem('mc_cart', JSON.stringify(items)) } catch (_) {}
  }, [items])

  // Sync cart across tabs via storage event
  React.useEffect(() => {
    function handleStorage(e) {
      if (e.key !== 'mc_cart') return
      try {
        const next = e.newValue ? JSON.parse(e.newValue) : []
        setItems(next)
      } catch (_) {}
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  function addToCart({ animal, cutId, name, color, price, qty, listingId, breed, sourceFarm }) {
    const id = `${animal}-${cutId}`
    setItems((prev) => {
      const existing = prev.find((i) => i.id === id)
      if (existing) {
        return prev.map((i) => i.id === id ? { ...i, qty: i.qty + qty } : i)
      }
      return [...prev, { id, animal, cutId, name, color, price, qty, listingId, breed, sourceFarm }]
    })
  }

  useEffect(() => {
    cartBridge.addToCart = addToCart
  })

  function removeFromCart(id) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  function updateQty(id, qty) {
    if (qty < 1) { removeFromCart(id); return }
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, qty } : i))
  }

  function clearCart() {
    setItems([])
  }

  useEffect(() => {
    cartClearBridge.clearCart = clearCart
  })

  function removeItems(ids) {
    setItems((prev) => prev.filter((i) => !ids.includes(i.id)))
  }

  const totalItems = items.reduce((sum, i) => sum + i.qty, 0)
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.qty, 0)

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, removeItems, updateQty, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
