import React, { useRef, useState, useCallback, useMemo } from 'react'
import { useGLTF, Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { PIG_CUT_DATA } from '../../../data/pigCutData'
import { shopBridge } from '../../../context/CartContext'

// 3D local-space cut detection — zones derived from 20-bin vertex histogram of 3DPig.glb
// HEAD at +Z (+0.95), TAIL at -Z (-0.95). Foreleg avgY dip at Z[+0.19,+0.38]; density gap n=120 at Z[+0.475,+0.57].
// Hindleg avgY dip at Z[-0.76,-0.475]; ham body dense at Z[-0.57,-0.475] n=351.
const CUTS = {
  head:     { id: 'head',     name: 'Head',     color: '#6c3483' },
  jowl:     { id: 'jowl',     name: 'Jowl',     color: '#9b59b6' },
  shoulder: { id: 'shoulder', name: 'Shoulder',  color: '#e74c3c' },
  loin:     { id: 'loin',     name: 'Loin',      color: '#e67e22' },
  belly:    { id: 'belly',    name: 'Belly',     color: '#f1c40f' },
  ham:      { id: 'ham',      name: 'Ham',       color: '#2ecc71' },
  hock:     { id: 'hock',     name: 'Hock',      color: '#3498db' },
}

function findCutByPosition(lp) {
  const y = lp.y, z = lp.z
  // Hock: front & rear legs (Y below mid-body)
  if (y < -0.22) return CUTS.hock
  // HEAD at +Z, TAIL at -Z
  if (z >= +0.760) return CUTS.head        // head           — Z [+0.760, +0.95]  (snout/face tip)
  if (z >= +0.540) return CUTS.jowl        // jowl/cheek     — Z [+0.540, +0.760] (avgY peak 0.289)
  if (z >= +0.180) return CUTS.shoulder    // shoulder       — Z [+0.180, +0.540] (forelegs here)
  // Loin (upper) / Belly (lower) share the same Z band — split by Y
  if (z >= -0.200) return y >= 0.05 ? CUTS.loin : CUTS.belly  // Z [-0.200, +0.180]
  // Ham: rear quarter (hindlegs also here, caught by hock check above)
  return CUTS.ham                            // ham            — Z [-0.95, -0.200]
}

function easeOutElastic(t) {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3)
}

function CutFullPopup({ cut, onClose }) {
  const data = PIG_CUT_DATA[cut.id]
  if (!data) return null
  const { color } = cut

  // Map 3D zone names to AnimalRequestModal primal IDs
  const PIG_CUT_MAP = { Ham: 'Leg', Head: null }
  const handleClaim = () => {
    onClose()
    const primalId = cut.name in PIG_CUT_MAP ? PIG_CUT_MAP[cut.name] : cut.name
    shopBridge.openRequestModal({ animal: 'pork', cuts: primalId ? [primalId] : [] })
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

export function Pig({ ...props }) {
  const meshRef = useRef()
  const GLB_URL = import.meta.env.VITE_GLB_BASE_URL ? `${import.meta.env.VITE_GLB_BASE_URL}/3DPig.glb` : '/3DPig.glb'
  const { scene, materials } = useGLTF(GLB_URL)
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

useGLTF.preload(import.meta.env.VITE_GLB_BASE_URL ? `${import.meta.env.VITE_GLB_BASE_URL}/3DPig.glb` : '/3DPig.glb')



