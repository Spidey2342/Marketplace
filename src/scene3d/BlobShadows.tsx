import { useLayoutEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { shops, stalls } from "@/data/townLayout"
import { paint, type Spot } from "@/scene3d/place"
import { tokens } from "@/scene3d/tokens"

function blobTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas")
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext("2d")
  if (ctx) {
    const glow = ctx.createRadialGradient(32, 32, 4, 32, 32, 30)
    glow.addColorStop(0, "rgba(24,47,42,0.55)")
    glow.addColorStop(1, "rgba(24,47,42,0)")
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, 64, 64)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

const blobs: Spot[] = [
  ...stalls.map((stall) => ({
    x: stall.x,
    y: 0.025,
    z: stall.z,
    rotX: -Math.PI / 2,
    sx: 2.3,
    sy: 2.1,
  })),
  ...shops.map((shop) => ({
    x: shop.x,
    y: 0.025,
    z: shop.z + 0.2,
    rotX: -Math.PI / 2,
    sx: shop.w * 0.9,
    sy: shop.d * 0.85,
  })),
]

export default function BlobShadows() {
  const ref = useRef<THREE.InstancedMesh>(null)
  const texture = useMemo(blobTexture, [])

  useLayoutEffect(() => {
    if (ref.current) paint(ref.current, blobs)
    return () => texture.dispose()
  }, [texture])

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, blobs.length]}
      frustumCulled={false}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture}
        color={tokens.ink}
        transparent
        opacity={0.9}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  )
}
