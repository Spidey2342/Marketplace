import { hairs, lookById, outfits, shoes } from "@/data/avatar"
import { neighborStalls } from "@/data/townLayout"
import type { StallOffer } from "@/data/visits"

export type RemotePlayer = {
  id: string
  name: string
  hair: string
  hairId: string
  outfit: string
  shoes: string
  x: number
  z: number
  yaw: number
  prevX: number
  prevZ: number
  prevYaw: number
  prevAt: number
  at: number
  moving: boolean
  speech: string | null
  speechUntil: number
  emote: string | null
  goods: StallOffer[]
}

export const townLive = {
  solo: true,
  ordered: [] as RemotePlayer[],
  npcSellers: 4,
  blocked: new Set<string>(),
  bytesOut: 0,
  bytesIn: 0,
  messagesOut: 0,
  messagesIn: 0,
  started: 0,
}

const byId = new Map<string, RemotePlayer>()
const listeners = new Set<() => void>()

export function subscribeTown(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function emit() {
  listeners.forEach((listener) => listener())
}

export function resetTown() {
  byId.clear()
  townLive.ordered = []
  townLive.npcSellers = 4
  townLive.solo = true
  emit()
}

export function setSolo(solo: boolean) {
  townLive.solo = solo
  if (solo) {
    townLive.npcSellers = 4
    emit()
  }
}

export function noteTraffic(direction: "in" | "out", bytes: number) {
  if (townLive.started === 0) townLive.started = performance.now()
  if (direction === "in") {
    townLive.bytesIn += bytes
    townLive.messagesIn += 1
  } else {
    townLive.bytesOut += bytes
    townLive.messagesOut += 1
  }
}

export function trafficRates(): { outMsg: number; outKb: number; inMsg: number; inKb: number } {
  const seconds = Math.max(1, (performance.now() - townLive.started) / 1000)
  return {
    outMsg: townLive.messagesOut / seconds,
    outKb: townLive.bytesOut / seconds / 1024,
    inMsg: townLive.messagesIn / seconds,
    inKb: townLive.bytesIn / seconds / 1024,
  }
}

export function blockPlayer(id: string) {
  townLive.blocked.add(id)
  byId.delete(id)
  rebuild()
}

export function syncPresence(
  rows: {
    id: string
    name: string
    hairId: string
    outfitId: string
    shoeId: string
    goods?: StallOffer[]
  }[],
  selfId: string,
) {
  const keep = new Set<string>()
  for (const row of rows) {
    if (row.id === selfId || townLive.blocked.has(row.id)) continue
    keep.add(row.id)
    const hair = lookById(hairs, row.hairId)
    const outfit = lookById(outfits, row.outfitId)
    const shoe = lookById(shoes, row.shoeId)
    const existing = byId.get(row.id)
    if (existing) {
      existing.name = row.name
      existing.hair = hair.color
      existing.hairId = hair.id
      existing.outfit = outfit.color
      existing.shoes = shoe.color
      if (row.goods) existing.goods = row.goods
      continue
    }
    byId.set(row.id, {
      id: row.id,
      name: row.name,
      hair: hair.color,
      hairId: hair.id,
      outfit: outfit.color,
      shoes: shoe.color,
      x: 0,
      z: 0,
      yaw: 0,
      prevX: 0,
      prevZ: 0,
      prevYaw: 0,
      prevAt: performance.now(),
      at: 0,
      moving: false,
      speech: null,
      speechUntil: 0,
      emote: null,
      goods: row.goods ?? [],
    })
  }
  for (const id of byId.keys()) {
    if (!keep.has(id)) byId.delete(id)
  }
  rebuild()
}

export function applyMove(
  id: string,
  sample: { x: number; z: number; yaw: number; moving: boolean },
) {
  const player = byId.get(id)
  if (!player || townLive.blocked.has(id)) return
  const now = performance.now()
  if (player.at > 0 && now - player.at < 50) return
  if (!Number.isFinite(sample.x) || !Number.isFinite(sample.z)) return
  if (player.at === 0) {
    player.prevX = sample.x
    player.prevZ = sample.z
    player.prevYaw = sample.yaw
  } else {
    player.prevX = player.x
    player.prevZ = player.z
    player.prevYaw = player.yaw
  }
  player.prevAt = player.at || now
  player.x = Math.max(-8, Math.min(8, sample.x))
  player.z = Math.max(-22, Math.min(22, sample.z))
  player.yaw = sample.yaw
  player.moving = sample.moving
  player.at = now
}

export function applyChat(id: string, text: string) {
  const player = byId.get(id)
  if (!player || townLive.blocked.has(id)) return
  const now = performance.now()
  if (player.speechUntil > now) return
  player.speech = text.slice(0, 80)
  player.speechUntil = now + 3000
  emit()
}

function rebuild() {
  townLive.ordered = [...byId.values()]
  townLive.npcSellers = townLive.solo
    ? 4
    : Math.max(0, neighborStalls.length - townLive.ordered.length)
  emit()
}

export function setGoods(id: string, goods: StallOffer[]) {
  const player = byId.get(id)
  if (!player) return
  player.goods = goods
}

export function slotForStall(stallIndex: number): RemotePlayer | null {
  if (townLive.solo) return null
  const remoteIndex = stallIndex - townLive.npcSellers
  if (remoteIndex < 0) return null
  return townLive.ordered[remoteIndex] ?? null
}
