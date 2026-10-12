import { useEffect, useState } from "react"
import AppFrame from "@/components/scene/AppFrame"
import LookPicker from "@/components/ui/LookPicker"
import Button from "@/components/ui/Button"
import Icon from "@/components/ui/Icon"
import {
  bodyTypes,
  hairs,
  lookById,
  outfits,
  shoes,
  skinTones,
} from "@/data/avatar"
import AvatarShowcase from "@/scene3d/characters/AvatarShowcase"
import SaveProgressPanel from "@/components/ui/SaveProgressPanel"
import { useRiggedCharacters } from "@/scene3d/characters/flags"
import { groupByCode, groups } from "@/data/groups"
import {
  formatHandle,
  localSetNickname,
  renameAllowed,
  renameWaitLabel,
} from "@/lib/handle"
import type { Go } from "@/lib/screen"
import {
  commitNickname,
  fetchGroups,
  isRemote,
  publishProfile,
  updateAvatarLook,
  type PublicGroup,
} from "@/lib/sync"
import { useGame } from "@/state/GameProvider"

const kindLabel: Record<string, string> = {
  hostel: "Hostel block",
  class: "Class year",
  neighborhood: "Neighborhood",
  team: "Team",
}

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
  const [joinError, setJoinError] = useState("")
  const [busy, setBusy] = useState(false)
  const [savedHandle, setSavedHandle] = useState<string | null>(null)
  const [remoteGroups, setRemoteGroups] = useState<PublicGroup[] | null>(null)
  const remote = isRemote()
  const riggedPreview = useRiggedCharacters()
  const editing = state.profileComplete
  const hair = lookById(hairs, state.hairId)
  const outfit = lookById(outfits, state.outfitId)
  const shoe = lookById(shoes, state.shoeId)
  const canRename = renameAllowed(state.nicknameChangedAt)
  const renameHint = renameWaitLabel(state.nicknameChangedAt)
  const handle = formatHandle(state.avatarName, state.avatarTag)

  useEffect(() => {
    if (!remote) return
    void fetchGroups().then((rows) => {
      if (rows) setRemoteGroups(rows)
    })
  }, [remote])

  const characterLook = {
    hairId: state.hairId,
    outfitId: state.outfitId,
    shoeId: state.shoeId,
    skinToneId: state.skinToneId,
    bodyTypeId: state.bodyTypeId,
  }
  const error = nicknameError(state.avatarName)
  const nameReady = state.avatarName.trim().length >= 2 && !error
  const ready = editing ? nameReady : nameReady && Boolean(state.groupId)

  function chooseCode() {
    const typed = code.trim().toUpperCase()
    const match = groupByCode(typed)
    if (match) {
      dispatch({ type: "setGroup", id: match.id })
    } else if (remote && /^[A-Z0-9]{4,8}$/.test(typed)) {
      dispatch({ type: "setGroup", id: `code:${typed}` })
    } else {
      setCodeError(true)
      return
    }
    setCodeOpen(false)
    setCodeError(false)
  }

  async function finish() {
    setShowError(true)
    setJoinError("")
    if (!nameReady || busy) return
    if (editing && !canRename) return
    if (!editing && !state.groupId) return

    setBusy(true)
    try {
      if (remote) {
        if (editing) {
          const named = await commitNickname(state.avatarName.trim())
          dispatch({ type: "applyNickname", ...named })
          await updateAvatarLook({
            hairId: state.hairId,
            outfitId: state.outfitId,
            shoeId: state.shoeId,
            skinToneId: state.skinToneId,
            bodyTypeId: state.bodyTypeId,
            stage: state.stageId,
          })
          setSavedHandle(formatHandle(named.nickname, named.tag))
          go("back")
          return
        }
        const joined = await publishProfile({
          nickname: state.avatarName.trim(),
          hairId: state.hairId,
          outfitId: state.outfitId,
          shoeId: state.shoeId,
          skinToneId: state.skinToneId,
          bodyTypeId: state.bodyTypeId,
          stage: state.stageId,
          groupId: state.groupId,
        })
        if (joined) dispatch({ type: "setGroup", id: joined.id })
        dispatch({
          type: "applyNickname",
          nickname: joined?.nickname ?? state.avatarName.trim(),
          tag: joined?.tag ?? state.avatarTag ?? 1000,
          nicknameChangedAt: null,
        })
        dispatch({ type: "completeProfile" })
        setSavedHandle(formatHandle(joined?.nickname ?? state.avatarName, joined?.tag ?? null))
        go("continue")
        return
      }

      const local = localSetNickname(
        state.avatarName,
        state.avatarTag,
        state.nicknameChangedAt,
        state.avatarName.trim(),
        state.profileComplete,
      )
      if ("error" in local) {
        setJoinError(local.error)
        return
      }
      dispatch({ type: "applyNickname", ...local })
      if (!editing) dispatch({ type: "completeProfile" })
      setSavedHandle(formatHandle(local.nickname, local.tag))
      go(editing ? "back" : "continue")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save your profile."
      setJoinError(message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppFrame className="avatar-screen">
      <div className="screen-layer">
        <header className="top-bar">
          <button
            aria-label="Go back"
            className="icon-button"
            onClick={() => go("back")}
            type="button"
          >
            <Icon name="chevron" />
          </button>
          <strong>{editing ? "YOUR PROFILE" : "YOUR HUSTLE"}</strong>
          <span />
        </header>
        <div className="content-scroll avatar-content">
          {editing && (
            <section className="profile-card">
              <h2>Profile card</h2>
              <p className="profile-handle">{handle || "Pick a nickname"}</p>
              <p className="field-help">This is how others see you on stalls and rankings.</p>
            </section>
          )}

          {riggedPreview ? (
            <AvatarShowcase look={characterLook} />
          ) : (
            <div className="avatar-doll" aria-hidden="true">
              <span className={`doll-hair hair-${hair.id}`} style={{ background: hair.color }} />
              <span className="doll-head" />
              <span className="doll-body" style={{ background: outfit.color }} />
              <span className="doll-arm arm-left" />
              <span className="doll-arm arm-right" />
              <span className="doll-shoe shoe-left" style={{ background: shoe.color }} />
              <span className="doll-shoe shoe-right" style={{ background: shoe.color }} />
            </div>
          )}

          <LookPicker
            options={bodyTypes}
            selected={state.bodyTypeId}
            title="Build"
            onPick={(id) => dispatch({ type: "setBodyType", id })}
          />
          <LookPicker
            options={skinTones}
            selected={state.skinToneId}
            title="Skin tone"
            onPick={(id) => dispatch({ type: "setSkinTone", id })}
          />
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
            <label htmlFor="nickname">{editing ? "Rename" : "What should we call you?"}</label>
            <input
              disabled={editing && !canRename}
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
            ) : editing && renameHint ? (
              <p className="field-help">{renameHint}</p>
            ) : (
              <p className="field-help">
                Others can have the same name. You&apos;ll get a number tag, like Ama#4821.
              </p>
            )}
            {savedHandle && <p className="field-help">Saved as {savedHandle}</p>}
          </div>

          {!editing && (
            <section className="look-block">
              <h2>Play for your group</h2>
              <div className="group-list">
                {remote && remoteGroups
                  ? remoteGroups.map((group) => (
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
                          {kindLabel[group.kind] ?? group.kind} · {group.member_count} members
                        </span>
                      </button>
                    ))
                  : groups.map((group) => (
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
          )}

          {remote && <SaveProgressPanel mode="save" />}

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
              void finish()
            }}
          >
            {busy ? "SAVING..." : editing ? "SAVE PROFILE" : "LET'S GO"}
          </Button>
          {joinError && <p className="field-error">{joinError}</p>}
        </footer>
      </div>
    </AppFrame>
  )
}
