import { useLayoutEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { lorry, sun } from "@/data/townLayout"
import { useTier } from "@/scene3d/tier"
import { paint, type Spot } from "@/scene3d/place"
import { tokens } from "@/scene3d/tokens"

const trunks: Spot[] = [
  { x: -6.6, y: 0.9, z: -8 },
  { x: 6.7, y: 1.05, z: -2 },
  { x: -6.5, y: 0.85, z: 6 },
  { x: 6.6, y: 1.1, z: 11 },
  { x: -6.8, y: 0.95, z: -14 },
]
const tops: Spot[] = trunks.map((trunk, index) => ({
  x: trunk.x,
  y: trunk.y + 1.35,
  z: trunk.z,
  sx: 1 + (index % 3) * 0.12,
  sy: 1,
  sz: 1 + (index % 2) * 0.1,
  color: index % 2 === 0 ? tokens.green : tokens.hill,
}))
const crates: Spot[] = [
  { x: -5.7, y: 0.22, z: -13.2, rotY: 0.4, color: tokens.orange },
  { x: -5.4, y: 0.18, z: -12.5, color: tokens.wood },
  { x: 5.6, y: 0.2, z: 14.2, rotY: 0.2, color: tokens.orange },
  { x: 5.5, y: 0.42, z: 14.5, color: tokens.yellow },
  { x: -1.2, y: 0.18, z: 14.6, color: tokens.wood },
]
const baskets: Spot[] = [
  { x: -5.7, y: 0.16, z: -6.4 },
  { x: -5.6, y: 0.16, z: 3.2 },
  { x: 5.65, y: 0.16, z: -8.4 },
]
const plantains: Spot[] = baskets.flatMap((basket) => [
  { x: basket.x - 0.08, y: 0.32, z: basket.z, color: tokens.yellow },
  { x: basket.x + 0.08, y: 0.3, z: basket.z + 0.06, color: tokens.orange },
  { x: basket.x, y: 0.34, z: basket.z - 0.06, color: tokens.hill },
])
const lamps: Spot[] = [
  { x: -2.35, y: 1.5, z: -8 },
  { x: 2.35, y: 1.5, z: 7 },
]
const lampHeads: Spot[] = lamps.map((lamp) => ({ x: lamp.x, y: 3.15, z: lamp.z, color: tokens.sun }))
const hills: Spot[] = [
  { x: -10, y: 2.2, z: -26, sx: 1.3, sy: 1.1, sz: 1.2, color: tokens.hill },
  { x: 0, y: 2.8, z: -28, sx: 1.6, sy: 1.35, sz: 1.4, color: tokens.green },
  { x: 11, y: 2.1, z: -25, sx: 1.2, sy: 1, sz: 1.15, color: tokens.hill },
]
const clouds: Spot[] = [
  { x: -6, y: 11, z: -4, sx: 2.2, sy: 0.7, sz: 1.2 },
  { x: -4.6, y: 11.3, z: -4.2, sx: 1.4, sy: 0.8, sz: 1 },
  { x: 7, y: 12, z: 6, sx: 1.8, sy: 0.6, sz: 1.1 },
  { x: 8.3, y: 12.2, z: 6.3, sx: 1.2, sy: 0.7, sz: 0.9 },
]
const wheels: Spot[] = [-1.15, 1.15].flatMap((z) =>
  [-0.95, 0.95].map((x) => ({
    x: lorry.x + x,
    y: 0.28,
    z: lorry.z + z,
    rotZ: Math.PI / 2,
  })),
)

function glowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas")
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext("2d")
  if (ctx) {
    const glow = ctx.createRadialGradient(32, 32, 2, 32, 32, 30)
    glow.addColorStop(0, "rgba(255,214,113,0.9)")
    glow.addColorStop(1, "rgba(255,214,113,0)")
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, 64, 64)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export default function Dressing() {
  const trunkRef = useRef<THREE.InstancedMesh>(null)
  const topRef = useRef<THREE.InstancedMesh>(null)
  const crateRef = useRef<THREE.InstancedMesh>(null)
  const basketRef = useRef<THREE.InstancedMesh>(null)
  const fruitRef = useRef<THREE.InstancedMesh>(null)
  const lampRef = useRef<THREE.InstancedMesh>(null)
  const headRef = useRef<THREE.InstancedMesh>(null)
  const hillRef = useRef<THREE.InstancedMesh>(null)
  const cloudRef = useRef<THREE.InstancedMesh>(null)
  const wheelRef = useRef<THREE.InstancedMesh>(null)
  const glow = useMemo(glowTexture, [])
  const tier = useTier()

  useLayoutEffect(() => {
    if (trunkRef.current) paint(trunkRef.current, trunks)
    if (topRef.current) paint(topRef.current, tops)
    if (crateRef.current) paint(crateRef.current, crates)
    if (basketRef.current) paint(basketRef.current, baskets)
    if (fruitRef.current) paint(fruitRef.current, plantains)
    if (lampRef.current) paint(lampRef.current, lamps)
    if (headRef.current) paint(headRef.current, lampHeads)
    if (hillRef.current) paint(hillRef.current, hills)
    if (cloudRef.current) paint(cloudRef.current, clouds)
    if (wheelRef.current) paint(wheelRef.current, wheels)
    return () => glow.dispose()
  }, [glow])

  return (
    <group>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, trunks.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.16, 0.22, 1.8, 5]} />
        <meshLambertMaterial color={tokens.wood} flatShading />
      </instancedMesh>
      <instancedMesh ref={topRef} args={[undefined, undefined, tops.length]} frustumCulled={false}>
        <coneGeometry args={[0.9, 1.7, 6]} />
        <meshLambertMaterial color={tokens.white} flatShading />
      </instancedMesh>
      <instancedMesh ref={crateRef} args={[undefined, undefined, crates.length]} frustumCulled={false}>
        <boxGeometry args={[0.42, 0.36, 0.42]} />
        <meshLambertMaterial color={tokens.white} flatShading />
      </instancedMesh>
      <instancedMesh ref={basketRef} args={[undefined, undefined, baskets.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.22, 0.16, 0.22, 6]} />
        <meshLambertMaterial color={tokens.orange} flatShading />
      </instancedMesh>
      <instancedMesh ref={fruitRef} args={[undefined, undefined, plantains.length]} frustumCulled={false}>
        <sphereGeometry args={[0.08, 5, 4]} />
        <meshLambertMaterial color={tokens.white} flatShading />
      </instancedMesh>
      <instancedMesh ref={lampRef} args={[undefined, undefined, lamps.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.06, 0.08, 3, 5]} />
        <meshLambertMaterial color={tokens.ink} flatShading />
      </instancedMesh>
      <instancedMesh ref={headRef} args={[undefined, undefined, lampHeads.length]} frustumCulled={false}>
        <sphereGeometry args={[0.16, 6, 4]} />
        <meshLambertMaterial color={tokens.white} flatShading />
      </instancedMesh>
      <instancedMesh ref={hillRef} args={[undefined, undefined, hills.length]} frustumCulled={false}>
        <coneGeometry args={[6, 5, 5]} />
        <meshLambertMaterial color={tokens.white} flatShading />
      </instancedMesh>
      <instancedMesh ref={cloudRef} args={[undefined, undefined, clouds.length]} frustumCulled={false}>
        <sphereGeometry args={[0.8, 6, 4]} />
        <meshLambertMaterial color={tokens.cloud} flatShading />
      </instancedMesh>
      <group position={[lorry.x, 0, lorry.z]}>
        <mesh position={[0, 0.85, -0.55]}>
          <boxGeometry args={[2, 1.15, 2.6]} />
          <meshLambertMaterial color={tokens.green} flatShading />
        </mesh>
        <mesh position={[0, 1.15, 1.35]}>
          <boxGeometry args={[1.9, 1.35, 1.5]} />
          <meshLambertMaterial color={tokens.yellow} flatShading />
        </mesh>
        <mesh position={[0, 1.25, 1.95]}>
          <boxGeometry args={[1.5, 0.55, 0.08]} />
          <meshLambertMaterial color={tokens.skyTop} flatShading />
        </mesh>
      </group>
      <instancedMesh ref={wheelRef} args={[undefined, undefined, wheels.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.28, 0.28, 0.18, 6]} />
        <meshLambertMaterial color={tokens.ink} flatShading />
      </instancedMesh>
      <mesh position={[sun.x, sun.y, sun.z]}>
        <sphereGeometry args={[1.15, 8, 6]} />
        <meshBasicMaterial color={tokens.sun} toneMapped={false} />
      </mesh>
      {tier !== "low" && (
        <sprite position={[sun.x, sun.y, sun.z]} scale={[8, 8, 1]}>
          <spriteMaterial map={glow} transparent depthWrite={false} toneMapped={false} />
        </sprite>
      )}
    </group>
  )
}
