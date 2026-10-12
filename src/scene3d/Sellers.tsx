import { useEffect, useLayoutEffect, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { neighborStalls, sellerSpot } from "@/data/townLayout"
import { dummy } from "@/scene3d/place"
import { tokens } from "@/scene3d/tokens"
import { townLive } from "@/scene3d/townLive"

const colors = [tokens.yellow, tokens.green, tokens.red, tokens.indigo]
const spots = neighborStalls.map((stall) => sellerSpot(stall))
const armLocal = new THREE.Object3D()
const scratch = new THREE.Matrix4()

export default function Sellers() {
  const bodyRef = useRef<THREE.InstancedMesh>(null)
  const headRef = useRef<THREE.InstancedMesh>(null)
  const hairRef = useRef<THREE.InstancedMesh>(null)
  const armRef = useRef<THREE.InstancedMesh>(null)
  const shoeRef = useRef<THREE.InstancedMesh>(null)
  const tagMats = useRef<(THREE.MeshBasicMaterial | null)[]>([])
  const tagMeshes = useRef<(THREE.Mesh | null)[]>([])

  useLayoutEffect(() => {
    const meshes = [bodyRef.current, headRef.current, hairRef.current, shoeRef.current]
    const heights = [0.86, 1.32, 1.48, 0.08]
    for (let meshIndex = 0; meshIndex < meshes.length; meshIndex += 1) {
      const mesh = meshes[meshIndex]
      if (!mesh) continue
      for (let index = 0; index < spots.length; index += 1) {
        const spot = spots[index]
        dummy.position.set(spot.x, heights[meshIndex], spot.z)
        dummy.rotation.set(0, spot.yaw, 0)
        dummy.scale.set(1, 1, 1)
        dummy.updateMatrix()
        mesh.setMatrixAt(index, dummy.matrix)
      }
      mesh.instanceMatrix.needsUpdate = true
      mesh.frustumCulled = false
    }
    const body = bodyRef.current
    const arm = armRef.current
    if (body) {
      for (let index = 0; index < spots.length; index += 1) {
        body.setColorAt(index, new THREE.Color(colors[index % colors.length]))
      }
      if (body.instanceColor) body.instanceColor.needsUpdate = true
    }
    if (arm) {
      for (let index = 0; index < spots.length * 2; index += 1) {
        arm.setColorAt(index, new THREE.Color(colors[Math.floor(index / 2) % colors.length]))
      }
      if (arm.instanceColor) arm.instanceColor.needsUpdate = true
    }
  }, [])

  useEffect(() => {
    let gone = false
    const textures: THREE.CanvasTexture[] = []
    async function paintTags() {
      try {
        await document.fonts.load("800 42px 'Baloo 2'")
      } catch {
        // Draw with the fallback face if the font is blocked.
      }
      if (gone) return
      for (let index = 0; index < neighborStalls.length; index += 1) {
        const canvas = document.createElement("canvas")
        canvas.width = 256
        canvas.height = 64
        const ctx = canvas.getContext("2d")
        if (!ctx) continue
        ctx.fillStyle = tokens.paper
        ctx.fillRect(0, 0, 256, 64)
        ctx.strokeStyle = tokens.line
        ctx.lineWidth = 8
        ctx.strokeRect(4, 4, 248, 56)
        ctx.fillStyle = tokens.ink
        ctx.font = "800 42px 'Baloo 2', sans-serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(neighborStalls[index].seller ?? "", 128, 34)
        const texture = new THREE.CanvasTexture(canvas)
        texture.colorSpace = THREE.SRGBColorSpace
        texture.needsUpdate = true
        textures.push(texture)
        const material = tagMats.current[index]
        if (!material) continue
        material.map = texture
        material.needsUpdate = true
      }
    }
    void paintTags()
    return () => {
      gone = true
      for (let index = 0; index < textures.length; index += 1) textures[index].dispose()
    }
  }, [])

  useFrame(({ clock }) => {
    const count = Math.max(0, Math.min(townLive.npcSellers, spots.length))
    if (bodyRef.current) bodyRef.current.count = count
    if (headRef.current) headRef.current.count = count
    if (hairRef.current) hairRef.current.count = count
    if (shoeRef.current) shoeRef.current.count = count
    for (let index = 0; index < tagMeshes.current.length; index += 1) {
      const tag = tagMeshes.current[index]
      if (tag) tag.visible = index < count
    }
    const arms = armRef.current
    if (!arms) return
    arms.count = count * 2
    const time = clock.elapsedTime
    let cursor = 0
    for (let index = 0; index < count; index += 1) {
      const spot = spots[index]
      dummy.position.set(spot.x, 0, spot.z)
      dummy.rotation.set(0, spot.yaw, 0)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      const window = (time + index * 1.4) % 4.5
      const waving = window < 0.7
      const swing = waving ? Math.sin(window * 16) * 0.9 : 0
      for (let side = 0; side < 2; side += 1) {
        armLocal.position.set(side === 0 ? -0.32 : 0.32, 0.86, 0)
        armLocal.rotation.set(side === 0 && waving ? swing : 0, 0, 0)
        armLocal.scale.set(1, 1, 1)
        armLocal.updateMatrix()
        scratch.multiplyMatrices(dummy.matrix, armLocal.matrix)
        arms.setMatrixAt(cursor, scratch)
        cursor += 1
      }
    }
    arms.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={bodyRef} args={[undefined, undefined, spots.length]} frustumCulled={false}>
        <boxGeometry args={[0.46, 0.54, 0.28]} />
        <meshLambertMaterial color={tokens.white} flatShading />
      </instancedMesh>
      <instancedMesh ref={headRef} args={[undefined, undefined, spots.length]} frustumCulled={false}>
        <sphereGeometry args={[0.18, 6, 4]} />
        <meshLambertMaterial color={tokens.cream} flatShading />
      </instancedMesh>
      <instancedMesh ref={hairRef} args={[undefined, undefined, spots.length]} frustumCulled={false}>
        <sphereGeometry args={[0.14, 5, 4]} />
        <meshLambertMaterial color={tokens.ink} flatShading />
      </instancedMesh>
      <instancedMesh ref={armRef} args={[undefined, undefined, spots.length * 2]} frustumCulled={false}>
        <boxGeometry args={[0.1, 0.32, 0.1]} />
        <meshLambertMaterial color={tokens.white} flatShading />
      </instancedMesh>
      <instancedMesh ref={shoeRef} args={[undefined, undefined, spots.length]} frustumCulled={false}>
        <boxGeometry args={[0.28, 0.08, 0.2]} />
        <meshLambertMaterial color={tokens.ink} flatShading />
      </instancedMesh>
      {neighborStalls.map((stall, index) => {
        const spot = sellerSpot(stall)
        return (
          <mesh
            key={stall.id}
            position={[spot.x, 1.82, spot.z]}
            ref={(mesh) => {
              tagMeshes.current[index] = mesh
            }}
          >
            <planeGeometry args={[0.9, 0.24]} />
            <meshBasicMaterial
              ref={(material) => {
                tagMats.current[index] = material
              }}
              color={tokens.white}
              toneMapped={false}
              transparent
            />
          </mesh>
        )
      })}
    </group>
  )
}
