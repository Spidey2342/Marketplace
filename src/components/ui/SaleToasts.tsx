import { useEffect, useRef, useState } from "react"

const TOAST_MS = 2500
const FADE_MS = 400

type Sale = {
  id: number
  buyer: string
  productName: string
  price: number
}

type Item = Sale & { phase: "in" | "out" }

export default function SaleToasts({ sale }: { sale: Sale | null }) {
  const [items, setItems] = useState<Item[]>([])
  const seen = useRef(0)
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  useEffect(() => {
    if (!sale || sale.id === seen.current) return
    seen.current = sale.id
    const id = sale.id
    const next: Item = {
      id,
      buyer: sale.buyer,
      productName: sale.productName,
      price: sale.price,
      phase: "in",
    }
    setItems((current) => {
      if (current.some((item) => item.id === id)) return current
      return [...current, next].slice(-2)
    })
    window.setTimeout(() => {
      if (!alive.current) return
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, phase: "out" } : item)),
      )
    }, TOAST_MS)
    window.setTimeout(() => {
      if (!alive.current) return
      setItems((current) => current.filter((item) => item.id !== id))
    }, TOAST_MS + FADE_MS)
  }, [sale])

  if (items.length === 0) return null

  return (
    <div className="sale-toasts">
      {items.map((item) => (
        <p className={`sale-pill ${item.phase === "out" ? "is-out" : ""}`} key={item.id}>
          {item.buyer} bought {item.productName}! +¢{item.price}
        </p>
      ))}
    </div>
  )
}
