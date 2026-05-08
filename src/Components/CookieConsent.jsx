import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/cookie-consent.css'

const STORAGE_KEY = 'mc_cookie_ok'

export default function CookieConsent() {
  const [visible, setVisible] = useState(() => !localStorage.getItem(STORAGE_KEY))

  if (!visible) return null

  function accept() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  return (
    <div className="cc-bar" role="region" aria-label="Cookie notice">
      <p className="cc-text">
        We use local storage to keep you signed in and remember your cart.
        See our <Link to="/privacy" className="cc-link">Privacy Policy</Link> for details.
      </p>
      <button className="cc-accept" onClick={accept}>
        Got it
      </button>
    </div>
  )
}
