import React from 'react'
import { WHOLE_ANIMAL_DATA } from '../data/wholeAnimalData'
import { shopBridge } from '../context/CartContext'

export function WholeAnimalPanel({ activeAnimal }) {
  const animalKey = activeAnimal === 'beef' ? 'beef' : activeAnimal === 'pork' ? 'pork' : 'lamb'
  const data = WHOLE_ANIMAL_DATA[animalKey]
  if (!data) return null

  return (
    <div className="wap-panel">
      <div className="wap-header">
        <span className="wap-title">Buy Whole Animal</span>
        <span className="wap-desc">{data.description}</span>
      </div>
      <div className="wap-options">
        {data.options.map((opt) => (
          <div key={opt.id} className="wap-card">
            <div className="wap-card-top">
              <span className="wap-symbol" style={{ color: data.color }}>{opt.symbol}</span>
              <span className="wap-label">{opt.label}</span>
              <span className="wap-weight">{opt.weight}</span>
            </div>
            <span className="wap-note">{opt.note}</span>
            <div className="wap-card-bottom">
              <button
                className="wap-btn"
                style={{ '--accent': data.color }}
                onClick={() => shopBridge.openRequestModal()}
              >
                Claim
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
