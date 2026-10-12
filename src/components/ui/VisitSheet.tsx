import { useEffect, useRef, useState } from "react"
import Icon from "@/components/ui/Icon"
import { productById } from "@/data/products"
import { stalls } from "@/data/townLayout"
import {
  BUY_COOLDOWN_MS,
  BUY_QTY_MAX,
  BUY_QTY_MIN,
  BUY_THANKS,
  npcByStall,
  type StallOffer,
} from "@/data/visits"
import { isRemote, sessionUserId } from "@/lib/supabase"
import { buyError, buyFromPlayer, isUuid, ratePurchase, subscribeStall } from "@/lib/sync"
import type { VisitTarget } from "@/scene3d/presence"
import { useGame } from "@/state/GameProvider"

export default function VisitSheet({
  visit,
  onClose,
  onReport,
}: {
  visit: VisitTarget
  onClose: () => void
  onReport?: () => void
}) {
  const { state, dispatch } = useGame()
  const [qty, setQty] = useState<Record<string, number>>({})
  const [notice, setNotice] = useState("")
  const [live, setLive] = useState<StallOffer[] | null>(null)
  const [purchaseId, setPurchaseId] = useState<string | null>(null)
  const [, bump] = useState(0)
  const dragY = useRef(0)
  const lock = useRef(false)
  const slot = stalls.find((item) => item.id === visit.id)
  const mine = Boolean(slot?.player) || (visit.profileId !== undefined && visit.profileId === sessionUserId)
  const remote = Boolean(visit.profileId && isUuid(visit.profileId) && isRemote() && !mine)
  const npc = visit.profileId ? null : npcByStall(visit.id)
  const lines = remote
    ? live ?? visit.goods ?? []
    : (state.npcStock[visit.id] ?? []).map((line) => {
        const product = productById(line.productId)
        return {
          name: product.name,
          price: line.price,
          productId: line.productId,
          stock: line.units,
        }
      })
  const sellerName = remote ? visit.name : npc?.name ?? visit.name
  const group = npc?.group ?? (remote ? "In the town" : "Your group")
  const stage = npc?.stage ?? "Stall"
  const reputation = npc?.reputation ?? null
  const cooling = Date.now() - state.lastBuyAt < BUY_COOLDOWN_MS
  const flash =
    state.buyFlash && state.buyFlash.stallId === visit.id ? state.buyFlash : null

  useEffect(() => {
    if (!remote || !visit.profileId) return
    return subscribeStall(visit.profileId, (items) => setLive(items))
  }, [remote, visit.profileId])

  useEffect(() => {
    if (!state.lastBuyAt) return
    const wait = BUY_COOLDOWN_MS - (Date.now() - state.lastBuyAt)
    if (wait <= 0) return
    const timer = window.setTimeout(() => bump((value) => value + 1), wait)
    return () => window.clearTimeout(timer)
  }, [state.lastBuyAt])

  function unitsFor(key: string, stock: number): number {
    const picked = qty[key] ?? BUY_QTY_MIN
    return Math.max(BUY_QTY_MIN, Math.min(BUY_QTY_MAX, stock, picked))
  }

  async function buy(offer: StallOffer) {
    const now = Date.now()
    if (mine || lock.current || now - state.lastBuyAt < BUY_COOLDOWN_MS) return
    const productId = offer.productId
    if (!productId) return
    const stock = offer.stock ?? 0
    const count = unitsFor(String(productId), stock)
    if (stock < count) return
    const spend = offer.price * count
    if (spend > state.coins) return
    lock.current = true
    window.setTimeout(() => {
      lock.current = false
    }, BUY_COOLDOWN_MS)
    if (remote && visit.profileId) {
      try {
        const saved = await buyFromPlayer(visit.profileId, String(productId), count)
        setPurchaseId(saved.purchase_id)
        dispatch({
          type: "boughtRemote",
          stallId: visit.id,
          productId,
          qty: count,
          spend,
          coins: saved.buyer_coins,
          now: Date.now(),
        })
      } catch (error) {
        setNotice(buyError(error instanceof Error ? error.message : ""))
      }
      return
    }
    dispatch({ type: "buyFromNpc", stallId: visit.id, productId, qty: count, now })
  }

  return (
    <div
      className="visit-sheet"
      onPointerDown={(event) => {
        dragY.current = event.clientY
      }}
      onPointerUp={(event) => {
        if (event.clientY - dragY.current > 48) onClose()
      }}
    >
      <div className="sheet-handle" />
      <div className="sheet-title">
        <div className="visit-who">
          <span
            className="visit-avatar"
            style={{ background: npc?.outfit ?? "#ffc928" }}
          >
            <i style={{ background: npc?.hair ?? "#2a1a16" }} />
          </span>
          <div>
            <h2>{sellerName}</h2>
            <p>
              {group} · {stage}
            </p>
          </div>
        </div>
        <button aria-label="Close stall" className="visit-x" onClick={onClose} type="button">
          <Icon name="x" />
        </button>
      </div>
      <div className="visit-meta">
        <span className="stage-badge">{stage}</span>
        {reputation !== null && <span>{reputation} reputation</span>}
      </div>

      {mine ? (
        <p className="visit-note">This stall is yours.</p>
      ) : (
        <div className="visit-items">
          {lines.map((offer) => {
            const key = String(offer.productId ?? offer.name)
            const stock = offer.stock ?? 0
            const count = unitsFor(key, Math.max(stock, 1))
            const spend = offer.price * count
            const soldOut = stock <= 0
            const short = !soldOut && spend > state.coins
            const just = flash?.productId === offer.productId
            return (
              <article className="visit-item" key={key}>
                <div>
                  <strong>{offer.name}</strong>
                  <span>
                    ¢{offer.price} · {soldOut ? "Sold out" : `${stock} left`}
                  </span>
                </div>
                {just && (
                  <p className="coin-pop">
                    <Icon name="coin" size={18} />
                    {flash?.text ?? BUY_THANKS}
                  </p>
                )}
                {!soldOut && !mine && (
                  <div className="qty-stepper">
                    <button
                      aria-label="Fewer"
                      onClick={() =>
                        setQty((current) => ({
                          ...current,
                          [key]: Math.max(BUY_QTY_MIN, count - 1),
                        }))
                      }
                      type="button"
                    >
                      <Icon name="minus" size={18} />
                    </button>
                    <b>{Math.min(count, stock)}</b>
                    <button
                      aria-label="More"
                      onClick={() =>
                        setQty((current) => ({
                          ...current,
                          [key]: Math.min(BUY_QTY_MAX, stock, count + 1),
                        }))
                      }
                      type="button"
                    >
                      <Icon name="plus" size={18} />
                    </button>
                  </div>
                )}
                <button
                  className="visit-buy"
                  disabled={soldOut || short || cooling || mine}
                  onClick={() => {
                    void buy(offer)
                  }}
                  type="button"
                >
                  {soldOut ? "Sold out" : short ? `¢${spend - state.coins} more to go` : "BUY"}
                </button>
              </article>
            )
          })}
        </div>
      )}

      {notice && <p className="field-error">{notice}</p>}

      {state.fairPending && state.fairPending.stallId === visit.id && (
        <div className="fair-row">
          <p>Fair price?</p>
          <button
            onClick={() => {
              dispatch({ type: "rateStall", fair: true })
              if (purchaseId) void ratePurchase(purchaseId, true)
            }}
            type="button"
          >
            <Icon name="thumb" size={20} />
            Fair
          </button>
          <button
            onClick={() => {
              dispatch({ type: "rateStall", fair: false })
              if (purchaseId) void ratePurchase(purchaseId, false)
            }}
            type="button"
          >
            <Icon name="thumbDown" size={20} />
            Too much
          </button>
        </div>
      )}

      {onReport && visit.profileId && (
        <button className="visit-report" onClick={onReport} type="button">
          Report
        </button>
      )}
    </div>
  )
}
