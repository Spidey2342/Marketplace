export function formatHandle(nickname: string, tag: number | null | undefined): string {
  const name = nickname.trim()
  if (!name) return ""
  if (tag == null || !Number.isFinite(tag)) return name
  return `${name}#${tag}`
}

/** Last two digits for 3D tags when nicknames collide in the same room. */
export function shortTagSuffix(tag: number): string {
  const digits = String(Math.trunc(tag))
  return digits.slice(-2).padStart(2, "0")
}

export type NameTagPeer = {
  id: string
  nickname: string
  tag: number
}

/** Label above avatars in the town (nickname, or nickname + short tag when duplicated). */
export function townNameTag(
  self: NameTagPeer,
  peers: NameTagPeer[],
  speech?: string | null,
): string {
  if (speech) return speech
  const key = self.nickname.trim().toLowerCase()
  const dupes = peers.filter((peer) => peer.nickname.trim().toLowerCase() === key)
  if (dupes.length <= 1) return self.nickname.trim()
  const suffix = shortTagSuffix(self.tag)
  const sameSuffix = dupes.filter((peer) => shortTagSuffix(peer.tag) === suffix)
  if (sameSuffix.length > 1) {
    return `${self.nickname.trim()} #${self.tag}`
  }
  return `${self.nickname.trim()} #${suffix}`
}

export function randomTag(): number {
  return 1000 + Math.floor(Math.random() * 9000)
}

const RENAME_MS = 7 * 24 * 60 * 60 * 1000

export function renameAllowed(changedAt: number | null, now = Date.now()): boolean {
  if (changedAt == null) return true
  return now - changedAt >= RENAME_MS
}

export function renameWaitLabel(changedAt: number | null, now = Date.now()): string | null {
  if (changedAt == null) return null
  const left = RENAME_MS - (now - changedAt)
  if (left <= 0) return null
  const days = Math.ceil(left / (24 * 60 * 60 * 1000))
  return days <= 1 ? "You can rename again tomorrow." : `You can rename again in ${days} days.`
}

export function nicknameErrorMessage(code: string): string | null {
  switch (code) {
    case "name_not_allowed":
      return "That name is not allowed. Try another nickname."
    case "nickname_cooldown":
      return "You can only change your name once every 7 days."
    case "invalid_name":
      return "Make it 2 to 16 characters."
    case "tag_exhausted":
      return "Could not assign a tag. Try again in a bit."
    default:
      return null
  }
}

const LOCAL_BLOCKED = ["placeholder1", "placeholder2", "placeholder3"]

export function localSetNickname(
  currentName: string,
  currentTag: number | null,
  changedAt: number | null,
  nextName: string,
  profileComplete: boolean,
): { nickname: string; tag: number; nicknameChangedAt: number | null } | { error: string } {
  const trimmed = nextName.trim()
  if (trimmed.length < 2 || trimmed.length > 16) {
    return { error: nicknameErrorMessage("invalid_name") ?? "Invalid name" }
  }
  const lower = trimmed.toLowerCase()
  if (LOCAL_BLOCKED.some((word) => lower.includes(word))) {
    return { error: nicknameErrorMessage("name_not_allowed") ?? "Not allowed" }
  }
  if (
    profileComplete &&
    currentTag != null &&
    currentName.trim().toLowerCase() !== lower &&
    !renameAllowed(changedAt)
  ) {
    return { error: nicknameErrorMessage("nickname_cooldown") ?? "Cooldown" }
  }
  if (currentName.trim().toLowerCase() === lower && currentTag != null) {
    return { nickname: trimmed, tag: currentTag, nicknameChangedAt: changedAt }
  }
  const tag = randomTag()
  const nicknameChangedAt =
    profileComplete && currentTag != null ? Date.now() : changedAt
  return { nickname: trimmed, tag, nicknameChangedAt }
}

export function parseRpcError(message: string): string {
  const lower = message.toLowerCase()
  for (const code of [
    "name_not_allowed",
    "nickname_cooldown",
    "invalid_name",
    "tag_exhausted",
  ]) {
    if (lower.includes(code)) {
      return nicknameErrorMessage(code) ?? message
    }
  }
  return message
}
