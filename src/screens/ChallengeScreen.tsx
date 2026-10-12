import { useEffect, useRef, useState } from "react"
import AppFrame from "@/components/scene/AppFrame"
import Button from "@/components/ui/Button"
import Icon from "@/components/ui/Icon"
import Pill from "@/components/ui/Pill"
import TopBar from "@/components/ui/TopBar"
import { currentChallenge, explorerChallenge, NOTE_MAX, PASSPORT_AFTER, weekId } from "@/data/challenges"
import { EXPLORER_STALLS } from "@/data/visits"
import { timeUntilSunday } from "@/lib/economy"
import type { Go } from "@/lib/screen"
import { isRemote, loadChallengeStatus, submitChallenge } from "@/lib/sync"
import { isDev } from "@/scene3d/tier"
import { challengeProgress, useGame } from "@/state/GameProvider"

export default function ChallengeScreen({ go }: { go: Go }) {
  const { state, dispatch } = useGame()
  const now = Date.now()
  const challenge = currentChallenge(now)
  const steps = challengeProgress(state)
  const doneCount = steps.filter((step) => step.done).length
  const left = timeUntilSunday(now)
  const [note, setNote] = useState(state.challengeNote)
  const [sendError, setSendError] = useState("")
  const [review, setReview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const unlocked = state.challengesCompleted >= PASSPORT_AFTER
  const remote = isRemote()

  useEffect(() => {
    if (!remote) return
    void loadChallengeStatus().then((status) => {
      if (!status) return
      setReview(status)
      if (status === "pending") dispatch({ type: "setProof", proof: "pending" })
      if (status === "approved") dispatch({ type: "approveChallenge", now: Date.now() })
    })
  }, [dispatch, remote])

  async function sendNote() {
    if (!remote) {
      dispatch({ type: "setProof", proof: "pending" })
      return
    }
    setSendError("")
    try {
      await submitChallenge({
        challengeId: String(challenge.id),
        proofType: "note",
        note,
      })
      dispatch({ type: "setProof", proof: "pending" })
      setReview("pending")
    } catch {
      setSendError("Could not send that note. Try again.")
    }
  }

  async function sendFile(file: File | undefined) {
    if (!file) return
    if (!remote) {
      dispatch({ type: "setProof", proof: "pending" })
      return
    }
    const proofType = state.proof === "receipt" ? "receipt" : "photo"
    setSendError("")
    try {
      await submitChallenge({
        challengeId: String(challenge.id),
        proofType,
        file,
      })
      dispatch({ type: "setProof", proof: "pending" })
      setReview("pending")
    } catch {
      setSendError("Could not send that photo. Try again.")
    }
  }

  return (
    <AppFrame className="challenge-screen">
      <div className="screen-layer">
        <TopBar
          coins={state.coins}
          onBack={() => go("back")}
          title="WEEKLY CHALLENGE"
        />
        <div className="content-scroll challenge-content">
          <div className="week-strip">
            <span>WEEK {weekId(now)}</span>
            <strong>{challenge.kicker}</strong>
            <Pill>
              <Icon name="clock" size={15} />
              {left.days}d {left.hours}h left
            </Pill>
          </div>

          <section className="challenge-hero">
            <div className="kente-strip">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
            <div className="challenge-illustration">
              <div className="hand hand-left" />
              <div className="challenge-coin">
                <Icon name="coin" size={38} />
              </div>
              <div className="hand hand-right" />
            </div>
            <span className="eyebrow">REAL-LIFE CHALLENGE</span>
            <h1>{challenge.title}</h1>
            <p>{challenge.body}</p>
            <div className="reward-pill">
              <Icon name="star" size={20} />
              <span>REWARD</span>
              <strong>
                {challenge.rewardCoins} coins + {challenge.rewardBadge}
              </strong>
            </div>
          </section>

          <section className="steps-card">
            <div className="card-heading">
              <h2>YOUR STEPS</h2>
              <span>
                {doneCount} of {steps.length}
              </span>
            </div>
            {steps.map((step, index) => (
              <div
                className={`challenge-step ${step.done ? "done" : ""}`}
                key={step.label}
              >
                <span>
                  {step.done ? <Icon name="check" size={17} /> : index + 1}
                </span>
                <p>{step.label}</p>
              </div>
            ))}
          </section>

          <section
            className={`proof-card ${
              state.proof === "pending" ? "proof-pending" : ""
            }`}
          >
            <div className="card-heading">
              <div>
                <span className="eyebrow">FINAL STEP</span>
                <h2>Add your proof</h2>
              </div>
              {state.proof === "pending" && <Pill>Pending review</Pill>}
            </div>
            {state.proof === "pending" ? (
              <div className="pending-state">
                <div className="pending-check">
                  <Icon name="check" size={28} />
                </div>
                <div>
                  <strong>Proof sent!</strong>
                  <p>
                    We&apos;ll review it before Sunday. Your photo stays
                    private.
                  </p>
                </div>
              </div>
            ) : challenge.proof === "note" ? (
              <>
                <p className="proof-helper">
                  Write a short note. No names or numbers. {NOTE_MAX} characters.
                </p>
                <textarea
                  className="challenge-note"
                  maxLength={NOTE_MAX}
                  onChange={(event) => {
                    const next = event.target.value.slice(0, NOTE_MAX)
                    setNote(next)
                    dispatch({ type: "setChallengeNote", note: next })
                  }}
                  value={note}
                />
                <Button
                  className="button-primary submit-proof"
                  onClick={() => {
                    void sendNote()
                  }}
                >
                  SUBMIT NOTE
                </Button>
              </>
            ) : (
              <>
                <p className="proof-helper">
                  Pick one. We only use it to verify your challenge.
                </p>
                <div className="proof-options">
                  <button
                    className={state.proof === "photo" ? "selected" : ""}
                    onClick={() => dispatch({ type: "setProof", proof: "photo" })}
                    type="button"
                  >
                    <Icon name="camera" size={25} />
                    <span>Photo</span>
                    <small>Product or sale</small>
                  </button>
                  <button
                    className={state.proof === "receipt" ? "selected" : ""}
                    onClick={() =>
                      dispatch({ type: "setProof", proof: "receipt" })
                    }
                    type="button"
                  >
                    <Icon name="receipt" size={25} />
                    <span>MoMo receipt</span>
                    <small>Hide private info</small>
                  </button>
                </div>
                {state.proof !== "none" && (
                  <Button
                    className="button-primary submit-proof"
                    onClick={() => {
                      if (!remote) {
                        dispatch({ type: "setProof", proof: "pending" })
                        return
                      }
                      fileRef.current?.click()
                    }}
                  >
                    SUBMIT PROOF
                  </Button>
                )}
              </>
            )}
          </section>

          <section className="proof-card">
            <div className="card-heading">
              <div>
                <span className="eyebrow">{explorerChallenge.kicker}</span>
                <h2>{explorerChallenge.title}</h2>
              </div>
              {state.explorerClaimed && <Pill>Done</Pill>}
            </div>
            <p className="proof-helper">
              {state.explorerStalls.length} of {EXPLORER_STALLS} stalls. Worth ¢
              {explorerChallenge.rewardCoins} and the {explorerChallenge.rewardBadge} badge.
            </p>
          </section>
          {sendError && <p className="field-error">{sendError}</p>}
          {review === "rejected" && (
            <p className="field-help">This week&apos;s proof was not approved.</p>
          )}
          <input
            accept="image/*"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ""
              void sendFile(file)
            }}
            ref={fileRef}
            type="file"
          />
          {isDev() && !remote && (
            <Button
              className="button-light"
              onClick={() => dispatch({ type: "approveChallenge", now: Date.now() })}
            >
              Approve proof
            </Button>
          )}
          {unlocked && (
            <section className="passport-unlock">
              <strong>Business Passport</strong>
              <p>Three challenges done. Your starter plan is ready.</p>
              <Button className="button-primary" onClick={() => go("passport")}>
                Open passport
              </Button>
            </section>
          )}
          <div className="privacy-card">
            <Icon name="shield" size={22} />
            <p>
              <strong>Your safety matters.</strong> Proof is moderated and never
              shown publicly without your permission.
            </p>
          </div>
        </div>
      </div>
    </AppFrame>
  )
}
