import { useEffect, useRef, useState, type PointerEvent } from "react"
import { setMove } from "@/state/input"

function clampUnit(value: number) {
  if (Number.isNaN(value)) return 0
  return Math.max(-1, Math.min(1, value))
}

const MOVE_KEYS = new Set([
  "arrowup",
  "arrowdown",
  "arrowleft",
  "arrowright",
  "w",
  "a",
  "s",
  "d",
])

export default function Joystick() {
  const baseRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const keys = useRef(new Set<string>())
  const [knob, setKnob] = useState({ x: 0, y: 0 })
  const [returning, setReturning] = useState(false)
  const vector = useRef({ x: 0, y: 0 })

  function travel() {
    const width = baseRef.current?.getBoundingClientRect().width ?? 96
    return Math.max(12, width / 2 - 30)
  }

  function publish(x: number, y: number) {
    const next = { x: clampUnit(x), y: clampUnit(y) }
    const distance = travel()
    vector.current = next
    setKnob({ x: next.x * distance, y: next.y * distance })
    setMove(next.x, next.y)
    const node = baseRef.current
    if (node) {
      node.dataset.x = String(next.x)
      node.dataset.y = String(next.y)
    }
  }

  function fromKeys() {
    let x = 0
    let y = 0
    if (keys.current.has("arrowleft") || keys.current.has("a")) x -= 1
    if (keys.current.has("arrowright") || keys.current.has("d")) x += 1
    if (keys.current.has("arrowup") || keys.current.has("w")) y -= 1
    if (keys.current.has("arrowdown") || keys.current.has("s")) y += 1
    const length = Math.hypot(x, y)
    if (length > 1) {
      x /= length
      y /= length
    }
    return { x, y }
  }

  function fromPointer(event: PointerEvent<HTMLDivElement>) {
    const rect = baseRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    const max = travel()
    let dx = event.clientX - (rect.left + rect.width / 2)
    let dy = event.clientY - (rect.top + rect.height / 2)
    const length = Math.hypot(dx, dy)
    if (length > max && length > 0) {
      dx = (dx / length) * max
      dy = (dy / length) * max
    }
    return {
      x: max === 0 ? 0 : dx / max,
      y: max === 0 ? 0 : dy / max,
    }
  }

  function release() {
    dragging.current = false
    const held = fromKeys()
    if (held.x !== 0 || held.y !== 0) {
      setReturning(false)
      publish(held.x, held.y)
      return
    }
    setReturning(true)
    setKnob({ x: 0, y: 0 })
    publish(0, 0)
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase()
      if (!MOVE_KEYS.has(key)) return
      if (event.repeat) return
      const target = event.target
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        return
      }
      event.preventDefault()
      keys.current.add(key)
      if (dragging.current) return
      const next = fromKeys()
      publish(next.x, next.y)
    }

    function onKeyUp(event: KeyboardEvent) {
      const key = event.key.toLowerCase()
      if (!MOVE_KEYS.has(key)) return
      keys.current.delete(key)
      if (dragging.current) return
      const next = fromKeys()
      if (next.x === 0 && next.y === 0) setReturning(true)
      publish(next.x, next.y)
    }

    function onBlur() {
      keys.current.clear()
      if (!dragging.current) release()
    }

    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    window.addEventListener("blur", onBlur)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
      window.removeEventListener("blur", onBlur)
      setMove(0, 0)
    }
  }, [])

  return (
    <div
      aria-label="Move"
      className={`virtual-joystick ${returning ? "is-reset" : ""}`}
      data-x={vector.current.x}
      data-y={vector.current.y}
      onPointerCancel={release}
      onPointerDown={(event) => {
        event.preventDefault()
        dragging.current = true
        setReturning(false)
        event.currentTarget.setPointerCapture(event.pointerId)
        const next = fromPointer(event)
        publish(next.x, next.y)
      }}
      onPointerMove={(event) => {
        if (!dragging.current) return
        const next = fromPointer(event)
        publish(next.x, next.y)
      }}
      onPointerUp={release}
      ref={baseRef}
      role="application"
    >
      <span className="joystick-direction joystick-up" />
      <span className="joystick-direction joystick-right" />
      <span className="joystick-direction joystick-down" />
      <span className="joystick-direction joystick-left" />
      <span
        className="joystick-knob"
        style={{
          transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))`,
        }}
      />
    </div>
  )
}
