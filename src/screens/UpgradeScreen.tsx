import AppFrame from "@/components/scene/AppFrame"
import Button from "@/components/ui/Button"
import Icon from "@/components/ui/Icon"
import TopBar from "@/components/ui/TopBar"
import {
  nextStage,
  quickUpgrades,
  stageIndex,
  stages,
  upgradeLock,
  type StageId,
} from "@/data/upgrades"
import { roundsToGo } from "@/lib/economy"
import type { Go } from "@/lib/screen"
import { useGame } from "@/state/GameProvider"

export default function UpgradeScreen({ go }: { go: Go }) {
  const { state, dispatch } = useGame()
  const upcoming = nextStage(state.stageId)
  const shortfall = upcoming ? Math.max(0, upcoming.cost - state.coins) : 0
  const rounds = roundsToGo(shortfall, state.roundProfits)
  const roundWord = rounds === 1 ? "round" : "rounds"

  return (
    <AppFrame className="upgrade-screen">
      <div className="screen-layer">
        <TopBar
          coins={state.coins}
          onBack={() => go("upgrade-back")}
          title="GROW YOUR HUSTLE"
        />
        <div className="content-scroll upgrade-content">
          <ol className="stage-ladder">
            {stages.map((stage) => {
              const mark = ladderMark(state.stageId, stage.id)
              return (
                <li className={`stage-step is-${mark}`} key={stage.id}>
                  <span>
                    {mark === "owned" && <Icon name="check" size={16} />}
                    {mark === "locked" && <Icon name="lock" size={16} />}
                    {mark === "current" && <i />}
                  </span>
                  {stage.label}
                </li>
              )
            })}
          </ol>

          {upcoming && (
            <section className="next-card">
              <span className="eyebrow">NEXT</span>
              <h2>{upcoming.label}</h2>
              <p>{upcoming.unlocks}</p>
              {upcoming.purchasable ? (
                <>
                  <strong>¢{upcoming.cost}</strong>
                  <div className="progress" aria-hidden="true">
                    <span
                      style={{
                        width: `${Math.min(100, (state.coins / upcoming.cost) * 100)}%`,
                      }}
                    />
                  </div>
                  {shortfall > 0 ? (
                    <p className="shortfall">
                      ¢{shortfall} to go. About {rounds} good {roundWord}.
                    </p>
                  ) : (
                    <Button
                      className="button-primary"
                      onClick={() => dispatch({ type: "buyStage" })}
                    >
                      BUY
                    </Button>
                  )}
                </>
              ) : null}
            </section>
          )}

          <section className="upgrade-list">
            <h2>Quick upgrades</h2>
            {quickUpgrades.map((item) => {
              const owned = state.ownedUpgrades.includes(item.id)
              const reason = owned
                ? null
                : upgradeLock(item, state.stageId, state.reputation)
              const affordable = !owned && !reason && state.coins >= item.cost
              return (
                <article
                  className={`upgrade-card ${owned ? "is-owned" : ""} ${reason ? "is-locked" : ""}`}
                  key={item.id}
                >
                  <div>
                    <strong>{item.name}</strong>
                    <p>{reason ?? item.detail}</p>
                  </div>
                  {owned ? (
                    <span className="owned-mark">
                      <Icon name="check" size={18} />
                    </span>
                  ) : (
                    <button
                      className={`upgrade-buy ${affordable ? "" : "is-disabled"}`}
                      disabled={!affordable}
                      onClick={() => dispatch({ type: "buyUpgrade", id: item.id })}
                      type="button"
                    >
                      BUY ¢{item.cost}
                    </button>
                  )}
                </article>
              )
            })}
          </section>

          <button
            className="rank-link"
            onClick={() => go("rankings")}
            type="button"
          >
            See group rankings
          </button>
        </div>
        <footer className="sticky-action">
          <Button className="button-primary" onClick={() => go("restock")}>
            RESTOCK
          </Button>
        </footer>
      </div>
    </AppFrame>
  )
}

function ladderMark(current: StageId, id: StageId): "owned" | "current" | "locked" {
  const here = stageIndex(current)
  const step = stageIndex(id)
  if (step < here) return "owned"
  if (step === here) return "current"
  return "locked"
}
