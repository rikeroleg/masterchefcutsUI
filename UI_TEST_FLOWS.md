# MasterChef Cuts — Comprehensive UI Testing Flows

This document outlines all user interface flows and functional testing scenarios for the MasterChef Cuts application. It serves as a blueprint to systematically test and verify every module, from static public routes to role-specific functional processes.

## 1. Public & Static Navigation Scenarios
*Testing the foundation of the site available to unauthenticated users.*

- **Scenario 1.1 - Global Header navigation:** Navigate through Home, Shop, Listings, Demand, About, and FAQ via the top navigation bar. Verify active states.
- **Scenario 1.2 - Static pages:** View `/about`, `/faq`, `/terms`, `/privacy`, and `/contact`. Ensure content loads without error.
- **Scenario 1.3 - 404 Handling:** Navigate to an unknown route (e.g., `/nowhere`) to verify `<NotFoundPage />` rendering.
- **Scenario 1.4 - Responsive Menu:** Toggle the Hamburger menu on simulated mobile view; toggle sub-menus.

## 2. Authentication & User Onboarding
*Testing account creation, session management, and recovery.*

- **Scenario 2.1 - Buyer Registration:** Use `/login` to switch to Sign Up and create a `buyer` account. Validate redirect.
- **Scenario 2.2 - Farmer Registration:** Use `/login` to switch to Sign Up and create a `farmer` account.
- **Scenario 2.3 - Login / Logout:** Sign in with existing credentials, check token persistence, and sign out using the navigation dropdown `[Sign Out]`.
- **Scenario 2.4 - Email Verification:** View `/verify-email` flow simulate hash/token resolution.
- **Scenario 2.5 - Password Recovery:** Trigger `/forgot-password`, follow through to `/reset-password` (simulated callback token).

## 3. Core Buyer Workflows
*Testing the demand side: 3D modeling, adding to cart, requests, and checking out.*

- **Scenario 3.1 - 3D Shop Experience (`/shop`):** 
  - Toggle between Beef 🐄, Pork 🐷, and Lamb 🐑.
  - Interact with the Whole Animal Panel (WAP) on desktop and mobile.
- **Scenario 3.2 - Animal Request Modal:** Trigger "Request an Animal" from the Shop action chooser. Submit a request to the Demand Board.
- **Scenario 3.3 - Browse Listings (`/listings`):** View the grid of active farm offerings. Use search/filter features if implemented.
- **Scenario 3.4 - Listing Detail & Cart Addition (`/listings/:id`):** 
  - Open a specific listing.
  - Increment cuts and "Add to Cart".
- **Scenario 3.5 - Cart & Checkout (`/cart`):**
  - Verify line items, pricing, and totals.
  - Complete the checkout process (via the Stripe Mock local bypass).
- **Scenario 3.6 - Order Receipt (`/order/:id`):** Post-checkout verification of order summary and line items.
- **Scenario 3.7 - Messaging a Farmer:** From a listing or Farmer Profile, initiate a chat. Send and retrieve a message in `/messages`.
- **Scenario 3.8 - User Profile Management (`/profile`):** Update delivery address, view order history, edit personal info.
- **Scenario 3.9 - Referrals (`/refer`):** View referral code and logic.

## 4. Core Farmer Workflows
*Testing the supply side: Posting listings, managing demand, and profiles.*

- **Scenario 4.1 - Farm Profile (`/profile` & `/farmer/:id`):** Update farm bio, location, and verify public profile layout.
- **Scenario 4.2 - Post a Listing (`/post`):** Submit a new animal listing (e.g., Whole Pig or Angus Beef) with images, price per lb, and processing details.
- **Scenario 4.3 - Demand Board Review (`/demand`):** View requests posted by buyers.
- **Scenario 4.4 - Fulfill / Pitch to Demand:** Respond to a buyer's request if active.
- **Scenario 4.5 - Inbox Management (`/messages`):** Read and reply to inbound queries from prospective buyers.

## 5. Admin Workflows
*Administrative overview.*

- **Scenario 5.1 - Admin Dashboard (`/admin`):** Access user lists, orders, or app-wide metrics.
- **Scenario 5.2 - User Management (`/admin/user/:id`):** View specific user details and toggle account states (if implemented).

---

## Test Execution Checklist

To test these, we will execute automated browser steps against `http://localhost:5173`:
- [ ] Global Nav & Static content checks
- [ ] 3D Shop check
- [ ] Request Animal Modal & Demand Board
- [ ] Listings board
- [ ] Messages board
- [ ] Authentication recovery routes
- [ ] Admin panel (requires Admin user access or forced DB promotion)