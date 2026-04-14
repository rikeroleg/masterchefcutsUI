import React, { useState } from 'react'
import { X, ShoppingCart, Flame, Thermometer, DollarSign } from 'lucide-react'
import { BEEF_CUT_DATA } from '../../data/beefCutData'

function TendernessBar({ value }) {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{ width: 28, height: 6, borderRadius: 3, background: i <= value ? '#f1c40f' : 'rgba(255,255,255,0.12)' }} />
      ))}
      <span style={{ marginLeft: 6, fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {['', 'Very Tough', 'Tough', 'Medium', 'Tender', 'Very Tender'][value]}
      </span>
    </div>
  )
}

function PriceTag({ price, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
      <DollarSign size={14} color={color} style={{ marginBottom: -2 }} />
      <span style={{ fontSize: 22, fontWeight: 700, color }}>{price.toLocaleString()}</span>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginLeft: 2 }}>/ whole cut</span>
    </div>
  )
}

export default function CutInfoModal({ cut, onClose }) {
  const [qty, setQty] = useState(1)

  if (!cut) return null
  const data = BEEF_CUT_DATA[cut.id]
  if (!data) return null

  const total = (data.price * qty).toLocaleString()

  return (
    <div className="cut-modal-backdrop" onClick={onClose}>
      <aside className="cut-modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="cut-modal-accent" style={{ background: data.color }} />
        <div className="cut-modal-scroll">
          <div className="cut-modal-header">
            <div>
              <p className="cut-modal-section-label">{data.section}</p>
              <h2 className="cut-modal-title" style={{ color: data.color }}>{data.name}</h2>
            </div>
            <button className="cut-modal-close" onClick={onClose} aria-label="Close"><X size={20} /></button>
          </div>

          <div className="cut-modal-meta">
            <PriceTag price={data.price} color={data.color} />
            <TendernessBar value={data.tenderness} />
          </div>

          <p className="cut-modal-description">{data.description}</p>
          <hr className="cut-modal-divider" />

          <div className="cut-modal-block">
            <h3 className="cut-modal-block-title">Popular Cuts</h3>
            <div className="cut-modal-chips">
              {data.popularCuts.map((c) => (
                <span key={c} className="cut-modal-chip" style={{ borderColor: data.color + '88', color: data.color }}>{c}</span>
              ))}
            </div>
          </div>
          <hr className="cut-modal-divider" />

          <div className="cut-modal-block">
            <h3 className="cut-modal-block-title">
              <Flame size={13} style={{ marginRight: 6, verticalAlign: 'middle', color: '#e67e22' }} />
              Best Cooking Methods
            </h3>
            <div className="cut-modal-methods">
              {data.cookingMethods.map((cm) => (
                <div key={cm.method} className="cut-modal-method-row">
                  <span className="cut-modal-method-name" style={{ color: data.color }}>{cm.method}</span>
                  <span className="cut-modal-method-note">{cm.note}</span>
                </div>
              ))}
            </div>
          </div>
          <hr className="cut-modal-divider" />

          <div className="cut-modal-block">
            <h3 className="cut-modal-block-title">
              <Thermometer size={13} style={{ marginRight: 6, verticalAlign: 'middle', color: '#e74c3c' }} />
              Internal Temperature
            </h3>
            <p className="cut-modal-temp">{data.internalTemp}</p>
          </div>

          <div className="cut-modal-flavor-pill">
            <span style={{ color: data.color, fontWeight: 600 }}>Flavour: </span>
            {data.flavorProfile}
          </div>
          <hr className="cut-modal-divider" />

          <div className="cut-modal-order">
            <div className="cut-modal-qty-row">
              <span className="cut-modal-qty-label">Quantity</span>
              <div className="cut-modal-qty-controls">
                <button
                  className="cut-modal-qty-btn"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >−</button>
                <span className="cut-modal-qty-value">{qty}</span>
                <button
                  className="cut-modal-qty-btn"
                  onClick={() => setQty((q) => q + 1)}
                >+</button>
              </div>
            </div>
            <button className="cut-modal-order-btn" style={{ background: data.color }}>
              <ShoppingCart size={16} style={{ marginRight: 8 }} />
              Order {qty} {qty === 1 ? 'Cut' : 'Cuts'} — ${total}
            </button>
          </div>
        </div>
      </aside>
    </div>
  )
}
