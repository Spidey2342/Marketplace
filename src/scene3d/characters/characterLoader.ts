import { useGLTF } from "@react-three/drei"
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js"
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js"
import { bodyTypes } from "@/data/avatar"

const DRACO_URL = "https://www.gstatic.com/draco/versioned/decoders/1.5.7/"

let dracoLoader: DRACOLoader | null = null

function extendLoader(loader: {
  setDRACOLoader: (decoder: DRACOLoader) => unknown
  setMeshoptDecoder: (decoder: typeof MeshoptDecoder) => unknown
}) {
  if (!dracoLoader) {
    dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath(DRACO_URL)
  }
  loader.setDRACOLoader(dracoLoader)
  loader.setMeshoptDecoder(MeshoptDecoder)
}

const withCompression = extendLoader as NonNullable<Parameters<typeof useGLTF>[3]>

export function bodyModelUrl(bodyTypeId: string): string {
  const known = bodyTypes.some((item) => item.id === bodyTypeId)
  const id = known ? bodyTypeId : "medium"
  return `/models/characters/base_${id}.glb`
}

export function useBodyGLTF(bodyTypeId: string) {
  return useGLTF(bodyModelUrl(bodyTypeId), true, true, withCompression)
}

export function preloadBodyModels() {
  for (const body of bodyTypes) {
    useGLTF.preload(bodyModelUrl(body.id), true, true, withCompression)
  }
}
