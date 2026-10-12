import { Html } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useEffect, useRef, useState } from "react"
import { productById } from "@/data/products"
import { neighborStalls } from "@/data/townLayout"
import { boardVisible } from "@/data/visits"
import { slotForStall } from "@/scene3d/townLive"
import { pose } from "@/scene3d/worldView"
import { useGame } from "@/state/GameProvider"

export default function PriceBoards() {
  const { state, dispatch } = useGame()
  const flags = useRef(neighborStalls.map(() => false))
  const stockRef = useRef(state.npcStock)
  const roundRef = useRef(state.roundsPlayed)
  const [shown, setShown] = useState(0)
  stockRef.current = state.npcStock
  roundRef.current = state.roundsPlayed

  useEffect(() => {
    if (!import.meta.env.DEV) return
    const host = window as Window & { __pose?: typeof pose }
    host.__pose = pose
  }, [])

  useFrame(() => {
    let changed = false
    for (let index = 0; index < neighborStalls.length; index += 1) {
      const stall = neighborStalls[index]
      const dist = Math.hypot(pose.x - stall.x, pose.z - stall.z)
      const show = boardVisible(dist)
      if (show === flags.current[index]) continue
      flags.current[index] = show
      changed = true
      if (!show) continue
      const guest = slotForStall(index)
      const prices = guest
        ? guest.goods.map((item) => ({
            productId: item.productId ?? 0,
            price: item.price,
          }))
        : (stockRef.current[stall.id] ?? []).map((line) => ({
            productId: line.productId,
            price: line.price,
          }))
      if (prices.length === 0) continue
      dispatch({
        type: "scoutStall",
        stallId: stall.id,
        round: roundRef.current,
        prices,
      })
    }
    if (changed) setShown((value) => value + 1)
  })

  return (
    <group>
      {neighborStalls.map((stall, index) => {
        if (!flags.current[index] || shown < 0) return null
        const guest = slotForStall(index)
        const rows = guest
          ? guest.goods.map((item) => ({ key: item.name, label: `${item.name} ¢${item.price}` }))
          : (state.npcStock[stall.id] ?? []).map((line) => ({
              key: String(line.productId),
              label: `${productById(line.productId).name} ¢${line.price}`,
            }))
        if (rows.length === 0) return null
        return (
          <Html key={stall.id} center position={[stall.x, 1.45, stall.z]} zIndexRange={[4, 0]}>
            <div className="price-board">
              {rows.map((row) => (
                <span key={row.key}>{row.label}</span>
              ))}
            </div>
          </Html>
        )
      })}
    </group>
  )
}
