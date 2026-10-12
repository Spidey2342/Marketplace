import { useRiggedCharacters } from "@/scene3d/characters/flags"
import RemotePlayersPrimitive from "@/scene3d/RemotePlayersPrimitive"
import RemotePlayersRigged from "@/scene3d/RemotePlayersRigged"

export default function RemotePlayers() {
  return useRiggedCharacters() ? <RemotePlayersRigged /> : <RemotePlayersPrimitive />
}
