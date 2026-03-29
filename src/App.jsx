import { OrbitControls, Center, Bounds } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import React, { useState } from "react";
import { Link, useLocation, Routes, Route } from "react-router-dom";
import { Beef, ShoppingCart, Home, Info, LayoutList } from "lucide-react";
import { Cow }  from "./Components/3DModel/cow/Cow";
import { Pig }  from "./Components/3DModel/pig/Pig";
import { Lamb } from "./Components/3DModel/lamb/Lamb";
import CartPage from "./pages/Cart";
import AboutPage from "./pages/About";
import HomePage from "./pages/Home";
import ListingsPage from "./pages/Listings";
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
  const { totalItems } = useCart();
  const isShop = location.pathname === '/shop';

  return (
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
              <Link to="/about" className={`ui-nav-link${location.pathname === '/about' ? ' active' : ''}`}>
                <Info size={18} />
                <span>About</span>
              </Link>
            </nav>
          </div>
        </header>

        {/* Page content */}
        <div style={{ flex: 1, position: 'relative' }}>
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
                <WholeAnimalPanel activeAnimal={activeAnimal} />
                {/* Bottom hint */}
                <div className="ui-bottom-hint">
                  <span>Drag to rotate &nbsp;·&nbsp; Scroll to zoom</span>
                </div>
              </div>
            } />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/listings" element={<ListingsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/" element={<HomePage />} />
          </Routes>
        </div>

      </div>
    </div>
  );
}

export default App;