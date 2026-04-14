import React, { useEffect } from 'react'
import '../styles/auth.css'

export default function Terms() {
  useEffect(() => { document.title = 'Terms of Service — MasterChef Cuts' }, [])

  return (
    <div className="auth-page" style={{ alignItems: 'flex-start', padding: '48px 24px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', marginBottom: 40, fontSize: '0.875rem' }}>
          Last updated: April 11, 2026
        </p>

        <Section title="1. Acceptance">
          By accessing or using MasterChef Cuts ("Platform"), you agree to be bound by these Terms. If you do not agree, do not use the Platform.
        </Section>

        <Section title="2. Description of Service">
          MasterChef Cuts is an online marketplace connecting licensed butcher shops and farmers ("Farmers") with buyers ("Participants") who wish to purchase primal cuts from whole animals raised locally. The Platform facilitates listings, claims, payments, and order coordination but is not a party to any transaction between Farmers and Participants.
        </Section>

        <Section title="3. Eligibility">
          You must be at least 18 years old and capable of forming a binding contract to use this Platform. Farmers must hold all required local, state, and federal licenses to sell meat products.
        </Section>

        <Section title="4. Accounts">
          You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized access. MasterChef Cuts reserves the right to terminate accounts that violate these Terms.
        </Section>

        <Section title="5. Listings and Claims">
          Farmers are solely responsible for the accuracy of listing information, including animal breed, weight, processing date, and price per pound. Claims are binding once submitted. Participants forfeit their claim if payment is not made before the claim expiry.
        </Section>

        <Section title="6. Payments">
          All payments are processed through Stripe. MasterChef Cuts charges a platform fee on each completed transaction. Refunds are handled on a case-by-case basis through our dispute resolution process. Farmers receive payouts via Stripe Connect after order completion.
        </Section>

        <Section title="7. Food Safety">
          All meat sold through the Platform must be processed at a USDA-inspected or equivalent licensed facility. MasterChef Cuts does not inspect or guarantee the quality, safety, or handling of any animal or meat product. Participants consume products at their own risk.
        </Section>

        <Section title="8. Prohibited Conduct">
          You may not: (a) post false or misleading listings; (b) manipulate pricing; (c) use the Platform for any unlawful purpose; (d) attempt to circumvent the Platform's payment system; (e) harass other users.
        </Section>

        <Section title="9. Disclaimers">
          The Platform is provided "as is" without warranties of any kind. MasterChef Cuts is not liable for the quality, safety, legality, or availability of any product listed on the Platform.
        </Section>

        <Section title="10. Limitation of Liability">
          To the maximum extent permitted by law, MasterChef Cuts shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform.
        </Section>

        <Section title="11. Changes to Terms">
          We may update these Terms at any time. Continued use of the Platform after changes constitutes acceptance of the revised Terms.
        </Section>

        <Section title="12. Contact">
          For questions about these Terms, contact us at{' '}
          <a href="mailto:legal@masterchefcuts.com" style={{ color: '#e74c3c' }}>legal@masterchefcuts.com</a>.
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
