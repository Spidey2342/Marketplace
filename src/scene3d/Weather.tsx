import { useMemo, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import type { EventId } from "@/data/events"
import { atmosphereOn } from "@/scene3d/tier"
import { tokens } from "@/scene3d/tokens"

const STREAKS = 12
const dummy = new THREE.Object3D()
const drops = Array.from({ length: STREAKS }, (_, index) => ({
  x: (index % 4) * 3.2 - 4.8,
  z: Math.floor(index / 4) * 4.5 - 6,
  y: 3 + (index % 5) * 1.4,
  speed: 5.5 + (index % 3),
}))

export default function Weather({ event }: { event: EventId }) {
  const fog = useRef<THREE.Fog>(null)
  const sun = useRef<THREE.DirectionalLight>(null)
  const sky = useRef<THREE.HemisphereLight>(null)
  const streaks = useRef<THREE.InstancedMesh>(null)
  const skyMat = useRef<THREE.ShaderMaterial>(null)
  const scene = useThree((state) => state.scene)
  const normalSun = useMemo(() => new THREE.Color(tokens.sun), [])
  const warmSun = useMemo(() => new THREE.Color("#ffb15a"), [])
  const coolSun = useMemo(() => new THREE.Color("#ffe3b0"), [])
  const normalSky = useMemo(() => new THREE.Color(tokens.sky), [])
  const hotSky = useMemo(() => new THREE.Color("#f0a05a"), [])
  const rainSky = useMemo(() => new THREE.Color("#f0c48a"), [])
  const normalGround = useMemo(() => new THREE.Color(tokens.groundShade), [])
  const coolGround = useMemo(() => new THREE.Color("#c49260"), [])
  const normalTop = useMemo(() => new THREE.Color(tokens.skyTop), [])
  const normalMid = useMemo(() => new THREE.Color(tokens.skyMid), [])
  const hotTop = useMemo(() => new THREE.Color("#ffb07a"), [])
  const rainTop = useMemo(() => new THREE.Color("#e7a56a"), [])
  const rainMid = useMemo(() => new THREE.Color("#d4894e"), [])

  useFrame((_, delta) => {
    const rain = event === "rain"
    const hot = event === "hot"
    if (sun.current) sun.current.color.copy(rain ? coolSun : hot ? warmSun : normalSun)
    if (sky.current) {
      sky.current.color.copy(rain ? coolSun : hot ? warmSun : normalSun)
      sky.current.groundColor.copy(rain ? coolGround : normalGround)
    }
    if (fog.current) fog.current.color.copy(rain ? rainSky : hot ? hotSky : normalSky)
    if (!skyMat.current) {
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh
        const material = mesh.material as THREE.ShaderMaterial | undefined
        if (material?.uniforms?.horizonColor) skyMat.current = material
      })
    }
    const uniforms = skyMat.current?.uniforms
    if (uniforms) {
      uniforms.topColor?.value.copy(rain ? rainTop : hot ? hotTop : normalTop)
      uniforms.midColor?.value.copy(rain ? rainMid : hot ? hotTop : normalMid)
      uniforms.horizonColor?.value.copy(rain ? rainSky : hot ? hotSky : normalSky)
    }
    const mesh = streaks.current
    if (!mesh) return
    const show = rain && atmosphereOn()
    for (let index = 0; index < STREAKS; index += 1) {
      const drop = drops[index]
      if (!drop) continue
      if (show) {
        drop.y -= drop.speed * delta
        if (drop.y < 0.2) drop.y = 8
      }
      dummy.position.set(drop.x, show ? drop.y : -20, drop.z)
      dummy.scale.set(show ? 1 : 0, show ? 1 : 0, show ? 1 : 0)
      dummy.rotation.set(0, 0, 0.15)
      dummy.updateMatrix()
      mesh.setMatrixAt(index, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <fog ref={fog} attach="fog" args={[tokens.sky, 18, 52]} />
      <hemisphereLight ref={sky} args={[tokens.sun, tokens.groundShade, 0.55]} />
      <directionalLight ref={sun} color={tokens.sun} intensity={1.55} position={[14, 8, 6]} />
      <instancedMesh ref={streaks} args={[undefined, undefined, STREAKS]} frustumCulled={false}>
        <boxGeometry args={[0.12, 1.15, 0.12]} />
        <meshBasicMaterial color="#d7e6f4" transparent opacity={0.75} />
      </instancedMesh>
    </group>
  )
}
