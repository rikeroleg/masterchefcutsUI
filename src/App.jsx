import { OrbitControls, Center, Bounds } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Beef, ShoppingCart, Home, Info } from "lucide-react";
import { Cow }  from "./Components/3DModel/cow/Cow";
import { Pig }  from "./Components/3DModel/pig/Pig";
import { Lamb } from "./Components/3DModel/lamb/Lamb";
// import CutInfoModal from "./Components/shop/CutInfoModal"; // reserved for future use
import './App.css';

const ANIMALS = [
  { id: 'beef', label: 'Beef', emoji: '🐄' },
  { id: 'pork', label: 'Pork', emoji: '🐷' },
  { id: 'lamb', label: 'Lamb', emoji: '🐑' },
];

function App() {
  const location = useLocation();
  const [activeAnimal, setActiveAnimal] = useState('beef');

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>

      {/* Full-viewport 3D Canvas — background layer */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <Canvas
          camera={{ position: [10, 1, 0], fov: 45 }}
          gl={{ antialias: true }}
          style={{ width: '100%', height: '100%' }}
        >
          <color attach="background" args={['#0f0f0f']} />
          <ambientLight intensity={1.2} />
          <pointLight position={[10, 10, 10]} intensity={1.5} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />
          <Bounds fit clip observe margin={1.1}>
            <Center>
              {activeAnimal === 'beef' && <Cow />}
              {activeAnimal === 'pork' && <Pig />}
              {activeAnimal === 'lamb' && <Lamb />}
            </Center>
          </Bounds>
          <OrbitControls enablePan={false} />
        </Canvas>
      </div>

      {/* UI Overlay — pointer-events disabled on wrapper, re-enabled on interactive children */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 10,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}>

        {/* Header */}
        <header style={{ pointerEvents: 'auto' }} className="ui-header">
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
                <span>Shop</span>
              </Link>
              <Link to="/cart" className={`ui-nav-link${location.pathname === '/cart' ? ' active' : ''}`}>
                <ShoppingCart size={18} />
                <span>Cart</span>
              </Link>
              <Link to="/about" className={`ui-nav-link${location.pathname === '/about' ? ' active' : ''}`}>
                <Info size={18} />
                <span>About</span>
              </Link>
            </nav>
          </div>
        </header>

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

        {/* Bottom hint */}
        <div className="ui-bottom-hint" style={{ pointerEvents: 'none' }}>
          <span>Drag to rotate &nbsp;·&nbsp; Scroll to zoom</span>
        </div>

      </div>
    </div>
  );
}

export default App;