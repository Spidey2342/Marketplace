import Icon from "@/components/ui/Icon"

export default function ReportSheet({
  handle,
  onCancel,
  onConfirm,
}: {
  handle: string
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="report-sheet" role="dialog">
      <div className="sheet-handle" />
      <h2>Report player</h2>
      <p className="report-target">
        You are reporting <strong>{handle}</strong>. We use your hidden player ID, not the name
        alone.
      </p>
      <p className="field-help">They will be hidden in your town session after you report.</p>
      <div className="report-actions">
        <button className="visit-x" onClick={onCancel} type="button">
          Cancel
        </button>
        <button className="report-send" onClick={onConfirm} type="button">
          <Icon name="shield" size={18} />
          Send report
        </button>
      </div>
    </div>
  )
}
