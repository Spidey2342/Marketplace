import { useLayoutEffect, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { playerStall, stalls } from "@/data/townLayout"
import { atmosphereOn } from "@/scene3d/tier"
import { dummy, paint, type Spot } from "@/scene3d/place"
import { tokens } from "@/scene3d/tokens"

function stripeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas")
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext("2d")
  if (ctx) {
    for (let band = 0; band < 8; band += 1) {
      ctx.fillStyle = band % 2 === 0 ? tokens.red : tokens.yellow
      ctx.fillRect(0, band * 8, 64, 8)
    }
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

function kenteTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas")
  canvas.width = 128
  canvas.height = 32
  const ctx = canvas.getContext("2d")
  const bands = [tokens.yellow, tokens.red, tokens.green, tokens.indigo, tokens.orange, tokens.yellow]
  if (ctx) {
    const width = 128 / bands.length
    for (let index = 0; index < bands.length; index += 1) {
      ctx.fillStyle = bands[index]
      ctx.fillRect(index * width, 0, width, 32)
    }
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

const tables: Spot[] = stalls.map((stall) => ({ x: stall.x, y: 0.38, z: stall.z }))
const poles: Spot[] = stalls.map((stall) => ({ x: stall.x, y: 1.55, z: stall.z }))
const canopies: Spot[] = stalls.map((stall) => ({ x: stall.x, y: 2.22, z: stall.z }))
const trims: Spot[] = stalls.map((stall) => {
  const towardStreet = stall.side === "right" ? -1 : 1
  return { x: stall.x + towardStreet * 0.56, y: 0.76, z: stall.z }
})

export default function Stalls() {
  const tableRef = useRef<THREE.InstancedMesh>(null)
  const poleRef = useRef<THREE.InstancedMesh>(null)
  const canopyRef = useRef<THREE.InstancedMesh>(null)
  const trimRef = useRef<THREE.InstancedMesh>(null)
  const swayed = useRef(false)
  const stripes = useMemo(stripeTexture, [])
  const kente = useMemo(kenteTexture, [])
  const mine = playerStall()

  useLayoutEffect(() => {
    if (tableRef.current) paint(tableRef.current, tables)
    if (poleRef.current) paint(poleRef.current, poles)
    if (canopyRef.current) paint(canopyRef.current, canopies)
    if (trimRef.current) paint(trimRef.current, trims)
    return () => {
      stripes.dispose()
      kente.dispose()
    }
  }, [kente, stripes])

  useFrame(({ clock }) => {
    const mesh = canopyRef.current
    if (!mesh) return
    const live = atmosphereOn()
    if (!live && !swayed.current) return
    const time = clock.elapsedTime
    for (let index = 0; index < canopies.length; index += 1) {
      const item = canopies[index]
      dummy.position.set(item.x, item.y, item.z)
      dummy.rotation.set(0, 0, live ? Math.sin(time * 1.4 + index * 0.7) * 0.07 : 0)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      mesh.setMatrixAt(index, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
    swayed.current = live
  })

  return (
    <group>
      <instancedMesh ref={tableRef} args={[undefined, undefined, tables.length]} frustumCulled={false}>
        <boxGeometry args={[1.12, 0.72, 1.56]} />
        <meshLambertMaterial color={tokens.wood} flatShading />
      </instancedMesh>
      <instancedMesh ref={poleRef} args={[undefined, undefined, poles.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.05, 0.06, 2.3, 5]} />
        <meshLambertMaterial color={tokens.ink} flatShading />
      </instancedMesh>
      <instancedMesh ref={canopyRef} args={[undefined, undefined, canopies.length]} frustumCulled={false}>
        <coneGeometry args={[1.15, 0.48, 8]} />
        <meshLambertMaterial map={stripes} color={tokens.white} flatShading />
      </instancedMesh>
      <instancedMesh ref={trimRef} args={[undefined, undefined, trims.length]} frustumCulled={false}>
        <boxGeometry args={[0.08, 0.1, 1.5]} />
        <meshLambertMaterial map={kente} color={tokens.white} flatShading />
      </instancedMesh>
      <mesh position={[mine.x, 2.55, mine.z]}>
        <boxGeometry args={[0.08, 0.42, 0.28]} />
        <meshLambertMaterial color={tokens.yellow} flatShading />
      </mesh>
    </group>
  )
}
