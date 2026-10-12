import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef } from "react"
import * as THREE from "three"
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js"
import { applyCharacterLook, simplifyMaterials } from "@/scene3d/characters/applyLook"
import { CharacterAnimator } from "@/scene3d/characters/CharacterAnimator"
import { useBodyGLTF } from "@/scene3d/characters/characterLoader"
import { countTriangles } from "@/scene3d/characters/countTriangles"
import type { CharacterLod, CharacterLook } from "@/scene3d/characters/constants"

export type CharacterHandle = {
  update: (delta: number, speed: number, lod: CharacterLod, animated: boolean) => void
  playEmote: (label: string) => void
  playOneShot: (name: "sell_call" | "buy") => void
  setLook: (look: CharacterLook) => void
  triangleCount: () => number
}

type Props = {
  look: CharacterLook
  lod: CharacterLod
  showcaseSpin?: boolean
}

const CharacterRig = forwardRef<CharacterHandle, Props>(function CharacterRig(
  { look, lod, showcaseSpin = false },
  ref,
) {
  const root = useRef<THREE.Group>(null)
  const animator = useRef<CharacterAnimator | null>(null)
  const triCount = useRef(0)
  const spin = useRef(0)
  const gltf = useBodyGLTF(look.bodyTypeId)

  useLayoutEffect(() => {
    const host = root.current
    if (!host) return
    while (host.children.length > 0) {
      host.remove(host.children[0])
    }

    const clone = cloneSkinned(gltf.scene) as THREE.Group
    clone.rotation.x = -Math.PI / 2
    clone.scale.setScalar(0.45)
    applyCharacterLook(clone, look)
    if (lod === "street-far") simplifyMaterials(clone)
    host.add(clone)
    triCount.current = countTriangles(clone)
    animator.current = new CharacterAnimator(clone, gltf.animations)

    return () => {
      animator.current?.dispose()
      animator.current = null
      clone.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) return
        node.geometry?.dispose()
        const material = node.material
        if (Array.isArray(material)) material.forEach((item) => item.dispose())
        else material?.dispose()
      })
      host.clear()
    }
  }, [gltf.scene, gltf.animations, look.bodyTypeId, lod])

  useEffect(() => {
    const host = root.current
    if (!host || host.children.length === 0) return
    const clone = host.children[0]
    applyCharacterLook(clone, look)
  }, [look])

  useImperativeHandle(ref, () => ({
    update(delta, speed, level, animated) {
      if (showcaseSpin) {
        spin.current += delta * 0.35
        if (root.current) root.current.rotation.y = spin.current
      }
      animator.current?.update(delta, speed, level, animated)
    },
    playEmote(label) {
      animator.current?.playEmote(label)
    },
    playOneShot(name) {
      animator.current?.playOneShot(name)
    },
    setLook(next) {
      const host = root.current
      if (!host || host.children.length === 0) return
      applyCharacterLook(host.children[0], next)
    },
    triangleCount() {
      return triCount.current
    },
  }))

  return <group ref={root} />
})

export default CharacterRig
