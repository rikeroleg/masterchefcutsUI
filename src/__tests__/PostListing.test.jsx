import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../api/client', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../context/ToastContext', () => ({
  useToast: vi.fn(),
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: () => vi.fn() }
})

import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import PostListing from '../pages/PostListing'

const FARMER_USER = {
  id: 'farmer-1', role: 'farmer', name: 'Jane Smith',
  stripeOnboardingComplete: true, approved: true,
}

function renderPostListing() {
  useAuth.mockReturnValue({ user: FARMER_USER })
  useToast.mockReturnValue({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } })
  return render(<MemoryRouter><PostListing /></MemoryRouter>)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('PostListing form', () => {
  it('does not render per-cut price inputs (dead UI removed)', () => {
    renderPostListing()
    const priceInputs = document.querySelectorAll('.hp-price-in')
    expect(priceInputs.length).toBe(0)
  })

  it('renders the processing date field', () => {
    renderPostListing()
    const dateInput = document.querySelector('input[name="processingDate"]')
    expect(dateInput).not.toBeNull()
    expect(dateInput.type).toBe('date')
  })

  it('renders weight inputs for primal cuts once an animal is selected', () => {
    renderPostListing()
    // Default animal type is beef — select a cut checkbox first
    const checkboxes = document.querySelectorAll('input[type="checkbox"]')
    expect(checkboxes.length).toBeGreaterThan(0)
  })

  it('renders the price-per-lb field (single price for the whole animal)', () => {
    renderPostListing()
    const pricePerLbInput = document.querySelector('input[name="pricePerLb"]')
    expect(pricePerLbInput).not.toBeNull()
  })

  it('renders the hanging weight field', () => {
    renderPostListing()
    const weightInput = document.querySelector('input[name="hangingWeight"]')
    expect(weightInput).not.toBeNull()
  })
})
