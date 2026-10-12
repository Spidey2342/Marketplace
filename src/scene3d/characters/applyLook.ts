import * as THREE from "three"
import { lookById, hairs, outfits, shoes, skinTones } from "@/data/avatar"
import type { CharacterLook } from "@/scene3d/characters/constants"

const PART_PREFIX = ["hair_", "top_", "bottom_", "shoes_", "accessory_"] as const

function tintMaterial(material: THREE.Material, hex: string, emissive = false) {
  if (!(material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshLambertMaterial)) {
    return
  }
  if (material.userData.tintHex === hex) return
  material.color.set(hex)
  if (emissive && material instanceof THREE.MeshStandardMaterial) {
    material.emissive.set(hex)
    material.emissiveIntensity = 0.08
  }
  material.userData.tintHex = hex
}

function meshName(node: THREE.Object3D): string {
  return node.name.toLowerCase()
}

export function applyCharacterLook(root: THREE.Object3D, look: CharacterLook) {
  const hair = lookById(hairs, look.hairId)
  const outfit = lookById(outfits, look.outfitId)
  const shoe = lookById(shoes, look.shoeId)
  const skin = lookById(skinTones, look.skinToneId)

  const visibleParts = new Set<string>([
    `hair_${look.hairId}`,
    `top_${look.outfitId}`,
    `bottom_${look.outfitId}`,
    `shoes_${look.shoeId}`,
  ])

  root.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return
    const name = meshName(node)
    let matchedPart = false
    for (const prefix of PART_PREFIX) {
      if (!name.startsWith(prefix)) continue
      matchedPart = true
      node.visible = visibleParts.has(name)
      if (name.startsWith("hair_")) tintMaterial(node.material, hair.color)
      if (name.startsWith("top_") || name.startsWith("bottom_")) tintMaterial(node.material, outfit.color)
      if (name.startsWith("shoes_")) tintMaterial(node.material, shoe.color)
    }
    if (!matchedPart && (name.includes("skin") || name.includes("body") || name.includes("head"))) {
      tintMaterial(node.material, skin.color, true)
    }
  })

  const hasHairPart = root.getObjectByName(`hair_${look.hairId}`) !== undefined
  if (!hasHairPart) {
    root.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return
      const name = meshName(node)
      if (name.includes("effect") || name.includes("man")) {
        tintMaterial(node.material, skin.color, true)
      }
    })
  }
}

export function simplifyMaterials(root: THREE.Object3D) {
  root.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return
    const material = node.material
    if (!(material instanceof THREE.MeshStandardMaterial)) return
    const basic = new THREE.MeshLambertMaterial({
      color: material.color,
      map: material.map,
      transparent: material.transparent,
      opacity: material.opacity,
    })
    node.material = basic
  })
}
