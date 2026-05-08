# MasterChef Cuts — Comprehensive UI Testing Flows

## Testing Standard

**Every interactable element on every screen must be clicked and tested.** This means every button, link, nav item, tab, toggle, dropdown option, checkbox, form field, accordion item, filter chip, and icon button — not just the happy path. Each item below is a required action, not a suggestion. If an element exists on screen, it must be exercised.

After completing any action, verify:
- The UI responds correctly (state change, navigation, modal open/close, error message, success state)
- No console errors beyond expected 500s from the offline backend
- No blank/broken screens or unhandled exceptions

---

## 1. Global Header (`/` and all routes)

Test on every page — the header is persistent.

### 1.1 Logo / Brand link
- [ ] Click the "MasterChef Cuts" logo — must navigate to `/`

### 1.2 Nav links (unauthenticated)
- [ ] Click **Home** — navigates to `/`, link shows active state
- [ ] Click **Shop** — navigates to `/shop`, link shows active state
- [ ] Click **Cart** — navigates to `/cart`, link shows active state
- [ ] Click **Listings** — navigates to `/listings`, link shows active state
- [ ] Click **Demand** — navigates to `/demand`, link shows active state
- [ ] Click **About** — navigates to `/about`, link shows active state
- [ ] Click **FAQ** — navigates to `/faq`, link shows active state
- [ ] Click **Sign In** — navigates to `/login`, link shows active state

### 1.3 Nav links (authenticated — BUYER)
All of the above, plus:
- [ ] **Messages** link appears and navigates to `/messages`
- [ ] **Notification Bell** icon appears and is clickable (opens notification panel)
- [ ] **Avatar chip** (user initials) appears and navigates to `/profile`
- [ ] **Sign Out** button is present — click it, verify logout (token cleared, redirected to `/`)

### 1.4 Nav links (authenticated — FARMER)
All BUYER links, plus:
- [ ] **Post** link appears and navigates to `/post`

### 1.5 Nav links (authenticated — ADMIN)
All BUYER links, plus:
- [ ] **Admin** link appears and navigates to `/admin`

### 1.6 Hamburger menu (mobile viewport ≤768px)
- [ ] Resize to mobile width — desktop nav links must collapse
- [ ] Click **☰ hamburger icon** — mobile menu opens
- [ ] All nav links are visible inside the open menu — click each one to verify navigation
- [ ] Click **✕ close icon** — menu closes
- [ ] Navigate to any page — menu auto-closes on route change

---

## 2. Footer (all non-shop routes)

### 2.1 Marketplace column links
- [ ] **Browse Listings** → `/listings`
- [ ] **Demand Board** → `/demand`
- [ ] **3D Shop** → `/shop`
- [ ] **About** → `/about`

### 2.2 Account column links
- [ ] **My Profile** → `/profile`
- [ ] **Sign In / Register** → `/login`
- [ ] **Post a Listing** → `/post`

### 2.3 Legal column links
- [ ] **Terms of Service** → `/terms`
- [ ] **Privacy Policy** → `/privacy`

### 2.4 Support column links
- [ ] **FAQ / Help Center** → `/faq`
- [ ] **Contact Us** → `/contact`

---

## 3. Cookie Consent Bar

Appears on first visit (localStorage key `mc_cookie_ok` not set). Clear localStorage to force it to show.

- [ ] Bar is visible at the bottom of the screen on first load
- [ ] **Privacy Policy** link inside the bar — navigates to `/privacy`
- [ ] Click **Got it** button — bar disappears immediately
- [ ] Reload the page — bar does NOT reappear (localStorage persisted)

---

## 4. Home Page (`/`)

### 4.1 Hero section
- [ ] Click **Find Meat Near Me** button — navigates to `/listings`
- [ ] Click **List an Animal →** button — navigates to `/post` (or `/login` if unauthenticated)
- [ ] Verify active listings and cuts available stats load (or show `—` if backend offline)

### 4.2 "Who are you?" section
- [ ] Click **🛒 I'm a Participant** card — navigates to `/listings`
- [ ] Click **🌾 I'm a Farmer / Butcher** card — navigates to `/post` (or `/login` if unauthenticated)

### 4.3 CTA section
- [ ] Click **Browse Animals →** link — navigates to `/listings`
- [ ] Click **Learn more** link — navigates to `/about`

---

## 5. 3D Shop (`/shop`)

### 5.1 Animal toggle buttons
- [ ] Click **🐄 Beef** — becomes active, WAP updates to beef weights, 3D model switches to cow
- [ ] Click **🐷 Pork** — becomes active, WAP updates to pork weights, 3D model switches to pig
- [ ] Click **🐑 Lamb** — becomes active, WAP updates to lamb weights, 3D model switches to lamb

### 5.2 Whole Animal Panel (WAP) — each animal
For each of Beef / Pork / Lamb:
- [ ] Click **Whole** tier → **Claim** button — opens Request Modal (or sign-in prompt if unauthenticated)
- [ ] Click **Half** tier → **Claim** button — opens Request Modal (or sign-in prompt)
- [ ] Click **Quarter** tier → **Claim** button — opens Request Modal (or sign-in prompt)

### 5.3 Action chooser
- [ ] Click **📋 Browse Listings** card — navigates to `/listings`
- [ ] Click **✏️ Request an Animal** button — opens Animal Request Modal

### 5.4 Mobile toggles (mobile viewport)
- [ ] Click **🐄 WAP toggle** button — Whole Animal Panel opens/closes
- [ ] Click **📋 Chooser toggle** button — action chooser opens/closes
- [ ] Verify only one panel is open at a time (toggling one closes the other)

### 5.5 3D model
- [ ] Drag on the canvas — model rotates
- [ ] Scroll on the canvas — model zooms in/out
- [ ] "Drag to rotate · Scroll to zoom" hint is visible

---

## 6. Animal Request Modal

Triggered from Shop or Demand Board. Requires BUYER auth.

### 6.1 Unauthenticated state
- [ ] Modal opens showing "You need to be signed in as a participant"
- [ ] Click **Sign In →** button — navigates to `/login`, modal closes

### 6.2 Authenticated BUYER state
- [ ] **Animal type** selector — click each option (Beef, Pork, Lamb), verify selection changes
- [ ] **Breed** text field — type a value, verify input accepted
- [ ] **Desired cuts** field — add cut labels, verify they appear as tags/chips
- [ ] **Notes** textarea — type text, verify input accepted
- [ ] Click **Submit Request** — posts to `/api/animal-requests`, shows success or error
- [ ] Click **✕ close** button — modal closes without submitting
- [ ] Click outside the modal — modal closes

---

## 7. Browse Listings (`/listings`)

### 7.1 View toggle
- [ ] Click **☰ Grid** button — listings display as grid
- [ ] Click **🗺 Map** button — map view renders (Leaflet map appears)

### 7.2 Search and filters
- [ ] Type in **Search breed, farm, description…** field — listing results filter live or on enter
- [ ] Type in **ZIP code** field — enter a valid ZIP
- [ ] Change **Search radius** dropdown — select 25 mi, 50 mi, 100 mi options
- [ ] Click **All** animal filter — shows all listings
- [ ] Click **🐄 Beef** filter chip — filters to beef only
- [ ] Click **🐷 Pork** filter chip — filters to pork only
- [ ] Click **🐑 Lamb** filter chip — filters to lamb only
- [ ] Click **⋯ Filters** button — opens extended filter panel (if implemented)
- [ ] Clear / reset filters — results return to unfiltered state

### 7.3 Listing cards
- [ ] Click a listing card — navigates to `/listings/:id`
- [ ] If pagination exists: click **Next page** / **Previous page** controls

### 7.4 Error / empty states
- [ ] With backend offline: verify "Request failed (500)" message appears, no crash
- [ ] Dismiss error alert with **✕** button — alert disappears

---

## 8. Listing Detail (`/listings/:id`)

### 8.1 Cuts panel
- [ ] For each available cut row: click **+ increment** button — count increases
- [ ] Click **− decrement** button — count decreases (does not go below 0)
- [ ] Click **Add to Cart** / **Claim** button — adds cut to cart (or prompts login if unauthenticated)

### 8.2 Reviews section
- [ ] If reviews exist: verify star ratings and text display
- [ ] Click **Submit Review** button (authenticated BUYER, post-purchase) — opens review form

### 8.3 Comments section
- [ ] Click **Post Comment** button (authenticated) — submits comment
- [ ] Verify existing comments display

### 8.4 Farmer profile link
- [ ] Click **farmer name / farm link** — navigates to `/farmer/:id`

### 8.5 Waitlist
- [ ] If listing is FULLY_CLAIMED: click **Join Waitlist** button — posts to waitlist API
- [ ] Click **Leave Waitlist** — removes from waitlist

### 8.6 Image
- [ ] Listing image loads (or shows placeholder if no image)

### 8.7 Back navigation
- [ ] Click **← Back to Listings** link — navigates to `/listings`

---

## 9. Cart (`/cart`)

### 9.1 Empty state
- [ ] Click **← Browse Listings** link — navigates to `/listings`
- [ ] Click **Browse Shop →** link — navigates to `/shop`

### 9.2 With items in cart (add items first via Listing Detail)
- [ ] Each cart line item displays: animal name, cut, weight, price
- [ ] Click **Remove** / **✕** button on a line item — item removed from cart, total updates
- [ ] Verify **Subtotal** and **Total** update correctly after removal
- [ ] Click **Checkout** / **Place Order** button — opens Stripe payment form (or mock flow)
- [ ] In Stripe form: enter test card `4242 4242 4242 4242`, exp `12/28`, CVC `123`
- [ ] Click **Pay** — processes payment, redirects to `/order/:id`

---

## 10. Order Receipt (`/order/:id`)

- [ ] Order ID, date, and status display correctly
- [ ] Line items (cut names, weights, prices) all render
- [ ] Subtotal and total match cart values
- [ ] Delivery address shown (if collected)
- [ ] Click **← Back to Home** or **Browse More** link — navigates away from receipt
- [ ] Click **File a Dispute** button (if present) — opens dispute form

---

## 11. Login Page (`/login`)

### 11.1 Sign In tab
- [ ] **Sign In** tab is active by default
- [ ] Click inside **Email** field — focused, accepts input
- [ ] Click inside **Password** field — accepts input, characters masked
- [ ] Click **Forgot password?** link — navigates to `/forgot-password`
- [ ] Click **Sign In →** button with empty fields — shows validation error(s)
- [ ] Click **Sign In →** with valid credentials — authenticates, redirects to home
- [ ] Click **Create one** link — switches to Create Account tab

### 11.2 Create Account tab
- [ ] Click **Create Account** tab button — form switches to registration view
- [ ] Click **🛒 Participant** role button — buyer fields shown
- [ ] Click **🌾 Farmer / Butcher** role button — farmer-specific fields appear (Shop name, Business Address)
- [ ] Fill **Full name**, **Email**, **ZIP Code**, **Password**, **Confirm password** fields
- [ ] Check **Terms & Conditions** checkbox — checkbox becomes checked
- [ ] Click **Terms & Conditions** button (inline) — opens terms modal or navigates to `/terms`
- [ ] Click **Create Account →** with empty fields — shows validation error(s)
- [ ] Click **Create Account →** with valid data — registers, redirects
- [ ] Click **Sign in** link at bottom — switches back to Sign In tab

---

## 12. Forgot Password (`/forgot-password`)

- [ ] Click inside **Email** field — accepts input
- [ ] Click **Send Reset Link** with empty field — shows validation error
- [ ] Click **Send Reset Link** with a valid email — shows success message ("Check your email")
- [ ] Click **Back to sign in** link — navigates to `/login`

---

## 13. Reset Password (`/reset-password?token=...`)

- [ ] Click inside **New password** field — accepts input, masked
- [ ] Click inside **Confirm password** field — accepts input, masked
- [ ] Click **Reset Password** with mismatched passwords — shows validation error
- [ ] Click **Reset Password** with matching valid passwords — submits, shows success or error from API
- [ ] Click **Back to sign in** link (if present) — navigates to `/login`

---

## 14. Verify Email (`/verify-email?token=...`)

### 14.1 Invalid / expired token (backend offline)
- [ ] Error state renders: "Verification failed" heading + error message
- [ ] Click inside **Your email address** field in the resend section — accepts input
- [ ] Click **Resend verification email** button — submits resend request, shows result
- [ ] Click **Back to Sign In** link — navigates to `/login`

### 14.2 Valid token (with backend running)
- [ ] Success state renders: "Email verified!" heading
- [ ] Click **Go to Sign In** / **Continue** button — navigates to `/login`

---

## 15. About Page (`/about`)

- [ ] All content sections render without error
- [ ] Any links within content — click each one, verify navigation target
- [ ] **Browse Listings →** or CTA buttons — click and verify navigation

---

## 16. FAQ Page (`/faq`)

- [ ] Page loads with all category sections visible: "Buying Meat", "For Farmers & Butchers", "Orders & Payments", "Account & Profile"
- [ ] Click every **accordion question button** — answer expands, chevron flips to ▲
- [ ] Click an expanded accordion item again — answer collapses, chevron returns to ▼
- [ ] Verify only intended items expand (no layout breaks on multiple open items)
- [ ] Click **Contact us** link in the header paragraph — navigates to `/contact`
- [ ] Click **Get in Touch →** link at the bottom — navigates to `/contact`

---

## 17. Contact Page (`/contact`)

- [ ] Click inside **Your name** field — accepts input
- [ ] Click inside **Email address** field — accepts input
- [ ] Click **Subject** dropdown — all options selectable: "I have a question about an order", "I need help with a dispute", "I have a question about my account", "I'm a farmer and need help with a listing", "Payment / payout issue", "Report a bug or technical issue", "Other"
- [ ] Click inside **Message** textarea — accepts input
- [ ] Click **Send Message** with empty fields — shows validation error(s)
- [ ] Click **Send Message** with all fields filled — submits to `/api/contact`, shows success or error
- [ ] Click **← Back to FAQ** link — navigates to `/faq`

---

## 18. Terms of Service (`/terms`)

- [ ] All 12 sections render
- [ ] Click **legal@masterchefcuts.com** mailto link — opens email client

---

## 19. Privacy Policy (`/privacy`)

- [ ] All 11 sections render
- [ ] Click **stripe.com/privacy** external link — opens in new tab
- [ ] Click **privacy@masterchefcuts.com** mailto link — opens email client

---

## 20. Demand Board (`/demand`)

### 20.1 Filter tabs
- [ ] Click **All** animal filter — shows all requests
- [ ] Click **🐄 Beef** filter — filters to beef requests
- [ ] Click **🐷 Pork** filter — filters to pork requests
- [ ] Click **🐑 Lamb** filter — filters to lamb requests
- [ ] Click **Open** status tab — shows open requests only
- [ ] Click **Fulfilled** status tab — shows fulfilled requests only
- [ ] Click **All** status tab — shows all requests

### 20.2 Request cards (if data present)
- [ ] For each card: verify animal type, breed, cut labels, status badge render
- [ ] Click **Fulfill** button (FARMER only) — sends fulfill request to API

### 20.3 "+ Request an Animal" button
- [ ] Click button — opens Animal Request Modal (or sign-in prompt if unauthenticated)

### 20.4 Error / empty state
- [ ] With backend offline: "Request failed (500)" message shows, no crash

---

## 21. Messages (`/messages`)

### 21.1 Unauthenticated
- [ ] "Sign in to view your messages" text visible
- [ ] Click **Sign In →** link — navigates to `/login`

### 21.2 Authenticated
- [ ] Thread list renders (or empty state if no messages)
- [ ] Click a thread — opens conversation view on the right
- [ ] Click inside message compose box — accepts input
- [ ] Click **Send** button — posts message, message appears in thread
- [ ] Click **Mark as read** on unread message (if applicable)
- [ ] Notification badge on nav bell updates after new message

---

## 22. Profile (`/profile`)

### 22.1 Unauthenticated
- [ ] "You are not signed in." message visible
- [ ] Click **Sign In →** link — navigates to `/login`

### 22.2 Authenticated — BUYER
- [ ] Profile info (name, email, role) renders
- [ ] Click **Edit** button — form fields become editable
- [ ] Modify **name** / **delivery address** fields
- [ ] Click **Save** — submits PATCH to `/api/auth/me`, shows success
- [ ] Click **Cancel** — discards changes, returns to read-only view
- [ ] Order history section renders (or "No orders yet" empty state)
- [ ] Click an order in history — navigates to `/order/:id`
- [ ] Click **Refer a Friend** / referral link — navigates to `/refer`
- [ ] **Danger Zone**: Click **Delete Account** button — shows confirmation dialog
- [ ] Click **Cancel** in confirmation — dialog closes, account not deleted

### 22.3 Authenticated — FARMER
All BUYER actions plus:
- [ ] **Shop name** and **bio** fields editable
- [ ] **Stripe Connect** status banner visible
- [ ] Click **Set Up Payouts** / **Go to Dashboard** button — calls `/api/connect/onboard` or `/api/connect/dashboard`
- [ ] Click **My Listings** tab or section — shows farmer's own listings
- [ ] Click a listing in the list — navigates to `/listings/:id`

---

## 23. Referral Page (`/refer`)

### 23.1 Unauthenticated
- [ ] "Sign in to get your personal referral link." message visible
- [ ] Click **Sign In →** link — navigates to `/login`

### 23.2 Authenticated
- [ ] Referral code / link renders
- [ ] Click **Copy** button — code copied to clipboard, button shows "Copied!" feedback
- [ ] Referral stats (invited, joined) display

---

## 24. Post a Listing (`/post`) — FARMER only

### 24.1 Unauthenticated or non-FARMER
- [ ] Navigating to `/post` redirects to `/login`

### 24.2 Authenticated FARMER
- [ ] **Animal type** selector — click Beef, Pork, Lamb — selection changes
- [ ] **Breed** text field — accepts input
- [ ] **Live weight (lbs)** field — accepts numeric input
- [ ] **Price per lb ($)** field — accepts decimal input
- [ ] **ZIP code** field — accepts 5-digit input
- [ ] **Processing date** date picker — click, select a future date
- [ ] **Description** textarea — accepts text
- [ ] **Upload Photo** button — opens file chooser, select an image
- [ ] **Cuts section** — click **Add Cut** button — new cut row appears
  - [ ] Fill **cut label** field
  - [ ] Fill **weight** field
  - [ ] Click **Remove** on a cut row — row disappears
- [ ] Click **Submit Listing** with empty required fields — shows validation errors
- [ ] Click **Submit Listing** with all valid fields — posts to `/api/listings`, shows success or error

---

## 25. Farmer Profile Public Page (`/farmer/:id`)

- [ ] Farm name, bio, and certifications render
- [ ] Listing cards for this farmer render (or empty state)
- [ ] Click a listing card — navigates to `/listings/:id`
- [ ] Reviews for this farmer display (or empty state)
- [ ] Click **Message Farmer** button — navigates to `/messages?with=:id` or opens compose view

---

## 26. Admin Dashboard (`/admin`)

### 26.1 Unauthenticated or non-ADMIN
- [ ] Navigating to `/admin` redirects to `/login`

### 26.2 Authenticated ADMIN
- [ ] Stats panel renders (total users, listings, orders, revenue)
- [ ] **Users tab**: user list renders with name, email, role, approved status
  - [ ] Click **Approve** button on a FARMER — sends PATCH to `/api/admin/users/:id/approve`
  - [ ] Click **Reject** button on a FARMER — sends PATCH to `/api/admin/users/:id/reject`
  - [ ] Click a user row or **View** button — navigates to `/admin/user/:id`
- [ ] **Listings tab**: all listings render
  - [ ] Click **Delete** button on a listing — sends DELETE to `/api/admin/listings/:id`, listing removed
- [ ] **Orders tab**: order list renders
  - [ ] Click **Refund** button on an order — sends POST to `/api/admin/orders/:id/refund`
- [ ] **Disputes tab**: dispute list renders
  - [ ] Click **Resolve** button on a dispute — sends POST to `/api/admin/disputes/:id/resolve`
- [ ] **Reviews tab**: review list renders
  - [ ] Click **Feature** / **Unfeature** toggle on a review — sends POST to `/api/admin/reviews/:id/feature`

---

## 27. Admin User Detail (`/admin/user/:id`)

- [ ] User's full profile renders (name, email, role, approved, spend, referral stats)
- [ ] Click **← Back to Admin** link — navigates to `/admin`
- [ ] Any action buttons (Approve / Reject / Promote) — click each and verify API call result

---

## 28. 404 Not Found

- [ ] Navigate to `/nowhere` or any unknown route
- [ ] "404 — Page Not Found" heading renders
- [ ] Themed message ("This pasture doesn't exist.") renders
- [ ] Click **← Back to Home** link — navigates to `/`

---

## 29. Error Boundary

- [ ] If a page-level JS error is thrown (can be simulated by corrupting a prop), the `<ErrorBoundary>` fallback renders instead of a blank screen
- [ ] Fallback shows a recoverable error message and a reload / home link

---

## Test Execution Checklist

Run against `http://localhost:5173`. Tick each box only after physically clicking/interacting with the element and verifying the expected outcome.

### Phase 1 — Unauthenticated walkthrough
- [ ] Cookie consent bar (Section 3)
- [ ] Header nav — all links (Section 1.2)
- [ ] Footer — all links (Section 2)
- [ ] Home page — all buttons and links (Section 4)
- [ ] Shop — all animal toggles, WAP claim buttons, action chooser, mobile toggles (Section 5)
- [ ] Animal Request Modal — unauthenticated path (Section 6.1)
- [ ] Listings — view toggle, all filters, search, error dismiss (Section 7)
- [ ] Cart — empty state links (Section 9.1)
- [ ] Login — Sign In tab all elements, Create Account tab all elements, role toggle (Section 11)
- [ ] Forgot Password — all elements (Section 12)
- [ ] Reset Password — all elements (Section 13)
- [ ] Verify Email — bad token path all elements (Section 14.1)
- [ ] FAQ — every accordion item open/close (Section 16)
- [ ] Contact — all fields, subject dropdown options, submit (Section 17)
- [ ] About — all links (Section 15)
- [ ] Terms — all sections render, mailto link (Section 18)
- [ ] Privacy — all sections render, external links (Section 19)
- [ ] Demand Board — all filters, request button unauthenticated (Section 20)
- [ ] Messages — unauthenticated state (Section 21.1)
- [ ] Profile — unauthenticated state (Section 22.1)
- [ ] Referral — unauthenticated state (Section 23.1)
- [ ] `/post` — redirects to `/login` (Section 24.1)
- [ ] `/admin` — redirects to `/login` (Section 26.1)
- [ ] 404 page (Section 28)
- [ ] Hamburger menu on mobile viewport (Section 1.6)

### Phase 2 — Authenticated BUYER walkthrough
- [ ] Register as BUYER and confirm redirect (Section 11.2)
- [ ] Header nav — authenticated links, notification bell, avatar, Sign Out (Section 1.3)
- [ ] Animal Request Modal — authenticated path, all fields, submit, close (Section 6.2)
- [ ] Listing Detail — cut quantity controls, Add to Cart, farmer link, waitlist (Section 8)
- [ ] Cart — with items: remove item, checkout flow, Stripe test card (Section 9.2)
- [ ] Order Receipt — all elements (Section 10)
- [ ] Messages — thread list, open thread, compose, send message (Section 21.2)
- [ ] Profile — edit form, save, cancel, order history, referral link, danger zone (Section 22.2)
- [ ] Referral page — code display, copy button (Section 23.2)

### Phase 3 — Authenticated FARMER walkthrough
- [ ] Register as FARMER and confirm redirect (Section 11.2)
- [ ] Header nav — Post link visible (Section 1.4)
- [ ] Post a Listing — all fields, add/remove cuts, upload image, submit (Section 24.2)
- [ ] Demand Board — Fulfill button on a request (Section 20.2)
- [ ] Profile — shop name, bio, Stripe Connect status, my listings section (Section 22.3)
- [ ] Farmer Profile public page — all elements (Section 25)

### Phase 4 — Authenticated ADMIN walkthrough
- [ ] Header nav — Admin link visible (Section 1.5)
- [ ] Admin Dashboard — stats, users tab (approve/reject/view), listings tab (delete), orders tab (refund), disputes tab (resolve), reviews tab (feature) (Section 26.2)
- [ ] Admin User Detail — full profile, back link, action buttons (Section 27)