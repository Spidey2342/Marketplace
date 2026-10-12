import { useEffect, useRef } from "react"
import { isRemote } from "@/lib/supabase"
import { flushOutbox, pullRemoteAccount } from "@/lib/sync"
import { useAuth } from "@/state/AuthProvider"
import { useGame } from "@/state/GameProvider"

export default function AuthBridge() {
  const { user } = useAuth()
  const { dispatch } = useGame()
  const lastId = useRef<string | null>(null)

  useEffect(() => {
    if (!isRemote() || !user?.id) return
    if (lastId.current === user.id) return
    lastId.current = user.id
    void flushOutbox().then(() =>
      pullRemoteAccount(user.id).then((bundle) => {
        if (!bundle) return
        dispatch({ type: "applyRemoteAccount", ...bundle })
      }),
    )
  }, [dispatch, user?.id])

  return null
}
