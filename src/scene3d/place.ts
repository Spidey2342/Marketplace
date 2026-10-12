import * as THREE from "three"

export const dummy = new THREE.Object3D()
export const tint = new THREE.Color()

export type Spot = {
  x: number
  y: number
  z: number
  rotY?: number
  rotX?: number
  rotZ?: number
  sx?: number
  sy?: number
  sz?: number
  color?: string
}

export function paint(mesh: THREE.InstancedMesh, items: readonly Spot[]) {
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index]
    dummy.position.set(item.x, item.y, item.z)
    dummy.rotation.set(item.rotX ?? 0, item.rotY ?? 0, item.rotZ ?? 0)
    dummy.scale.set(item.sx ?? 1, item.sy ?? 1, item.sz ?? 1)
    dummy.updateMatrix()
    mesh.setMatrixAt(index, dummy.matrix)
    if (item.color) {
      tint.set(item.color)
      mesh.setColorAt(index, tint)
    }
  }
  mesh.instanceMatrix.needsUpdate = true
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  mesh.frustumCulled = false
}
