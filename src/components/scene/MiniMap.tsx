import { useEffect, useState } from "react"
import { shops, street } from "@/data/townLayout"
import { townLive } from "@/scene3d/townLive"
import { useGame } from "@/state/GameProvider"

function pin(x: number, z: number) {
  const left = ((x - street.minX) / street.width) * 100
  const top = ((z - street.minZ) / street.length) * 100
  return { left: `${left}%`, top: `${top}%` }
}

export default function MiniMap() {
  const { state } = useGame()
  const [pins, setPins] = useState<{ id: string; x: number; z: number }[]>([])

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = performance.now()
      setPins(
        townLive.ordered
          .filter((player) => player.at === 0 || now - player.at < 5000)
          .map((player) => ({ id: player.id, x: player.x, z: player.z })),
      )
    }, 200)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="mini-map">
      <div className="map-street" />
      {shops.map((shop) => (
        <i
          key={shop.id}
          className="map-shop"
          style={{ ...pin(shop.x, shop.z), background: shop.color }}
        />
      ))}
      {pins.map((player) => (
        <span className="map-friend" key={player.id} style={pin(player.x, player.z)} />
      ))}
      <span className="map-player" style={pin(state.playerX, state.playerZ)} />
      <div className="map-label">YOU</div>
    </div>
  )
}
