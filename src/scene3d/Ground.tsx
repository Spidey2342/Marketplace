import { street } from "@/data/townLayout"
import { tokens } from "@/scene3d/tokens"

export default function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow={false}>
        <planeGeometry args={[street.width + 24, street.length + 28]} />
        <meshLambertMaterial color={tokens.sand} />
      </mesh>
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[street.roadWidth, 0.08, street.length]} />
        <meshLambertMaterial color={tokens.road} flatShading />
      </mesh>
    </group>
  )
}
