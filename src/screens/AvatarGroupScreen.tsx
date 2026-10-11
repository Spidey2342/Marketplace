import { useState } from "react"
import AppFrame from "@/components/scene/AppFrame"
import LookPicker from "@/components/ui/LookPicker"
import Button from "@/components/ui/Button"
import Icon from "@/components/ui/Icon"
import {
  hairs,
  lookById,
  outfits,
  shoes,
} from "@/data/avatar"
import { groupByCode, groups } from "@/data/groups"
import type { Go } from "@/lib/screen"
import { useGame } from "@/state/GameProvider"

function nicknameError(name: string): string | null {
  const trimmed = name.trim()
  if (trimmed.length === 0) return null
  if (trimmed.length < 2) return "Make it at least 2 characters."
  if (trimmed.length > 16) return "Keep it to 16 characters."
  const digits = trimmed.replace(/[\s+-]/g, "")
  if (/^\d{8,}$/.test(digits)) return "Use a nickname, not your phone number."
  return null
}

export default function AvatarGroupScreen({ go }: { go: Go }) {
  const { state, dispatch } = useGame()
  const [showError, setShowError] = useState(false)
  const [codeOpen, setCodeOpen] = useState(false)
  const [code, setCode] = useState("")
  const [codeError, setCodeError] = useState(false)
  const hair = lookById(hairs, state.hairId)
  const outfit = lookById(outfits, state.outfitId)
  const shoe = lookById(shoes, state.shoeId)
  const error = nicknameError(state.avatarName)
  const nameReady = state.avatarName.trim().length >= 2 && !error
  const ready = nameReady && Boolean(state.groupId)

  function chooseCode() {
    const match = groupByCode(code)
    if (!match) {
      setCodeError(true)
      return
    }
    dispatch({ type: "setGroup", id: match.id })
    setCodeOpen(false)
    setCodeError(false)
  }

  return (
    <AppFrame className="avatar-screen">
      <div className="screen-layer">
        <header className="top-bar">
          <button
            aria-label="Go back"
            className="icon-button"
            onClick={() => go("home")}
            type="button"
          >
            <Icon name="chevron" />
          </button>
          <strong>YOUR HUSTLE</strong>
          <span />
        </header>
        <div className="content-scroll avatar-content">
          <div className="avatar-doll" aria-hidden="true">
            <span className={`doll-hair hair-${hair.id}`} style={{ background: hair.color }} />
            <span className="doll-head" />
            <span className="doll-body" style={{ background: outfit.color }} />
            <span className="doll-arm arm-left" />
            <span className="doll-arm arm-right" />
            <span className="doll-shoe shoe-left" style={{ background: shoe.color }} />
            <span className="doll-shoe shoe-right" style={{ background: shoe.color }} />
          </div>

          <LookPicker
            options={hairs}
            selected={state.hairId}
            title="Hair"
            onPick={(id) => dispatch({ type: "setHair", id })}
          />
          <LookPicker
            options={outfits}
            selected={state.outfitId}
            title="Outfit"
            onPick={(id) => dispatch({ type: "setOutfit", id })}
          />
          <LookPicker
            options={shoes}
            selected={state.shoeId}
            title="Shoes"
            onPick={(id) => dispatch({ type: "setShoes", id })}
            locked
          />

          <div className={`name-field ${showError && error ? "has-error" : ""}`}>
            <label htmlFor="nickname">What should we call you?</label>
            <input
              id="nickname"
              maxLength={16}
              onBlur={() => setShowError(true)}
              onChange={(event) => {
                dispatch({ type: "setAvatarName", name: event.target.value })
                setShowError(true)
              }}
              placeholder="Kofi"
              value={state.avatarName}
            />
            {showError && error ? (
              <p className="field-error">{error}</p>
            ) : (
              <p className="field-help">
                Use a nickname, not your full name or phone number.
              </p>
            )}
          </div>

          <section className="look-block">
            <h2>Play for your group</h2>
            <div className="group-list">
              {groups.map((group) => (
                <button
                  className={`group-card ${
                    state.groupId === group.id ? "is-selected" : ""
                  }`}
                  key={group.id}
                  onClick={() => dispatch({ type: "setGroup", id: group.id })}
                  type="button"
                >
                  <strong>{group.name}</strong>
                  <span>
                    {group.kind} · {group.members} members
                  </span>
                  <small>{group.rivalry}</small>
                </button>
              ))}
            </div>
            <button
              className="code-link"
              onClick={() => setCodeOpen((open) => !open)}
              type="button"
            >
              Join with group code
            </button>
            {codeOpen && (
              <form
                className={`group-code ${codeError ? "has-error" : ""}`}
                onSubmit={(event) => {
                  event.preventDefault()
                  chooseCode()
                }}
              >
                <label htmlFor="group-code">Enter the group code</label>
                <div className={`code-field ${codeError ? "has-error" : ""}`}>
                  <input
                    id="group-code"
                    maxLength={8}
                    onChange={(event) => {
                      setCode(event.target.value.toUpperCase())
                      setCodeError(false)
                    }}
                    placeholder="E.G. BLOCKA"
                    value={code}
                  />
                </div>
                {codeError && (
                  <p className="field-error">
                    That code doesn&apos;t match a group yet.
                  </p>
                )}
                <Button className="button-primary" type="submit">
                  FIND GROUP
                </Button>
              </form>
            )}
          </section>

          <div className="privacy-note">
            <Icon name="shield" size={17} />
            <span>Safe play · No exact location shared</span>
          </div>
        </div>
        <footer className="sticky-action">
          <Button
            className={`button-primary ${ready ? "" : "button-disabled"}`}
            icon="arrow"
            onClick={() => {
              setShowError(true)
              if (!ready) return
              dispatch({ type: "completeProfile" })
              go("setup")
            }}
          >
            LET&apos;S GO
          </Button>
        </footer>
      </div>
    </AppFrame>
  )
}
