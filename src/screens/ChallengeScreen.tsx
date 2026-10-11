import { useMemo, useState } from "react"
import AppFrame from "@/components/scene/AppFrame"
import Button from "@/components/ui/Button"
import Icon from "@/components/ui/Icon"
import Pill from "@/components/ui/Pill"
import TopBar from "@/components/ui/TopBar"
import type { Go } from "@/lib/screen"

export default function ChallengeScreen({ go }: { go: Go }) {
  const [proof, setProof] = useState<"none" | "photo" | "receipt" | "pending">(
    "none",
  )
  const steps = useMemo(
    () => [
      { done: true, label: "Choose one thing to sell" },
      { done: true, label: "Agree a fair price" },
      { done: proof === "pending", label: "Make the sale & add proof" },
    ],
    [proof],
  )

  return (
    <AppFrame className="challenge-screen">
      <div className="screen-layer">
        <TopBar
          coins={138}
          onBack={() => go("town")}
          title="WEEKLY CHALLENGE"
        />
        <div className="content-scroll challenge-content">
          <div className="week-strip">
            <span>WEEK 3</span>
            <strong>First sale energy</strong>
            <Pill>
              <Icon name="clock" size={15} />
              2d 14h left
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
            <h1>Make your first real sale</h1>
            <p>
              Sell one simple thing to someone you know. Start small — the win
              is starting.
            </p>
            <div className="reward-pill">
              <Icon name="star" size={20} />
              <span>REWARD</span>
              <strong>200 coins + First Sale badge</strong>
            </div>
          </section>

          <section className="steps-card">
            <div className="card-heading">
              <h2>YOUR STEPS</h2>
              <span>2 of 3</span>
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
              proof === "pending" ? "proof-pending" : ""
            }`}
          >
            <div className="card-heading">
              <div>
                <span className="eyebrow">FINAL STEP</span>
                <h2>Add your proof</h2>
              </div>
              {proof === "pending" && <Pill>Pending review</Pill>}
            </div>
            {proof === "pending" ? (
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
                    className={proof === "photo" ? "selected" : ""}
                    onClick={() => setProof("photo")}
                    type="button"
                  >
                    <Icon name="camera" size={25} />
                    <span>Photo</span>
                    <small>Product or sale</small>
                  </button>
                  <button
                    className={proof === "receipt" ? "selected" : ""}
                    onClick={() => setProof("receipt")}
                    type="button"
                  >
                    <Icon name="receipt" size={25} />
                    <span>MoMo receipt</span>
                    <small>Hide private info</small>
                  </button>
                </div>
                {proof !== "none" && (
                  <Button
                    className="button-primary submit-proof"
                    onClick={() => setProof("pending")}
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
