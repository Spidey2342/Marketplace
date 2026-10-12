import { bounds, type Aabb } from "@/data/townLayout"

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function separate(x: number, z: number, radius: number, boxes: readonly Aabb[]) {
  let nx = x
  let nz = z
  for (let pass = 0; pass < 2; pass += 1) {
    for (let index = 0; index < boxes.length; index += 1) {
      const box = boxes[index]
      const closestX = clamp(nx, box.minX, box.maxX)
      const closestZ = clamp(nz, box.minZ, box.maxZ)
      const ox = nx - closestX
      const oz = nz - closestZ
      const dist = Math.hypot(ox, oz)
      if (dist >= radius) continue
      if (dist <= 0.0001) {
        const toLeft = nx - box.minX
        const toRight = box.maxX - nx
        const toNear = nz - box.minZ
        const toFar = box.maxZ - nz
        if (Math.min(toLeft, toRight) < Math.min(toNear, toFar)) {
          nx += toLeft < toRight ? -(radius - toLeft) : radius - toRight
        } else {
          nz += toNear < toFar ? -(radius - toNear) : radius - toFar
        }
      } else {
        const push = (radius - dist) / dist
        nx += ox * push
        nz += oz * push
      }
    }
  }
  return {
    x: clamp(nx, bounds.minX, bounds.maxX),
    z: clamp(nz, bounds.minZ, bounds.maxZ),
  }
}

/** Move X first, then Z, so the circle slides along a wall. */
export function slide(
  x: number,
  z: number,
  dx: number,
  dz: number,
  radius: number,
  boxes: readonly Aabb[],
): { x: number; z: number } {
  const movedX = separate(
    clamp(x + dx, bounds.minX, bounds.maxX),
    z,
    radius,
    boxes,
  )
  return separate(
    movedX.x,
    clamp(z + dz, bounds.minZ, bounds.maxZ),
    radius,
    boxes,
  )
}
