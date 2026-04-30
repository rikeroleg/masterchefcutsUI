import React, { useState, useRef, useEffect } from 'react'
import { api } from '../api/client'
import '../styles/dispute-modal.css'

const DISPUTE_TYPES = [
  { id: 'QUALITY',  label: 'Quality issue — cuts different than described' },
  { id: 'NO_SHOW',  label: 'Pickup issue — farmer no-show or no contact' },
  { id: 'WEIGHT',   label: 'Weight discrepancy — wrong portion received' },
  { id: 'BILLING',  label: 'Billing issue — charged incorrectly' },
  { id: 'OTHER',    label: 'Other issue' },
]

export default function DisputeModal({ claim, onClose }) {
  const [type, setType]       = useState('')
  const [desc, setDesc]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [done, setDone]       = useState(false)
  const modalRef = useRef(null)

  // Focus trap + Escape key
  useEffect(() => {
    const el = modalRef.current
    if (!el) return
    const focusable = el.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
    const first = focusable[0]
    const last  = focusable[focusable.length - 1]
    first?.focus()
    function handleKey(e) {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab') return
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus() }
      }
    }
    el.addEventListener('keydown', handleKey)
    return () => el.removeEventListener('keydown', handleKey)
  }, [onClose])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!type) { setError('Please select an issue type.'); return }
    if (desc.trim().length < 10) { setError('Please describe the issue in a few words.'); return }
    setLoading(true)
    setError('')
    try {
      await api.post('/api/disputes', {
        claimId:     claim.id,
        listingId:   claim.listingId,
        type,
        description: desc.trim(),
      })
      setDone(true)
    } catch (err) {
      setError(err.message || 'Failed to submit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dsp-overlay" onClick={onClose}>
      <div className="dsp-modal" ref={modalRef} onClick={e => e.stopPropagation()}>
        <button className="dsp-close" onClick={onClose}>✕</button>

        {done ? (
          <div className="dsp-done">
            <div className="dsp-done-icon">✓</div>
            <h3>Report submitted</h3>
            <p>Our team will review your report and follow up within 2 business days.</p>
            <button className="dsp-btn-primary" onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            <h3 className="dsp-title">Report an Issue</h3>
            <p className="dsp-sub">{claim.breed} {claim.cutLabel} · {claim.sourceFarm}</p>

            <form className="dsp-form" onSubmit={handleSubmit}>
              <div className="dsp-field">
                <label className="dsp-label">Issue type *</label>
                <div className="dsp-types">
                  {DISPUTE_TYPES.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      className={`dsp-type-btn${type === t.id ? ' active' : ''}`}
                      onClick={() => setType(t.id)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="dsp-field">
                <label className="dsp-label">Description *</label>
                <textarea
                  className="dsp-textarea"
                  rows={4}
                  placeholder="Describe what happened in detail…"
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                />
              </div>

              {error && <p className="dsp-error">{error}</p>}

              <div className="dsp-actions">
                <button type="button" className="dsp-btn-secondary" onClick={onClose}>Cancel</button>
                <button type="submit" className="dsp-btn-primary" disabled={loading}>
                  {loading ? 'Submitting…' : 'Submit Report →'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
