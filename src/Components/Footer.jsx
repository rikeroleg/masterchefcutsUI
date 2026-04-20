import React from 'react'
import { Link } from 'react-router-dom'
import '../styles/footer.css'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">

        {/* Brand */}
        <div className="footer-brand">
          <span className="footer-brand-name">MasterChef Cuts</span>
          <p className="footer-brand-tagline">Farm-fresh meat, direct from local butchers.</p>
        </div>

        {/* Navigation */}
        <div className="footer-col">
          <h4 className="footer-col-title">Marketplace</h4>
          <Link to="/listings" className="footer-link">Browse Listings</Link>
          <Link to="/demand" className="footer-link">Demand Board</Link>
          <Link to="/shop" className="footer-link">3D Shop</Link>
          <Link to="/about" className="footer-link">About</Link>
        </div>

        {/* Account */}
        <div className="footer-col">
          <h4 className="footer-col-title">Account</h4>
          <Link to="/profile" className="footer-link">My Profile</Link>
          <Link to="/login" className="footer-link">Sign In / Register</Link>
          <Link to="/post" className="footer-link">Post a Listing</Link>
        </div>

        {/* Legal */}
        <div className="footer-col">
          <h4 className="footer-col-title">Legal</h4>
          <Link to="/terms" className="footer-link">Terms of Service</Link>
          <Link to="/privacy" className="footer-link">Privacy Policy</Link>
        </div>

        {/* Support */}
        <div className="footer-col">
          <h4 className="footer-col-title">Support</h4>
          <Link to="/faq" className="footer-link">FAQ</Link>
          <Link to="/contact" className="footer-link">Contact Us</Link>
        </div>

      </div>

      <div className="footer-bottom">
        <span>© {year} MasterChef Cuts. All rights reserved.</span>
        <span className="footer-bottom-sep">·</span>
        <span>Farm-to-table, direct from the source.</span>
      </div>
    </footer>
  )
}
