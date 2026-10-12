import { Html } from "@react-three/drei"
import { useEffect, useState } from "react"
import { worldView, subscribeView } from "@/scene3d/worldView"

export default function PlayerBubble() {
  const [, bump] = useState(0)
  useEffect(() => subscribeView(() => bump((value) => value + 1)), [])
  const text = worldView.speech ?? worldView.emote
  if (!text) return null
  return (
    <Html center position={[0, 1.85, 0]} zIndexRange={[4, 0]} pointerEvents="none" distanceFactor={10}>
      <div className="avatar-bubble">{text}</div>
    </Html>
  )
}
