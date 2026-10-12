import { Html } from "@react-three/drei"
import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { neighborStalls, stalls, type StallSlot } from "@/data/townLayout"
import { getNearby, openVisit, setNearby, usePresence } from "@/scene3d/presence"
import { slotForStall } from "@/scene3d/townLive"
import { pose, worldView } from "@/scene3d/worldView"

function guestFor(stall: StallSlot) {
  const index = neighborStalls.findIndex((item) => item.id === stall.id)
  if (index < 0) return null
  return slotForStall(index)
}

function labelFor(stall: StallSlot): string {
  const guest = guestFor(stall)
  if (guest) return guest.name
  if (stall.player) return worldView.stallName
  if (stall.seller) return stall.seller
  return "Quiet stall"
}

export default function VisitChips() {
  const current = useRef<StallSlot | null>(null)
  const { nearby } = usePresence()

  useFrame(() => {
    let best: StallSlot | null = null
    let bestDist = 2
    for (let index = 0; index < stalls.length; index += 1) {
      const stall = stalls[index]
      const dist = Math.hypot(pose.x - stall.x, pose.z - stall.z)
      if (dist < bestDist) {
        bestDist = dist
        best = stall
      }
    }
    current.current = best
    if (!best) {
      setNearby(null)
      return
    }
    const guest = guestFor(best)
    const next = {
      id: best.id,
      name: guest?.name ?? labelFor(best),
      profileId: guest && !guest.id.startsWith("fake-") ? guest.id : undefined,
      goods: guest?.goods,
    }
    const shown = getNearby()
    if (shown?.id === next.id && shown.name === next.name && shown.profileId === next.profileId) {
      return
    }
    setNearby(next)
  })

  if (!nearby) return null
  const stall = stalls.find((item) => item.id === nearby.id)
  if (!stall) return null

  return (
    <Html
      center
      position={[stall.x, 2.45, stall.z]}
      zIndexRange={[6, 0]}
      pointerEvents="auto"
      distanceFactor={9}
    >
      <button
        className="visit-chip"
        onClick={() => {
          const guest = guestFor(stall)
          openVisit({
            id: stall.id,
            name: guest?.name ?? nearby.name,
            profileId: guest && !guest.id.startsWith("fake-") ? guest.id : undefined,
            goods: guest?.goods ?? [],
          })
        }}
        type="button"
      >
        Visit stall
      </button>
    </Html>
  )
}
