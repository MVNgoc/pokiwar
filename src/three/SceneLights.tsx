import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

/** Môi trường phản chiếu dựng sẵn trong code (không tải file): cho mắt, ngọc và kim loại có độ bóng. */
export function Env({ intensity = 0.7 }: { intensity?: number }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = env
    scene.environmentIntensity = intensity
    return () => {
      scene.environment = null
      env.dispose()
      pmrem.dispose()
    }
  }, [gl, scene, intensity])
  return null
}

/** Bộ đèn cho nhân vật: nền sáng đều, đèn chính ấm, đèn viền lạnh phía sau để tách khỏi nền. */
export function CharacterLights() {
  return (
    <>
      <Env />
      <hemisphereLight args={['#dfeaff', '#7a5a3a', 1.1]} />
      <directionalLight position={[3, 6, 6]} intensity={2.2} color="#fff3e0" />
      <directionalLight position={[-5, 3, -4]} intensity={2.4} color="#8fb8ff" />
      <directionalLight position={[4, 1.5, -3]} intensity={1.2} color="#ffb4d0" />
    </>
  )
}

/** Bục đứng: mảng đất oval dẹt (như bục đấu trong game Pokémon) với vòng sáng theo hệ của nhân vật. */
export function Platform({ position, color }: { position: [number, number, number]; color: string; ground?: string }) {
  return (
    <group position={position} scale={[1, 1, 0.55]}>
      <mesh position={[0, -0.03, 0]}>
        <cylinderGeometry args={[1.25, 1.3, 0.06, 48]} />
        <meshStandardMaterial color="#5c6b3e" roughness={1} transparent opacity={0.82} />
      </mesh>
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.22, 48]} />
        <meshBasicMaterial color="#8fb25a" transparent opacity={0.55} />
      </mesh>
      <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.05, 1.15, 56]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>
    </group>
  )
}
