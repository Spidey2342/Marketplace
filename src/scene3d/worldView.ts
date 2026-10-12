import type { PropType } from "@/data/products"

export type GoodProp = {
  id: number
  name: string
  price: number
  color: string
  propType: PropType
}

export const worldView = {
  hair: "#2a1a16",
  hairId: "short",
  outfit: "#ffc928",
  shoes: "#8a5b43",
  stallName: "MY STALL",
  speech: null as string | null,
  emote: null as string | null,
  goods: [] as GoodProp[],
}

export const saleCue: { id: number; price: number }[] = []
const seenSales = new Set<number>()
const listeners = new Set<() => void>()

export function queueSale(id: number, price: number) {
  if (seenSales.has(id)) return
  if (saleCue.some((item) => item.id === id)) return
  saleCue.push({ id, price })
}

export function finishSale(id: number) {
  seenSales.add(id)
}

export function publishView() {
  listeners.forEach((listener) => listener())
}

export function subscribeView(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const pose = { x: 0, z: 0, yaw: Math.PI }
