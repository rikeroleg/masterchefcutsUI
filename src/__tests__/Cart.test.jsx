import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Cart from '../pages/Cart'

vi.mock('../context/CartContext', () => ({
  useCart: vi.fn(),
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../Components/CartPaymentModal', () => ({
  default: () => <div data-testid="payment-modal" />,
}))

// Suppress CSS import errors in jsdom
vi.mock('../styles/cart.css', () => ({}))

import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

const ITEM = {
  id: 'beef-1', animal: 'beef', cutId: '1', name: 'Ribeye', color: '#b00',
  price: 50, qty: 1, listingId: 'listing-1', breed: 'Angus', sourceFarm: 'Green Farm',
}

function renderCart() {
  return render(
    <MemoryRouter>
      <Cart />
    </MemoryRouter>
  )
}

describe('Cart – checkout button address guard', () => {
  it('disables button and shows prompt when user has no address', () => {
    useCart.mockReturnValue({
      items: [ITEM], removeFromCart: vi.fn(), removeItems: vi.fn(),
      updateQty: vi.fn(), totalPrice: 50, clearCart: vi.fn(),
    })
    useAuth.mockReturnValue({ user: { street: '', city: '', state: '' } })

    renderCart()
    const btn = screen.getByRole('button', { name: /add address to checkout/i })
    expect(btn).toBeDisabled()
  })

  it('disables button and shows prompt when address is incomplete (missing city)', () => {
    useCart.mockReturnValue({
      items: [ITEM], removeFromCart: vi.fn(), removeItems: vi.fn(),
      updateQty: vi.fn(), totalPrice: 50, clearCart: vi.fn(),
    })
    useAuth.mockReturnValue({ user: { street: '123 Main St', city: '', state: 'CO' } })

    renderCart()
    const btn = screen.getByRole('button', { name: /add address to checkout/i })
    expect(btn).toBeDisabled()
  })

  it('enables button and shows total when address is complete', () => {
    useCart.mockReturnValue({
      items: [ITEM], removeFromCart: vi.fn(), removeItems: vi.fn(),
      updateQty: vi.fn(), totalPrice: 50, clearCart: vi.fn(),
    })
    useAuth.mockReturnValue({
      user: { street: '123 Main St', city: 'Denver', state: 'CO', zipCode: '80201' },
    })

    renderCart()
    const btn = screen.getByRole('button', { name: /place order/i })
    expect(btn).not.toBeDisabled()
  })

  it('shows "no address on file" message when all address fields are empty', () => {
    useCart.mockReturnValue({
      items: [ITEM], removeFromCart: vi.fn(), removeItems: vi.fn(),
      updateQty: vi.fn(), totalPrice: 50, clearCart: vi.fn(),
    })
    useAuth.mockReturnValue({ user: { street: '', city: '', state: '' } })

    renderCart()
    expect(screen.getByText(/no address on file/i)).toBeInTheDocument()
  })

  it('shows required-fields warning when street is present but city/state missing', () => {
    useCart.mockReturnValue({
      items: [ITEM], removeFromCart: vi.fn(), removeItems: vi.fn(),
      updateQty: vi.fn(), totalPrice: 50, clearCart: vi.fn(),
    })
    useAuth.mockReturnValue({ user: { street: '123 Main St', city: '', state: '' } })

    renderCart()
    expect(screen.getByText(/street, city, and state are required/i)).toBeInTheDocument()
  })
})
