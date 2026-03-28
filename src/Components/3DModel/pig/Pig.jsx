import React, { useRef, useState, useCallback } from 'react'
import { useGLTF, Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { PIG_CUT_DATA } from '../../../data/pigCutData'

// UV-space cut zones — placeholder zones, tune once actual GLB is loaded
// v=0 bottom of texture, v=1 top; flip handled in findCutByUV
const UV_CUT_ZONES = [
  { id: 'jowl',     name: 'Jowl',     u: [0.00, 0.14], v: [0.55, 0.95], color: '#9b59b6' },
  { id: 'shoulder', name: 'Shoulder', u: [0.10, 0.35], v: [0.48, 0.92], color: '#e74c3c' },
  { id: 'loin',     name: 'Loin',     u: [0.33, 0.65], v: [0.52, 0.92], color: '#e67e22' },
  { id: 'belly',    name: 'Belly',    u: [0.30, 0.65], v: [0.12, 0.50], color: '#f1c40f' },
  { id: 'ham',      name: 'Ham',      u: [0.63, 0.92], v: [0.42, 0.92], color: '#2ecc71' },
  { id: 'hock',     name: 'Hock',     u: [0.68, 0.96], v: [0.04, 0.42], color: '#3498db' },
]

function findCutByUV(u, v) {
  for (const zone of UV_CUT_ZONES) {
    if (u >= zone.u[0] && u <= zone.u[1] && v >= zone.v[0] && v <= zone.v[1]) return zone
  }
  const vFlip = 1 - v
  for (const zone of UV_CUT_ZONES) {
    if (u >= zone.u[0] && u <= zone.u[1] && vFlip >= zone.v[0] && vFlip <= zone.v[1]) return zone
  }
  let best = null, bestDist = Infinity
  for (const zone of UV_CUT_ZONES) {
    const cu = (zone.u[0] + zone.u[1]) / 2
    const cv = (zone.v[0] + zone.v[1]) / 2
    const d = Math.hypot(u - cu, v - cv)
    if (d < bestDist) { bestDist = d; best = zone }
  }
  return best
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
  const data = PIG_CUT_DATA[cut.id]
  if (!data) return null
  const { color } = cut
  const total = (data.price * qty).toFixed(0)

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
          <button className="cpf-add-btn" style={{ background: color }}>
            Order {qty} {qty === 1 ? 'Cut' : 'Cuts'} — ${total}
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
      position[1] + ease * 0.22,
      position[2] + ease * 0.55
    )

    const s = easeOutElastic(p) * 0.11
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
        distanceFactor={13}
        position={[0, 0.7, 0]}
        zIndexRange={[50, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <CutFullPopup cut={cut} onClose={onClose} />
      </Html>
    </group>
  )
}

export function Pig({ ...props }) {
  const meshRef = useRef()
  const { nodes, materials } = useGLTF('/pig_cuts_diagram.glb')
  const [markers, setMarkers] = useState([])

  const mesh = Object.values(nodes).find((n) => n.isMesh) ?? Object.values(nodes)[1]
  const mat  = Object.values(materials)[0]

  const handleClick = useCallback((event) => {
    event.stopPropagation()
    const { uv, point } = event
    if (!uv) {
      console.warn('[Pig] No UV on intersection — model may lack UV coords')
      return
    }
    console.log('[Pig] UV click:', uv.x.toFixed(3), uv.y.toFixed(3))

    const cut = findCutByUV(uv.x, uv.y)
    if (!cut) return

    const localPoint = event.object.worldToLocal(point.clone())
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

  const handlePointerOver = useCallback(() => { document.body.style.cursor = 'pointer' }, [])
  const handlePointerOut  = useCallback(() => { document.body.style.cursor = 'auto'    }, [])

  return (
    <group {...props} dispose={null}>
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        geometry={mesh?.geometry}
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

useGLTF.preload('/pig_cuts_diagram.glb')
