import { tokens } from "@/scene3d/tokens"
import { worldView } from "@/scene3d/worldView"

export default function PlayerAvatar() {
  return (
    <group>
      <mesh name="body" position={[0, 0.86, 0]}>
        <boxGeometry args={[0.48, 0.56, 0.3]} />
        <meshLambertMaterial color={worldView.outfit} flatShading />
      </mesh>
      <group name="arm-l" position={[-0.32, 1.05, 0]}>
        <mesh name="arm-l-mesh" position={[0, -0.18, 0]}>
          <boxGeometry args={[0.12, 0.36, 0.12]} />
          <meshLambertMaterial color={worldView.outfit} flatShading />
        </mesh>
      </group>
      <group name="arm-r" position={[0.32, 1.05, 0]}>
        <mesh name="arm-r-mesh" position={[0, -0.18, 0]}>
          <boxGeometry args={[0.12, 0.36, 0.12]} />
          <meshLambertMaterial color={worldView.outfit} flatShading />
        </mesh>
      </group>
      <mesh name="head" position={[0, 1.32, 0]}>
        <sphereGeometry args={[0.2, 7, 5]} />
        <meshLambertMaterial color={tokens.cream} flatShading />
      </mesh>
      <mesh name="hair-short" position={[0, 1.48, 0]}>
        <sphereGeometry args={[0.16, 6, 4]} />
        <meshLambertMaterial color={worldView.hair} flatShading />
      </mesh>
      <mesh name="hair-puff" position={[0, 1.52, 0]} visible={false}>
        <sphereGeometry args={[0.22, 6, 4]} />
        <meshLambertMaterial color={worldView.hair} flatShading />
      </mesh>
      <mesh name="hair-braids" position={[0, 1.28, 0.02]} visible={false}>
        <boxGeometry args={[0.42, 0.34, 0.18]} />
        <meshLambertMaterial color={worldView.hair} flatShading />
      </mesh>
      <mesh name="hair-fade" position={[0, 1.46, 0]} visible={false}>
        <boxGeometry args={[0.36, 0.1, 0.3]} />
        <meshLambertMaterial color={worldView.hair} flatShading />
      </mesh>
      <mesh name="shoe-l" position={[-0.12, 0.08, 0.06]}>
        <boxGeometry args={[0.16, 0.1, 0.26]} />
        <meshLambertMaterial color={worldView.shoes} flatShading />
      </mesh>
      <mesh name="shoe-r" position={[0.12, 0.08, 0.06]}>
        <boxGeometry args={[0.16, 0.1, 0.26]} />
        <meshLambertMaterial color={worldView.shoes} flatShading />
      </mesh>
    </group>
  )
}
