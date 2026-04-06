import { OrbitControls, Center, Bounds } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import React, { useState } from "react";
import { Link, useLocation, Routes, Route } from "react-router-dom";
import { Beef, ShoppingCart, Home, Info, LayoutList, UserCircle2 } from "lucide-react";
import { Cow }  from "./Components/3DModel/cow/Cow";
import { Pig }  from "./Components/3DModel/pig/Pig";
import { Lamb } from "./Components/3DModel/lamb/Lamb";
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
import NotificationBell from "./components/NotificationBell";
import AnimalRequestModal from "./Components/AnimalRequestModal";
import { useAuth } from "./context/AuthContext";
import { useCart } from "./context/CartContext";
import { WholeAnimalPanel } from "./Components/WholeAnimalPanel";
import './App.css';

const ANIMALS = [
  { id: 'beef', label: 'Beef', emoji: '🐄' },
  { id: 'pork', label: 'Pork', emoji: '🐷' },
  { id: 'lamb', label: 'Lamb', emoji: '🐑' },
];

function App() {
  const location = useLocation();
  const [activeAnimal, setActiveAnimal] = useState('beef');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const { totalItems } = useCart();
  const { user } = useAuth();
  const isShop = location.pathname === '/shop';

  return (
    <>
    <div style={{ width: '100vw', height: isShop ? '100vh' : 'auto', minHeight: '100vh', overflow: isShop ? 'hidden' : 'visible', background: 'transparent', position: 'relative' }}>

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
                {activeAnimal === 'beef' && <Cow />}
                {activeAnimal === 'pork' && <Pig />}
                {activeAnimal === 'lamb' && <Lamb />}
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
        minHeight: isShop ? '100%' : '100vh',
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

            <nav className="ui-nav">
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
                <LayoutList size={18} />
                <span>Demand</span>
              </Link>
              <Link to="/about" className={`ui-nav-link${location.pathname === '/about' ? ' active' : ''}`}>
                <Info size={18} />
                <span>About</span>
              </Link>
              {user && <NotificationBell />}
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
            </nav>
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
                {/* Whole Animal Panel */}
                <div style={{ pointerEvents: 'auto', zIndex: 100 }}><WholeAnimalPanel activeAnimal={activeAnimal} /></div>
                {/* Shop action chooser */}
                <div className="shop-action-chooser" style={{ pointerEvents: 'auto' }}>
                  <p className="shop-action-label">What are you looking for?</p>
                  <div className="shop-action-btns">
                    <Link to="/listings" className="shop-action-btn">
                      <span className="shop-action-icon">📋</span>
                      <span className="shop-action-text">
                        <strong>Browse Listings</strong>
                        <small>See available animals near you</small>
                      </span>
                    </Link>
                    <button className="shop-action-btn" onClick={() => setShowRequestModal(true)}>
                      <span className="shop-action-icon">✏️</span>
                      <span className="shop-action-text">
                        <strong>Request an Animal</strong>
                        <small>Tell a farmer exactly what you need</small>
                      </span>
                    </button>
                  </div>
                </div>
                {/* Bottom hint */}
                <div className="ui-bottom-hint">
                  <span>Drag to rotate &nbsp;·&nbsp; Scroll to zoom</span>
                </div>
              </div>
            } />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/listings" element={<ListingsPage />} />
            <Route path="/listings/:id" element={<ListingDetailPage />} />
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
            <Route path="/" element={<HomePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>

      </div>
    </div>

    {showRequestModal && <AnimalRequestModal onClose={() => setShowRequestModal(false)} />}
    </>
  );
}

export default App;