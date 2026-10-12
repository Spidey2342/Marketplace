import { Suspense, useRef, type RefObject } from "react"
import type { Group } from "three"
import CharacterRig, { type CharacterHandle } from "@/scene3d/characters/CharacterRig"
import type { CharacterLod, CharacterLook } from "@/scene3d/characters/constants"
import { useRiggedCharacters } from "@/scene3d/characters/flags"
import PrimitiveAvatar from "@/scene3d/characters/PrimitiveAvatar"

export type { CharacterHandle }

type Props = {
  look: CharacterLook
  lod: CharacterLod
  rigRef?: RefObject<CharacterHandle | null>
  primitiveRef?: RefObject<Group | null>
  showcaseSpin?: boolean
}

export default function CharacterAvatar({ look, lod, rigRef, primitiveRef, showcaseSpin }: Props) {
  const localRig = useRef<CharacterHandle | null>(null)
  const handle = rigRef ?? localRig

  if (!useRiggedCharacters()) {
    return <PrimitiveAvatar ref={primitiveRef} />
  }

  return (
    <Suspense fallback={<PrimitiveAvatar ref={primitiveRef} />}>
      <CharacterRig look={look} lod={lod} ref={handle} showcaseSpin={showcaseSpin} />
    </Suspense>
  )
}
