import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/** Đốm sáng nhỏ trôi lên chậm phía sau sàn đấu cho cảnh bớt trống. */
export default function Motes({ count = 40 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null)
  const { geometry, seeds } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const seeds = Array.from({ length: count }, () => ({ x: (Math.random() - 0.5) * 9, z: -1 - Math.random() * 3, speed: 0.1 + Math.random() * 0.25, phase: Math.random() * 6 }))
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return { geometry: g, seeds }
  }, [count])
  useFrame((state) => {
    const attr = geometry.getAttribute('position') as THREE.BufferAttribute
    const t = state.clock.elapsedTime
    seeds.forEach((s, i) => {
      attr.setXYZ(i, s.x + Math.sin(t * 0.5 + s.phase) * 0.3, ((t * s.speed + s.phase) % 4) - 0.3, s.z)
    })
    attr.needsUpdate = true
  })
  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial color="#ffffff" size={0.06} transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
    </points>
  )
}
