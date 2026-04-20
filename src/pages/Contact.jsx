import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { SITE_URL, useSEO } from '../utils/seo'
import '../styles/contact.css'

export default function Contact() {
  useSEO({
    title: 'Contact Us — MasterChef Cuts',
    description: 'Get in touch with the MasterChef Cuts support team. We\'re here to help with listings, orders, or any questions.',
    url: '/contact',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Contact MasterChef Cuts',
      url: `${SITE_URL}/contact`,
    },
  })

  const [fields, setFields] = useState({ name: '', email: '', subject: '', message: '' })
  const [status, setStatus] = useState({ loading: false, error: null, success: false })

  function handleChange(e) {
    setFields(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus({ loading: true, error: null, success: false })
    try {
      await api.post('/api/contact', fields)
      setStatus({ loading: false, error: null, success: true })
    } catch (err) {
      setStatus({ loading: false, error: err.message || 'Something went wrong. Please try again.', success: false })
    }
  }

  return (
    <div className="contact-page">

      {/* Hero */}
      <section className="contact-hero">
        <span className="contact-hero-eyebrow">Support</span>
        <h1 className="contact-hero-title">How can we help?</h1>
        <p className="contact-hero-sub">
          Have a question about a listing, an order, or your account? Send us a message and we'll get back to you as soon as possible.
        </p>
      </section>

      {/* Form */}
      <section className="contact-form-section">
        <div className="contact-form-wrap">
          <h2 className="contact-form-title">Send a message</h2>
          <p className="contact-form-subtitle">We typically respond within 1–2 business days.</p>

          {status.success ? (
            <div className="contact-success">
              <span className="contact-success-icon">✅</span>
              <h3 className="contact-success-title">Message sent!</h3>
              <p className="contact-success-body">
                Thanks for reaching out. Our support team will get back to you at <strong>{fields.email}</strong> within 1–2 business days.
              </p>
              <Link to="/" className="contact-success-back">Back to home</Link>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit} noValidate>
              <div className="contact-row">
                <div className="contact-field">
                  <label className="contact-label" htmlFor="contact-name">Your name</label>
                  <input
                    id="contact-name"
                    className="contact-input"
                    type="text"
                    name="name"
                    value={fields.name}
                    onChange={handleChange}
                    placeholder="Jane Smith"
                    required
                    maxLength={120}
                  />
                </div>
                <div className="contact-field">
                  <label className="contact-label" htmlFor="contact-email">Email address</label>
                  <input
                    id="contact-email"
                    className="contact-input"
                    type="email"
                    name="email"
                    value={fields.email}
                    onChange={handleChange}
                    placeholder="jane@example.com"
                    required
                    maxLength={200}
                  />
                </div>
              </div>

              <div className="contact-field">
                <label className="contact-label" htmlFor="contact-subject">Subject</label>
                <input
                  id="contact-subject"
                  className="contact-input"
                  type="text"
                  name="subject"
                  value={fields.subject}
                  onChange={handleChange}
                  placeholder="e.g. Question about my order"
                  required
                  maxLength={200}
                />
              </div>

              <div className="contact-field">
                <label className="contact-label" htmlFor="contact-message">Message</label>
                <textarea
                  id="contact-message"
                  className="contact-textarea"
                  name="message"
                  value={fields.message}
                  onChange={handleChange}
                  placeholder="Describe your question or issue in detail…"
                  required
                  maxLength={3000}
                />
              </div>

              {status.error && (
                <div className="contact-error" role="alert">{status.error}</div>
              )}

              <button
                type="submit"
                className="contact-submit"
                disabled={status.loading}
              >
                {status.loading ? 'Sending…' : 'Send message'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Info cards */}
      <section className="contact-info-section">
        <div className="contact-info-grid">
          <div className="contact-info-card">
            <div className="contact-info-icon">📧</div>
            <div className="contact-info-label">Email</div>
            <div className="contact-info-value">support@masterchefcuts.com</div>
          </div>
          <div className="contact-info-card">
            <div className="contact-info-icon">⏱</div>
            <div className="contact-info-label">Response time</div>
            <div className="contact-info-value">1–2 business days</div>
          </div>
          <div className="contact-info-card">
            <div className="contact-info-icon">🕒</div>
            <div className="contact-info-label">Hours</div>
            <div className="contact-info-value">Mon–Fri, 9am–5pm ET</div>
          </div>
        </div>
      </section>

    </div>
  )
}
