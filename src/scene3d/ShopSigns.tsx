import { useEffect, useRef } from "react"
import * as THREE from "three"
import { shops } from "@/data/townLayout"
import { tokens } from "@/scene3d/tokens"

function drawSign(name: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas")
  canvas.width = 512
  canvas.height = 192
  const ctx = canvas.getContext("2d")
  if (!ctx) return new THREE.CanvasTexture(canvas)
  ctx.fillStyle = tokens.paper
  ctx.fillRect(0, 0, 512, 192)
  ctx.strokeStyle = tokens.line
  ctx.lineWidth = 18
  ctx.strokeRect(12, 12, 488, 168)
  ctx.fillStyle = tokens.ink
  ctx.font = "800 72px 'Baloo 2', sans-serif"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(name, 256, 100)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

export default function ShopSigns() {
  const mats = useRef<(THREE.MeshBasicMaterial | null)[]>([])

  useEffect(() => {
    let gone = false
    const textures: THREE.CanvasTexture[] = []
    async function paint() {
      try {
        await document.fonts.load("800 72px 'Baloo 2'")
      } catch {
        // Draw with the fallback face if the font request fails.
      }
      if (gone) return
      for (let index = 0; index < shops.length; index += 1) {
        const texture = drawSign(shops[index].name)
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
  }, [])

  return (
    <group>
      {shops.map((shop, index) => (
        <mesh
          key={shop.id}
          position={[shop.x, shop.h * 0.72, shop.z + shop.d / 2 + 0.08]}
        >
          <planeGeometry args={[shop.w * 0.78, 0.7]} />
          <meshBasicMaterial
            ref={(material) => {
              mats.current[index] = material
            }}
            color={tokens.white}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  )
}
