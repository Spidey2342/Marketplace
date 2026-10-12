import { useEffect, useRef } from "react"
import {
  ensureSession,
  enqueueRound,
  flushOutbox,
  isRemote,
  loadProfile,
  outboxWaiting,
  queueStallSync,
  roundFromResult,
  subscribeMySales,
  subscribeStall,
} from "@/lib/sync"
import { useGame } from "@/state/GameProvider"

export default function BackendBridge() {
  const { state, dispatch } = useGame()
  const seenRounds = useRef(state.roundsPlayed)
  const seenSales = useRef(state.saleSeq)
  const booted = useRef(false)

  useEffect(() => {
    if (booted.current || !isRemote()) return
    booted.current = true
    let gone = false
    void (async () => {
      const userId = await ensureSession()
      if (!userId || gone) return
      const scores = await flushOutbox()
      if (gone) return
      if (scores) {
        dispatch({ type: "applyServerScores", coins: scores.coins, reputation: scores.reputation })
      }
      const profile = await loadProfile(userId)
      if (!profile || gone) return
      dispatch({ type: "hydrateProfile", ...profile })
    })()
    return () => {
      gone = true
    }
  }, [dispatch])

  useEffect(() => {
    if (!isRemote()) return
    let stopStock = () => undefined as void
    let stopSales = () => undefined as void
    void ensureSession().then((userId) => {
      if (!userId) return
      stopStock =
        subscribeStall(userId, (offers) => {
          dispatch({
            type: "applyStallStock",
            items: offers.flatMap((offer) =>
              offer.productId
                ? [{ productId: offer.productId, price: offer.price, stock: offer.stock ?? 0 }]
                : [],
            ),
          })
        }) ?? stopStock
      stopSales =
        subscribeMySales(userId, (sale) => {
          dispatch({ type: "notePlayerSale", ...sale })
        }) ?? stopSales
    })
    return () => {
      stopStock()
      stopSales()
    }
  }, [dispatch])

  useEffect(() => {
    if (!isRemote() || state.saleSeq === seenSales.current) return
    seenSales.current = state.saleSeq
    queueStallSync(state.stall)
  }, [state.saleSeq, state.stall])

  useEffect(() => {
    if (!isRemote()) return
    if (state.roundsPlayed <= seenRounds.current) return
    seenRounds.current = state.roundsPlayed
    const result = state.lastResult
    if (!result) return
    const entry = roundFromResult(
      `round-${state.roundsPlayed}-${result.revenue}-${result.profit}`,
      state.stall,
      state.ownedUpgrades,
      state.regulars,
      result,
    )
    enqueueRound(entry)
    void flushOutbox().then((scores) => {
      if (scores) {
        dispatch({
          type: "applyServerScores",
          coins: scores.coins,
          reputation: scores.reputation,
        })
        return
      }
      dispatch({
        type: "setSyncNote",
        note: outboxWaiting() ? "Saved on this device" : null,
      })
    })
  }, [
    dispatch,
    state.lastResult,
    state.ownedUpgrades,
    state.regulars,
    state.roundsPlayed,
    state.stall,
  ])

  return null
}
