/**
 * ListingsMap.jsx — Leaflet map overlay for the Listings page.
 *
 * Uses the free Nominatim API (OpenStreetMap) to geocode ZIP codes
 * on-demand, with a local cache to avoid duplicate requests.
 * Falls back gracefully if geocoding fails.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

// Lazily import leaflet so it doesn't break SSR / non-map pages
let L = null

const ZIP_CACHE = {} // { '17601': { lat, lng } }

async function geocodeZip(zip) {
  if (!zip) return null
  const key = String(zip).trim()
  if (ZIP_CACHE[key]) return ZIP_CACHE[key]
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(key)}&country=US&format=json&limit=1`,
      { headers: { 'Accept-Language': 'en' } }
    )
    const data = await res.json()
    if (data[0]) {
      const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
      ZIP_CACHE[key] = coords
      return coords
    }
  } catch { /* silent */ }
  return null
}

const ANIMAL_COLOR = { BEEF: '#c0392b', PORK: '#d35400', LAMB: '#8e44ad' }
const ANIMAL_EMOJI = { BEEF: '🐄', PORK: '🐷', LAMB: '🐑' }

export default function ListingsMap({ listings }) {
  const navigate   = useNavigate()
  const mapRef     = useRef(null)
  const leafletMap = useRef(null)
  const markers    = useRef([])
  const [geocoding, setGeocoding] = useState(false)
  const [placed, setPlaced]       = useState(0)

  const clearMarkers = useCallback(() => {
    markers.current.forEach(m => m.remove())
    markers.current = []
  }, [])

  // Init map once
  useEffect(() => {
    let cancelled = false

    async function init() {
      if (!mapRef.current || leafletMap.current) return

      // Dynamic import so Leaflet's window references load only client-side
      const leaflet = await import('leaflet')
      await import('leaflet/dist/leaflet.css')
      L = leaflet.default || leaflet

      // Fix default icon paths (Vite asset hashing)
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl:       new URL('leaflet/dist/images/marker-icon.png',    import.meta.url).href,
        iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
        shadowUrl:     new URL('leaflet/dist/images/marker-shadow.png',  import.meta.url).href,
      })

      if (cancelled || !mapRef.current || leafletMap.current) return

      leafletMap.current = L.map(mapRef.current, {
        center: [39.5, -98.35], // geographic center of CONUS
        zoom:   4,
        scrollWheelZoom: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(leafletMap.current)
    }

    init()
    return () => { cancelled = true }
  }, [])

  // Place markers whenever listings change
  useEffect(() => {
    if (!leafletMap.current || !L) return

    async function placeMarkers() {
      clearMarkers()
      setGeocoding(true)
      setPlaced(0)

      const uniqueZips = [...new Set(listings.map(l => l.zipCode).filter(Boolean))]
      const zipCoords  = {}

      // Geocode all unique ZIPs (throttled — 1 req per 200ms to respect Nominatim ToS)
      for (const zip of uniqueZips) {
        const coords = await geocodeZip(zip)
        if (coords) zipCoords[zip] = coords
        await new Promise(r => setTimeout(r, 200))
      }

      // Group listings by zip
      const byZip = {}
      listings.forEach(l => {
        if (!l.zipCode || !zipCoords[l.zipCode]) return
        if (!byZip[l.zipCode]) byZip[l.zipCode] = []
        byZip[l.zipCode].push(l)
      })

      let count = 0
      const map = leafletMap.current
      if (!map) return

      Object.entries(byZip).forEach(([zip, group]) => {
        const { lat, lng } = zipCoords[zip]

        // Custom circle marker
        const color = ANIMAL_COLOR[group[0].animalType] || '#e74c3c'
        const radius = 10 + Math.min(group.length * 4, 20)

        const circleMarker = L.circleMarker([lat, lng], {
          radius,
          color:       '#fff',
          weight:      2,
          fillColor:   color,
          fillOpacity: 0.85,
        })

        // Popup content
        const popupHtml = group.map(l => `
          <div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid rgba(0,0,0,0.1)">
            <strong>${ANIMAL_EMOJI[l.animalType] || '🥩'} ${l.breed} ${l.animalType.charAt(0) + l.animalType.slice(1).toLowerCase()}</strong>
            <br/><span>${l.farmerShopName || l.farmerName}</span>
            <br/><span>$${parseFloat(l.pricePerLb).toFixed(2)}/lb</span>
            <br/><a href="/listings/${l.id}" style="color:#e74c3c;font-weight:600">View listing →</a>
          </div>
        `).join('')

        circleMarker.bindPopup(`
          <div style="min-width:180px;font-family:sans-serif;font-size:0.88rem">
            <strong style="font-size:0.78rem;text-transform:uppercase;letter-spacing:0.06em;color:#888">ZIP ${zip} — ${group.length} listing${group.length !== 1 ? 's' : ''}</strong>
            <div style="margin-top:8px">${popupHtml}</div>
          </div>
        `, { maxWidth: 240 })

        circleMarker.addTo(map)
        markers.current.push(circleMarker)
        count++
        setPlaced(count)
      })

      // Fit map to markers if any
      if (markers.current.length > 0) {
        const group = L.featureGroup(markers.current)
        map.fitBounds(group.getBounds().pad(0.3))
      }

      setGeocoding(false)
    }

    placeMarkers()
    return () => clearMarkers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listings])

  return (
    <div className="listings-map-wrap">
      {geocoding && (
        <div className="listings-map-status">
          📍 Geocoding zip codes… ({placed} placed)
        </div>
      )}
      <div ref={mapRef} className="listings-map" />
    </div>
  )
}
