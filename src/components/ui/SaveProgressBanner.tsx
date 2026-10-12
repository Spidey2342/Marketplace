import Icon from "@/components/ui/Icon"
import { dismissSaveBanner } from "@/lib/account"

export default function SaveProgressBanner({
  onSave,
  onDismiss,
}: {
  onSave: () => void
  onDismiss: () => void
}) {
  return (
    <aside className="save-banner">
      <p>
        <Icon name="shield" size={18} />
        Save your progress so you can play on another phone.
      </p>
      <div className="save-banner-actions">
        <button
          onClick={() => {
            dismissSaveBanner()
            onDismiss()
          }}
          type="button"
        >
          Not now
        </button>
        <button className="save-banner-go" onClick={onSave} type="button">
          Save
        </button>
      </div>
    </aside>
  )
}
