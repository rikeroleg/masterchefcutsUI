import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

vi.mock('../api/client', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../context/ToastContext', () => ({
  useToast: vi.fn(),
}))

vi.mock('../Components/PaymentModal', () => ({
  default: () => null,
}))

vi.mock('../styles/listings.css', () => ({}))

import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import FarmerProfile from '../pages/FarmerProfile'

const FARMER_ID = 'farmer-123'
const TOAST = { error: vi.fn(), success: vi.fn(), info: vi.fn() }

function renderFarmerProfile(farmerId = FARMER_ID) {
  useAuth.mockReturnValue({ user: null })
  useToast.mockReturnValue({ toast: TOAST })
  return render(
    <MemoryRouter initialEntries={[`/farmers/${farmerId}`]}>
      <Routes>
        <Route path="/farmers/:id" element={<FarmerProfile />} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('FarmerProfile — empty listings', () => {
  it('falls back to /public endpoint and shows farmer name when listings are empty', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/api/listings')) return Promise.resolve([])
      if (url.includes('/public')) return Promise.resolve({
        name: 'Jane Farmer', shopName: 'Green Pastures', zipCode: '12345',
        bio: 'Grass-fed and pasture-raised.', certifications: 'USDA Organic',
      })
      if (url.includes('/api/reviews/farmer')) return Promise.resolve([])
      return Promise.resolve([])
    })

    renderFarmerProfile()

    await waitFor(() => {
      expect(screen.getByText(/Jane Farmer/)).toBeTruthy()
    })
  })

  it('shows empty listings message when farmer has no active listings', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/api/listings')) return Promise.resolve([])
      if (url.includes('/public')) return Promise.resolve({ name: 'Jane Farmer', shopName: null })
      if (url.includes('/api/reviews/farmer')) return Promise.resolve([])
      return Promise.resolve([])
    })

    renderFarmerProfile()

    await waitFor(() => {
      expect(screen.getByText(/no active listings right now/i)).toBeTruthy()
    })
  })

  it('calls the public endpoint when listings array is empty', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/api/listings')) return Promise.resolve([])
      if (url.includes('/public')) return Promise.resolve({ name: 'John Ranch' })
      if (url.includes('/api/reviews/farmer')) return Promise.resolve([])
      return Promise.resolve([])
    })

    renderFarmerProfile()

    await waitFor(() => {
      const publicCall = api.get.mock.calls.find(([url]) =>
        url.includes(`/api/participants/${FARMER_ID}/public`)
      )
      expect(publicCall).toBeTruthy()
    })
  })
})

describe('FarmerProfile — with listings', () => {
  it('renders farmer name from listing data when listings exist', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/api/listings')) return Promise.resolve([{
        id: 'l1', farmerName: 'Bob Ranch', farmerShopName: 'Bob\'s Farm',
        zipCode: '90210', farmerBio: null, farmerCertifications: null,
        animalType: 'BEEF', breed: 'Angus', weightLbs: 600, pricePerLb: 5.5,
        status: 'ACTIVE', totalCuts: 8, claimedCuts: 2, cuts: [],
      }])
      if (url.includes('/api/reviews/farmer')) return Promise.resolve([])
      return Promise.resolve([])
    })

    renderFarmerProfile()

    await waitFor(() => {
      expect(screen.getByText(/Bob Ranch/)).toBeTruthy()
    })
  })
})
