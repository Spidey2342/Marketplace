import { Canvas } from "@react-three/fiber"
import { memo } from "react"
import * as THREE from "three"
import { playerSpawn } from "@/data/townLayout"
import BlobShadows from "@/scene3d/BlobShadows"
import Customers from "@/scene3d/Customers"
import Dressing from "@/scene3d/Dressing"
import Dust from "@/scene3d/Dust"
import Ground from "@/scene3d/Ground"
import Player from "@/scene3d/Player"
import PriceBoards from "@/scene3d/PriceBoards"
import RemotePlayers from "@/scene3d/RemotePlayers"
import Quality from "@/scene3d/Quality"
import SceneBoundary from "@/scene3d/SceneBoundary"
import ShopSigns from "@/scene3d/ShopSigns"
import Shops from "@/scene3d/Shops"
import StallGoods from "@/scene3d/StallGoods"
import Stalls from "@/scene3d/Stalls"
import SyncView from "@/scene3d/SyncView"
import TownStats from "@/scene3d/TownStats"
import { isDev } from "@/scene3d/tier"
import { tokens } from "@/scene3d/tokens"
import Sellers from "@/scene3d/Sellers"
import VisitChips from "@/scene3d/VisitChips"
import Weather from "@/scene3d/Weather"
import type { EventId } from "@/data/events"
import { useRiggedCharacters } from "@/scene3d/characters/flags"
import { preloadBodyModels } from "@/scene3d/characters/characterLoader"

if (useRiggedCharacters()) {
  preloadBodyModels()
}

const start = playerSpawn()

const skyVert = `
  varying float vHeight;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vHeight = normalize(world.xyz).y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const skyFrag = `
  varying float vHeight;
  uniform vec3 topColor;
  uniform vec3 midColor;
  uniform vec3 horizonColor;
  void main() {
    float h = clamp(vHeight * 0.5 + 0.5, 0.0, 1.0);
    vec3 color = mix(horizonColor, midColor, smoothstep(0.12, 0.5, h));
    color = mix(color, topColor, smoothstep(0.42, 0.92, h));
    gl_FragColor = vec4(color, 1.0);
  }
`

function TownCanvas({
  event,
  onFail,
}: {
  event: EventId
  onFail: () => void
}) {
  if (import.meta.env.DEV) {
    const host = window as Window & { __sceneRenders?: number }
    host.__sceneRenders = (host.__sceneRenders ?? 0) + 1
  }

  return (
    <SceneBoundary onFail={onFail}>
      <Canvas
        className="town-canvas"
        dpr={[1, 1.5]}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          overflow: "hidden",
          zIndex: -2,
          pointerEvents: "none",
        }}
        camera={{
          fov: 52,
          near: 0.1,
          far: 90,
          position: [start.x, 9.55, start.z + 8.08],
        }}
        gl={{ antialias: true, alpha: false, powerPreference: "default" }}
        onCreated={({ gl, camera }) => {
          gl.toneMapping = THREE.NoToneMapping
          gl.outputColorSpace = THREE.SRGBColorSpace
          gl.shadowMap.enabled = false
          camera.lookAt(start.x, 0.75, start.z - 0.72)
        }}
      >
        <Quality>
          <color attach="background" args={[tokens.sky]} />
          <Weather event={event} />
          <mesh scale={60} frustumCulled={false}>
            <sphereGeometry args={[1, 12, 8]} />
            <shaderMaterial
              side={THREE.BackSide}
              depthWrite={false}
              fog={false}
              uniforms={{
                topColor: { value: new THREE.Color(tokens.skyTop) },
                midColor: { value: new THREE.Color(tokens.skyMid) },
                horizonColor: { value: new THREE.Color(tokens.sky) },
              }}
              vertexShader={skyVert}
              fragmentShader={skyFrag}
            />
          </mesh>
          <Ground />
          <BlobShadows />
          <Shops />
          <ShopSigns />
          <Stalls />
          <Dressing />
          <StallGoods />
          <Sellers />
          <PriceBoards />
          <Customers />
          <Dust />
          <Player />
          <RemotePlayers />
          <VisitChips />
          <SyncView />
          {isDev() && <TownStats />}
        </Quality>
      </Canvas>
    </SceneBoundary>
  )
}

export default memo(TownCanvas)
