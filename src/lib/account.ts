import type { User } from "@supabase/supabase-js"
import { STARTING_COINS } from "@/lib/economy"
import { isRemote, supabase } from "@/lib/supabase"
import type { GameState } from "@/state/GameProvider"

export type AccountSaveKind = "guest" | "google" | "email"

export type AccountSaveStatus = {
  kind: AccountSaveKind
  label: string
}

const BANNER_DISMISS_KEY = "market-street-save-banner"
const BANNER_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000

export function authRedirectUrl(): string {
  try {
    const url = new URL(window.location.href)
    url.hash = ""
    url.searchParams.delete("code")
    return url.toString()
  } catch {
    return window.location.origin
  }
}

export function accountSaveStatus(user: User | null): AccountSaveStatus {
  if (!user || user.is_anonymous) {
    return { kind: "guest", label: "Not saved: your progress lives on this device only" }
  }
  const providers = new Set(user.identities?.map((row) => row.provider) ?? [])
  if (providers.has("google")) {
    return { kind: "google", label: "Saved with Google" }
  }
  if (providers.has("email")) {
    return { kind: "email", label: "Saved with email" }
  }
  return { kind: "guest", label: "Not saved: your progress lives on this device only" }
}

export function requireSavedAccount(user: User | null): boolean {
  if (!isRemote() || !user) return false
  return !user.is_anonymous
}

export function deviceHasProgress(state: GameState): boolean {
  return (
    state.profileComplete ||
    state.roundsPlayed > 0 ||
    state.hasStocked ||
    state.coins > STARTING_COINS
  )
}

export function shouldShowSaveBanner(state: GameState, user: User | null): boolean {
  if (!isRemote() || requireSavedAccount(user)) return false
  if (state.roundsPlayed < 1) return false
  return !saveBannerDismissedRecently()
}

export function dismissSaveBanner() {
  localStorage.setItem(BANNER_DISMISS_KEY, String(Date.now()))
}

function saveBannerDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(BANNER_DISMISS_KEY)
    if (!raw) return false
    const at = Number(raw)
    if (!Number.isFinite(at)) return false
    return Date.now() - at < BANNER_COOLDOWN_MS
  } catch {
    return false
  }
}

export function isIdentityAlreadyExists(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "")
  const lower = message.toLowerCase()
  return lower.includes("identity_already_exists") || lower.includes("already linked")
}

export function isOffline(): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true
  return false
}

export async function getSessionUser(): Promise<User | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session?.user ?? null
}

export async function linkGoogleAccount(): Promise<{ error: string | null; identityExists: boolean }> {
  if (!supabase) return { error: "Offline", identityExists: false }
  const { error } = await supabase.auth.linkIdentity({
    provider: "google",
    options: { redirectTo: authRedirectUrl() },
  })
  if (!error) return { error: null, identityExists: false }
  if (isIdentityAlreadyExists(error)) {
    return { error: error.message, identityExists: true }
  }
  return { error: error.message, identityExists: false }
}

export async function startGoogleSignIn(): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Offline" }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: authRedirectUrl() },
  })
  return { error: error?.message ?? null }
}

export async function sendSaveEmail(email: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Offline" }
  const trimmed = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { error: "Enter a valid email address." }
  }
  const { error } = await supabase.auth.updateUser({ email: trimmed })
  return { error: error?.message ?? null }
}

export async function verifySaveEmail(email: string, token: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Offline" }
  const { error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: token.trim(),
    type: "email_change",
  })
  if (!error) return { error: null }
  const fallback = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: token.trim(),
    type: "email",
  })
  return { error: fallback.error?.message ?? error.message }
}

export async function sendSignInEmail(email: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Offline" }
  const trimmed = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { error: "Enter a valid email address." }
  }
  const { error } = await supabase.auth.signInWithOtp({
    email: trimmed,
    options: { shouldCreateUser: false },
  })
  return { error: error?.message ?? null }
}

export async function verifySignInEmail(
  email: string,
  token: string,
): Promise<{ error: string | null; identityExists: boolean }> {
  if (!supabase) return { error: "Offline", identityExists: false }
  const { error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: token.trim(),
    type: "email",
  })
  if (!error) return { error: null, identityExists: false }
  if (isIdentityAlreadyExists(error)) {
    return { error: error.message, identityExists: true }
  }
  return { error: error.message, identityExists: false }
}

export async function signOutToGuest(): Promise<{ error: string | null; userId: string | null }> {
  if (!supabase) return { error: "Offline", userId: null }
  await supabase.auth.signOut()
  const signed = await supabase.auth.signInAnonymously()
  const userId = signed.data.user?.id ?? null
  return { error: signed.error?.message ?? null, userId }
}
