import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/faq.css'

const SECTIONS = [
  {
    label: 'For Buyers',
    items: [
      {
        q: 'How does MasterChef Cuts work?',
        a: 'Local farmers and butchers list whole animals (beef, pork, lamb) on our platform. You browse nearby listings, claim a primal cut share, and pay securely. Once the animal is fully claimed, the butcher processes it and you collect your fresh cuts.',
      },
      {
        q: 'Is the meat safe and inspected?',
        a: 'Yes. All animals processed through MasterChef Cuts must be handled by USDA-licensed facilities or state-inspected processors. Farmers attest to this when listing. If you have questions about a specific listing, message the farmer directly.',
      },
      {
        q: 'What cuts do I get?',
        a: 'Each listing shows the available primal cuts — things like chuck, rib, loin, round, brisket, flank, shank, and more. You claim a specific cut, so you know exactly what you\'re getting before you pay.',
      },
      {
        q: 'How does pickup work?',
        a: 'The farmer sets a processing date and pickup location when posting their listing. You\'ll receive a notification when your order is ready. Coordinate directly with the farmer via our messaging system to arrange pickup.',
      },
      {
        q: 'What if the animal pool doesn\'t fill completely?',
        a: 'If a listing doesn\'t fill before the processing date, the farmer may extend the deadline or cancel the listing. If cancelled, you receive a full refund automatically. You can also join the waitlist on full listings.',
      },
      {
        q: 'Can I get a refund?',
        a: 'Yes. If a listing is cancelled by the farmer, you\'re refunded in full. If you have an issue with your order after delivery, use the Dispute button on your order page within 7 days of pickup to open a case.',
      },
    ],
  },
  {
    label: 'For Farmers',
    items: [
      {
        q: 'How do I list an animal?',
        a: 'Create a farmer account, complete Stripe Connect onboarding to receive payouts, then go to Post a Listing. Fill in the animal type, breed, live weight, available cuts, price per pound, your ZIP code, and processing date.',
      },
      {
        q: 'What\'s the platform commission?',
        a: 'MasterChef Cuts takes a small platform fee per order to cover payment processing and platform maintenance. The exact rate is shown during listing creation. You keep the rest, paid directly to your connected Stripe account.',
      },
      {
        q: 'How do payouts work?',
        a: 'Payouts are handled through Stripe Connect. Once an order is confirmed and the buyer marks receipt, funds are released to your connected bank account on Stripe\'s standard payout schedule (typically 2–7 business days).',
      },
      {
        q: 'Do I need to be USDA-licensed?',
        a: 'The processing facility you use must be USDA-inspected or state-approved for the meat to be legally sold. You are responsible for ensuring your processor meets all applicable regulations in your state.',
      },
    ],
  },
  {
    label: 'General',
    items: [
      {
        q: 'What is MasterChef Cuts?',
        a: 'MasterChef Cuts is a marketplace that connects local farmers and butchers directly with buyers. We make it easy to split whole animals with neighbors — lowering costs, reducing waste, and supporting local agriculture.',
      },
      {
        q: 'Where does MasterChef Cuts operate?',
        a: 'We currently operate across the United States. Listings are filtered by ZIP code so you only see animals available near you. We\'re actively growing — if there are no listings in your area yet, sign up for notifications.',
      },
      {
        q: 'How do I contact support?',
        a: 'Use the Contact page (linked below) to send us a message. We typically respond within 1 business day. For urgent order issues, use the Dispute button on your order page.',
      },
    ],
  },
]

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="faq-item">
      <button className="faq-question" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span>{q}</span>
        <span className={`faq-chevron${open ? ' faq-chevron--open' : ''}`}>▼</span>
      </button>
      <div className={`faq-answer${open ? ' faq-answer--open' : ''}`}>
        <p>{a}</p>
      </div>
    </div>
  )
}

export default function FaqPage() {
  return (
    <div className="faq-page">
      <div className="faq-inner">

        <div className="faq-hero">
          <span className="about-eyebrow">Help Center</span>
          <h1 className="faq-hero-title">Frequently Asked Questions</h1>
          <p className="faq-hero-sub">Everything you need to know about buying and selling on MasterChef Cuts.</p>
        </div>

        {SECTIONS.map(section => (
          <div key={section.label} className="faq-section">
            <span className="faq-section-title">{section.label}</span>
            {section.items.map(item => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        ))}

        <div className="faq-contact-cta">
          <h3>Still have questions?</h3>
          <p>Our support team is here to help with anything not covered above.</p>
          <Link to="/contact" className="faq-contact-btn">Contact Support →</Link>
        </div>

      </div>
    </div>
  )
}
