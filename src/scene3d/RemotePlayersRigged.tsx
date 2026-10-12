import { createRef, useLayoutEffect, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import type { Group } from "three"
import * as THREE from "three"
import { neighborStalls, sellerSpot } from "@/data/townLayout"
import CharacterAvatar, { type CharacterHandle } from "@/scene3d/characters/CharacterAvatar"
import { CHARACTER_NEAR_METERS } from "@/scene3d/characters/constants"
import { lookFromRemote } from "@/scene3d/characters/remoteLook"
import { tokens } from "@/scene3d/tokens"
import { characterAnimBudget } from "@/scene3d/tier"
import { townLive, type RemotePlayer } from "@/scene3d/townLive"
import { townNameTag, type NameTagPeer } from "@/lib/handle"
import { pose } from "@/scene3d/worldView"

const SLOTS = 20

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

export default function RemotePlayersRigged() {
  const roots = useRef<(Group | null)[]>([])
  const rigs = useRef(
    Array.from({ length: SLOTS }, () => createRef<CharacterHandle | null>()),
  )
  const tags = useRef<(THREE.Mesh | null)[]>([])
  const labels = useRef<string[]>(Array(SLOTS).fill(""))
  const phases = useRef(new Float32Array(SLOTS))

  useLayoutEffect(() => {
    for (let index = 0; index < SLOTS; index += 1) {
      const root = roots.current[index]
      if (!root) continue
      const tag = root.getObjectByName("name-tag")
      if (tag instanceof THREE.Mesh) tags.current[index] = tag
    }
  }, [])

  useFrame((_, delta) => {
    const step = delta > 0.05 ? 0.05 : delta
    const now = performance.now()
    const list = townLive.ordered
    const budget = characterAnimBudget()
    const ranked: { index: number; dist: number }[] = []

    for (let index = 0; index < SLOTS; index += 1) {
      const root = roots.current[index]
      const player = list[index]
      if (!root || !player || stale(player, now)) {
        if (root) root.visible = false
        continue
      }
      root.visible = true
      const spot = stallSpot(index)
      let x = player.x
      let z = player.z
      let yaw = player.yaw
      let moving = player.moving
      if (player.id.startsWith("fake-")) {
        const angle = now / 900 + index
        x = Math.sin(angle) * 1.4
        z = -3 + index * 0.8
        yaw = angle
        player.x = x
        player.z = z
        moving = true
        player.at = now
      } else if (player.at === 0) {
        x = spot.x
        z = spot.z
        yaw = spot.yaw
        player.x = x
        player.z = z
        player.prevX = x
        player.prevZ = z
        moving = false
      } else {
        const t = Math.min(1, (now - player.at) / 125)
        x = player.prevX + (player.x - player.prevX) * t
        z = player.prevZ + (player.z - player.prevZ) * t
        yaw = player.prevYaw + (player.yaw - player.prevYaw) * t
      }
      root.position.set(x, 0, z)
      root.rotation.y = yaw
      ranked.push({ index, dist: Math.hypot(x - pose.x, z - pose.z) })
    }

    ranked.sort((a, b) => a.dist - b.dist)
    const animateSet = new Set(ranked.slice(0, budget).map((item) => item.index))

    const tagPeers: NameTagPeer[] = list
      .filter((player): player is RemotePlayer => Boolean(player))
      .map((player) => ({
        id: player.id,
        nickname: player.nickname,
        tag: player.tag,
      }))

    for (const item of ranked) {
      const player = list[item.index]
      const rig = rigs.current[item.index]?.current
      if (!player || !rig) continue
      rig.setLook(lookFromRemote(player))
      const far = item.dist > CHARACTER_NEAR_METERS
      const lod = far ? "street-far" : "street-near"
      const speed = player.moving ? (far ? 1.2 : 2.5) : 0
      if (player.moving && !far) phases.current[item.index] += step * 9
      rig.update(step, speed, lod, animateSet.has(item.index))

      const speech = player.speech && player.speechUntil > now ? player.speech : null
      const text = townNameTag(
        { id: player.id, nickname: player.nickname, tag: player.tag },
        tagPeers,
        speech,
      )
      if (text !== labels.current[item.index]) {
        labels.current[item.index] = text
        const tag = tags.current[item.index]
        if (tag) writeTag(tag, text)
      }
    }
  })

  const defaultLook = lookFromRemote({
    id: "idle",
    nickname: "Guest",
    tag: 1000,
    hair: "#2a1a16",
    hairId: "short",
    outfit: "#ffc928",
    shoes: "#8a5b43",
    x: 0,
    z: 0,
    yaw: 0,
    prevX: 0,
    prevZ: 0,
    prevYaw: 0,
    prevAt: 0,
    at: 0,
    moving: false,
    speech: null,
    speechUntil: 0,
    emote: null,
    goods: [],
  })

  return (
    <group>
      {Array.from({ length: SLOTS }, (_, index) => (
        <group
          key={index}
          ref={(node) => {
            roots.current[index] = node
          }}
          visible={false}
        >
          <CharacterAvatar look={defaultLook} lod="street-near" rigRef={rigs.current[index]} />
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
