import { useState } from "react"
import AppFrame from "@/components/scene/AppFrame"
import Brand from "@/components/scene/Brand"
import Button from "@/components/ui/Button"
import TopBar from "@/components/ui/TopBar"
import { NOTE_MAX } from "@/data/challenges"
import { products } from "@/data/products"
import type { Go } from "@/lib/screen"
import { useGame } from "@/state/GameProvider"
import type { TypeCounts } from "@/lib/economy"

const fields = [
  { key: "passportSell", label: "What will you really sell?" },
  { key: "passportBuyers", label: "Who will buy it?" },
  { key: "passportStart", label: "What do you need to start?" },
] as const

export default function PassportScreen({ go }: { go: Go }) {
  const { state, dispatch } = useGame()
  const best = bestSeller(state.itemUnits)
  const buyers = topBuyers(state.buyerTotals)
  const margin =
    state.itemsSoldTotal > 0 ? Math.round(state.marginSum / state.itemsSoldTotal) : null
  const profit = average(state.roundProfits)
  const stock = average(state.roundStockCosts)

  return (
    <AppFrame className="passport-screen">
      <div className="screen-layer">
        <TopBar coins={state.coins} onBack={() => go("back")} title="PASSPORT" />
        <div className="content-scroll passport-print">
          <div className="kente-strip" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
          <Brand />
          <h1>Business Starter Plan</h1>
          <p className="passport-lead">Built from your stall. It stays on this phone.</p>
          <dl className="passport-facts">
            <div>
              <dt>Best-selling item</dt>
              <dd>{best ?? "Play a round and this fills in."}</dd>
            </div>
            <div>
              <dt>Who buys most</dt>
              <dd>{buyers ?? "Play a round and this fills in."}</dd>
            </div>
            <div>
              <dt>Average margin</dt>
              <dd>{margin === null ? "—" : `¢${margin} per item`}</dd>
            </div>
            <div>
              <dt>Average profit</dt>
              <dd>{profit === null ? "—" : `¢${profit} per round`}</dd>
            </div>
            <div>
              <dt>Typical stock cost</dt>
              <dd>{stock === null ? "—" : `¢${stock} a round`}</dd>
            </div>
          </dl>
          {fields.map((field) => (
            <label key={field.key}>
              {field.label}
              <Answer
                value={state[field.key]}
                onChange={(value) =>
                  dispatch({ type: "setPassport", field: field.key, value })
                }
              />
            </label>
          ))}
          <p className="passport-close">Made in Market Street. Your move.</p>
          <div className="passport-actions">
            <Button className="button-primary" onClick={() => window.print()}>
              Save as PDF
            </Button>
            <p>No contact details. Nothing leaves this device.</p>
          </div>
        </div>
      </div>
    </AppFrame>
  )
}

function Answer({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [text, setText] = useState(value)
  return (
    <textarea
      maxLength={NOTE_MAX}
      onChange={(event) => {
        const next = event.target.value.slice(0, NOTE_MAX)
        setText(next)
        onChange(next)
      }}
      rows={3}
      value={text}
    />
  )
}

function average(values: number[]): number | null {
  if (values.length === 0) return null
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

function bestSeller(units: number[]): string | null {
  const top = units.reduce(
    (best, count, index) => (count > best.count ? { count, index } : best),
    { count: 0, index: -1 },
  )
  if (top.count <= 0 || top.index < 0) return null
  return products[top.index]?.name ?? null
}

function topBuyers(counts: TypeCounts): string | null {
  const labels: Record<keyof TypeCounts, string> = {
    student: "Students",
    worker: "Workers",
    visitor: "Visitors",
    regular: "Regulars",
    player: "Players",
  }
  const top = (Object.keys(labels) as (keyof TypeCounts)[]).reduce((best, key) =>
    counts[key] > counts[best] ? key : best,
  )
  if (counts[top] <= 0) return null
  return labels[top]
}
