import React, { useMemo, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Bounds, Center, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// ── Cut zone definitions (colors match shop 3D models) ────────────────────

const BEEF_CUTS = {
  head:      { id: 'head',      name: 'Head',       color: '#922b21' },
  chuck:     { id: 'chuck',     name: 'Chuck',      color: '#e74c3c' },
  rib:       { id: 'rib',       name: 'Rib',        color: '#e67e22' },
  shortloin: { id: 'shortloin', name: 'Loin',       color: '#f1c40f' },
  sirloin:   { id: 'sirloin',   name: 'Sirloin',    color: '#2ecc71' },
  round:     { id: 'round',     name: 'Round',      color: '#1abc9c' },
  brisket:   { id: 'brisket',   name: 'Brisket',    color: '#3498db' },
  plate:     { id: 'plate',     name: 'Plate',      color: '#9b59b6' },
  flank:     { id: 'flank',     name: 'Flank',      color: '#e91e63' },
  shank:     { id: 'shank',     name: 'Shank',      color: '#795548' },
}

const PORK_CUTS = {
  head:     { id: 'head',     name: 'Head',     color: '#6c3483' },
  jowl:     { id: 'jowl',     name: 'Jowl',     color: '#9b59b6' },
  shoulder: { id: 'shoulder', name: 'Shoulder', color: '#e74c3c' },
  loin:     { id: 'loin',     name: 'Loin',     color: '#e67e22' },
  belly:    { id: 'belly',    name: 'Belly',    color: '#f1c40f' },
  ham:      { id: 'ham',      name: 'Ham',      color: '#2ecc71' },
  hock:     { id: 'hock',     name: 'Hock',     color: '#3498db' },
}

const LAMB_CUTS = {
  shoulder: { id: 'shoulder', name: 'Shoulder',      color: '#e74c3c' },
  rack:     { id: 'rack',     name: 'Rack',           color: '#e67e22' },
  loin:     { id: 'loin',     name: 'Loin',           color: '#f1c40f' },
  leg:      { id: 'leg',      name: 'Leg',            color: '#2ecc71' },
  breast:   { id: 'breast',   name: 'Breast & Flank', color: '#3498db' },
  shank:    { id: 'shank',    name: 'Shank',          color: '#9b59b6' },
}

// ── Position detectors (same zones as shop models) ────────────────────────

function findBeefCut(lp) {
  const y = lp.y, z = lp.z
  if (y < -0.22) return BEEF_CUTS.shank
  if (z >= +0.50) return BEEF_CUTS.head
  if (y >= 0.10) {
    if (z >= +0.09) return BEEF_CUTS.chuck
    if (z >= -0.10) return BEEF_CUTS.rib
    if (z >= -0.30) return BEEF_CUTS.shortloin
    if (z >= -0.50) return BEEF_CUTS.sirloin
    return BEEF_CUTS.round
  }
  if (z >= +0.09) return BEEF_CUTS.brisket
  if (z >= -0.10) return BEEF_CUTS.plate
  if (z >= -0.50) return BEEF_CUTS.flank
  return BEEF_CUTS.round
}

function findPorkCut(lp) {
  const y = lp.y, z = lp.z
  if (y < -0.22) return PORK_CUTS.hock
  if (z >= +0.760) return PORK_CUTS.head
  if (z >= +0.540) return PORK_CUTS.jowl
  if (z >= +0.180) return PORK_CUTS.shoulder
  if (z >= -0.200) return y >= 0.05 ? PORK_CUTS.loin : PORK_CUTS.belly
  return PORK_CUTS.ham
}

function findLambCut(lp) {
  const y = lp.y, z = lp.z
  if (y < -0.28) return LAMB_CUTS.shank
  if (z >= +0.20) return y >= -0.05 ? LAMB_CUTS.shoulder : LAMB_CUTS.breast
  if (z >= -0.10) return y >= 0.0 ? LAMB_CUTS.rack : LAMB_CUTS.breast
  if (z >= -0.35) return y >= 0.0 ? LAMB_CUTS.loin : LAMB_CUTS.breast
  return LAMB_CUTS.leg
}

// ── Label → cut ID mapping (backend labels from PostListing.jsx) ──────────

const BEEF_LABEL_MAP = {
  'chuck': ['chuck'], 'rib': ['rib'],
  'loin': ['shortloin', 'sirloin'],  // backend merges short loin + sirloin into "loin"
  'round': ['round'], 'brisket': ['brisket'],
  'plate': ['plate'], 'flank': ['flank'], 'shank': ['shank'],
}
const PORK_LABEL_MAP = {
  'shoulder': ['shoulder'], 'loin': ['loin'], 'belly': ['belly'],
  'leg (ham)': ['ham'], 'leg': ['ham'], 'ham': ['ham'],
  'jowl': ['jowl'], 'hock': ['hock'],
}
const LAMB_LABEL_MAP = {
  'shoulder': ['shoulder'], 'rack': ['rack'], 'loin': ['loin'],
  'leg': ['leg'], 'breast': ['breast'], 'breast & flank': ['breast'],
  'shank': ['shank'],
}

const GLB_BASE = import.meta.env.VITE_GLB_BASE ?? 'https://storage.googleapis.com/masterchefcuts-static'

const ANIMAL_CONFIG = {
  BEEF: { glb: `${GLB_BASE}/3DCow.glb`,  cuts: BEEF_CUTS, findCut: findBeefCut, labelMap: BEEF_LABEL_MAP },
  PORK: { glb: `${GLB_BASE}/3DPig.glb`,  cuts: PORK_CUTS, findCut: findPorkCut, labelMap: PORK_LABEL_MAP },
  LAMB: { glb: `${GLB_BASE}/3DLamb.glb`, cuts: LAMB_CUTS, findCut: findLambCut, labelMap: LAMB_LABEL_MAP },
}

function hexToRgb(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16) / 255,
    g: parseInt(hex.slice(3, 5), 16) / 255,
    b: parseInt(hex.slice(5, 7), 16) / 255,
  }
}

function buildClaimedSet(cuts, labelMap) {
  const s = new Set()
  cuts.forEach(c => {
    if (c.claimed) {
      const ids = labelMap[c.label?.toLowerCase()] ?? []
      ids.forEach(id => s.add(id))
    }
  })
  return s
}

// ── Coloured mesh ─────────────────────────────────────────────────────────

function ColoredMesh({ glbPath, findCut, listingCuts, labelMap }) {
  const { scene } = useGLTF(glbPath)

  const meshObj = useMemo(() => {
    let found = null
    scene.traverse(c => { if (!found && c.isMesh) found = c })
    return found
  }, [scene])

  const claimedIds = useMemo(
    () => buildClaimedSet(listingCuts, labelMap),
    [listingCuts, labelMap]
  )

  const coloredGeo = useMemo(() => {
    if (!meshObj?.geometry) return null
    const geo = meshObj.geometry.clone()
    const pos = geo.attributes.position
    const col = new Float32Array(pos.count * 3)

    for (let i = 0; i < pos.count; i++) {
      const cut = findCut({ x: pos.getX(i), y: pos.getY(i), z: pos.getZ(i) })
      if (cut && claimedIds.has(cut.id)) {
        col[i * 3] = 0.18; col[i * 3 + 1] = 0.18; col[i * 3 + 2] = 0.18
      } else if (cut) {
        const { r, g, b } = hexToRgb(cut.color)
        col[i * 3] = r * 0.65 + 0.12
        col[i * 3 + 1] = g * 0.65 + 0.12
        col[i * 3 + 2] = b * 0.65 + 0.12
      } else {
        col[i * 3] = 0.35; col[i * 3 + 1] = 0.35; col[i * 3 + 2] = 0.35
      }
    }

    geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
    return geo
  }, [meshObj, claimedIds, findCut])

  return (
    <mesh geometry={coloredGeo} castShadow receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.72} metalness={0.06} />
    </mesh>
  )
}

// ── Preloads ──────────────────────────────────────────────────────────────

useGLTF.preload(`${GLB_BASE}/3DCow.glb`)
useGLTF.preload(`${GLB_BASE}/3DPig.glb`)
useGLTF.preload(`${GLB_BASE}/3DLamb.glb`)

// ── Main export ───────────────────────────────────────────────────────────

export default function ListingAnimalViewer({ animalType, cuts = [] }) {
  const config = ANIMAL_CONFIG[animalType]
  if (!config) return null

  const claimedIds = buildClaimedSet(cuts, config.labelMap)
  const cutList = Object.values(config.cuts).filter(c => c.id !== 'head')

  return (
    <div className="lav-wrap">
      <div className="lav-canvas-area">
        <Suspense fallback={<div className="lav-loading">Loading 3D model…</div>}>
          <Canvas
            camera={{ position: [14, 1, 0], fov: 40 }}
            gl={{ antialias: true, alpha: true }}
            style={{ width: '100%', height: '100%', background: 'transparent' }}
          >
            <ambientLight intensity={1.4} />
            <pointLight position={[10, 10, 10]} intensity={1.5} />
            <pointLight position={[-10, -10, -10]} intensity={0.5} />
            <Bounds fit clip observe margin={1.6}>
              <Center>
                <ColoredMesh
                  glbPath={config.glb}
                  findCut={config.findCut}
                  listingCuts={cuts}
                  labelMap={config.labelMap}
                />
              </Center>
            </Bounds>
            <OrbitControls enablePan={false} autoRotate autoRotateSpeed={0.6} />
          </Canvas>
        </Suspense>
      </div>

      <div className="lav-legend">
        {cutList.map(cut => {
          const isClaimed = claimedIds.has(cut.id)
          return (
            <div key={cut.id} className={`lav-item${isClaimed ? ' lav-item--claimed' : ''}`}>
              <span className="lav-dot" style={{ background: isClaimed ? '#3a3a3a' : cut.color }} />
              <span className="lav-name">{cut.name}</span>
              {isClaimed
                ? <span className="lav-tag lav-tag--claimed">Claimed</span>
                : <span className="lav-tag lav-tag--avail">Available</span>
              }
            </div>
          )
        })}
      </div>
    </div>
  )
}
