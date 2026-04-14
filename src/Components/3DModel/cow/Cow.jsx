import React, { useRef, useState, useCallback, useMemo } from 'react'
import { useGLTF, Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { BEEF_CUT_DATA } from '../../../data/beefCutData'
import { cartBridge } from '../../../context/CartContext'

// 3D local-space cut detection — zones derived from 20-bin vertex histogram of 3DCow.glb
// HEAD at +Z (+0.95), TAIL at -Z (-0.95). Skull crown avgY peak at Z+0.665; neck extends to Z+0.50.
// Bin peaks: rib @ Z[+0.095,+0.19] n=493; hindquarter @ Z[-0.57,-0.475] n=410.
const CUTS = {
  head:      { id: 'head',      name: 'Head',       color: '#922b21' },
  chuck:     { id: 'chuck',     name: 'Chuck',      color: '#e74c3c' },
  rib:       { id: 'rib',       name: 'Rib',        color: '#e67e22' },
  shortloin: { id: 'shortloin', name: 'Short Loin', color: '#f1c40f' },
  sirloin:   { id: 'sirloin',   name: 'Sirloin',    color: '#2ecc71' },
  round:     { id: 'round',     name: 'Round',      color: '#1abc9c' },
  brisket:   { id: 'brisket',   name: 'Brisket',    color: '#3498db' },
  plate:     { id: 'plate',     name: 'Plate',      color: '#9b59b6' },
  flank:     { id: 'flank',     name: 'Flank',      color: '#e91e63' },
  shank:     { id: 'shank',     name: 'Shank',      color: '#795548' },
}

function findCutByPosition(lp) {
  const y = lp.y, z = lp.z
  // Shank: front & rear legs (Y below mid-body)
  if (y < -0.22) return CUTS.shank
  // HEAD at +Z, TAIL at -Z
  if (z >= +0.50) return CUTS.head         // head + neck    — Z [+0.50, +0.95]  (skull crown + neck piece)
  // Upper body (spine side, Y >= 0.10)
  if (y >= 0.10) {
    if (z >= +0.09) return CUTS.chuck      // chuck/shoulder — Z [+0.09, +0.50]  (forelegs here)
    if (z >= -0.10) return CUTS.rib        // rib section    — Z [-0.10, +0.09]   (vertex density peak)
    if (z >= -0.30) return CUTS.shortloin  // short loin     — Z [-0.30, -0.10]
    if (z >= -0.50) return CUTS.sirloin    // sirloin        — Z [-0.50, -0.30]
    return CUTS.round                       // round/rump     — Z [-0.95, -0.50]   (hindlegs here)
  }
  // Lower/mid body (belly & chest, Y -0.22 to +0.10)
  if (z >= +0.09) return CUTS.brisket  // front chest    — Z [+0.09, +0.665]
  if (z >= -0.10) return CUTS.plate    // belly center   — Z [-0.10, +0.09]
  if (z >= -0.50) return CUTS.flank    // rear belly     — Z [-0.50, -0.10]
  return CUTS.round                     // rear lower     — Z [-0.95, -0.50]
}

function easeOutElastic(t) {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3)
}

function CutFullPopup({ cut, onClose }) {
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const data = BEEF_CUT_DATA[cut.id]
  if (!data) return null
  const { color } = cut
  const total = (data.price * qty).toFixed(0)

  const handleOrder = () => {
    cartBridge.addToCart({ animal: 'beef', cutId: cut.id, name: data.name, color, price: data.price, qty })
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <div
      className="cpf"
      style={{ pointerEvents: 'auto' }}
      onWheel={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="cpf-accent" style={{ background: color }} />
      <div className="cpf-scroll">

        <div className="cpf-header">
          <div>
            <p className="cpf-section">{data.section}</p>
            <h3 className="cpf-title" style={{ color }}>{data.name}</h3>
          </div>
          <button className="cpf-close" onClick={onClose}>×</button>
        </div>

        <div className="cpf-price-row">
          <span className="cpf-price" style={{ color }}>${data.price.toLocaleString()}</span>
          <span className="cpf-per-lb"> / whole cut</span>
        </div>

        <div className="cpf-tenderness">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="cpf-tend-bar"
              style={{ background: i <= data.tenderness ? '#f1c40f' : 'rgba(255,255,255,0.12)' }}
            />
          ))}
          <span className="cpf-tend-label">
            {['', 'Very Tough', 'Tough', 'Medium', 'Tender', 'Very Tender'][data.tenderness]}
          </span>
        </div>

        <p className="cpf-desc">{data.description}</p>

        <hr className="cpf-divider" />

        <div className="cpf-block">
          <p className="cpf-block-title">Popular Cuts</p>
          <div className="cpf-chips">
            {data.popularCuts.map((c) => (
              <span key={c} className="cpf-chip" style={{ borderColor: color + '88', color }}>{c}</span>
            ))}
          </div>
        </div>

        <hr className="cpf-divider" />

        <div className="cpf-block">
          <p className="cpf-block-title">Best Cooking Methods</p>
          <div className="cpf-methods">
            {data.cookingMethods.map((cm) => (
              <div key={cm.method} className="cpf-method-row">
                <span className="cpf-method-name" style={{ color }}>{cm.method}</span>
                <span className="cpf-method-note">{cm.note}</span>
              </div>
            ))}
          </div>
        </div>

        <hr className="cpf-divider" />

        <div className="cpf-block">
          <p className="cpf-block-title">Internal Temperature</p>
          <p className="cpf-temp">{data.internalTemp}</p>
        </div>

        <div className="cpf-flavor">
          <span style={{ color, fontWeight: 600 }}>Flavour: </span>
          {data.flavorProfile}
        </div>

        <hr className="cpf-divider" />

        <div className="cpf-order">
          <div className="cpf-qty-row">
            <span className="cpf-qty-label">Quantity</span>
            <div className="cpf-qty-controls">
              <button className="cpf-qty-btn" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
              <span className="cpf-qty-val">{qty}</span>
              <button className="cpf-qty-btn" onClick={() => setQty((q) => q + 1)}>+</button>
            </div>
          </div>
          <button className="cpf-add-btn" style={{ background: added ? '#27ae60' : color }} onClick={handleOrder}>
            {added ? '✓ Added to Cart!' : `Order ${qty} ${qty === 1 ? 'Cut' : 'Cuts'} — $${total}`}
          </button>
        </div>

      </div>
    </div>
  )
}

function CutMarker({ position, color, cut, onClose }) {
  const groupRef = useRef()
  const sphereRef = useRef()
  const progress = useRef(0)

  useFrame((state, delta) => {
    progress.current = Math.min(progress.current + delta * 2.8, 1)
    const p = progress.current
    if (!groupRef.current || !sphereRef.current) return

    const ease = easeOutCubic(p)
    groupRef.current.position.set(
      position[0],
      position[1] + ease * 0.025,
      position[2] + ease * 0.07
    )

    const s = easeOutElastic(p) * 0.03
    sphereRef.current.scale.setScalar(Math.max(0, s))

    if (p >= 1) {
      sphereRef.current.material.emissiveIntensity =
        1.4 + Math.sin(state.clock.elapsedTime * 4.5) * 0.6
    }
  })

  return (
    <group ref={groupRef} position={position}>
      <mesh ref={sphereRef}>
        <sphereGeometry args={[1, 20, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>

      <Html
        center
        distanceFactor={2}
        position={[0, 0.08, 0]}
        zIndexRange={[50, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <CutFullPopup cut={cut} onClose={onClose} />
      </Html>
    </group>
  )
}

export function Cow({ ...props }) {
  const meshRef = useRef()
  const { scene, materials } = useGLTF('/3DCow.glb')
  const [markers, setMarkers] = useState([])

  const meshObj = useMemo(() => {
    let found = null
    scene.traverse((c) => { if (!found && c.isMesh) found = c })
    return found
  }, [scene])

  const mat = Object.values(materials)[0] ?? meshObj?.material

  const handleClick = useCallback((event) => {
    event.stopPropagation()
    const { point } = event

    const localPoint = event.object.worldToLocal(point.clone())
    const cut = findCutByPosition(localPoint)
    if (!cut) return

    const markerId = `${cut.id}-${Date.now()}`
    setMarkers((prev) => [
      ...prev.filter((m) => m.cutId !== cut.id),
      {
        id: markerId,
        cutId: cut.id,
        position: [localPoint.x, localPoint.y, localPoint.z],
        color: cut.color,
        cut,
      },
    ])
  }, [])

  const handlePointerOver = useCallback(() => {
    document.body.style.cursor = 'pointer'
  }, [])

  const handlePointerOut = useCallback(() => {
    document.body.style.cursor = 'auto'
  }, [])

  return (
    <group {...props} dispose={null}>
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        geometry={meshObj?.geometry}
        material={mat}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />
      {markers.map((m) => (
        <CutMarker
          key={m.id}
          position={m.position}
          color={m.color}
          cut={m.cut}
          onClose={() => setMarkers((prev) => prev.filter((x) => x.id !== m.id))}
        />
      ))}
    </group>
  )
}

useGLTF.preload('/3DCow.glb')


