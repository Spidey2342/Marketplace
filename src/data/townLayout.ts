import { tokens } from "@/scene3d/tokens"

/** Street runs along Z. Width is X. Units are meters. */
export const street = {
  length: 40,
  width: 12,
  minX: -6,
  maxX: 6,
  minZ: -20,
  maxZ: 20,
  roadWidth: 4.4,
}

export const bounds = {
  minX: -5.15,
  maxX: 5.15,
  minZ: -14.4,
  maxZ: 18.2,
}

export type ShopDef = {
  id: string
  name: string
  x: number
  z: number
  w: number
  d: number
  h: number
  color: string
}

export const shops: ShopDef[] = [
  { id: "amas", name: "AMA'S", x: -4.2, z: -16.6, w: 3.4, d: 3.2, h: 3.3, color: tokens.indigo },
  { id: "chop", name: "CHOP BAR", x: 0, z: -16.6, w: 3.4, d: 3.2, h: 3.3, color: tokens.green },
  { id: "repairs", name: "REPAIRS", x: 4.2, z: -16.6, w: 3.4, d: 3.2, h: 3.3, color: tokens.red },
]

export type StallSlot = {
  id: string
  x: number
  z: number
  side: "left" | "right"
  player: boolean
  seller: string | null
}

const zStops = [-12, -7.2, -2.4, 2.4, 7.2, 12]

function makeStalls(): StallSlot[] {
  const slots: StallSlot[] = []
  for (const side of ["left", "right"] as const) {
    for (let index = 0; index < zStops.length; index += 1) {
      const z = zStops[index]
      const right = side === "right"
      const player = right && z === 2.4
      let seller: string | null = null
      if (right && z === -2.4) seller = "Akos"
      if (right && z === 7.2) seller = "Yaw"
      if (!right && z === 2.4) seller = "Esi"
      if (!right && z === -2.4) seller = "Kojo"
      slots.push({
        id: `${side}-${index}`,
        x: right ? 4.6 : -4.6,
        z,
        side,
        player,
        seller,
      })
    }
  }
  return slots
}

export const stalls: StallSlot[] = makeStalls()

export const lorry = { x: -3.3, z: 16.2, w: 2.1, d: 4.4, h: 2.15 }

export const sun = { x: 14, y: 16, z: -8 }

export type Aabb = { minX: number; maxX: number; minZ: number; maxZ: number }

export function approach(stall: StallSlot, reach = 1.35): { x: number; z: number } {
  const towardStreet = stall.side === "right" ? -1 : 1
  return { x: stall.x + towardStreet * reach, z: stall.z }
}

export function playerStall(): StallSlot {
  const slot = stalls.find((item) => item.player)
  return slot ?? stalls[0]
}

export function playerSpawn(): { x: number; z: number } {
  return approach(playerStall(), 1.45)
}

export function sellerSpot(stall: StallSlot): { x: number; z: number; yaw: number } {
  const towardStreet = stall.side === "right" ? -1 : 1
  return {
    x: stall.x + towardStreet * 0.82,
    z: stall.z,
    yaw: stall.side === "right" ? -Math.PI / 2 : Math.PI / 2,
  }
}

export const colliders: Aabb[] = [
  ...shops.map((shop) => ({
    minX: shop.x - shop.w / 2,
    maxX: shop.x + shop.w / 2,
    minZ: shop.z - shop.d / 2,
    maxZ: shop.z + shop.d / 2,
  })),
  ...stalls.map((stall) => ({
    minX: stall.x - 0.58,
    maxX: stall.x + 0.58,
    minZ: stall.z - 0.82,
    maxZ: stall.z + 0.82,
  })),
  {
    minX: lorry.x - lorry.w / 2,
    maxX: lorry.x + lorry.w / 2,
    minZ: lorry.z - lorry.d / 2,
    maxZ: lorry.z + lorry.d / 2,
  },
]

export const waypoints: { x: number; z: number }[] = [
  { x: -1.4, z: -11 },
  { x: 1.3, z: -6 },
  { x: -1.2, z: -1 },
  { x: 1.5, z: 4 },
  { x: -1.3, z: 9 },
  { x: 1.2, z: 13 },
  { x: 0, z: 6 },
  { x: -1.6, z: 1 },
]

export const neighborStalls: StallSlot[] = stalls.filter((stall) => stall.seller)
