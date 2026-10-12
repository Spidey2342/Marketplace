import * as THREE from "three"

export function countTriangles(root: THREE.Object3D): number {
  let total = 0
  root.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return
    const geometry = node.geometry
    if (!geometry) return
    if (geometry.index) total += geometry.index.count / 3
    else if (geometry.attributes.position) total += geometry.attributes.position.count / 3
  })
  return Math.round(total)
}
