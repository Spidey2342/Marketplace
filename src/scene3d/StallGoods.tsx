import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import type { PropType } from "@/data/products"
import { playerStall } from "@/data/townLayout"
import { tokens } from "@/scene3d/tokens"
import { subscribeView, worldView } from "@/scene3d/worldView"

function drawTag(price: number): THREE.CanvasTexture {
  const canvas = document.createElement("canvas")
  canvas.width = 128
  canvas.height = 64
  const ctx = canvas.getContext("2d")
  if (ctx) {
    ctx.fillStyle = tokens.yellow
    ctx.fillRect(0, 0, 128, 64)
    ctx.strokeStyle = tokens.line
    ctx.lineWidth = 8
    ctx.strokeRect(4, 4, 120, 56)
    ctx.fillStyle = tokens.ink
    ctx.font = "800 36px 'Baloo 2', sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(`¢${price}`, 64, 34)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

export default function StallGoods() {
  const [, bump] = useState(0)
  const mats = useRef<(THREE.MeshBasicMaterial | null)[]>([])
  useEffect(() => subscribeView(() => bump((value) => value + 1)), [])
  const stall = playerStall()
  const goods = worldView.goods
  const signature = goods.map((good) => `${good.id}:${good.price}`).join("|")

  useEffect(() => {
    let gone = false
    const textures: THREE.CanvasTexture[] = []
    async function paint() {
      try {
        await document.fonts.load("800 36px 'Baloo 2'")
      } catch {
        // Draw with the fallback face if the font is blocked.
      }
      if (gone) return
      for (let index = 0; index < goods.length; index += 1) {
        const texture = drawTag(goods[index].price)
        textures.push(texture)
        const material = mats.current[index]
        if (!material) continue
        material.map = texture
        material.needsUpdate = true
      }
    }
    void paint()
    return () => {
      gone = true
      for (let index = 0; index < textures.length; index += 1) textures[index].dispose()
    }
  }, [signature])

  return (
    <group>
      {goods.map((good, index) => {
        const z = stall.z + (index - (goods.length - 1) / 2) * 0.42
        const kind: PropType = good.propType ?? "pile"
        return (
          <group key={good.id} position={[stall.x, 0.86, z]}>
            {kind === "cup" && (
              <mesh position={[0, 0.04, 0]}>
                <cylinderGeometry args={[0.09, 0.11, 0.2, 8]} />
                <meshLambertMaterial color={good.color || tokens.yellow} flatShading />
              </mesh>
            )}
            {kind === "bag" && (
              <mesh>
                <boxGeometry args={[0.26, 0.2, 0.18]} />
                <meshLambertMaterial color={good.color || tokens.yellow} flatShading />
              </mesh>
            )}
            {kind === "plate" && (
              <mesh position={[0, -0.04, 0]}>
                <cylinderGeometry args={[0.16, 0.16, 0.06, 10]} />
                <meshLambertMaterial color={good.color || tokens.yellow} flatShading />
              </mesh>
            )}
            {kind === "pile" && (
              <group>
                <mesh position={[-0.06, -0.02, 0]}>
                  <boxGeometry args={[0.14, 0.12, 0.14]} />
                  <meshLambertMaterial color={good.color || tokens.yellow} flatShading />
                </mesh>
                <mesh position={[0.07, 0.02, 0.02]}>
                  <boxGeometry args={[0.12, 0.12, 0.12]} />
                  <meshLambertMaterial color={good.color || tokens.yellow} flatShading />
                </mesh>
                <mesh position={[0, 0.1, -0.02]}>
                  <boxGeometry args={[0.1, 0.1, 0.1]} />
                  <meshLambertMaterial color={good.color || tokens.yellow} flatShading />
                </mesh>
              </group>
            )}
            <mesh position={[0, 0.42, 0]}>
              <planeGeometry args={[0.46, 0.22]} />
              <meshBasicMaterial
                ref={(material) => {
                  mats.current[index] = material
                }}
                color={tokens.white}
                toneMapped={false}
                transparent
              />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}
