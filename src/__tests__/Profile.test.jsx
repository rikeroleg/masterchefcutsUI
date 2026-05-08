import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../api/client', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../context/ToastContext', () => ({
  useToast: vi.fn(),
}))

vi.mock('../context/CartContext', () => ({
  useCart: vi.fn(),
}))

vi.mock('../Components/DisputeModal', () => ({
  default: () => null,
}))

vi.mock('../utils/index', () => ({
  useFavorites: vi.fn(() => ({ favorites: [], toggle: vi.fn(), isFav: vi.fn(() => false) })),
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => vi.fn() }
})

import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useCart } from '../context/CartContext'

const TOAST = { success: vi.fn(), error: vi.fn(), info: vi.fn() }
const BUYER_USER = {
  id: 'buyer-1', name: 'Jane Doe', role: 'buyer',
  approved: true, stripeOnboardingComplete: false,
  notificationPreference: 'ALL', emailPreference: 'ALL',
  joinedAt: '2025-01-15T00:00:00Z',
}

function renderProfile(user = BUYER_USER) {
  useAuth.mockReturnValue({
    user,
    logout: vi.fn(),
    updateUser: vi.fn(),
    refreshConnectStatus: vi.fn(() => Promise.resolve()),
  })
  useToast.mockReturnValue({ toast: TOAST })
  useCart.mockReturnValue({ addToCart: vi.fn(), items: [] })
  api.get.mockResolvedValue([])
  api.patch.mockResolvedValue({})

  return render(<MemoryRouter><Profile /></MemoryRouter>)
}

import Profile from '../pages/Profile'

beforeEach(() => {
  vi.clearAllMocks()
})

// ── Avatar unit tests ─────────────────────────────────────────────────────

describe('Avatar', () => {
  it('renders without crashing when user name is null', () => {
    renderProfile({ ...BUYER_USER, name: null })
    // If Avatar throws on null name, this test would fail with an error
    // The page renders with a fallback '?' avatar
    const avatar = document.querySelector('.profile-avatar')
    expect(avatar).not.toBeNull()
    expect(avatar.textContent).toBe('?')
  })

  it('renders initials correctly for a user with a full name', () => {
    renderProfile({ ...BUYER_USER, name: 'Jane Doe' })
    const avatar = document.querySelector('.profile-avatar')
    expect(avatar).not.toBeNull()
    expect(avatar.textContent).toBe('JD')
  })

  it('renders single initial for single-word name', () => {
    renderProfile({ ...BUYER_USER, name: 'Jane' })
    const avatar = document.querySelector('.profile-avatar')
    expect(avatar.textContent).toBe('J')
  })
})

// ── Preference UI ────────────────────────────────────────────────────────

describe('Profile — notification & email preference UI', () => {
  it('renders notification preference buttons for authenticated user', () => {
    renderProfile()
    expect(screen.getByText(/All notifications/i)).toBeTruthy()
    expect(screen.getByText(/Important only/i)).toBeTruthy()
  })

  it('renders email preference buttons for authenticated user', () => {
    renderProfile()
    expect(screen.getAllByText(/All emails/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Orders only/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/No emails/i).length).toBeGreaterThan(0)
  })

  it('shows unauthenticated state when user is null', () => {
    useAuth.mockReturnValue({
      user: null, logout: vi.fn(), updateUser: vi.fn(), refreshConnectStatus: vi.fn(),
    })
    useToast.mockReturnValue({ toast: TOAST })
    useCart.mockReturnValue({ addToCart: vi.fn(), items: [] })

    render(<MemoryRouter><Profile /></MemoryRouter>)
    expect(screen.getByText(/not signed in/i)).toBeTruthy()
  })
})
