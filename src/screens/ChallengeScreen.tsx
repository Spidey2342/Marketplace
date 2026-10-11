import AppFrame from "@/components/scene/AppFrame"
import Button from "@/components/ui/Button"
import Icon from "@/components/ui/Icon"
import Pill from "@/components/ui/Pill"
import TopBar from "@/components/ui/TopBar"
import { weeklyChallenge } from "@/data/challenges"
import { timeUntilSunday } from "@/lib/economy"
import type { Go } from "@/lib/screen"
import { challengeProgress, useGame } from "@/state/GameProvider"

export default function ChallengeScreen({ go }: { go: Go }) {
  const { state, dispatch } = useGame()
  const steps = challengeProgress(state)
  const doneCount = steps.filter((step) => step.done).length
  const left = timeUntilSunday(Date.now())

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
            <span>WEEK {weeklyChallenge.week}</span>
            <strong>{weeklyChallenge.kicker}</strong>
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
            <h1>{weeklyChallenge.title}</h1>
            <p>{weeklyChallenge.body}</p>
            <div className="reward-pill">
              <Icon name="star" size={20} />
              <span>REWARD</span>
              <strong>
                {weeklyChallenge.rewardCoins} coins + {weeklyChallenge.rewardBadge}
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
                    onClick={() =>
                      dispatch({ type: "setProof", proof: "pending" })
                    }
                  >
                    SUBMIT PROOF
                  </Button>
                )}
              </>
            )}
          </section>

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
