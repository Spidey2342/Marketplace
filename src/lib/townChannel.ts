import type { SupabaseClient } from "@supabase/supabase-js"
import { groupById, groups } from "@/data/groups"
import { isUuid } from "@/lib/sync"

/** Same channel for local preset ids, join codes, and server group UUIDs that match a seeded group. */
export async function resolveTownChannelBase(
  supabase: SupabaseClient | null,
  friendsRoom: string | null,
  groupId: string | null,
): Promise<string> {
  if (friendsRoom) return `friends-${friendsRoom.toLowerCase()}`
  if (!groupId) return "town-solo"
  if (groupId.startsWith("code:")) {
    return `town-code-${groupId.slice(5).toUpperCase()}`
  }
  const local = groupById(groupId)
  if (local) return `town-code-${local.code}`
  if (isUuid(groupId) && supabase) {
    const { data } = await supabase
      .from("groups_public")
      .select("name")
      .eq("id", groupId)
      .maybeSingle()
    const name = data?.name ? String(data.name) : ""
    const preset = groups.find((group) => group.name === name)
    if (preset) return `town-code-${preset.code}`
  }
  return `town-${groupId}`
}
