import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null

export function isRemote(): boolean {
  return supabase !== null
}

export let sessionUserId: string | null = null

export function setSessionUserId(id: string | null) {
  sessionUserId = id
}
