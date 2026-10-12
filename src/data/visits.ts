import { neighborStalls } from "@/data/townLayout"
import { PRICE_MAX, PRICE_MIN } from "@/lib/economy"
import { isUnlocked, productById, products } from "@/data/products"
import type { StageId } from "@/data/upgrades"

export const VISIT_BOARD_METERS = 4
export const BUY_COOLDOWN_MS = 1000
export const BUY_QTY_MIN = 1
export const BUY_QTY_MAX = 3
export const FIRST_STALL_REPUTATION = 1
export const DAILY_STALL_REP_CAP = 3
export const EXPLORER_STALLS = 3
export const EXPLORER_COINS = 150
export const EXPLORER_BADGE = "Explorer"
export const NPC_PRICE_SWING = 1
export const BUY_THANKS = "Chale, thank you!"
export const PURCHASES_PER_HOUR = 12
export const PAIR_POINTS_PER_WEEK = 3
export const FAIR_REP_PER_DAY = 5
export const STALL_SYNC_MS = 2000

export type NpcSeller = {
  stallId: string
  name: string
  group: string
  stage: string
  reputation: number
  hair: string
  outfit: string
}

const specs: Omit<NpcSeller, "stallId">[] = [
  {
    name: "Akos",
    group: "Block A Hostel",
    stage: "Stall",
    reputation: 18,
    hair: "#2a1a16",
    outfit: "#e23b2f",
  },
  {
    name: "Yaw",
    group: "Class of '26",
    stage: "Shop",
    reputation: 24,
    hair: "#1a120e",
    outfit: "#1f8a4c",
  },
  {
    name: "Esi",
    group: "Osu Corner",
    stage: "Stall",
    reputation: 11,
    hair: "#3b2418",
    outfit: "#f4a261",
  },
  {
    name: "Kojo",
    group: "Stall United",
    stage: "Stall",
    reputation: 15,
    hair: "#24160f",
    outfit: "#3d4ea3",
  },
]

export const npcSellers: NpcSeller[] = specs.map((spec) => {
  const stall = neighborStalls.find((slot) => slot.seller === spec.name)
  return { ...spec, stallId: stall?.id ?? spec.name }
})

export type NpcLine = {
  productId: number
  price: number
  units: number
}

export type StallOffer = {
  name: string
  price: number
  productId?: number
  stock?: number
}

export function npcByStall(stallId: string): NpcSeller | null {
  return npcSellers.find((seller) => seller.stallId === stallId) ?? null
}

export function boardVisible(distance: number): boolean {
  return distance <= VISIT_BOARD_METERS
}

export function dayKey(now: number): string {
  const date = new Date(now)
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

/** Neighbor price, then ¢1 up or down. The side flips by stall, item, and round. */
export function npcUnitPrice(stallId: string, productId: number, round: number): number {
  const product = productById(productId)
  const stallIndex = Math.max(
    0,
    npcSellers.findIndex((seller) => seller.stallId === stallId),
  )
  const plus = (stallIndex + productId + round) % 2 === 0
  const price = product.neighborPrice + (plus ? NPC_PRICE_SWING : -NPC_PRICE_SWING)
  return Math.max(PRICE_MIN, Math.min(PRICE_MAX, price))
}

function sellerStage(stallId: string): StageId {
  const seller = npcByStall(stallId)
  if (seller?.stage === "Shop") return "shop"
  if (seller?.stage === "Brand") return "brand"
  return "stall"
}

export function freshNpcStock(stallId: string, round: number): NpcLine[] {
  const stage = sellerStage(stallId)
  return products
    .filter((product) => isUnlocked(product, stage))
    .map((product) => ({
      productId: product.id,
      price: npcUnitPrice(stallId, product.id, round),
      units: product.quantity,
    }))
}

export function freshNpcMarket(round: number): Record<string, NpcLine[]> {
  const market: Record<string, NpcLine[]> = {}
  for (const seller of npcSellers) {
    market[seller.stallId] = freshNpcStock(seller.stallId, round)
  }
  return market
}
