import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei'

export function Cow(props) {
  const { nodes, materials } = useGLTF('/Meshy_AI_Beef_Cuts_Diagram_0326215242_texture.glb')
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Mesh_0.geometry}
        material={materials['Material_0.003']}
      />
    </group>
  )
}

useGLTF.preload('/Meshy_AI_Beef_Cuts_Diagram_0326215242_texture.glb')
