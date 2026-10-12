import { useLayoutEffect, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { approach, playerStall, stalls, waypoints } from "@/data/townLayout"
import { customerLimit } from "@/scene3d/tier"
import { dummy, tint } from "@/scene3d/place"
import { tokens } from "@/scene3d/tokens"
import { finishSale, saleCue } from "@/scene3d/worldView"
import { sendAction } from "@/state/GameProvider"

const COUNT = 8
const saleSpot = approach(playerStall(), 1.75)
const mine = playerStall()
const colors = [
  tokens.orange,
  tokens.indigo,
  tokens.green,
  tokens.red,
  tokens.yellow,
  tokens.greenDark,
  tokens.cream,
  tokens.skyMid,
]
const armLocal = new THREE.Object3D()
const scratch = new THREE.Matrix4()

type Npc = {
  x: number
  z: number
  yaw: number
  tx: number
  tz: number
  pause: number
  saleId: number
  phase: number
  walk: number
  popping: number
}

const npcs: Npc[] = []
for (let index = 0; index < COUNT; index += 1) {
  const spot = waypoints[index % waypoints.length]
  const next = waypoints[(index + 1) % waypoints.length]
  npcs.push({
    x: spot.x,
    z: spot.z,
    yaw: 0,
    tx: next.x,
    tz: next.z,
    pause: index * 0.4,
    saleId: 0,
    phase: index,
    walk: index,
    popping: 0,
  })
}

function placeMark(
  mesh: THREE.InstancedMesh | null,
  index: number,
  x: number,
  y: number,
  z: number,
  scale: number,
) {
  if (!mesh) return
  armLocal.position.set(x, y, z)
  armLocal.rotation.set(0, 0, 0)
  armLocal.scale.set(scale, scale, scale)
  armLocal.updateMatrix()
  scratch.multiplyMatrices(dummy.matrix, armLocal.matrix)
  mesh.setMatrixAt(index, scratch)
}

function pickWander(npc: Npc) {
  npc.phase += 1
  if (npc.phase % 2 === 0) {
    const stall = stalls[npc.phase % stalls.length]
    const spot = approach(stall, 1.8)
    npc.tx = spot.x
    npc.tz = spot.z
    npc.pause = 1.2
    return
  }
  const next = waypoints[npc.phase % waypoints.length]
  npc.tx = next.x
  npc.tz = next.z
  npc.pause = 0.35
}

export default function Customers() {
  const bodyRef = useRef<THREE.InstancedMesh>(null)
  const headRef = useRef<THREE.InstancedMesh>(null)
  const hairRef = useRef<THREE.InstancedMesh>(null)
  const armRef = useRef<THREE.InstancedMesh>(null)
  const shoeRef = useRef<THREE.InstancedMesh>(null)
  const backpackRef = useRef<THREE.InstancedMesh>(null)
  const tieRef = useRef<THREE.InstancedMesh>(null)
  const hatRef = useRef<THREE.InstancedMesh>(null)
  const starRef = useRef<THREE.InstancedMesh>(null)
  const coinRef = useRef<THREE.Mesh>(null)
  const coinLife = useRef(0)

  useLayoutEffect(() => {
    const body = bodyRef.current
    const arms = armRef.current
    if (body) {
      for (let index = 0; index < COUNT; index += 1) {
        tint.set(colors[index])
        body.setColorAt(index, tint)
      }
      if (body.instanceColor) body.instanceColor.needsUpdate = true
    }
    if (arms) {
      for (let index = 0; index < COUNT * 2; index += 1) {
        tint.set(colors[Math.floor(index / 2)])
        arms.setColorAt(index, tint)
      }
      if (arms.instanceColor) arms.instanceColor.needsUpdate = true
    }
  }, [])

  useFrame((_, delta) => {
    const step = delta > 0.05 ? 0.05 : delta
    let busy = false
    for (let index = 0; index < COUNT; index += 1) {
      if (npcs[index].saleId !== 0) busy = true
    }
    if (!busy && saleCue.length > 0) {
      const job = saleCue[0]
      const pool = customerLimit()
      let best = 0
      let bestDist = Number.POSITIVE_INFINITY
      for (let index = 0; index < pool; index += 1) {
        const dist = Math.hypot(npcs[index].x - saleSpot.x, npcs[index].z - saleSpot.z)
        if (dist < bestDist) {
          bestDist = dist
          best = index
        }
      }
      npcs[best].saleId = job.id
      npcs[best].tx = saleSpot.x
      npcs[best].tz = saleSpot.z
      npcs[best].pause = 0
      npcs[best].popping = 0
    }

    const limit = customerLimit()
    for (let index = 0; index < COUNT; index += 1) {
      const npc = npcs[index]
      const shown = index < limit || npc.saleId !== 0
      if (!shown) continue
      if (npc.popping > 0) {
        npc.popping -= step
        if (npc.popping <= 0) {
          sendAction({ type: "revealSale", id: npc.saleId })
          finishSale(npc.saleId)
          if (saleCue.length > 0 && saleCue[0].id === npc.saleId) saleCue.shift()
          npc.saleId = 0
          npc.popping = 0
          pickWander(npc)
          npc.pause = 0.2
        }
        continue
      }
      if (npc.pause > 0) {
        npc.pause -= step
        continue
      }
      const dx = npc.tx - npc.x
      const dz = npc.tz - npc.z
      const dist = Math.hypot(dx, dz)
      if (dist < 0.35) {
        if (npc.saleId !== 0) {
          npc.popping = 0.62
          coinLife.current = 0.62
        } else {
          pickWander(npc)
        }
        continue
      }
      const speed = npc.saleId !== 0 ? 2.2 : 1.35
      npc.x += (dx / dist) * speed * step
      npc.z += (dz / dist) * speed * step
      npc.yaw = Math.atan2(dx, dz)
      npc.walk += step * 8
    }

    const coin = coinRef.current
    if (coin) {
      if (coinLife.current > 0) {
        coinLife.current -= step
        const rise = 1 - coinLife.current / 0.62
        coin.visible = true
        coin.position.set(mine.x, 1.25 + rise * 1.15, mine.z)
      } else {
        coin.visible = false
      }
    }

    const body = bodyRef.current
    const head = headRef.current
    const hair = hairRef.current
    const arms = armRef.current
    const shoes = shoeRef.current
    if (!body || !head || !hair || !arms || !shoes) return
    let armCursor = 0
    for (let index = 0; index < COUNT; index += 1) {
      const npc = npcs[index]
      const shown = index < limit || npc.saleId !== 0
      const scale = shown ? 1 : 0
      dummy.position.set(npc.x, 0.86, npc.z)
      dummy.rotation.set(0, npc.yaw, 0)
      dummy.scale.set(scale, scale, scale)
      dummy.updateMatrix()
      body.setMatrixAt(index, dummy.matrix)
      dummy.position.set(npc.x, 1.32, npc.z)
      dummy.updateMatrix()
      head.setMatrixAt(index, dummy.matrix)
      dummy.position.set(npc.x, 1.48, npc.z)
      dummy.updateMatrix()
      hair.setMatrixAt(index, dummy.matrix)
      dummy.position.set(npc.x, 0.08, npc.z)
      dummy.updateMatrix()
      shoes.setMatrixAt(index, dummy.matrix)
      dummy.position.set(npc.x, 0, npc.z)
      dummy.rotation.set(0, npc.yaw, 0)
      dummy.scale.set(scale, scale, scale)
      dummy.updateMatrix()
      const kind = index % 4
      const mark = shown ? 1 : 0
      placeMark(backpackRef.current, index, 0, 0.95, -0.18, kind === 0 ? mark : 0)
      placeMark(tieRef.current, index, 0, 0.92, 0.16, kind === 1 ? mark : 0)
      placeMark(hatRef.current, index, 0, 1.62, 0, kind === 2 ? mark : 0)
      placeMark(starRef.current, index, 0, 1.88, 0, kind === 3 ? mark : 0)
      const swing = shown && npc.pause <= 0 && npc.popping <= 0 ? Math.sin(npc.walk) * 0.7 : 0
      for (let side = 0; side < 2; side += 1) {
        armLocal.position.set(side === 0 ? -0.3 : 0.3, 0.86, 0)
        armLocal.rotation.set(side === 0 ? swing : -swing, 0, 0)
        armLocal.scale.set(1, 1, 1)
        armLocal.updateMatrix()
        scratch.multiplyMatrices(dummy.matrix, armLocal.matrix)
        arms.setMatrixAt(armCursor, scratch)
        armCursor += 1
      }
    }
    body.instanceMatrix.needsUpdate = true
    head.instanceMatrix.needsUpdate = true
    hair.instanceMatrix.needsUpdate = true
    shoes.instanceMatrix.needsUpdate = true
    arms.instanceMatrix.needsUpdate = true
    for (const mesh of [backpackRef.current, tieRef.current, hatRef.current, starRef.current]) {
      if (!mesh) continue
      mesh.count = limit
      mesh.instanceMatrix.needsUpdate = true
    }
    body.count = limit
    head.count = limit
    hair.count = limit
    shoes.count = limit
    arms.count = limit * 2
  })

  return (
    <group>
      <instancedMesh ref={bodyRef} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <boxGeometry args={[0.44, 0.52, 0.28]} />
        <meshLambertMaterial color={tokens.white} flatShading />
      </instancedMesh>
      <instancedMesh ref={headRef} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <sphereGeometry args={[0.17, 6, 4]} />
        <meshLambertMaterial color={tokens.cream} flatShading />
      </instancedMesh>
      <instancedMesh ref={hairRef} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <sphereGeometry args={[0.13, 5, 4]} />
        <meshLambertMaterial color={tokens.ink} flatShading />
      </instancedMesh>
      <instancedMesh ref={armRef} args={[undefined, undefined, COUNT * 2]} frustumCulled={false}>
        <boxGeometry args={[0.1, 0.3, 0.1]} />
        <meshLambertMaterial color={tokens.white} flatShading />
      </instancedMesh>
      <instancedMesh ref={shoeRef} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <boxGeometry args={[0.26, 0.08, 0.18]} />
        <meshLambertMaterial color={tokens.ink} flatShading />
      </instancedMesh>
      <instancedMesh ref={backpackRef} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <boxGeometry args={[0.28, 0.32, 0.12]} />
        <meshLambertMaterial color={tokens.indigo} flatShading />
      </instancedMesh>
      <instancedMesh ref={tieRef} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <boxGeometry args={[0.06, 0.26, 0.04]} />
        <meshLambertMaterial color={tokens.ink} flatShading />
      </instancedMesh>
      <instancedMesh ref={hatRef} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <cylinderGeometry args={[0.16, 0.16, 0.08, 6]} />
        <meshLambertMaterial color={tokens.yellow} flatShading />
      </instancedMesh>
      <instancedMesh ref={starRef} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <octahedronGeometry args={[0.08, 0]} />
        <meshLambertMaterial color={tokens.yellow} flatShading />
      </instancedMesh>
      <mesh ref={coinRef} visible={false}>
        <sphereGeometry args={[0.12, 6, 4]} />
        <meshBasicMaterial color={tokens.yellow} toneMapped={false} />
      </mesh>
    </group>
  )
}
