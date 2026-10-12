import Icon from "@/components/ui/Icon"
import { productById } from "@/data/products"
import { stockLeft } from "@/lib/economy"
import { useGame } from "@/state/GameProvider"

export default function StallStatus({ onClose }: { onClose: () => void }) {
  const { state } = useGame()
  const lines = state.stall.filter((line) => line.selected)

  return (
    <div aria-label="Your stall" className="stall-sheet stall-status" role="dialog">
      <div className="sheet-handle" />
      <div className="sheet-title">
        <h2>YOUR STALL</h2>
        <button aria-label="Close" onClick={onClose} type="button">
          <Icon name="x" />
        </button>
      </div>
      <div className="content-scroll setup-content">
        {lines.length === 0 && <p className="open-reason">Nothing on the table yet.</p>}
        {lines.map((line) => {
          const product = productById(line.productId)
          const left = stockLeft(line)
          return (
            <article className="status-line" key={line.productId}>
              <span className="status-swatch" style={{ background: product.color }} />
              <div>
                <strong>{product.name}</strong>
                <p>
                  {left} {product.unitName} left · ¢{line.price}
                </p>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
