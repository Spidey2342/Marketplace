import { outfits, shoes, type LookOption } from "@/data/avatar"
import type { CharacterLook } from "@/scene3d/characters/constants"
import type { RemotePlayer } from "@/scene3d/townLive"

function idByColor(options: LookOption[], color: string, fallback: string): string {
  const match = options.find((item) => item.color.toLowerCase() === color.toLowerCase())
  return match?.id ?? fallback
}

export function lookFromRemote(player: RemotePlayer): CharacterLook {
  return {
    hairId: player.hairId,
    outfitId: idByColor(outfits, player.outfit, "kente"),
    shoeId: idByColor(shoes, player.shoes, "sandals"),
    skinToneId: "caramel",
    bodyTypeId: "medium",
  }
}
