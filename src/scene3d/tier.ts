import { useEffect, useState } from "react"

export type Tier = "low" | "medium" | "high"

const order: Tier[] = ["high", "medium", "low"]
let tier: Tier = "high"
let manual = false
const listeners = new Set<() => void>()

export function isDev(): boolean {
  try {
    return new URLSearchParams(window.location.search).get("dev") === "1"
  } catch {
    return false
  }
}

export function getTier(): Tier {
  return tier
}

export function atmosphereOn(): boolean {
  return tier !== "low"
}

export function customerLimit(): number {
  return tier === "low" ? 4 : 8
}

export function tierDpr(): number {
  if (tier === "low") return 1
  if (tier === "medium") return 1.25
  return 1.5
}

export function setTier(next: Tier, fromUser = false) {
  if (fromUser) manual = true
  else if (manual) return
  if (tier === next) return
  tier = next
  listeners.forEach((listener) => listener())
}

export function dropTier() {
  const index = order.indexOf(tier)
  if (index < 0 || index >= order.length - 1) return
  setTier(order[index + 1])
}

export function subscribeTier(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useTier(): Tier {
  const [current, setCurrent] = useState(getTier)
  useEffect(() => subscribeTier(() => setCurrent(getTier())), [])
  return current
}
