import React from 'react'

export default class ErrorBoundary extends React.Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ textAlign: 'center', padding: '80px 24px', color: '#fff' }}>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '12px' }}>Something went wrong</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '24px' }}>
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#e74c3c', color: '#fff', border: 'none',
              padding: '12px 28px', borderRadius: '8px', cursor: 'pointer',
              fontSize: '1rem', fontWeight: 600,
            }}
          >
            Refresh Page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
