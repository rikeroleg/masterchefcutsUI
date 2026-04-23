import { OrbitControls, Center, Bounds } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate, Routes, Route } from "react-router-dom";
import { Beef, ShoppingCart, Home, Info, LayoutList, ClipboardList, MessageSquare, PlusCircle, UserCircle2, Menu, X } from "lucide-react";
import { Cow }  from "./Components/3DModel/cow/Cow";
import { Pig }  from "./Components/3DModel/pig/Pig";
import { Lamb } from "./Components/3DModel/lamb/Lamb";
import { api } from './api/client';
import CartPage from "./pages/Cart";
import AboutPage from "./pages/About";
import HomePage from "./pages/Home";
import ListingsPage from "./pages/Listings";
import ListingDetailPage from "./pages/ListingDetail";
import LoginPage from "./pages/Login";
import ProfilePage from "./pages/Profile";
import PostListingPage from "./pages/PostListing";
import ForgotPasswordPage from "./pages/ForgotPassword";
import ResetPasswordPage from "./pages/ResetPassword";
import AdminPage from "./pages/Admin";
import AdminUserDetailPage from "./pages/AdminUserDetail";
import DemandBoardPage from "./pages/DemandBoard";
import NotFoundPage from "./pages/NotFound";
import FarmerProfilePage from "./pages/FarmerProfile";
import TermsPage from "./pages/Terms";
import PrivacyPage from "./pages/Privacy";
import OrderReceiptPage from "./pages/OrderReceipt";
import MessagesPage from "./pages/Messages";
import ReferralPage from "./pages/Referral"
import VerifyEmailPage from "./pages/VerifyEmail"
import ContactPage from "./pages/Contact"
import FAQPage from "./pages/FAQ"
import ErrorBoundary from "./Components/ErrorBoundary";
import Footer from "./Components/Footer";
import NotificationBell from "./Components/NotificationBell";
import AnimalRequestModal from "./Components/AnimalRequestModal";
import { useAuth } from "./context/AuthContext";
import { useCart } from "./context/CartContext";
import { shopBridge } from './context/CartContext';
import { WholeAnimalPanel } from "./Components/WholeAnimalPanel";
import './App.css';

const ANIMALS = [
  { id: 'beef', label: 'Beef', emoji: '🐄' },
  { id: 'pork', label: 'Pork', emoji: '🐷' },
  { id: 'lamb', label: 'Lamb', emoji: '🐑' },
];

// Maps 3D cut IDs → display labels sent to backend
const CUTS_ID_TO_LABEL = {
  beef: { chuck: 'Chuck', rib: 'Rib', shortloin: 'Short Loin', sirloin: 'Sirloin', round: 'Round', brisket: 'Brisket', plate: 'Plate', flank: 'Flank', shank: 'Shank' },
  pork: { shoulder: 'Shoulder', loin: 'Loin', belly: 'Belly', ham: 'Ham', jowl: 'Jowl', hock: 'Hock' },
  lamb: { shoulder: 'Shoulder', rack: 'Rack', loin: 'Loin', leg: 'Leg', breast: 'Breast & Flank', shank: 'Shank' },
};

// Maps lowercased request cutLabels → 3D cut IDs
const LABEL_TO_CUT_ID = {
  beef: { chuck: 'chuck', rib: 'rib', 'short loin': 'shortloin', sirloin: 'sirloin', loin: 'shortloin', round: 'round', brisket: 'brisket', plate: 'plate', flank: 'flank', shank: 'shank' },
  pork: { shoulder: 'shoulder', loin: 'loin', belly: 'belly', leg: 'ham', 'leg (ham)': 'ham', ham: 'ham', jowl: 'jowl', hock: 'hock' },
  lamb: { shoulder: 'shoulder', rack: 'rack', loin: 'loin', leg: 'leg', breast: 'breast', 'breast & flank': 'breast', shank: 'shank' },
};

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeAnimal, setActiveAnimal] = useState('beef');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [wapOpen, setWapOpen] = useState(false);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [requestPayload, setRequestPayload] = useState(null);
  // Edit-request mode
  const [shopEditMode, setShopEditMode] = useState(false);
  const [editRequest, setEditRequest] = useState(null);
  const [editCutIds, setEditCutIds] = useState(new Set());
  const [editSaving, setEditSaving] = useState(false);
  const processedEditRef = useRef(null);

  // Wire up shopBridge synchronously during render
  shopBridge.openRequestModal = (payload) => { setRequestPayload(payload || null); setShowRequestModal(true); };
  shopBridge.editMode = shopEditMode;
  shopBridge.editCutIds = editCutIds;
  shopBridge.toggleEditCut = (cutId) => {
    setEditCutIds(prev => {
      const next = new Set(prev);
      if (next.has(cutId)) next.delete(cutId); else next.add(cutId);
      return next;
    });
  };

  const { totalItems } = useCart();
  const { user, logout } = useAuth();
  const isShop = location.pathname === '/shop';

  // Enter edit mode when navigated from DemandBoard
  useEffect(() => {
    const req = location.state?.editRequest;
    if (!req || processedEditRef.current === req.id) return;
    processedEditRef.current = req.id;
    const animalKey = req.animalType === 'BEEF' ? 'beef' : req.animalType === 'PORK' ? 'pork' : 'lamb';
    setActiveAnimal(animalKey);
    const initialIds = new Set(
      (req.cutLabels || []).map(lbl => LABEL_TO_CUT_ID[animalKey]?.[lbl.toLowerCase()]).filter(Boolean)
    );
    setEditCutIds(initialIds);
    setEditRequest(req);
    setShopEditMode(true);
  }, [location.state]);

  async function saveEditRequest() {
    if (!editRequest) return;
    setEditSaving(true);
    try {
      const cutLabels = Array.from(editCutIds)
        .map(id => CUTS_ID_TO_LABEL[activeAnimal]?.[id])
        .filter(Boolean);
      await api.patch(`/api/animal-requests/${editRequest.id}`, {
        animalType: editRequest.animalType,
        breed: editRequest.breed,
        zipCode: editRequest.zipCode,
        description: editRequest.description || '',
        cutLabels,
      });
      cancelEditMode();
    } catch (err) {
      console.error('Failed to save edit:', err);
    } finally {
      setEditSaving(false);
    }
  }

  function cancelEditMode() {
    setShopEditMode(false);
    setEditRequest(null);
    setEditCutIds(new Set());
    processedEditRef.current = null;
    navigate('/demand');
  }

  useEffect(() => { setMenuOpen(false) }, [location.pathname]);

  return (
    <>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100vw', height: isShop ? '100vh' : 'auto', overflow: isShop ? 'hidden' : 'visible', background: 'transparent', position: 'relative' }}>

      {/* 3D Canvas — fixed background, only mounted on shop route */}
      {isShop && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <Canvas
            camera={{ position: [14, 1, 0], fov: 40 }}
            gl={{ antialias: true, alpha: true }}
            style={{ width: '100%', height: '100%', background: 'transparent' }}
          >
            <ambientLight intensity={1.2} />
            <pointLight position={[10, 10, 10]} intensity={1.5} />
            <pointLight position={[-10, -10, -10]} intensity={0.5} />
            <Bounds fit clip observe margin={1.5}>
              <Center>
              {activeAnimal === 'beef' && <Cow claimedCutIds={shopEditMode ? editCutIds : null} />}
                {activeAnimal === 'pork' && <Pig claimedCutIds={shopEditMode ? editCutIds : null} />}
                {activeAnimal === 'lamb' && <Lamb claimedCutIds={shopEditMode ? editCutIds : null} />}
              </Center>
            </Bounds>
            <OrbitControls enablePan={false} />
          </Canvas>
        </div>
      )}

      {/* UI layer — always rendered */}
      <div style={{
        position: isShop ? 'absolute' : 'relative',
        inset: isShop ? 0 : 'auto',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: 'none',
      }}>

        {/* Header */}
        <header style={{ pointerEvents: 'auto', flexShrink: 0 }} className="ui-header">
          <div className="ui-header-inner">
            <Link to="/" className="ui-brand">
              <div className="ui-brand-icon">
                <Beef size={24} color="white" />
              </div>
              <div>
                <span className="ui-brand-title">MasterChef Cuts</span>
                <span className="ui-brand-sub">Premium Butcher Shop</span>
              </div>
            </Link>

            <nav className={`ui-nav${menuOpen ? ' ui-nav--open' : ''}`}>
              <Link to="/" className={`ui-nav-link${location.pathname === '/' ? ' active' : ''}`}>
                <Home size={18} />
                <span>Home</span>
              </Link>
              <Link to="/shop" className={`ui-nav-link${location.pathname === '/shop' ? ' active' : ''}`}>
                <Beef size={18} />
                <span>Shop</span>
              </Link>
              <Link to="/cart" className={`ui-nav-link${location.pathname === '/cart' ? ' active' : ''}`}>
                <ShoppingCart size={18} />
                <span>Cart</span>
                {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
              </Link>
              <Link to="/listings" className={`ui-nav-link${location.pathname === '/listings' ? ' active' : ''}`}>
                <LayoutList size={18} />
                <span>Listings</span>
              </Link>
              <Link to="/demand" className={`ui-nav-link${location.pathname === '/demand' ? ' active' : ''}`}>
                <ClipboardList size={18} />
                <span>Demand</span>
              </Link>
              <Link to="/about" className={`ui-nav-link${location.pathname === '/about' ? ' active' : ''}`}>
                <Info size={18} />
                <span>About</span>
              </Link>
              {user && <NotificationBell />}
              {user && (
                <Link to="/messages" className={`ui-nav-link${location.pathname === '/messages' ? ' active' : ''}`}>
                  <MessageSquare size={18} />
                  <span>Messages</span>
                </Link>
              )}
              {user?.role === 'farmer' && (
                <Link to="/post" className={`ui-nav-link${location.pathname === '/post' ? ' active' : ''}`}>
                  <PlusCircle size={18} />
                  <span>Post</span>
                </Link>
              )}
              {user?.role === 'admin' && (
                <Link to="/admin" className={`ui-nav-link${location.pathname === '/admin' ? ' active' : ''}`}>
                  <span>Admin</span>
                </Link>
              )}
              {user ? (
                <Link to="/profile" className={`ui-nav-link ui-nav-link--avatar${location.pathname === '/profile' ? ' active' : ''}`}>
                  <span className="ui-avatar-chip">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </span>
                  <span>{user.name.split(' ')[0]}</span>
                </Link>
              ) : (
                <Link to="/login" className={`ui-nav-link ui-nav-link--login${location.pathname === '/login' ? ' active' : ''}`}>
                  <UserCircle2 size={18} />
                  <span>Sign In</span>
                </Link>
              )}
              {user && (
                <button
                  className="ui-nav-link ui-nav-link--logout"
                  onClick={() => { logout(); setMenuOpen(false); }}
                  aria-label="Sign out"
                >
                  <UserCircle2 size={18} />
                  <span>Sign Out</span>
                </button>
              )}
            </nav>
            <button className="ui-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </header>

        {/* Page content */}
        <div style={{ flex: 1, position: 'relative', pointerEvents: isShop ? 'none' : 'auto' }}>
          <Routes>
            <Route path="/shop" element={
              <div style={{ position: 'relative', height: 'calc(100vh - 72px)', pointerEvents: 'none' }}>
                {/* Animal Switcher */}
                <div className="animal-switcher" style={{ pointerEvents: 'auto' }}>
                  {ANIMALS.map((a) => (
                    <button
                      key={a.id}
                      className={`animal-btn${activeAnimal === a.id ? ' active' : ''}`}
                      onClick={() => setActiveAnimal(a.id)}
                    >
                      <span className="animal-emoji">{a.emoji}</span>
                      <span className="animal-label">{a.label}</span>
                    </button>
                  ))}
                </div>
                {/* Mobile toggle buttons — hidden on desktop via CSS */}
                <button
                  className="shop-mob-toggle shop-mob-toggle--wap"
                  style={{ pointerEvents: 'auto' }}
                  onClick={() => { setWapOpen(o => !o); setChooserOpen(false); }}
                  aria-label="Toggle animal panel"
                >
                  {wapOpen ? '✕' : '🐄'}
                </button>
                <button
                  className="shop-mob-toggle shop-mob-toggle--chooser"
                  style={{ pointerEvents: 'auto' }}
                  onClick={() => { setChooserOpen(o => !o); setWapOpen(false); }}
                  aria-label="Toggle action menu"
                >
                  {chooserOpen ? '✕' : '📋'}
                </button>
                {/* Whole Animal Panel */}
                <div className={`wap-mobile-wrap${wapOpen ? ' wap-mobile-wrap--open' : ''}`} style={{ pointerEvents: 'auto', zIndex: 100 }}><WholeAnimalPanel activeAnimal={activeAnimal} /></div>
                {/* Shop action chooser */}
                {/* Shop action chooser — hidden in edit mode */}
                {!shopEditMode && (
                  <div className={`shop-action-chooser${chooserOpen ? ' shop-action-chooser--mobile-open' : ''}`} style={{ pointerEvents: 'auto' }}>
                    <p className="shop-action-label">What are you looking for?</p>
                    <div className="shop-action-btns">
                      <Link to="/listings" className="shop-action-btn">
                        <span className="shop-action-icon">📋</span>
                        <span className="shop-action-text">
                          <strong>Browse Listings</strong>
                          <small>See available animals near you</small>
                        </span>
                      </Link>
                      <button className="shop-action-btn" onClick={() => { setRequestPayload(null); setShowRequestModal(true); }}>
                        <span className="shop-action-icon">✏️</span>
                        <span className="shop-action-text">
                          <strong>Request an Animal</strong>
                          <small>Tell a farmer exactly what you need</small>
                        </span>
                      </button>
                    </div>
                  </div>
                )}
                {/* Edit-request panel */}
                {shopEditMode && editRequest && (
                  <div className="shop-edit-panel">
                    <p className="sep-title">Editing Your Request</p>
                    <p className="sep-subtitle">{editRequest.breed} {editRequest.animalType.charAt(0) + editRequest.animalType.slice(1).toLowerCase()} — click cuts to toggle</p>
                    <div className="sep-legend">
                      <span className="sep-legend-item"><span className="sep-legend-dot sep-legend-dot--selected" />In request</span>
                      <span className="sep-legend-item"><span className="sep-legend-dot sep-legend-dot--available" />Available</span>
                    </div>
                    <div className="sep-chips">
                      {editCutIds.size === 0
                        ? <span className="sep-empty">No cuts selected</span>
                        : Array.from(editCutIds).map(id => (
                          <button
                            key={id}
                            className="sep-chip"
                            onClick={() => setEditCutIds(prev => { const n = new Set(prev); n.delete(id); return n; })}
                            title="Click to remove"
                          >
                            {CUTS_ID_TO_LABEL[activeAnimal]?.[id] || id} ×
                          </button>
                        ))
                      }
                    </div>
                    <div className="sep-btns">
                      <button className="sep-btn-save" disabled={editSaving || editCutIds.size === 0} onClick={saveEditRequest}>
                        {editSaving ? 'Saving…' : 'Save Changes'}
                      </button>
                      <button className="sep-btn-cancel" onClick={cancelEditMode}>Cancel</button>
                    </div>
                  </div>
                )}
                {/* Animated beacon — auto-fades after 5s, hidden in edit mode */}
                {!shopEditMode && (
                  <div className="shop-click-beacon" aria-hidden="true">
                    <div className="shop-click-beacon__ring" />
                    <span className="shop-click-beacon__icon">👆</span>
                    <p className="shop-click-beacon__title">Click the animal</p>
                    <p className="shop-click-beacon__sub">Tap any zone to explore cuts &amp; claim</p>
                  </div>
                )}

                {/* Bottom hint */}
                <div className="ui-bottom-hint">
                  <span className="ui-bottom-hint__item">Drag to rotate</span>
                  <span className="ui-bottom-hint__sep" />
                  <span className="ui-bottom-hint__item ui-bottom-hint__item--click">Click to explore cuts</span>
                  <span className="ui-bottom-hint__sep" />
                  <span className="ui-bottom-hint__item">Scroll to zoom</span>
                </div>
              </div>
            } />
            <Route path="/cart" element={<ErrorBoundary><CartPage /></ErrorBoundary>} />
            <Route path="/listings" element={<ListingsPage />} />
            <Route path="/listings/:id" element={<ErrorBoundary><ListingDetailPage /></ErrorBoundary>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/post" element={<PostListingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/user/:id" element={<AdminUserDetailPage />} />
            <Route path="/demand" element={<DemandBoardPage />} />
            <Route path="/farmer/:id" element={<FarmerProfilePage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/order/:id" element={<OrderReceiptPage />} />
            <Route path="/messages" element={<ErrorBoundary><MessagesPage /></ErrorBoundary>} />
            <Route path="/refer" element={<ReferralPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/" element={<HomePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>

        {/* Footer — hidden on 3D shop route */}
        {!isShop && <Footer />}

      </div>
    </div>

    {showRequestModal && <AnimalRequestModal onClose={() => { setShowRequestModal(false); setRequestPayload(null); }} initialAnimal={requestPayload?.animal} initialCuts={requestPayload?.cuts} />}
    </>
  );
}

export default App;