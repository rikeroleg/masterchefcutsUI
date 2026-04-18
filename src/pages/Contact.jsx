import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import '../styles/contact.css'

const SUBJECTS = [
  'I have a question about an order',
  'I need help with a dispute',
  'I have a question about my account',
  'I\'m a farmer and need help with a listing',
  'Payment / payout issue',
  'Report a bug or technical issue',
  'Other',
]

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: SUBJECTS[0], message: '' })
  const [loading, setLoading]   = useState(false)
  const [done,    setDone]      = useState(false)
  const [error,   setError]     = useState('')

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/api/contact', form)
      setDone(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="contact-page">
      <div className="contact-inner">

        <div className="contact-hero">
          <span className="about-eyebrow">Support</span>
          <h1 className="contact-hero-title">Contact Us</h1>
          <p className="contact-hero-sub">We typically respond within 1 business day.</p>
        </div>

        <div className="contact-card">
          {done ? (
            <div className="contact-success">
              <div className="contact-success-icon">✅</div>
              <h3>Message sent!</h3>
              <p>Thanks for reaching out. We'll get back to you shortly.</p>
              <Link to="/" className="faq-contact-btn">Back to Home</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <p className="contact-error">{error}</p>}

              <div className="contact-field">
                <label htmlFor="contact-name">Your name</label>
                <input
                  id="contact-name"
                  className="contact-input"
                  type="text"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Jane Smith"
                />
              </div>

              <div className="contact-field">
                <label htmlFor="contact-email">Email address</label>
                <input
                  id="contact-email"
                  className="contact-input"
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="jane@example.com"
                />
              </div>

              <div className="contact-field">
                <label htmlFor="contact-subject">Subject</label>
                <select
                  id="contact-subject"
                  className="contact-select"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                >
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="contact-field">
                <label htmlFor="contact-message">Message</label>
                <textarea
                  id="contact-message"
                  className="contact-textarea"
                  name="message"
                  required
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Describe your issue or question in detail…"
                />
              </div>

              <button type="submit" className="contact-submit" disabled={loading}>
                {loading ? 'Sending…' : 'Send Message'}
              </button>
            </form>
          )}
        </div>

        <Link to="/faq" className="contact-back-link">← Back to FAQ</Link>

      </div>
    </div>
  )
}
