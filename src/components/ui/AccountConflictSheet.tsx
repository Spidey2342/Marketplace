export default function AccountConflictSheet({
  onCancel,
  onContinue,
}: {
  onCancel: () => void
  onContinue: () => void
}) {
  return (
    <div className="account-conflict" role="dialog">
      <div className="sheet-handle" />
      <h2>Replace progress on this device?</h2>
      <p>
        Signing in will replace the progress on this device with your saved account.
      </p>
      <div className="report-actions">
        <button className="visit-x" onClick={onCancel} type="button">
          Cancel
        </button>
        <button className="report-send" onClick={onContinue} type="button">
          Continue
        </button>
      </div>
    </div>
  )
}
