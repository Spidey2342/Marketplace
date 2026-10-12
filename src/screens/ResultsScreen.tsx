import AppFrame from "@/components/scene/AppFrame"
import Button from "@/components/ui/Button"
import Icon from "@/components/ui/Icon"
import Pill from "@/components/ui/Pill"
import type { Go } from "@/lib/screen"
import { products } from "@/data/products"
import { useGame } from "@/state/GameProvider"

export default function ResultsScreen({ go }: { go: Go }) {
  const { state } = useGame()
  const result = state.lastResult
  const profit = result?.profit ?? 0
  const loss = profit < 0
  const profitLabel = `${profit > 0 ? "+" : profit < 0 ? "−" : ""}¢${Math.abs(profit)}`

  return (
    <AppFrame className="results-screen">
      {result && result.profit >= 0 && (
        <>
          <div className="confetti confetti-one" />
          <div className="confetti confetti-two" />
          <div className="confetti confetti-three" />
        </>
      )}
      <div className="results-layer">
        <div className="round-complete">
          <span className="eyebrow">MARKET CLOSED</span>
          <h1>{result?.headline ?? "Market closed"}</h1>
          <p>{result?.subline ?? "Open your stall to play a round."}</p>
        </div>

        <section className="results-card">
          <div className="results-ribbon">ROUND RESULT</div>
          <div className={`profit-mark ${loss ? "is-loss" : ""}`}>
            <div className="coin-stack">
              <Icon name="coin" size={34} />
            </div>
            <span>PROFIT</span>
            <strong>{profitLabel}</strong>
          </div>
          {state.syncNote && <p className="field-help">{state.syncNote}</p>}
          <div className="who-bought">
            <span>Who bought</span>
            <div>
              <span>Students</span>
              <strong>{result?.buyers.student ?? 0}</strong>
            </div>
            <div>
              <span>Workers</span>
              <strong>{result?.buyers.worker ?? 0}</strong>
            </div>
            <div>
              <span>Visitors</span>
              <strong>{result?.buyers.visitor ?? 0}</strong>
            </div>
            <div>
              <span>Regulars</span>
              <strong>{result?.buyers.regular ?? 0}</strong>
            </div>
            <div>
              <span>Players</span>
              <strong>{result?.buyers.player ?? 0}</strong>
            </div>
          </div>
          <div className="results-stats">
            <div>
              <span>Items sold</span>
              <strong>{result?.itemsSold ?? 0}</strong>
            </div>
            <div>
              <span>Customers</span>
              <strong>{result?.customers ?? 0}</strong>
            </div>
            <div>
              <span>Reputation</span>
              <strong>+{result?.reputationChange ?? 0}</strong>
            </div>
          </div>
          {result?.bestSeller && (
            <div className="best-seller">
              <div
                className="best-art"
                style={{
                  background:
                    products.find((item) => item.id === result.bestSeller?.productId)?.color ??
                    "#ffc928",
                }}
              >
                <div
                  className={`prop prop-${products.find((item) => item.id === result.bestSeller?.productId)?.propType ?? "pile"}`}
                />
              </div>
              <div>
                <span>BEST SELLER</span>
                <strong>
                  {result.bestSeller.name} · {result.bestSeller.sold} sold
                </strong>
              </div>
              <Pill>
                <Icon name="star" size={15} /> MVP
              </Pill>
            </div>
          )}
          <p className="bought-result">
            Bought from others: {result?.boughtItems ?? 0} items, ¢{result?.boughtSpend ?? 0}
          </p>
          {result?.eventLine && <p className="event-result">{result.eventLine}</p>}
          {result?.creditLine && <p className="credit-result">{result.creditLine}</p>}
          <div className="insight-card">
            <div className="insight-icon">
              <Icon name="spark" size={22} />
            </div>
            <p>
              <strong>{result?.reasonTitle ?? "What happened"}</strong>
              {result?.reasonLine ??
                "Stock the stall and the market will tell you how it went."}
            </p>
          </div>
        </section>

        <div className="results-actions">
          <Button
            className="button-primary"
            icon="arrow"
            onClick={() => go("reinvest")}
          >
            {profit > 0 ? `REINVEST ¢${profit}` : "REINVEST"}
          </Button>
          <Button className="button-light" onClick={() => go("play-again")}>
            PLAY AGAIN
          </Button>
          <button
            className="text-button dark"
            onClick={() => go("challenge")}
            type="button"
          >
            View weekly challenge
          </button>
          <button
            className="text-button dark"
            onClick={() => go("rankings")}
            type="button"
          >
            See group rankings
          </button>
        </div>
      </div>
    </AppFrame>
  )
}
