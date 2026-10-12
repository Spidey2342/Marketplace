import { useLayoutEffect, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { dummy } from "@/scene3d/place"
import { useTier } from "@/scene3d/tier"
import { tokens } from "@/scene3d/tokens"

const COUNT = 28

export default function Dust() {
  const tier = useTier()
  const ref = useRef<THREE.InstancedMesh>(null)
  const specks = useMemo(() => new Float32Array(COUNT * 3), [])

  useLayoutEffect(() => {
    for (let index = 0; index < COUNT; index += 1) {
      specks[index * 3] = (index % 7) * 1.3 - 4
      specks[index * 3 + 1] = 0.8 + (index % 5) * 0.55
      specks[index * 3 + 2] = (index % 8) * 3.2 - 12
    }
  }, [specks])

  useFrame((_, delta) => {
    const mesh = ref.current
    if (!mesh) return
    const step = delta > 0.05 ? 0.05 : delta
    for (let index = 0; index < COUNT; index += 1) {
      let x = specks[index * 3] + step * (0.15 + (index % 4) * 0.05)
      let y = specks[index * 3 + 1] + Math.sin(x * 0.7 + index) * step * 0.15
      let z = specks[index * 3 + 2] + step * 0.05
      if (x > 6) x = -6
      if (z > 16) z = -16
      if (y > 3.4) y = 0.8
      if (y < 0.5) y = 0.8
      specks[index * 3] = x
      specks[index * 3 + 1] = y
      specks[index * 3 + 2] = z
      dummy.position.set(x, y, z)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      mesh.setMatrixAt(index, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  if (tier === "low") return null

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <planeGeometry args={[0.07, 0.07]} />
      <meshBasicMaterial color={tokens.sun} transparent opacity={0.55} depthWrite={false} toneMapped={false} />
    </instancedMesh>
  )
}
