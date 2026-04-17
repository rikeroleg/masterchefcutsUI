import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider, useAuth } from '../context/AuthContext'

// Mock the api client
vi.mock('../api/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
  },
}))

// Mock CartContext bridge
vi.mock('../context/CartContext', () => ({
  cartClearBridge: { clearCart: vi.fn() },
  useCart: vi.fn(() => ({ items: [], clearCart: vi.fn() })),
}))

import { api } from '../api/client'

// Helper: renders AuthProvider and exposes auth context via callback
function renderAuth(onContext) {
  function Consumer() {
    onContext(useAuth())
    return null
  }
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    </MemoryRouter>
  )
}

const MOCK_USER_RESPONSE = {
  id: 1, firstName: 'Jane', lastName: 'Doe', email: 'jane@test.com',
  role: 'BUYER', approved: true, shopName: '', street: '', apt: '',
  city: '', state: '', zipCode: '', bio: '', certifications: '',
  stripeAccountId: null, stripeOnboardingComplete: false, licenseUrl: null, rejectionReason: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

// ─── updateUser ────────────────────────────────────────────────────────────

describe('updateUser', () => {
  it('omits blank street, city, and state from the PATCH payload', async () => {
    api.patch.mockResolvedValue(MOCK_USER_RESPONSE)
    let auth
    renderAuth(ctx => { auth = ctx })

    await act(async () => {
      await auth.updateUser({ name: 'Jane Doe', street: '', city: '', state: '' })
    })

    const [, payload] = api.patch.mock.calls[0]
    expect(payload).not.toHaveProperty('street')
    expect(payload).not.toHaveProperty('city')
    expect(payload).not.toHaveProperty('state')
  })

  it('omits whitespace-only street, city, state', async () => {
    api.patch.mockResolvedValue(MOCK_USER_RESPONSE)
    let auth
    renderAuth(ctx => { auth = ctx })

    await act(async () => {
      await auth.updateUser({ street: '   ', city: '   ', state: '   ' })
    })

    const [, payload] = api.patch.mock.calls[0]
    expect(payload).not.toHaveProperty('street')
    expect(payload).not.toHaveProperty('city')
    expect(payload).not.toHaveProperty('state')
  })

  it('includes non-blank address fields in the payload', async () => {
    api.patch.mockResolvedValue({ ...MOCK_USER_RESPONSE, street: '123 Main St', city: 'Denver', state: 'CO' })
    let auth
    renderAuth(ctx => { auth = ctx })

    await act(async () => {
      await auth.updateUser({ street: '123 Main St', city: 'Denver', state: 'CO' })
    })

    const [, payload] = api.patch.mock.calls[0]
    expect(payload.street).toBe('123 Main St')
    expect(payload.city).toBe('Denver')
    expect(payload.state).toBe('CO')
  })
})

// ─── register ──────────────────────────────────────────────────────────────

describe('register', () => {
  it('omits blank street, city, and state from the POST payload', async () => {
    api.post.mockResolvedValue({ verify: true })
    let auth
    renderAuth(ctx => { auth = ctx })

    await act(async () => {
      await auth.register({
        name: 'Jane Doe', email: 'jane@test.com', password: 'Pass1234!',
        role: 'buyer', street: '', city: '', state: '',
      })
    })

    const [, payload] = api.post.mock.calls[0]
    expect(payload).not.toHaveProperty('street')
    expect(payload).not.toHaveProperty('city')
    expect(payload).not.toHaveProperty('state')
  })

  it('omits undefined address fields from the POST payload', async () => {
    api.post.mockResolvedValue({ verify: true })
    let auth
    renderAuth(ctx => { auth = ctx })

    await act(async () => {
      await auth.register({
        name: 'Jane Doe', email: 'jane@test.com', password: 'Pass1234!', role: 'buyer',
      })
    })

    const [, payload] = api.post.mock.calls[0]
    expect(payload).not.toHaveProperty('street')
    expect(payload).not.toHaveProperty('city')
    expect(payload).not.toHaveProperty('state')
  })

  it('includes non-blank address fields in the POST payload', async () => {
    api.post.mockResolvedValue({ verify: true })
    let auth
    renderAuth(ctx => { auth = ctx })

    await act(async () => {
      await auth.register({
        name: 'Jane Doe', email: 'jane@test.com', password: 'Pass1234!',
        role: 'buyer', street: '456 Farm Rd', city: 'Boulder', state: 'CO',
      })
    })

    const [, payload] = api.post.mock.calls[0]
    expect(payload.street).toBe('456 Farm Rd')
    expect(payload.city).toBe('Boulder')
    expect(payload.state).toBe('CO')
  })
})
