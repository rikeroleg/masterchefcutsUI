import React, { useState } from 'react'
import { WHOLE_ANIMAL_DATA } from '../data/wholeAnimalData'
import { useCart } from '../context/CartContext'

export function WholeAnimalPanel({ activeAnimal }) {
  const { addToCart } = useCart()
  const [added, setAdded] = useState(null)
  const animalKey = activeAnimal === 'beef' ? 'beef' : activeAnimal === 'pork' ? 'pork' : 'lamb'
  const data = WHOLE_ANIMAL_DATA[animalKey]
  if (!data) return null

  function handleAdd(opt) {
    addToCart({
      animal: animalKey,
      cutId: `${animalKey}-${opt.id}`,
      name: `${data.label} \u2014 ${opt.label} (${opt.weight})`,
      color: data.color,
      price: opt.price,
      qty: 1,
    })
    setAdded(opt.id)
    setTimeout(() => setAdded(null), 1800)
  }

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
              <span className="wap-price">${opt.price.toLocaleString()}</span>
              <button
                className={`wap-btn${added === opt.id ? ' wap-btn--added' : ''}`}
                style={{ '--accent': data.color }}
                onClick={() => handleAdd(opt)}
              >
                {added === opt.id ? '\u2713 Added' : 'Add to Cart'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
