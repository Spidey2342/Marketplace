import { useEffect } from "react"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { hairs, lookById, outfits, shoes } from "@/data/avatar"
import { chatPhrases } from "@/data/chat"
import { emotes } from "@/data/emotes"
import { goodsFromStall } from "@/lib/sync"
import { sessionUserId, supabase } from "@/lib/supabase"
import {
  applyChat,
  applyMove,
  noteTraffic,
  resetTown,
  setGoods,
  setSolo,
  syncPresence,
  townLive,
} from "@/scene3d/townLive"

type Me = {
  nickname: string
  hairId: string
  outfitId: string
  shoeId: string
  groupId: string | null
  stage: string
  friendsRoom: string | null
}

let channel: RealtimeChannel | null = null
let selfId = ""
let lastMove = 0
let lastChat = 0
let lastEmote = 0

export function sendMove(x: number, z: number, yaw: number, moving: boolean) {
  if (!channel || townLive.solo) return
  const now = performance.now()
  if (now - lastMove < 125) return
  lastMove = now
  const payload = {
    from: selfId,
    x: Math.round(x * 100) / 100,
    z: Math.round(z * 100) / 100,
    yaw: Math.round(yaw * 100) / 100,
    moving: moving ? 1 : 0,
  }
  noteTraffic("out", 48)
  void channel.send({ type: "broadcast", event: "move", payload })
}

export function sendChat(text: string) {
  if (!channel || townLive.solo || !chatPhrases.includes(text)) return
  const now = performance.now()
  if (now - lastChat < 2000) return
  lastChat = now
  noteTraffic("out", text.length)
  void channel.send({ type: "broadcast", event: "chat", payload: { from: selfId, text } })
}

export function sendEmote(label: string) {
  if (!channel || townLive.solo || !emotes.some((item) => item.label === label)) return
  const now = performance.now()
  if (now - lastEmote < 1000) return
  lastEmote = now
  noteTraffic("out", label.length)
  void channel.send({
    type: "broadcast",
    event: "emote",
    payload: { from: selfId, label },
  })
}

export default function TownLink({ me }: { me: Me }) {
  useEffect(() => {
    let gone = false
    let active: RealtimeChannel | null = null
    const remotes = readFakeCount()

    if (!supabase || !sessionUserId) {
      setSolo(true)
      if (remotes > 0) seedFakes(remotes)
      return () => {
        resetTown()
      }
    }

    selfId = sessionUserId
    const base = me.friendsRoom
      ? `friends-${me.friendsRoom.toLowerCase()}`
      : `town-${me.groupId ?? "solo"}`

    void join(base, true)

    return () => {
      gone = true
      void active?.unsubscribe()
      channel = null
      resetTown()
    }

    async function join(name: string, split: boolean) {
      if (!supabase || gone) return
      await active?.unsubscribe()
      const next = supabase.channel(name, {
        config: { presence: { key: selfId }, broadcast: { self: false } },
      })
      active = next
      channel = next
      next.on("presence", { event: "sync" }, () => {
        const state = next.presenceState() as Record<string, PresenceRow[]>
        const rows = Object.entries(state).map(([id, metas]) => {
          const meta = metas[0]
          return {
            id,
            name: meta?.nickname || "Player",
            hairId: meta?.hair || "short",
            outfitId: meta?.outfit || "kente",
            shoeId: meta?.shoes || "sandals",
          }
        })
        const others = rows.filter((row) => row.id !== selfId).length
        if (split && others >= 20) {
          void join(`${base}-2`, false)
          return
        }
        syncPresence(rows, selfId)
        setSolo(false)
        void loadStalls(rows.map((row) => row.id).filter((id) => id !== selfId))
      })
      next.on("broadcast", { event: "move" }, ({ payload }) => {
        const body = payload as MoveBody
        if (!body?.from || townLive.blocked.has(body.from)) return
        noteTraffic("in", 48)
        applyMove(body.from, { x: body.x, z: body.z, yaw: body.yaw, moving: body.moving === 1 })
      })
      next.on("broadcast", { event: "chat" }, ({ payload }) => {
        const body = payload as { text?: string; from?: string }
        if (!body?.from || !body.text || !chatPhrases.includes(body.text)) return
        noteTraffic("in", body.text.length)
        applyChat(body.from, body.text)
      })
      next.on("broadcast", { event: "emote" }, ({ payload }) => {
        const body = payload as { label?: string; from?: string }
        if (!body?.from || !body.label || !emotes.some((item) => item.label === body.label)) return
        noteTraffic("in", body.label.length)
        applyChat(body.from, body.label)
      })
      next.subscribe((status) => {
        if (gone) return
        if (status === "SUBSCRIBED") {
          const hair = lookById(hairs, me.hairId)
          const outfit = lookById(outfits, me.outfitId)
          const shoe = lookById(shoes, me.shoeId)
          void next.track({
            nickname: me.nickname || "Player",
            hair: hair.id,
            outfit: outfit.id,
            shoes: shoe.id,
            group: me.groupId,
            stage: me.stage,
          })
          setSolo(false)
          return
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setSolo(true)
        }
      })
    }
  }, [me.friendsRoom, me.groupId, me.nickname, me.hairId, me.outfitId, me.shoeId, me.stage])

  return null
}

type PresenceRow = {
  nickname?: string
  hair?: string
  outfit?: string
  shoes?: string
}

type MoveBody = {
  from?: string
  x: number
  z: number
  yaw: number
  moving: number
}

async function loadStalls(ids: string[]) {
  if (!supabase || ids.length === 0) return
  const { data } = await supabase.from("stalls").select("profile_id, items").in("profile_id", ids)
  if (!data) return
  for (const row of data) {
    setGoods(String(row.profile_id), goodsFromStall(row.items))
  }
}

function readFakeCount(): number {
  try {
    const value = new URLSearchParams(window.location.search).get("remotes")
    const count = Number(value)
    if (!Number.isFinite(count)) return 0
    return Math.max(0, Math.min(6, count))
  } catch {
    return 0
  }
}

function seedFakes(count: number) {
  const now = performance.now()
  townLive.ordered = Array.from({ length: count }, (_, index) => ({
    id: `fake-${index}`,
    name: `Player ${index + 1}`,
    hair: hairs[index % hairs.length].color,
    hairId: hairs[index % hairs.length].id,
    outfit: outfits[index % outfits.length].color,
    shoes: shoes[index % shoes.length].color,
    x: -1 + index * 0.4,
    z: -4 + index,
    yaw: 0,
    prevX: -1 + index * 0.4,
    prevZ: -4 + index,
    prevYaw: 0,
    prevAt: now,
    at: now,
    moving: true,
    speech: null,
    speechUntil: 0,
    emote: null,
    goods: [{ name: "Sobolo", price: 5 }],
  }))
  townLive.solo = false
  townLive.npcSellers = Math.max(0, 4 - count)
}
