import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="post-page">
      <div className="post-unauth" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '12px' }}>🐄</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#f5c97a', marginBottom: '8px' }}>404 — Page Not Found</h1>
        <p style={{ marginBottom: '24px', opacity: 0.75 }}>
          This pasture doesn&apos;t exist. Head back to familiar ground.
        </p>
        <Link to="/" className="hp-btn-primary">← Back to Home</Link>
      </div>
    </div>
  )
}
