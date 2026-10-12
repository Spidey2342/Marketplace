import { useState } from "react"

const lines = [
  "Use the joystick to walk",
  "Walk up to a stall to see prices",
  "Open your stall to start the market.",
]

export default function CoachMarks({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  const last = step === lines.length - 1

  return (
    <div className={`coach-mark coach-${step}`}>
      <p>{lines[step]}</p>
      <div className="coach-actions">
        <button onClick={onDone} type="button">
          Skip
        </button>
        <button
          onClick={() => {
            if (last) onDone()
            else setStep(step + 1)
          }}
          type="button"
        >
          {last ? "Got it" : "Next"}
        </button>
      </div>
    </div>
  )
}
