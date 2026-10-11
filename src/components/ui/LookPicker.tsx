import Icon from "@/components/ui/Icon"
import type { LookOption } from "@/data/avatar"

export default function LookPicker({
  title,
  options,
  selected,
  onPick,
  locked = false,
}: {
  title: string
  options: LookOption[]
  selected: string
  onPick: (id: string) => void
  locked?: boolean
}) {
  return (
    <section className="look-block">
      <h2>{title}</h2>
      <div className={`look-grid ${title === "Shoes" ? "shoes" : ""}`}>
        {options.map((option) => (
          <button
            className={`look-tile ${selected === option.id ? "is-selected" : ""}`}
            key={option.id}
            onClick={() => onPick(option.id)}
            type="button"
          >
            <span className="look-swatch" style={{ background: option.color }} />
            {option.label}
          </button>
        ))}
        {locked && (
          <div className="look-tile locked">
            <Icon name="lock" size={18} />
            More styles coming
          </div>
        )}
      </div>
    </section>
  )
}
