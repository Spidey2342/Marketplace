import { useLayoutEffect, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { neighborStalls, sellerSpot } from "@/data/townLayout"
import { townNameTag, type NameTagPeer } from "@/lib/handle"
import PlayerAvatar from "@/scene3d/PlayerAvatar"
import { tokens } from "@/scene3d/tokens"
import { townLive, type RemotePlayer } from "@/scene3d/townLive"

const SLOTS = 20
const HAIR = ["short", "puff", "braids", "fade"]

type Slot = {
  root: THREE.Group
  body: THREE.Mesh
  armL: THREE.Object3D
  armR: THREE.Object3D
  hairs: THREE.Object3D[]
  hairMats: THREE.Mesh[]
  outfit: THREE.Mesh[]
  shoes: THREE.Mesh[]
  tag: THREE.Mesh
  label: string
}

const phases = new Float32Array(SLOTS)

function paint(mesh: THREE.Mesh | undefined, hex: string) {
  if (!mesh) return
  const material = mesh.material
  if (!(material instanceof THREE.MeshLambertMaterial)) return
  if (material.userData.hex === hex) return
  material.color.set(hex)
  material.userData.hex = hex
}

function writeTag(mesh: THREE.Mesh, text: string) {
  const material = mesh.material
  if (!(material instanceof THREE.MeshBasicMaterial)) return
  const canvas = document.createElement("canvas")
  canvas.width = 256
  canvas.height = 64
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  ctx.clearRect(0, 0, 256, 64)
  if (text) {
    ctx.fillStyle = tokens.paper
    ctx.fillRect(8, 4, 240, 56)
    ctx.fillStyle = tokens.ink
    ctx.font = "800 28px 'Baloo 2', sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(text.slice(0, 18), 128, 34)
  }
  const previous = material.map
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  material.map = texture
  material.needsUpdate = true
  previous?.dispose()
}

export default function RemotePlayersPrimitive() {
  const slots = useRef<Slot[]>([])
  const roots = useRef<(THREE.Group | null)[]>([])

  useLayoutEffect(() => {
    const next: Slot[] = []
    for (let index = 0; index < SLOTS; index += 1) {
      const root = roots.current[index]
      if (!root) continue
      const outfit: THREE.Mesh[] = []
      for (const name of ["body", "arm-l-mesh", "arm-r-mesh"]) {
        const mesh = root.getObjectByName(name)
        if (mesh instanceof THREE.Mesh) outfit.push(mesh)
      }
      const shoes: THREE.Mesh[] = []
      const shoeL = root.getObjectByName("shoe-l")
      const shoeR = root.getObjectByName("shoe-r")
      if (shoeL instanceof THREE.Mesh) shoes.push(shoeL)
      if (shoeR instanceof THREE.Mesh) shoes.push(shoeR)
      const hairs: THREE.Object3D[] = []
      const hairMats: THREE.Mesh[] = []
      for (let hair = 0; hair < HAIR.length; hair += 1) {
        const mesh = root.getObjectByName(`hair-${HAIR[hair]}`)
        if (mesh) hairs.push(mesh)
        if (mesh instanceof THREE.Mesh) hairMats.push(mesh)
      }
      const body = root.getObjectByName("body")
      const armL = root.getObjectByName("arm-l")
      const armR = root.getObjectByName("arm-r")
      const tag = root.getObjectByName("name-tag")
      if (!(body instanceof THREE.Mesh) || !armL || !armR || !(tag instanceof THREE.Mesh)) continue
      next.push({
        root,
        body,
        armL,
        armR,
        hairs,
        hairMats,
        outfit,
        shoes,
        tag,
        label: "",
      })
    }
    slots.current = next
  }, [])

  useFrame((_, delta) => {
    const step = delta > 0.05 ? 0.05 : delta
    const now = performance.now()
    const list = townLive.ordered
    const ready = slots.current
    const tagPeers: NameTagPeer[] = list
      .filter((player): player is RemotePlayer => Boolean(player))
      .map((player) => ({
        id: player.id,
        nickname: player.nickname,
        tag: player.tag,
      }))

    for (let index = 0; index < ready.length; index += 1) {
      const slot = ready[index]
      const player = list[index]
      if (!player || stale(player, now)) {
        slot.root.visible = false
        continue
      }
      slot.root.visible = true
      const spot = stallSpot(index)
      let x = player.x
      let z = player.z
      let yaw = player.yaw
      if (player.id.startsWith("fake-")) {
        const angle = now / 900 + index
        x = Math.sin(angle) * 1.4
        z = -3 + index * 0.8
        yaw = angle
        player.x = x
        player.z = z
        player.moving = true
        player.at = now
      } else if (player.at === 0) {
        x = spot.x
        z = spot.z
        yaw = spot.yaw
        player.x = x
        player.z = z
        player.prevX = x
        player.prevZ = z
      } else {
        const t = Math.min(1, (now - player.at) / 125)
        x = player.prevX + (player.x - player.prevX) * t
        z = player.prevZ + (player.z - player.prevZ) * t
        yaw = player.prevYaw + (player.yaw - player.prevYaw) * t
      }
      slot.root.position.set(x, 0, z)
      slot.root.rotation.y = yaw
      if (player.moving) {
        phases[index] += step * 9
        const swing = Math.sin(phases[index])
        slot.body.position.y = 0.86 + Math.abs(swing) * 0.06
        slot.armL.rotation.x = swing * 0.75
        slot.armR.rotation.x = -swing * 0.75
      } else {
        slot.body.position.y = 0.86
        slot.armL.rotation.x = 0
        slot.armR.rotation.x = 0
      }
      for (let piece = 0; piece < slot.outfit.length; piece += 1) {
        paint(slot.outfit[piece], player.outfit)
      }
      for (let piece = 0; piece < slot.shoes.length; piece += 1) {
        paint(slot.shoes[piece], player.shoes)
      }
      for (let piece = 0; piece < slot.hairMats.length; piece += 1) {
        paint(slot.hairMats[piece], player.hair)
        slot.hairs[piece].visible = HAIR[piece] === player.hairId
      }
      const speech = player.speech && player.speechUntil > now ? player.speech : null
      const text = townNameTag(
        { id: player.id, nickname: player.nickname, tag: player.tag },
        tagPeers,
        speech,
      )
      if (text !== slot.label) {
        slot.label = text
        writeTag(slot.tag, text)
      }
    }
  })

  return (
    <group>
      {Array.from({ length: SLOTS }, (_, index) => (
        <group key={index} ref={(node) => { roots.current[index] = node }} visible={false}>
          <PlayerAvatar />
          <mesh name="name-tag" position={[0, 1.9, 0]}>
            <planeGeometry args={[0.9, 0.22]} />
            <meshBasicMaterial color={tokens.white} toneMapped={false} transparent />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function stale(player: RemotePlayer, now: number): boolean {
  if (player.id.startsWith("fake-")) return false
  if (player.at === 0) return now - player.prevAt > 5000
  return now - player.at > 5000
}

function stallSpot(index: number) {
  const stallIndex = townLive.npcSellers + index
  const stall = neighborStalls[stallIndex]
  if (!stall) return { x: 0, z: -6 - index, yaw: 0 }
  return sellerSpot(stall)
}
