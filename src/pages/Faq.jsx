import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSEO, DEFAULT_OG_IMAGE, SITE_URL } from '../utils/seo'
import '../styles/faq.css'

const FAQS = [
  {
    category: 'Buying Meat',
    items: [
      {
        q: 'What is a "whole animal share"?',
        a: 'A whole animal share lets you buy a portion — whole, half, or quarter — of an animal directly from a local butcher. You split the cost and the cuts with other community members, getting farm-fresh meat at significantly lower prices than retail.',
      },
      {
        q: 'How much can I save compared to grocery stores?',
        a: 'Most participants save 30–50% versus supermarket prices. Because you\'re buying direct and in bulk, there\'s no retail markup. Exact savings depend on the animal type and your share size.',
      },
      {
        q: 'Do I need a large freezer?',
        a: 'A standard chest or upright freezer (5–7 cubic feet) comfortably holds a quarter share. Half and whole shares benefit from a larger dedicated freezer. Most butchers can advise on packaging and storage.',
      },
      {
        q: 'Can I choose my specific cuts?',
        a: 'Cut selection depends on the butcher. Many listings let you customize cuts at checkout or allow you to message the farmer directly. Look for the "custom cuts" tag on a listing.',
      },
      {
        q: 'What if the pool doesn\'t fill?',
        a: 'If a listing doesn\'t reach the minimum claims before the closing date, the butcher may extend it or cancel it. Any holds on your payment are released immediately on cancellation.',
      },
    ],
  },
  {
    category: 'For Farmers & Butchers',
    items: [
      {
        q: 'How do I post a listing?',
        a: 'Create a Farmer account, go to Post a Listing, and fill in the animal details — type, breed, weight, price per lb, processing date, and photos. Your listing goes live after admin approval (usually within 24 hours).',
      },
      {
        q: 'When do I receive payment?',
        a: 'Payments are released to your Stripe account within 2 business days after all participants in a pool have confirmed receipt of their orders.',
      },
      {
        q: 'What is the platform fee?',
        a: 'MasterChef Cuts charges a small percentage service fee per completed transaction. The exact rate is displayed when you create a listing. There are no monthly subscription fees.',
      },
      {
        q: 'Can I list multiple animals at once?',
        a: 'Yes — you can have multiple active listings simultaneously. Each listing is managed independently with its own pool and processing date.',
      },
    ],
  },
  {
    category: 'Orders & Payments',
    items: [
      {
        q: 'What payment methods are accepted?',
        a: 'We accept all major credit and debit cards (Visa, Mastercard, Amex, Discover) processed securely via Stripe. We do not store card information on our servers.',
      },
      {
        q: 'Can I cancel or modify my claim?',
        a: 'You can cancel your claim before the listing\'s closing date from your Cart page. After the pool has closed and processing is underway, cancellations are at the butcher\'s discretion.',
      },
      {
        q: 'What if there\'s a problem with my order?',
        a: 'Use the Dispute button on your order receipt. Our team reviews disputes within 48 hours and works with both parties to reach a fair resolution.',
      },
      {
        q: 'Is my payment information secure?',
        a: 'Yes. All payments are processed by Stripe, which is PCI-DSS Level 1 certified. MasterChef Cuts never sees or stores your full card number.',
      },
    ],
  },
  {
    category: 'Account & Profile',
    items: [
      {
        q: 'How do I reset my password?',
        a: 'Click "Forgot password?" on the login page and enter your email. You\'ll receive a reset link within a few minutes. Check your spam folder if you don\'t see it.',
      },
      {
        q: 'Can I have both a buyer and farmer account?',
        a: 'Each email address is linked to one role. If you want to both buy and sell, contact us at support@masterchefcuts.com and we can discuss your options.',
      },
      {
        q: 'How does the referral program work?',
        a: 'Share your unique referral link from the Referrals page. When a friend signs up and completes their first purchase, both of you earn a credit toward your next order.',
      },
    ],
  },
]

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`faq-item${open ? ' faq-item--open' : ''}`}>
      <button className="faq-question" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span>{q}</span>
        <span className="faq-chevron">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="faq-answer"><p>{a}</p></div>}
    </div>
  )
}

export default function FAQ() {
  useSEO({
    title: 'FAQ — MasterChef Cuts',
    description: 'Answers to common questions about buying whole-animal shares, posting listings, payments, and accounts on MasterChef Cuts.',
    image: DEFAULT_OG_IMAGE,
    url: '/faq',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      name: 'MasterChef Cuts FAQ',
      url: `${SITE_URL}/faq`,
      mainEntity: FAQS.flatMap(cat =>
        cat.items.map(item => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        }))
      ),
    },
  })

  return (
    <div className="faq-page">
      <div className="faq-hero">
        <span className="faq-eyebrow">Help Center</span>
        <h1 className="faq-title">Frequently Asked Questions</h1>
        <p className="faq-sub">
          Can't find your answer?{' '}
          <Link to="/contact" className="faq-sub-link">Contact us</Link> and we'll get back to you.
        </p>
      </div>

      <div className="faq-body">
        {FAQS.map(cat => (
          <section key={cat.category} className="faq-section">
            <h2 className="faq-category">{cat.category}</h2>
            <div className="faq-list">
              {cat.items.map(item => (
                <FAQItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="faq-cta">
        <p>Still have questions?</p>
        <Link to="/contact" className="faq-cta-btn">Get in Touch →</Link>
      </div>
    </div>
  )
}
