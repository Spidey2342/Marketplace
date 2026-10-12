/** Default off: town uses primitive block avatars. Add ?characters=rigged to test GLB rigs. */
export const USE_RIGGED_CHARACTERS = false

export function useRiggedCharacters(): boolean {
  if (USE_RIGGED_CHARACTERS) return true
  try {
    return new URLSearchParams(window.location.search).get("characters") === "rigged"
  } catch {
    return false
  }
}
