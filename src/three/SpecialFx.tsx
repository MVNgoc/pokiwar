import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Special } from '../game/types'
import { starTexture } from './GemAura'

const RINGS = 3
const BOLTS = 3
const ARC_POINTS = 28

/**
 * Hiệu ứng bao quanh ngọc đặc biệt (thay cho icon):
 * Bom: vầng sáng đỏ nhịp tim và các vòng sóng cam lan ra liên tục · Sét: vòng tia điện vàng nhấp nháy và các tia sao quay quanh.
 */
export default function SpecialFx({ kind }: { kind: Special }) {
  return kind === 'bomb' ? <BombFx /> : <LightningFx />
}

function BombFx() {
  const glow = useRef<THREE.Mesh>(null)
  const rings = useRef<(THREE.Mesh | null)[]>([])
  const seed = useMemo(() => Math.random() * 10, [])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed
    if (glow.current) {
      const beat = Math.pow(Math.max(0, Math.sin(t * 6)), 3) // nhịp tim: bật mạnh rồi lắng
      glow.current.scale.setScalar(1 + beat * 0.18)
      ;(glow.current.material as THREE.MeshBasicMaterial).opacity = 0.2 + beat * 0.25
    }
    rings.current.forEach((r, i) => {
      if (!r) return
      const k = (t * 0.75 + i / RINGS) % 1
      r.scale.setScalar(0.95 + k * 0.85)
      ;(r.material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.7
    })
  })
  return (
    <>
      <mesh ref={glow} position={[0, 0, -0.05]}>
        <circleGeometry args={[0.62, 32]} />
        <meshBasicMaterial color="#ff3b1f" transparent opacity={0.25} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {Array.from({ length: RINGS }, (_, i) => (
        <mesh key={i} ref={(m) => void (rings.current[i] = m)} position={[0, 0, 0.12]}>
          <ringGeometry args={[0.44, 0.5, 40]} />
          <meshBasicMaterial color="#ff9a3d" transparent depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </>
  )
}

function LightningFx() {
  const arcs = useRef<THREE.Line[]>([])
  const bolts = useRef<(THREE.Sprite | null)[]>([])
  const last = useRef(0)
  const seed = useMemo(() => Math.random() * 10, [])
  // hai vòng tia điện (vàng và xanh nhạt), đỉnh được xáo lại liên tục
  const lines = useMemo(
    () =>
      ['#fff6a8', '#8fd3ff'].map(
        (color) =>
          new THREE.Line(
            new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array((ARC_POINTS + 1) * 3), 3)),
            new THREE.LineBasicMaterial({ color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
          ),
      ),
    [],
  )
  arcs.current = lines

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed
    // vòng tia điện: đổi hình răng cưa ~16 lần/giây
    if (t - last.current > 0.06) {
      last.current = t
      lines.forEach((ln, gi) => {
        const pos = ln.geometry.getAttribute('position') as THREE.BufferAttribute
        for (let i = 0; i <= ARC_POINTS; i++) {
          const a = ((i % ARC_POINTS) / ARC_POINTS) * Math.PI * 2
          const r = (gi === 0 ? 0.5 : 0.56) + (Math.random() - 0.5) * 0.14
          pos.setXYZ(i, Math.cos(a) * r, Math.sin(a) * r, 0.14)
        }
        pos.needsUpdate = true
      })
    }
    lines.forEach((l, i) => {
      l.frustumCulled = false
      ;(l.material as THREE.LineBasicMaterial).opacity = 0.5 + 0.5 * Math.abs(Math.sin(t * (17 + i * 6)))
    })
    bolts.current.forEach((b, i) => {
      if (!b) return
      const a = t * 2.6 + (i / BOLTS) * Math.PI * 2
      b.position.set(Math.cos(a) * 0.55, Math.sin(a) * 0.55, 0.2)
      b.scale.setScalar(0.3 + 0.18 * Math.abs(Math.sin(t * 14 + i * 2)))
      b.material.rotation = t * 3 + i
    })
  })
  return (
    <>
      {lines.map((l, i) => (
        <primitive key={i} object={l} />
      ))}
      {Array.from({ length: BOLTS }, (_, i) => (
        <sprite key={i} ref={(s) => void (bolts.current[i] = s)}>
          <spriteMaterial map={starTexture()} color="#fff3a0" depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      ))}
    </>
  )
}
