import React from 'react'
import '../styles/auth.css'
import { DEFAULT_OG_IMAGE, SITE_URL, useSEO } from '../utils/seo'

export default function Privacy() {
  useSEO({
    title: 'Privacy Policy - MasterChef Cuts',
    description: 'Read how MasterChef Cuts collects, uses, and protects your account, payment, and marketplace data.',
    image: DEFAULT_OG_IMAGE,
    url: '/privacy',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Privacy Policy',
      url: `${SITE_URL}/privacy`,
    },
  })

  return (
    <div className="auth-page" style={{ alignItems: 'flex-start', padding: '48px 24px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', marginBottom: 40, fontSize: '0.875rem' }}>
          Last updated: April 11, 2026
        </p>

        <Section title="1. Information We Collect">
          We collect information you provide directly: name, email address, delivery address, and payment information. We also collect usage data such as pages visited, listings viewed, and claims made.
        </Section>

        <Section title="2. How We Use Your Information">
          Your information is used to: operate and improve the Platform; process payments and payouts; send transactional emails (order confirmations, claim expiry reminders); and provide customer support. We do not sell your personal data to third parties.
        </Section>

        <Section title="3. Payment Data">
          Payment processing is handled by Stripe. MasterChef Cuts does not store full credit card numbers. Stripe's privacy policy governs the handling of your payment data. See{' '}
          <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#e74c3c' }}>stripe.com/privacy</a>.
        </Section>

        <Section title="4. Sharing Your Information">
          We share your information only as necessary: with Farmers to fulfill your order (name, contact info, pickup details); with Stripe to process payments; and with service providers who operate the Platform infrastructure.
        </Section>

        <Section title="5. Cookies and Local Storage">
          We use browser local storage to maintain your session token and cart contents. We do not use third-party advertising cookies.
        </Section>

        <Section title="6. Data Retention">
          Account data is retained as long as your account is active. Closed accounts are anonymized within 90 days, except where retention is required by law (e.g., financial transaction records).
        </Section>

        <Section title="7. Your Rights">
          You may request access to, correction of, or deletion of your personal data at any time by contacting us. You may delete your account at any time through the Profile page's Danger Zone.
        </Section>

        <Section title="8. Security">
          We use industry-standard security measures including TLS encryption in transit and hashed passwords. No system is completely secure; we cannot guarantee absolute security.
        </Section>

        <Section title="9. Children's Privacy">
          The Platform is not directed at children under 13. We do not knowingly collect personal information from children under 13.
        </Section>

        <Section title="10. Changes to This Policy">
          We may update this Privacy Policy from time to time. We will notify registered users of material changes by email.
        </Section>

        <Section title="11. Contact">
          For privacy-related questions, contact us at{' '}
          <a href="mailto:privacy@masterchefcuts.com" style={{ color: '#e74c3c' }}>privacy@masterchefcuts.com</a>.
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 8, color: '#fff' }}>{title}</h2>
      <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, margin: 0 }}>{children}</p>
    </div>
  )
}
