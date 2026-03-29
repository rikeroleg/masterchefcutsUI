import React, { useState } from 'react'

const MOCK_LISTINGS = [
  {
    id: 1, animal: 'Beef', emoji: '🐄', breed: 'Black Angus',
    farm: 'Green Pastures Farm', location: 'Lancaster, PA',
    weight: 650, pricePerLb: 5.50, postedDaysAgo: 2,
    cuts: [
      { label: 'Chuck',   claimed: true  },
      { label: 'Rib',     claimed: true  },
      { label: 'Loin',    claimed: true  },
      { label: 'Round',   claimed: false },
      { label: 'Brisket', claimed: true  },
      { label: 'Plate',   claimed: false },
      { label: 'Flank',   claimed: false },
      { label: 'Shank',   claimed: false },
    ],
    description: 'Grass-fed, pasture-raised Angus. No hormones, no antibiotics. Dry-aged 14 days before processing.',
  },
  {
    id: 2, animal: 'Pork', emoji: '🐷', breed: 'Berkshire',
    farm: 'Sunridge Family Farm', location: 'Ephrata, PA',
    weight: 240, pricePerLb: 4.25, postedDaysAgo: 5,
    cuts: [
      { label: 'Shoulder', claimed: true  },
      { label: 'Loin',     claimed: true  },
      { label: 'Belly',    claimed: true  },
      { label: 'Leg (Ham)',claimed: true  },
      { label: 'Jowl',     claimed: false },
      { label: 'Hock',     claimed: false },
    ],
    description: 'Heritage Berkshire pork, acorn-finished. Rich marbling, exceptional flavor. Raised on open pasture.',
  },
  {
    id: 3, animal: 'Lamb', emoji: '🐑', breed: 'Dorset Cross',
    farm: 'Blue Ridge Meats', location: 'Roanoke, VA',
    weight: 85, pricePerLb: 7.00, postedDaysAgo: 1,
    cuts: [
      { label: 'Shoulder', claimed: false },
      { label: 'Rack',     claimed: false },
      { label: 'Loin',     claimed: false },
      { label: 'Leg',      claimed: false },
      { label: 'Breast',   claimed: false },
      { label: 'Shank',    claimed: false },
    ],
    description: 'Fresh spring lamb, locally raised on mixed pasture. Perfect for whole-animal buyers or split orders.',
  },
  {
    id: 4, animal: 'Beef', emoji: '🐄', breed: 'Hereford',
    farm: 'Oak Hill Ranch', location: 'Frederick, MD',
    weight: 720, pricePerLb: 5.20, postedDaysAgo: 8,
    cuts: [
      { label: 'Chuck',   claimed: true  },
      { label: 'Rib',     claimed: true  },
      { label: 'Loin',    claimed: true  },
      { label: 'Round',   claimed: true  },
      { label: 'Brisket', claimed: true  },
      { label: 'Plate',   claimed: true  },
      { label: 'Flank',   claimed: true  },
      { label: 'Shank',   claimed: false },
    ],
    description: 'Certified grass-fed Hereford. One share remaining — shank is the last unclaimed cut.',
  },
]

const ANIMAL_FILTERS = ['All', 'Beef', 'Pork', 'Lamb']

function ShareProgressBar({ cuts }) {
  const total   = cuts.length
  const claimed = cuts.filter(c => c.claimed).length
  const pct     = Math.round((claimed / total) * 100)

  return (
    <div className="spb">
      <div className="spb-header">
        <span className="spb-title">Share progress</span>
        <span className="spb-count">
          <strong>{claimed}</strong> / {total} cuts claimed
          <span className={`spb-pct${pct === 100 ? ' spb-pct--full' : ''}`}>{pct}%</span>
        </span>
      </div>

      {/* Segmented bar */}
      <div className="spb-track">
        {cuts.map((c, i) => (
          <div
            key={i}
            className={`spb-seg${c.claimed ? ' spb-seg--claimed' : ''}`}
            style={{ flex: 1 }}
            title={`${c.label}: ${c.claimed ? 'Claimed' : 'Available'}`}
          />
        ))}
      </div>

      {/* Cut pills */}
      <div className="spb-cuts">
        {cuts.map((c, i) => (
          <span key={i} className={`spb-cut${c.claimed ? ' spb-cut--claimed' : ' spb-cut--open'}`}>
            {c.claimed ? '✓' : '+'} {c.label}
          </span>
        ))}
      </div>

      <div className="spb-legend">
        <span className="spb-legend-item spb-legend-item--claimed"><span />Claimed</span>
        <span className="spb-legend-item spb-legend-item--open"><span />Available</span>
      </div>
    </div>
  )
}

function ListingCard({ listing }) {
  const [expanded, setExpanded] = useState(false)
  const available = listing.cuts.filter(c => !c.claimed).length

  return (
    <div className={`lc${expanded ? ' lc--expanded' : ''}`}>
      <div className="lc-header">
        <div className="lc-animal-badge">{listing.emoji}</div>
        <div className="lc-meta">
          <div className="lc-title">{listing.breed} {listing.animal}</div>
          <div className="lc-farm">{listing.farm} &middot; {listing.location}</div>
        </div>
        <div className="lc-price-block">
          <span className="lc-price">${listing.pricePerLb.toFixed(2)}<small>/lb</small></span>
          <span className="lc-weight">{listing.weight} lbs</span>
        </div>
      </div>

      <ShareProgressBar cuts={listing.cuts} />

      {listing.description && (
        <p className="lc-desc">{listing.description}</p>
      )}

      <div className="lc-footer">
        <span className="lc-posted">Posted {listing.postedDaysAgo}d ago</span>
        {available > 0 ? (
          <button className="lc-claim-btn" onClick={() => setExpanded(e => !e)}>
            {expanded ? 'Close' : `Claim a cut (${available} open)`}
          </button>
        ) : (
          <span className="lc-full-badge">Pool Full — Processing Soon</span>
        )}
      </div>

      {expanded && available > 0 && (
        <div className="lc-claim-panel">
          <p className="lc-claim-label">Available cuts — select one to claim</p>
          <div className="lc-claim-cuts">
            {listing.cuts.filter(c => !c.claimed).map((c, i) => (
              <button key={i} className="lc-claim-cut-btn">
                <span className="lc-claim-cut-name">{c.label}</span>
                <span className="lc-claim-cut-action">Claim →</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Listings() {
  const [filter, setFilter] = useState('All')

  const filtered = filter === 'All'
    ? MOCK_LISTINGS
    : MOCK_LISTINGS.filter(l => l.animal === filter)

  return (
    <div className="listings-page">
      <div className="listings-inner">

        <div className="listings-header">
          <div>
            <p className="hp-label">Available now</p>
            <h1 className="listings-title">Browse Listings</h1>
            <p className="listings-sub">Claim a primal cut from a whole animal near you.</p>
          </div>
          <div className="listings-filters">
            {ANIMAL_FILTERS.map(f => (
              <button
                key={f}
                className={`listings-filter-btn${filter === f ? ' active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'Beef' ? '🐄 ' : f === 'Pork' ? '🐷 ' : f === 'Lamb' ? '🐑 ' : ''}{f}
              </button>
            ))}
          </div>
        </div>

        <div className="listings-grid">
          {filtered.map(l => <ListingCard key={l.id} listing={l} />)}
        </div>

      </div>
    </div>
  )
}
