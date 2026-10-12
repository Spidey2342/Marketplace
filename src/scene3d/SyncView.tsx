import { useEffect } from "react"
import { hairs, lookById, outfits, shoes } from "@/data/avatar"
import { productById } from "@/data/products"
import { useGame } from "@/state/GameProvider"
import { publishView, queueSale, worldView } from "@/scene3d/worldView"

export default function SyncView() {
  const { state } = useGame()
  const hair = lookById(hairs, state.hairId)
  const outfit = lookById(outfits, state.outfitId)
  const shoe = lookById(shoes, state.shoeId)
  const selected = state.stall.filter((line) => line.selected)
  const goodsKey = selected.map((line) => `${line.productId}:${line.price}`).join("|")
  const signature = `${hair.id}|${hair.color}|${outfit.color}|${shoe.color}|${state.avatarName}|${state.speech ?? ""}|${state.emote ?? ""}|${goodsKey}|${state.lastSale?.id ?? 0}`

  useEffect(() => {
    worldView.hair = hair.color
    worldView.hairId = hair.id
    worldView.outfit = outfit.color
    worldView.shoes = shoe.color
    worldView.stallName = state.avatarName.trim()
      ? `${state.avatarName.trim().toUpperCase()}'S STALL`
      : "MY STALL"
    worldView.speech = state.speech
    worldView.emote = state.emote
    worldView.goods = selected.map((line) => {
      const product = productById(line.productId)
      return {
        id: line.productId,
        name: product.name,
        price: line.price,
        color: product.color,
        propType: product.propType,
      }
    })
    publishView()
    if (state.lastSale) queueSale(state.lastSale.id, state.lastSale.price)
  }, [signature])

  return null
}
