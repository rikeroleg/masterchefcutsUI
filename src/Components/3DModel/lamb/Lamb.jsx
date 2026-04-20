import React, { useRef, useState, useCallback, useMemo } from 'react'
import { useGLTF, Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { LAMB_CUT_DATA } from '../../../data/lambCutData'
import { shopBridge } from '../../../context/CartContext'

// 3D local-space cut detection for 3DLamb.glb
// Convention: HEAD at +Z, TAIL at -Z (same as 3DCow / 3DPig)
const CUTS = {
  shoulder: { id: 'shoulder', name: 'Shoulder',      color: '#e74c3c' },
  rack:     { id: 'rack',     name: 'Rack',           color: '#e67e22' },
  loin:     { id: 'loin',     name: 'Loin',           color: '#f1c40f' },
  leg:      { id: 'leg',      name: 'Leg',            color: '#2ecc71' },
  breast:   { id: 'breast',   name: 'Breast & Flank', color: '#3498db' },
  shank:    { id: 'shank',    name: 'Shank',          color: '#9b59b6' },
}

function findCutByPosition(lp) {
  const y = lp.y, z = lp.z
  // Shank: lower legs (very low Y regardless of Z)
  if (y < -0.28) return CUTS.shank
  // HEAD at +Z --- Shoulder: front forequarter
  if (z >= +0.20) return y >= 0.12 ? CUTS.shoulder : CUTS.breast
  // Mid body: Rack (upper) / Breast (lower)
  if (z >= -0.10) return y >= 0.0 ? CUTS.rack : CUTS.breast
  // Upper-rear: Loin (upper) / Breast-flank (lower)
  if (z >= -0.35) return y >= 0.0 ? CUTS.loin : CUTS.breast
  // Rear hindquarter: Leg
  return CUTS.leg
}

function easeOutElastic(t) {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3)
}

function CutFullPopup({ cut, onClose }) {
  const data = LAMB_CUT_DATA[cut.id]
  if (!data) return null
  const { color } = cut

  // Map 3D zone names to AnimalRequestModal primal IDs
  const LAMB_CUT_MAP = { 'Breast & Flank': 'Breast' }
  const handleClaim = () => {
    onClose()
    const primalId = cut.name in LAMB_CUT_MAP ? LAMB_CUT_MAP[cut.name] : cut.name
    shopBridge.openRequestModal({ animal: 'lamb', cuts: [primalId] })
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
          <button className="cpf-close" onClick={onClose}>&times;</button>
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
          <button className="cpf-add-btn" style={{ background: color }} onClick={handleClaim}>
            Claim This Cut
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

export function Lamb({ ...props }) {
  const meshRef = useRef()
  const { scene, materials } = useGLTF('/3DLamb.glb')
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

  const handlePointerOver = useCallback(() => { document.body.style.cursor = 'pointer' }, [])
  const handlePointerOut  = useCallback(() => { document.body.style.cursor = 'auto'    }, [])

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

useGLTF.preload('/3DLamb.glb')
