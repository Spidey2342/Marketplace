import { useEffect, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { Stats } from "@react-three/drei"
import { getTier } from "@/scene3d/tier"

type TownInfo = { calls: number; tris: number; fps: number; tier: string }

export default function TownStats() {
  const label = useRef<HTMLDivElement | null>(null)
  const parent = useRef<HTMLElement>(document.body)
  const screen = document.querySelector(".town-screen")
  if (screen instanceof HTMLElement) parent.current = screen
  const last = useRef("")
  const frames = useRef(0)
  const elapsed = useRef(0)
  const fps = useRef(0)
  const gl = useThree((state) => state.gl)

  useEffect(() => {
    const node = document.createElement("div")
    node.className = "town-draw-calls"
    node.textContent = "0 draws"
    const host = document.querySelector(".town-screen") ?? document.body
    host.appendChild(node)
    label.current = node
    const info: TownInfo = { calls: 0, tris: 0, fps: 0, tier: getTier() }
    ;(window as Window & { __town?: TownInfo }).__town = info
    return () => {
      node.remove()
      label.current = null
    }
  }, [])

  useFrame((_, delta) => {
    const node = label.current
    if (!node) return
    frames.current += 1
    elapsed.current += delta
    if (elapsed.current >= 0.5) {
      fps.current = Math.round(frames.current / elapsed.current)
      frames.current = 0
      elapsed.current = 0
    }
    const calls = gl.info.render.calls
    const tris = gl.info.render.triangles
    const tier = getTier()
    const text = `${calls} draws · ${tris} tris · ${fps.current} fps · ${tier}`
    const info = (window as Window & { __town?: TownInfo }).__town
    if (info) {
      info.calls = calls
      info.tris = tris
      info.fps = fps.current
      info.tier = tier
    }
    if (text === last.current) return
    last.current = text
    node.textContent = text
  })

  return <Stats className="town-stats" parent={parent} showPanel={0} />
}
