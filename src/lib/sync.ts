import { weekId } from "@/data/challenges"
import { groupById } from "@/data/groups"
import { productById } from "@/data/products"
import { STALL_SYNC_MS, type StallOffer } from "@/data/visits"
import type { Regular, RoundResult, StallLine } from "@/lib/economy"
import { stockLeft } from "@/lib/economy"
import { isRemote, setSessionUserId, supabase } from "@/lib/supabase"
import { isoWeekId } from "@/lib/week"

const OUTBOX_KEY = "market-street-outbox"
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export type PublicGroup = {
  id: string
  name: string
  kind: string
  member_count: number
}

export type RankRow = {
  rank: number
  group_id: string
  name: string
  points: number
  member_count: number
}

export type ServerProfile = {
  nickname: string
  hairId: string
  outfitId: string
  shoeId: string
  groupId: string | null
  coins: number
  reputation: number
  stage: string
}

type OutboxEntry = {
  id: string
  stall: {
    items: StallLine[]
    leftover: Record<string, number>
    upgrades: string[]
    regulars: Regular[]
  }
  round: {
    stock_cost: number
    revenue: number
    profit: number
    items_sold: number
    customers: number
    event: string
    breakdown: Record<string, unknown>
    started_at: string
  }
}

export async function ensureSession(): Promise<string | null> {
  if (!supabase) return null
  const existing = await supabase.auth.getSession()
  if (existing.data.session?.user) {
    setSessionUserId(existing.data.session.user.id)
    return existing.data.session.user.id
  }
  const signed = await supabase.auth.signInAnonymously()
  const id = signed.data.user?.id ?? null
  setSessionUserId(id)
  return id
}

export async function fetchGroups(): Promise<PublicGroup[] | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from("groups_public")
    .select("id, name, kind, member_count")
    .order("name")
  if (error || !data) return null
  return data as PublicGroup[]
}

export async function publishProfile(input: {
  nickname: string
  hairId: string
  outfitId: string
  shoeId: string
  stage: string
  groupId: string | null
}): Promise<{ id: string; name: string } | null> {
  if (!supabase) return null
  const userId = await ensureSession()
  if (!userId) throw new Error("Sign-in failed")
  const { error } = await supabase.from("profiles").upsert({
    id: userId,
    nickname: input.nickname.trim().slice(0, 16),
    avatar: {
      hair: input.hairId,
      outfit: input.outfitId,
      shoes: input.shoeId,
    },
    stage: input.stage,
    badges: [],
  })
  if (error) throw error

  const coded = input.groupId?.startsWith("code:") ? input.groupId.slice(5) : null
  const local = groupById(input.groupId)
  if (coded || local) {
    const { data, error: joinError } = await supabase.rpc("join_group_by_code", {
      code: coded ?? local?.code,
    })
    if (joinError) throw joinError
    const row = firstRow<{ id: string; name: string }>(data)
    return row
  }
  if (input.groupId && UUID.test(input.groupId)) {
    const { data, error: joinError } = await supabase.rpc("join_public_group", {
      group_id: input.groupId,
    })
    if (joinError) throw joinError
    return firstRow<{ id: string; name: string }>(data)
  }
  return null
}

export async function loadProfile(userId: string): Promise<ServerProfile | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from("profiles")
    .select("nickname, avatar, group_id, coins, reputation, stage")
    .eq("id", userId)
    .maybeSingle()
  if (error || !data) return null
  const avatar = (data.avatar ?? {}) as { hair?: string; outfit?: string; shoes?: string }
  return {
    nickname: String(data.nickname ?? ""),
    hairId: avatar.hair ?? "short",
    outfitId: avatar.outfit ?? "kente",
    shoeId: avatar.shoes ?? "sandals",
    groupId: data.group_id ? String(data.group_id) : null,
    coins: Number(data.coins) || 0,
    reputation: Number(data.reputation) || 0,
    stage: String(data.stage ?? "stall"),
  }
}

export function enqueueRound(entry: OutboxEntry) {
  const list = readOutbox().filter((item) => item.id !== entry.id)
  list.push(entry)
  localStorage.setItem(OUTBOX_KEY, JSON.stringify(list))
}

export function outboxWaiting(): boolean {
  return readOutbox().length > 0
}

export async function flushOutbox(): Promise<{ coins: number; reputation: number } | null> {
  if (!supabase) return null
  const userId = await ensureSession()
  if (!userId) return null
  const pending = readOutbox()
  const keep: OutboxEntry[] = []
  let latest: { coins: number; reputation: number } | null = null
  for (const entry of pending) {
    const result = await pushRound(userId, entry)
    if (result === "retry") keep.push(entry)
    else if (result) latest = result
  }
  localStorage.setItem(OUTBOX_KEY, JSON.stringify(keep))
  return latest
}

export async function fetchRankings(): Promise<RankRow[] | null> {
  if (!supabase) return null
  const { data, error } = await supabase.rpc("get_group_rankings", {
    week_id: isoWeekId(Date.now()),
  })
  if (error || !data) return null
  return data as RankRow[]
}

export async function submitChallenge(input: {
  challengeId: string
  proofType: "photo" | "receipt" | "note"
  file?: Blob | null
  note?: string | null
}): Promise<"pending" | "offline"> {
  if (!supabase) return "offline"
  const userId = await ensureSession()
  if (!userId) return "offline"
  const week = String(weekId(Date.now()))
  let proofPath: string | null = null
  if (input.file && input.proofType !== "note") {
    const resized = await resizeImage(input.file)
    const path = `${userId}/${week}-${Math.random().toString(36).slice(2, 8)}.jpg`
    const { error } = await supabase.storage.from("proofs").upload(path, resized, {
      contentType: "image/jpeg",
      upsert: false,
    })
    if (error) throw error
    proofPath = path
  }
  const { error } = await supabase.from("challenge_submissions").insert({
    profile_id: userId,
    week_id: week,
    challenge_id: input.challengeId,
    proof_type: input.proofType,
    proof_path: proofPath,
    note: input.note?.slice(0, 140) ?? null,
    status: "pending",
  })
  if (error) throw error
  return "pending"
}

export async function loadChallengeStatus(): Promise<string | null> {
  if (!supabase) return null
  const userId = await ensureSession()
  if (!userId) return null
  const week = String(weekId(Date.now()))
  const { data } = await supabase
    .from("challenge_submissions")
    .select("status")
    .eq("profile_id", userId)
    .eq("week_id", week)
    .maybeSingle()
  return data?.status ? String(data.status) : null
}

export async function sendReport(targetId: string, reason: string): Promise<boolean> {
  if (!supabase || !UUID.test(targetId)) return false
  const userId = await ensureSession()
  if (!userId) return false
  const { error } = await supabase.from("reports").insert({
    reporter_id: userId,
    target_profile_id: targetId,
    reason: reason.slice(0, 200),
  })
  return !error
}

export function roundFromResult(
  id: string,
  stall: StallLine[],
  upgrades: string[],
  regulars: Regular[],
  result: RoundResult,
): OutboxEntry {
  const leftover: Record<string, number> = {}
  for (const line of stall) leftover[String(line.productId)] = line.carried
  return {
    id,
    stall: { items: stall, leftover, upgrades, regulars },
    round: {
      stock_cost: result.stockCost,
      revenue: result.revenue,
      profit: result.profit,
      items_sold: result.itemsSold,
      customers: result.customers,
      event: result.eventId,
      breakdown: {
        buyers: result.buyers,
        spoiled: result.spoiled,
        reason: result.reasonLine,
      },
      started_at: new Date().toISOString(),
    },
  }
}

export function isUuid(value: string): boolean {
  return UUID.test(value)
}

export { isRemote }

async function pushRound(
  userId: string,
  entry: OutboxEntry,
): Promise<{ coins: number; reputation: number } | "retry" | null> {
  if (!supabase) return "retry"
  const stall = await supabase.from("stalls").upsert({
    profile_id: userId,
    items: entry.stall.items.map((line) => ({
      ...line,
      stock: stockLeft(line),
    })),
    leftover: entry.stall.leftover,
    upgrades: entry.stall.upgrades,
    regulars: entry.stall.regulars,
    updated_at: new Date().toISOString(),
  })
  if (stall.error) return network(stall.error.message) ? "retry" : null
  const saved = await supabase.rpc("record_round", entry.round)
  if (saved.error) {
    const message = saved.error.message
    if (message.includes("Wait a moment") || network(message)) return "retry"
    return null
  }
  const row = firstRow<{ coins: number; reputation: number }>(saved.data)
  return row
}

function network(message: string): boolean {
  return /fetch|network|failed to fetch|timeout/i.test(message)
}

function readOutbox(): OutboxEntry[] {
  try {
    const raw = localStorage.getItem(OUTBOX_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as OutboxEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function firstRow<T>(data: unknown): T | null {
  if (Array.isArray(data)) return (data[0] as T) ?? null
  if (data && typeof data === "object") return data as T
  return null
}

export async function resizeImage(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const ctx = canvas.getContext("2d")
  if (!ctx) return file
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.82)
  })
  return blob ?? file
}

export function goodsFromStall(items: unknown): StallOffer[] {
  if (!Array.isArray(items)) return []
  const offers: StallOffer[] = []
  for (const line of items) {
    if (!line || typeof line !== "object") continue
    const row = line as StallLine & { stock?: number }
    if (row.selected === false) continue
    try {
      const product = productById(row.productId)
      const stock = Number.isFinite(Number(row.stock)) ? Number(row.stock) : stockLeft(row)
      offers.push({ name: product.name, price: row.price, productId: row.productId, stock })
    } catch {
      continue
    }
    if (offers.length >= 4) break
  }
  return offers
}

export function buyError(message: string): string {
  if (message.includes("sold_out")) return "Sold out"
  if (message.includes("not_enough_coins")) return "Not enough coins"
  if (message.includes("own_stall")) return "That stall is yours"
  if (message.includes("too_many")) return "Slow down, Chale. Try again in a bit."
  return "Could not buy. Try again."
}

export async function buyFromPlayer(
  sellerId: string,
  itemId: string,
  qty: number,
): Promise<{ buyer_coins: number; purchase_id: string }> {
  if (!supabase) throw new Error("offline")
  const saved = await supabase.rpc("buy_from_stall", {
    seller_id: sellerId,
    item_id: itemId,
    qty,
  })
  if (saved.error) throw new Error(saved.error.message)
  const row = firstRow<{ buyer_coins: number; purchase_id: string }>(saved.data)
  if (!row) throw new Error("Could not buy. Try again.")
  return row
}

export async function ratePurchase(purchaseId: string, fair: boolean): Promise<void> {
  if (!supabase) return
  await supabase.rpc("rate_purchase", { purchase_id: purchaseId, fair })
}

export function subscribeStall(sellerId: string, onItems: (offers: StallOffer[]) => void) {
  if (!supabase) return () => undefined
  const channel = supabase
    .channel(`stall-${sellerId}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "stalls", filter: `profile_id=eq.${sellerId}` },
      (payload) => {
        const next = payload.new as { items?: unknown }
        onItems(goodsFromStall(next.items))
      },
    )
    .subscribe()
  return () => {
    void supabase?.removeChannel(channel)
  }
}

const seenSales = new Set<string>()

export function subscribeMySales(
  userId: string,
  onSale: (sale: {
    id: string
    buyer: string
    price: number
    qty: number
    productName: string
  }) => void,
) {
  if (!supabase) return () => undefined
  const channel = supabase
    .channel(`sales-${userId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "purchases", filter: `seller_id=eq.${userId}` },
      (payload) => {
        const row = payload.new as {
          id?: string
          buyer_id?: string
          item_id?: string
          qty?: number
          unit_price?: number
        }
        if (!row.id || seenSales.has(row.id)) return
        seenSales.add(row.id)
        const productId = Number(row.item_id)
        let productName = "Something"
        try {
          if (Number.isFinite(productId)) productName = productById(productId).name
        } catch {
          productName = "Something"
        }
        const buyerId = row.buyer_id ?? ""
        void supabase
          ?.from("profiles")
          .select("nickname")
          .eq("id", buyerId)
          .maybeSingle()
          .then(({ data }) => {
            onSale({
              id: row.id ?? "",
              buyer: data?.nickname ? String(data.nickname) : "A player",
              price: Number(row.unit_price) || 0,
              qty: Number(row.qty) || 1,
              productName,
            })
          })
      },
    )
    .subscribe()
  return () => {
    void supabase?.removeChannel(channel)
  }
}

let stallTimer = 0

export function queueStallSync(lines: StallLine[]) {
  if (!supabase) return
  window.clearTimeout(stallTimer)
  stallTimer = window.setTimeout(() => {
    void pushStall(lines)
  }, STALL_SYNC_MS)
}

async function pushStall(lines: StallLine[]) {
  if (!supabase) return
  const userId = await ensureSession()
  if (!userId) return
  await supabase.from("stalls").upsert({
    profile_id: userId,
    items: lines.map((line) => ({
      productId: line.productId,
      price: line.price,
      stock: stockLeft(line),
      selected: line.selected,
    })),
    leftover: Object.fromEntries(lines.map((line) => [String(line.productId), line.carried])),
    updated_at: new Date().toISOString(),
  })
}
