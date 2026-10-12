import { Suspense, useRef, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { ContactShadows, OrbitControls } from "@react-three/drei"
import CharacterRig, { type CharacterHandle } from "@/scene3d/characters/CharacterRig"
import { useRiggedCharacters } from "@/scene3d/characters/flags"
import { preloadBodyModels } from "@/scene3d/characters/characterLoader"
import type { CharacterLook } from "@/scene3d/characters/constants"
import PrimitiveAvatar from "@/scene3d/characters/PrimitiveAvatar"

if (useRiggedCharacters()) {
  preloadBodyModels()
}

function ShowcaseRig({ look }: { look: CharacterLook }) {
  const rig = useRef<CharacterHandle | null>(null)
  useFrame((_, delta) => {
    rig.current?.update(delta, 0, "showcase", true)
  })
  return (
    <Suspense fallback={<PrimitiveAvatar />}>
      <CharacterRig look={look} lod="showcase" ref={rig} showcaseSpin />
    </Suspense>
  )
}

export default function AvatarShowcase({ look }: { look: CharacterLook }) {
  const [dragging, setDragging] = useState(false)

  if (!useRiggedCharacters()) {
    return null
  }

  return (
    <div aria-hidden="true" className="avatar-showcase">
      <Canvas
        camera={{ position: [0, 1.15, 2.35], fov: 36 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={["#fff7df"]} />
        <ambientLight intensity={0.45} />
        <directionalLight castShadow intensity={1.1} position={[2.5, 4, 2]} />
        <directionalLight intensity={0.35} position={[-2, 2.5, -1.5]} />
        <directionalLight color="#7ec8e3" intensity={0.55} position={[-2.2, 1.2, 2.8]} />
        <group position={[0, -0.02, 0]}>
          <ShowcaseRig look={look} />
          <ContactShadows blur={2.2} far={2.2} opacity={0.35} position={[0, 0, 0]} scale={2.2} />
        </group>
        <OrbitControls
          autoRotate={!dragging}
          autoRotateSpeed={0.7}
          enablePan={false}
          enableZoom={false}
          maxPolarAngle={Math.PI / 2 + 0.15}
          minPolarAngle={Math.PI / 3}
          onEnd={() => setDragging(false)}
          onStart={() => setDragging(true)}
          target={[0, 0.95, 0]}
        />
      </Canvas>
    </div>
  )
}
