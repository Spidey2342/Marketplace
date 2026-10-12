import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import type { User } from "@supabase/supabase-js"
import { isOffline } from "@/lib/account"
import { isRemote, setSessionUserId, supabase } from "@/lib/supabase"

type AuthContextValue = {
  user: User | null
  ready: boolean
  online: boolean
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  ready: !isRemote(),
  online: true,
  refresh: async () => undefined,
})

export function useAuth() {
  return useContext(AuthContext)
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(!isRemote())
  const [online, setOnline] = useState(() => !isOffline())

  async function refresh() {
    if (!supabase) {
      setUser(null)
      setReady(true)
      return
    }
    const { data } = await supabase.auth.getSession()
    const next = data.session?.user ?? null
    setSessionUserId(next?.id ?? null)
    setUser(next)
    setReady(true)
  }

  useEffect(() => {
    if (!isRemote() || !supabase) return
    void refresh()
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const next = session?.user ?? null
      setSessionUserId(next?.id ?? null)
      setUser(next)
      setReady(true)
    })
    return () => {
      sub.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    function onLine() {
      setOnline(true)
    }
    function onOff() {
      setOnline(false)
    }
    window.addEventListener("online", onLine)
    window.addEventListener("offline", onOff)
    return () => {
      window.removeEventListener("online", onLine)
      window.removeEventListener("offline", onOff)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, ready, online, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}
