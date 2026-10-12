import { useLayoutEffect, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { shops } from "@/data/townLayout"
import { atmosphereOn } from "@/scene3d/tier"
import { dummy, paint, tint, type Spot } from "@/scene3d/place"
import { tokens } from "@/scene3d/tokens"

const bodies: Spot[] = shops.map((shop) => ({
  x: shop.x,
  y: shop.h / 2,
  z: shop.z,
  sx: shop.w,
  sy: shop.h,
  sz: shop.d,
  color: shop.color,
}))

const roofs: Spot[] = shops.map((shop) => ({
  x: shop.x,
  y: shop.h + 0.38,
  z: shop.z,
  rotZ: Math.PI / 2,
  sx: 1,
  sy: shop.w + 0.15,
  sz: 1,
  color: shop.color,
}))

const doors: Spot[] = shops.map((shop) => ({
  x: shop.x,
  y: 0.72,
  z: shop.z + shop.d / 2 + 0.04,
  color: tokens.wood,
}))

const windows: Spot[] = shops.flatMap((shop) => [
  {
    x: shop.x - 0.7,
    y: 2.15,
    z: shop.z + shop.d / 2 + 0.05,
    color: tokens.yellowLight,
  },
  {
    x: shop.x + 0.7,
    y: 2.15,
    z: shop.z + shop.d / 2 + 0.05,
    color: tokens.yellowLight,
  },
])

const awnings: Spot[] = shops.map((shop) => ({
  x: shop.x,
  y: 2.55,
  z: shop.z + shop.d / 2 + 0.45,
  sx: shop.w * 0.92,
  sy: 0.08,
  sz: 0.9,
  color: shop.color,
}))

export default function Shops() {
  const bodyRef = useRef<THREE.InstancedMesh>(null)
  const roofRef = useRef<THREE.InstancedMesh>(null)
  const doorRef = useRef<THREE.InstancedMesh>(null)
  const windowRef = useRef<THREE.InstancedMesh>(null)
  const awningRef = useRef<THREE.InstancedMesh>(null)
  const swayed = useRef(false)

  useLayoutEffect(() => {
    if (bodyRef.current) paint(bodyRef.current, bodies)
    if (roofRef.current) paint(roofRef.current, roofs)
    if (doorRef.current) paint(doorRef.current, doors)
    if (windowRef.current) paint(windowRef.current, windows)
    if (awningRef.current) paint(awningRef.current, awnings)
  }, [])

  useFrame(({ clock }) => {
    const mesh = awningRef.current
    if (!mesh) return
    const live = atmosphereOn()
    if (!live && !swayed.current) return
    const time = clock.elapsedTime
    for (let index = 0; index < awnings.length; index += 1) {
      const item = awnings[index]
      dummy.position.set(item.x, item.y, item.z)
      dummy.rotation.set(live ? Math.sin(time * 1.1 + index) * 0.08 : 0, 0, 0)
      dummy.scale.set(item.sx ?? 1, item.sy ?? 1, item.sz ?? 1)
      dummy.updateMatrix()
      mesh.setMatrixAt(index, dummy.matrix)
      if (item.color) {
        tint.set(item.color)
        mesh.setColorAt(index, tint)
      }
    }
    mesh.instanceMatrix.needsUpdate = true
    swayed.current = live
  })

  return (
    <group>
      <instancedMesh ref={bodyRef} args={[undefined, undefined, bodies.length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial color={tokens.white} flatShading />
      </instancedMesh>
      <instancedMesh ref={roofRef} args={[undefined, undefined, roofs.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.72, 0.72, 1, 3]} />
        <meshLambertMaterial color={tokens.white} flatShading />
      </instancedMesh>
      <instancedMesh ref={doorRef} args={[undefined, undefined, doors.length]} frustumCulled={false}>
        <boxGeometry args={[0.72, 1.35, 0.08]} />
        <meshLambertMaterial color={tokens.white} flatShading />
      </instancedMesh>
      <instancedMesh ref={windowRef} args={[undefined, undefined, windows.length]} frustumCulled={false}>
        <boxGeometry args={[0.55, 0.48, 0.06]} />
        <meshLambertMaterial color={tokens.white} flatShading />
      </instancedMesh>
      <instancedMesh ref={awningRef} args={[undefined, undefined, awnings.length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial color={tokens.white} flatShading />
      </instancedMesh>
    </group>
  )
}
