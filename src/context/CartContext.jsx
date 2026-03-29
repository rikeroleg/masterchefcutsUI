import React, { createContext, useContext, useState, useEffect } from 'react'

const noop = () => {}
const CartContext = createContext({
  items: [], addToCart: noop, removeFromCart: noop,
  updateQty: noop, clearCart: noop, totalItems: 0, totalPrice: 0,
})

export const cartBridge = { addToCart: noop }

export function CartProvider({ children }) {
  const [items, setItems] = useState([])

  function addToCart({ animal, cutId, name, color, price, qty }) {
    const id = `${animal}-${cutId}`
    setItems((prev) => {
      const existing = prev.find((i) => i.id === id)
      if (existing) {
        return prev.map((i) => i.id === id ? { ...i, qty: i.qty + qty } : i)
      }
      return [...prev, { id, animal, cutId, name, color, price, qty }]
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

  const totalItems = items.reduce((sum, i) => sum + i.qty, 0)
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.qty, 0)

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQty, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
