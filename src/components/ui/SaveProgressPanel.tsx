import { useState } from "react"
import Button from "@/components/ui/Button"
import Icon from "@/components/ui/Icon"
import AccountConflictSheet from "@/components/ui/AccountConflictSheet"
import {
  accountSaveStatus,
  deviceHasProgress,
  linkGoogleAccount,
  requireSavedAccount,
  sendSaveEmail,
  sendSignInEmail,
  signOutToGuest,
  startGoogleSignIn,
  verifySaveEmail,
  verifySignInEmail,
} from "@/lib/account"
import { isRemote, setSessionUserId } from "@/lib/supabase"
import { useAuth } from "@/state/AuthProvider"
import { useGame } from "@/state/GameProvider"

type Mode = "save" | "signin"

export default function SaveProgressPanel({
  mode,
  onClose,
}: {
  mode: Mode
  onClose?: () => void
}) {
  const { user, online, refresh } = useAuth()
  const { state, dispatch } = useGame()
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [emailStep, setEmailStep] = useState<"idle" | "sent">("idle")
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState("")
  const [conflict, setConflict] = useState(false)
  const [pending, setPending] = useState<(() => void) | null>(null)

  if (!isRemote()) return null

  const saved = requireSavedAccount(user)
  const status = accountSaveStatus(user)
  const offline = !online
  const title = mode === "save" ? "Save your progress" : "Sign in to your account"

  function needsConflict(): boolean {
    return mode === "signin" && Boolean(user?.is_anonymous && deviceHasProgress(state))
  }

  function runProtected(action: () => void) {
    if (needsConflict()) {
      setPending(() => action)
      setConflict(true)
      return
    }
    action()
  }

  async function google() {
    if (offline || busy) return
    setNotice("")
    const launch = async () => {
      setBusy(true)
      try {
        if (mode === "save") {
          const result = await linkGoogleAccount()
          if (result.identityExists) {
            setPending(() => () => {
              runProtected(() => {
                void startGoogleSignIn()
              })
            })
            setConflict(true)
            setNotice("That Google account already has a player. Sign in to it instead?")
            return
          }
          if (result.error) setNotice(result.error)
        } else {
          const result = await startGoogleSignIn()
          if (result.error) setNotice(result.error)
        }
      } finally {
        setBusy(false)
      }
    }
    if (needsConflict()) {
      setPending(() => () => {
        void launch()
      })
      setConflict(true)
      return
    }
    await launch()
  }

  async function sendEmail() {
    if (offline || busy) return
    setNotice("")
    setBusy(true)
    try {
      const result =
        mode === "save" ? await sendSaveEmail(email) : await sendSignInEmail(email)
      if (result.error) {
        setNotice(result.error)
        return
      }
      setEmailStep("sent")
    } finally {
      setBusy(false)
    }
  }

  async function verifyEmail() {
    if (offline || busy) return
    setNotice("")
    const finish = async () => {
      setBusy(true)
      try {
        if (mode === "save") {
          const result = await verifySaveEmail(email, code)
          if (result.error) {
            setNotice(result.error)
            return
          }
          await refresh()
          setNotice("Chale, you are saved. Same player on any device.")
          setEmailStep("idle")
          setCode("")
        } else {
          const result = await verifySignInEmail(email, code)
          if (result.error) {
            setNotice(result.error)
            return
          }
          await refresh()
          onClose?.()
        }
      } finally {
        setBusy(false)
      }
    }
    if (needsConflict()) {
      setPending(() => () => {
        void finish()
      })
      setConflict(true)
      return
    }
    await finish()
  }

  async function signOut() {
    if (offline || busy) return
    if (!saved && deviceHasProgress(state)) {
      const ok = window.confirm(
        "Sign out will erase this guest progress on this device. Continue?",
      )
      if (!ok) return
    }
    setBusy(true)
    try {
      const result = await signOutToGuest()
      if (result.error) {
        setNotice(result.error)
        return
      }
      setSessionUserId(result.userId)
      dispatch({ type: "beginFreshGuest" })
      await refresh()
      onClose?.()
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <section className="save-progress-card">
        <h2>{title}</h2>
        {mode === "save" && !saved && (
          <p className="field-help">
            Link Google or email to keep the same player on any device. Your hidden player ID stays
            the same.
          </p>
        )}
        {mode === "signin" && (
          <p className="field-help">Use the same method you picked when you saved.</p>
        )}
        {offline && (
          <p className="field-error">You are offline. Connect to save or sign in.</p>
        )}
        {mode === "save" && (
          <p className="save-status">
            <Icon name="shield" size={17} />
            {status.label}
          </p>
        )}
        {!saved && (
          <>
            <Button
              className={`button-light ${offline ? "button-disabled" : ""}`}
              disabled={offline || busy}
              onClick={() => {
                void google()
              }}
            >
              Continue with Google
            </Button>
            <div className="email-save">
              <label htmlFor={`save-email-${mode}`}>Use email</label>
              <input
                disabled={offline || busy}
                id={`save-email-${mode}`}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                type="email"
                value={email}
              />
              {emailStep === "idle" ? (
                <button
                  className="email-send"
                  disabled={offline || busy || email.trim().length < 5}
                  onClick={() => {
                    void sendEmail()
                  }}
                  type="button"
                >
                  Send code
                </button>
              ) : (
                <>
                  <input
                    disabled={offline || busy}
                    inputMode="numeric"
                    maxLength={8}
                    onChange={(event) => setCode(event.target.value)}
                    placeholder="Code from email"
                    value={code}
                  />
                  <button
                    className="email-send"
                    disabled={offline || busy || code.trim().length < 4}
                    onClick={() => {
                      void verifyEmail()
                    }}
                    type="button"
                  >
                    Confirm
                  </button>
                </>
              )}
            </div>
          </>
        )}
        {(mode === "save" || saved) && (
          <button
            className="sign-out-link"
            disabled={offline || busy}
            onClick={() => {
              void signOut()
            }}
            type="button"
          >
            Sign out
          </button>
        )}
        {notice && <p className="field-help">{notice}</p>}
        {onClose && (
          <button className="visit-x save-close" onClick={onClose} type="button">
            Close
          </button>
        )}
      </section>
      {conflict && (
        <AccountConflictSheet
          onCancel={() => {
            setConflict(false)
            setPending(null)
          }}
          onContinue={() => {
            setConflict(false)
            const next = pending
            setPending(null)
            next?.()
          }}
        />
      )}
    </>
  )
}
