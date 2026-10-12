import { useEffect, useLayoutEffect, useMemo, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import type { Group } from "three"
import * as THREE from "three"
import { colliders, playerSpawn } from "@/data/townLayout"
import { slide } from "@/scene3d/collide"
import CharacterAvatar, { type CharacterHandle } from "@/scene3d/characters/CharacterAvatar"
import { SELL_CALL_MAX_S, SELL_CALL_MIN_S } from "@/scene3d/characters/constants"
import PlayerBubble from "@/scene3d/PlayerBubble"
import { sendMove } from "@/scene3d/TownLink"
import { clearGlide, input } from "@/state/input"
import { sendAction, useGame } from "@/state/GameProvider"
import { pose, worldView } from "@/scene3d/worldView"

const RADIUS = 0.36
const SPEED = 3
const ACCEL = 14
const DECEL = 16
const home = playerSpawn()
const HAIR = ["short", "puff", "braids", "fade"]
const look = new THREE.Vector3()
const desired = new THREE.Vector3()

type Parts = {
  armL: THREE.Object3D
  armR: THREE.Object3D
  body: THREE.Mesh
  hairs: THREE.Object3D[]
  hairMats: THREE.Mesh[]
  outfit: THREE.Mesh[]
  shoes: THREE.Mesh[]
}

function paintMesh(mesh: THREE.Mesh | undefined, hex: string) {
  if (!mesh) return
  const material = mesh.material
  if (!(material instanceof THREE.MeshLambertMaterial)) return
  if (material.userData.hex === hex) return
  material.color.set(hex)
  material.userData.hex = hex
}

export default function PlayerRigged() {
  const { state } = useGame()
  const group = useRef<THREE.Group>(null)
  const rig = useRef<CharacterHandle | null>(null)
  const primitive = useRef<Group | null>(null)
  const parts = useRef<Parts | null>(null)
  const camera = useThree((state) => state.camera)
  const speed = useRef(0)
  const bob = useRef(0)
  const breath = useRef(0)
  const report = useRef(0)
  const sentX = useRef(0)
  const sentZ = useRef(0)
  const nextSell = useRef(0)
  const lastEmote = useRef<string | null>(null)
  const lastBuyFlash = useRef<string | null>(null)

  const characterLook = useMemo(
    () => ({
      hairId: state.hairId,
      outfitId: state.outfitId,
      shoeId: state.shoeId,
      skinToneId: state.skinToneId,
      bodyTypeId: state.bodyTypeId,
    }),
    [
      state.bodyTypeId,
      state.hairId,
      state.outfitId,
      state.shoeId,
      state.skinToneId,
    ],
  )

  useLayoutEffect(() => {
    const spot = playerSpawn()
    pose.x = spot.x
    pose.z = spot.z
    pose.yaw = Math.PI
    const root = group.current
    if (!root) return
    root.position.set(spot.x, 0, spot.z)
    root.rotation.y = Math.PI
    sentX.current = spot.x
    sentZ.current = spot.z
  }, [])

  useLayoutEffect(() => {
    const root = primitive.current
    if (!root) return
    const outfitNames = ["body", "arm-l-mesh", "arm-r-mesh"]
    const outfit: THREE.Mesh[] = []
    for (let index = 0; index < outfitNames.length; index += 1) {
      const mesh = root.getObjectByName(outfitNames[index])
      if (mesh instanceof THREE.Mesh) outfit.push(mesh)
    }
    const shoes: THREE.Mesh[] = []
    const shoeL = root.getObjectByName("shoe-l")
    const shoeR = root.getObjectByName("shoe-r")
    if (shoeL instanceof THREE.Mesh) shoes.push(shoeL)
    if (shoeR instanceof THREE.Mesh) shoes.push(shoeR)
    const hairs: THREE.Object3D[] = []
    const hairMats: THREE.Mesh[] = []
    for (let index = 0; index < HAIR.length; index += 1) {
      const mesh = root.getObjectByName(`hair-${HAIR[index]}`)
      if (mesh) hairs.push(mesh)
      if (mesh instanceof THREE.Mesh) hairMats.push(mesh)
    }
    const body = root.getObjectByName("body")
    const armL = root.getObjectByName("arm-l")
    const armR = root.getObjectByName("arm-r")
    if (!(body instanceof THREE.Mesh) || !armL || !armR) return
    parts.current = { body, armL, armR, hairs, outfit, shoes, hairMats }
  })

  useEffect(() => {
    if (!state.emote || state.emote === lastEmote.current) return
    lastEmote.current = state.emote
    rig.current?.playEmote(state.emote)
  }, [state.emote])

  useEffect(() => {
    const key = state.buyFlash ? `${state.buyFlash.stallId}:${state.buyFlash.productId}` : null
    if (!key || key === lastBuyFlash.current) return
    lastBuyFlash.current = key
    rig.current?.playOneShot("buy")
  }, [state.buyFlash])

  useFrame((_, delta) => {
    const step = delta > 0.05 ? 0.05 : delta
    const root = group.current
    const avatar = parts.current
    if (!root) return

    let wishX = 0
    let wishZ = 0
    if (input.glideHome) {
      const dx = home.x - pose.x
      const dz = home.z - pose.z
      const dist = Math.hypot(dx, dz)
      if (dist < 0.12) {
        clearGlide()
        pose.x = home.x
        pose.z = home.z
        speed.current = 0
      } else {
        wishX = dx / dist
        wishZ = dz / dist
      }
    } else if (input.x !== 0 || input.y !== 0) {
      wishX = input.x
      wishZ = input.y
      const length = Math.hypot(wishX, wishZ)
      if (length > 1) {
        wishX /= length
        wishZ /= length
      }
    }

    const moving = wishX !== 0 || wishZ !== 0
    const target = moving ? SPEED : 0
    const rate = moving ? ACCEL : DECEL
    const gap = target - speed.current
    const change = Math.min(Math.abs(gap), rate * step)
    speed.current += Math.sign(gap) * change
    if (speed.current < 0.02) speed.current = 0

    if (moving && speed.current > 0) {
      const next = slide(
        pose.x,
        pose.z,
        wishX * speed.current * step,
        wishZ * speed.current * step,
        RADIUS,
        colliders,
      )
      pose.x = next.x
      pose.z = next.z
      const yaw = Math.atan2(wishX, wishZ)
      let turn = yaw - pose.yaw
      if (turn > Math.PI) turn -= Math.PI * 2
      if (turn < -Math.PI) turn += Math.PI * 2
      const blend = step * 10
      pose.yaw += turn * (blend > 1 ? 1 : blend)
    }

    root.position.set(pose.x, 0, pose.z)
    root.rotation.y = pose.yaw

    if (rig.current) {
      rig.current.update(step, speed.current, "street-near", true)
    } else if (avatar) {
      if (speed.current > 0.15) {
        bob.current += step * 9
        const swing = Math.sin(bob.current)
        avatar.body.position.y = 0.86 + Math.abs(swing) * 0.06
        avatar.armL.rotation.x = swing * 0.75
        avatar.armR.rotation.x = -swing * 0.75
      } else {
        breath.current += step * 2.2
        avatar.body.position.y = 0.86 + Math.sin(breath.current) * 0.02
        avatar.armL.rotation.x = 0
        avatar.armR.rotation.x = 0
      }
      for (let index = 0; index < avatar.outfit.length; index += 1) {
        paintMesh(avatar.outfit[index], worldView.outfit)
      }
      for (let index = 0; index < avatar.shoes.length; index += 1) {
        paintMesh(avatar.shoes[index], worldView.shoes)
      }
      for (let index = 0; index < avatar.hairMats.length; index += 1) {
        paintMesh(avatar.hairMats[index], worldView.hair)
        avatar.hairs[index].visible = HAIR[index] === worldView.hairId
      }
    }

    if (state.roundStatus === "running") {
      if (nextSell.current === 0) {
        nextSell.current =
          performance.now() / 1000 +
          SELL_CALL_MIN_S +
          Math.random() * (SELL_CALL_MAX_S - SELL_CALL_MIN_S)
      } else if (performance.now() / 1000 >= nextSell.current) {
        rig.current?.playOneShot("sell_call")
        nextSell.current =
          performance.now() / 1000 +
          SELL_CALL_MIN_S +
          Math.random() * (SELL_CALL_MAX_S - SELL_CALL_MIN_S)
      }
    } else {
      nextSell.current = 0
    }

    const ahead = speed.current > 0.2 ? 1.7 : 0.72
    const faceX = Math.sin(pose.yaw)
    const faceZ = Math.cos(pose.yaw)
    look.set(pose.x + faceX * ahead, 0.75, pose.z + faceZ * ahead)
    desired.set(look.x, look.y + 8.8, look.z + 8.8)
    if (desired.y < 2) desired.y = 2
    const damp = 1 - Math.exp(-4 * step)
    camera.position.lerp(desired, damp)
    camera.lookAt(look)
    sendMove(pose.x, pose.z, pose.yaw, speed.current > 0.15)

    report.current += step
    if (report.current < 0.2) return
    report.current = 0
    if (Math.abs(pose.x - sentX.current) < 0.02 && Math.abs(pose.z - sentZ.current) < 0.02) return
    sentX.current = pose.x
    sentZ.current = pose.z
    sendAction({ type: "setPlayerPose", x: pose.x, z: pose.z })
  })

  return (
    <group ref={group}>
      <CharacterAvatar
        look={characterLook}
        lod="street-near"
        primitiveRef={primitive}
        rigRef={rig}
      />
      <PlayerBubble />
    </group>
  )
}
