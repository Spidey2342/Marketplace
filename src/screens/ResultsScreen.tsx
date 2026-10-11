import AppFrame from "@/components/scene/AppFrame"
import Button from "@/components/ui/Button"
import Icon from "@/components/ui/Icon"
import Pill from "@/components/ui/Pill"
import type { Go } from "@/lib/screen"

export default function ResultsScreen({ go }: { go: Go }) {
  return (
    <AppFrame className="results-screen">
      <div className="confetti confetti-one" />
      <div className="confetti confetti-two" />
      <div className="confetti confetti-three" />
      <div className="results-layer">
        <div className="round-complete">
          <span className="eyebrow">MARKET CLOSED</span>
          <h1>Solid hustle, Kofi!</h1>
          <p>Your first sale is in the books.</p>
        </div>

        <section className="results-card">
          <div className="results-ribbon">ROUND RESULT</div>
          <div className="profit-mark">
            <div className="coin-stack">
              <Icon name="coin" size={34} />
            </div>
            <span>PROFIT</span>
            <strong>+¢38</strong>
          </div>
          <div className="results-stats">
            <div>
              <span>Items sold</span>
              <strong>11</strong>
            </div>
            <div>
              <span>Customers</span>
              <strong>8</strong>
            </div>
            <div>
              <span>Reputation</span>
              <strong>+12</strong>
            </div>
          </div>
          <div className="best-seller">
            <div className="best-art">
              <div className="food food-1" />
            </div>
            <div>
              <span>BEST SELLER</span>
              <strong>Sobolo · 6 sold</strong>
            </div>
            <Pill>
              <Icon name="star" size={15} /> MVP
            </Pill>
          </div>
          <div className="insight-card">
            <div className="insight-icon">
              <Icon name="spark" size={22} />
            </div>
            <p>
              <strong>Why you won</strong>
              Your Sobolo was ¢1 cheaper than your neighbours&apos;. More people
              stopped by.
            </p>
          </div>
        </section>

        <div className="results-actions">
          <Button
            className="button-primary"
            icon="arrow"
            onClick={() => go("setup")}
          >
            REINVEST ¢38
          </Button>
          <Button className="button-light" onClick={() => go("town")}>
            PLAY AGAIN
          </Button>
          <button
            className="text-button dark"
            onClick={() => go("challenge")}
            type="button"
          >
            View weekly challenge
          </button>
        </div>
      </div>
    </AppFrame>
  )
}
