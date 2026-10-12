import AppFrame from "@/components/scene/AppFrame"
import Button from "@/components/ui/Button"
import Icon from "@/components/ui/Icon"
import Pill from "@/components/ui/Pill"
import TopBar from "@/components/ui/TopBar"
import { groupHustlers, leaderboard } from "@/data/groups"
import { playerWeekPoints, timeUntilSunday } from "@/lib/economy"
import type { Go } from "@/lib/screen"
import { useEffect, useState } from "react"
import { fetchRankings, isRemote, type RankRow } from "@/lib/sync"
import { useGame } from "@/state/GameProvider"

export default function LeaderboardScreen({ go }: { go: Go }) {
  const { state } = useGame()
  const left = timeUntilSunday(Date.now())
  const remote = isRemote()
  const [live, setLive] = useState<RankRow[] | null>(null)
  const [missed, setMissed] = useState(false)

  useEffect(() => {
    if (!remote) return
    void fetchRankings().then((rows) => {
      if (rows) setLive(rows)
      else setMissed(true)
    })
  }, [remote])

  const rows = remote
    ? (live ?? []).map((row) => ({
        id: row.group_id,
        name: row.name,
        points: row.points,
        rank: row.rank,
        moved: 0,
      }))
    : [...leaderboard]
        .sort((a, b) => b.points - a.points)
        .map((row, index) => ({ ...row, rank: index + 1 }))
  const mine = rows.find((row) => row.id === state.groupId) ?? null
  const added = playerWeekPoints(state.weekContribution, state.challengesCompleted)

  return (
    <AppFrame className="leaderboard-screen">
      <div className="screen-layer">
        <TopBar
          coins={state.coins}
          onBack={() => go("back")}
          title="GROUP RANKINGS"
        />
        <div className="content-scroll leaderboard-content">
          <section className="week-card">
            <span>Week ends Sunday</span>
            <Pill>
              <Icon name="clock" size={15} />
              {left.days}d {left.hours}h left
            </Pill>
          </section>

          <section className="pin-card">
            {mine ? (
              <>
                <span className={`rank-mark ${mine.rank <= 3 ? `medal-${mine.rank}` : ""}`}>
                  {mine.rank}
                </span>
                <div>
                  <strong>{mine.name}</strong>
                  <span>{mine.points} pts</span>
                </div>
                <em>You added +{added}</em>
              </>
            ) : (
              <p>Pick a group to see your rank.</p>
            )}
          </section>

          {remote && missed && <p className="field-help">Rankings will load when you are back online.</p>}
          <ol className="rank-list">
            {rows.map((row) => (
              <li
                className={row.id === state.groupId ? "is-you" : ""}
                key={row.id}
              >
                <span className={`rank-mark ${row.rank <= 3 ? `medal-${row.rank}` : ""}`}>
                  {row.rank}
                </span>
                <strong>{row.name}</strong>
                <span className="pts">{row.points}</span>
                {remote ? <span /> : <Move places={row.moved} />}
              </li>
            ))}
          </ol>

          {!remote && (
          <section className="hustle-card">
            <h2>Top hustlers in your group</h2>
            {groupHustlers.map((player, index) => (
              <div className="hustle-row" key={player.name}>
                <span>{index + 1}</span>
                <strong>{player.name}</strong>
                <em>{player.points} pts</em>
              </div>
            ))}
          </section>
          )}
        </div>
        <footer className="sticky-action">
          <Button className="button-primary" onClick={() => go("back")}>
            BACK TO MARKET
          </Button>
        </footer>
      </div>
    </AppFrame>
  )
}

function Move({ places }: { places: number }) {
  return (
    <span
      aria-label={
        places > 0
          ? `Up ${places}`
          : places < 0
            ? `Down ${Math.abs(places)}`
            : "No change"
      }
      className={`move ${places > 0 ? "up" : places < 0 ? "down" : "flat"}`}
    >
      {places !== 0 && <i />}
      {Math.abs(places)}
    </span>
  )
}
