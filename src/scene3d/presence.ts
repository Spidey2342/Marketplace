import { useEffect, useState } from "react"
import type { StallOffer } from "@/data/visits"

export type VisitTarget = {
  id: string
  name: string
  profileId?: string
  goods?: StallOffer[]
}

let nearby: VisitTarget | null = null
let visit: VisitTarget | null = null
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

export function getNearby() {
  return nearby
}

export function getVisit() {
  return visit
}

export function setNearby(next: VisitTarget | null) {
  if (
    nearby?.id === next?.id &&
    nearby?.name === next?.name &&
    nearby?.profileId === next?.profileId
  ) {
    return
  }
  nearby = next
  emit()
}

export function openVisit(next: VisitTarget) {
  visit = next
  emit()
}

export function closeVisit() {
  if (!visit) return
  visit = null
  emit()
}

export function subscribePresence(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function usePresence() {
  const [, bump] = useState(0)
  useEffect(() => subscribePresence(() => bump((value) => value + 1)), [])
  return { nearby: getNearby(), visit: getVisit() }
}
