import Icon from "@/components/ui/Icon"
import Pill from "@/components/ui/Pill"

export default function TopBar({
  title,
  onBack,
  coins = 100,
}: {
  title: string
  onBack?: () => void
  coins?: number
}) {
  return (
    <header className="top-bar">
      {onBack ? (
        <button
          aria-label="Go back"
          className="icon-button"
          onClick={onBack}
          type="button"
        >
          <Icon name="chevron" />
        </button>
      ) : (
        <div className="avatar-chip">
          <span className="avatar-face" />
          <span>KM</span>
        </div>
      )}
      <strong>{title}</strong>
      <Pill className="coin-pill">
        <Icon name="coin" size={19} />
        {coins}
      </Pill>
    </header>
  )
}
