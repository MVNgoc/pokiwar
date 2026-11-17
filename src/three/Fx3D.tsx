import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Cast } from '../hooks/useGame'
import { clamp01, easeOutCubic } from './easing'
import { FLIGHT_MS, FX_PLANS, type FxEvent } from './fxPlans'

type Vec3 = [number, number, number]
const HEAD = 1.0 // độ cao điểm tung/trúng đòn
const ADD = THREE.AdditiveBlending

/** Thời gian (giây) kể từ `t0 + at`; âm nghĩa là chưa tới lúc. */
const since = (t0: number, atMs: number) => (performance.now() - t0 - atMs) / 1000

function Burst({ t0, at, pos, color, count = 14, up = false }: { t0: number; at: number; pos: Vec3; color: string; count?: number; up?: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const flash = useRef<THREE.Mesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const parts = useMemo(
    () =>
      Array.from({ length: count }, () => {
        const a = Math.random() * Math.PI * 2
        const sp = 1.2 + Math.random() * 2.2
        return { vx: Math.cos(a) * sp, vy: (up ? 1.6 : 0.2) + Math.random() * 1.6, vz: (Math.random() - 0.5) * 2, size: 0.05 + Math.random() * 0.07 }
      }),
    [count, up],
  )
  useFrame(() => {
    const t = since(t0, at)
    const m = mesh.current
    if (!m) return
    const on = t >= 0 && t < 0.7
    m.visible = on
    if (flash.current) flash.current.visible = t >= 0 && t < 0.18
    if (!on) return
    parts.forEach((p, i) => {
      dummy.position.set(p.vx * t, p.vy * t - 2.6 * t * t * (up ? 0.3 : 1), p.vz * t)
      dummy.scale.setScalar(p.size * (1 - t / 0.7) * 1.4)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    })
    m.instanceMatrix.needsUpdate = true
    if (flash.current) flash.current.scale.setScalar(0.3 + easeOutCubic(t / 0.18) * 1.1)
  })
  return (
    <group position={pos}>
      <instancedMesh ref={mesh} args={[undefined, undefined, count]} visible={false}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial color={color} transparent blending={ADD} depthWrite={false} />
      </instancedMesh>
      <mesh ref={flash} visible={false}>
        <sphereGeometry args={[0.5, 12, 8]} />
        <meshBasicMaterial color="#fff" transparent opacity={0.7} blending={ADD} depthWrite={false} />
      </mesh>
    </group>
  )
}

function Projectile({ t0, from, to, style, color, size = 0.32 }: { t0: number; from: Vec3; to: Vec3; style: 'fire' | 'thorn'; color: string; size?: number }) {
  const group = useRef<THREE.Group>(null)
  const core = useRef<THREE.Mesh>(null)
  const trail = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const N = 12
  const pos = (k: number, out: THREE.Vector3) =>
    out.set(from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k + Math.sin(k * Math.PI) * 0.7, from[2] + (to[2] - from[2]) * k)
  const tmp = useMemo(() => new THREE.Vector3(), [])
  useFrame((_, dt) => {
    const k = (performance.now() - t0) / FLIGHT_MS
    const on = k >= 0 && k <= 1
    if (group.current) group.current.visible = on
    if (!on) return
    if (core.current) {
      pos(k, core.current.position)
      core.current.rotation.x += dt * 9
      core.current.rotation.y += dt * 7
      core.current.scale.setScalar(1 + Math.sin(k * 40) * 0.08)
    }
    if (trail.current) {
      for (let i = 0; i < N; i++) {
        const kk = Math.max(0, k - (i + 1) * 0.028)
        pos(kk, tmp)
        dummy.position.copy(tmp)
        dummy.scale.setScalar(size * (1 - i / N) * 0.85)
        dummy.updateMatrix()
        trail.current.setMatrixAt(i, dummy.matrix)
      }
      trail.current.instanceMatrix.needsUpdate = true
    }
  })
  return (
    <group ref={group} visible={false}>
      <mesh ref={core}>
        {style === 'fire' ? <icosahedronGeometry args={[size, 1]} /> : <octahedronGeometry args={[size * 1.2, 0]} />}
        <meshBasicMaterial color={color} />
      </mesh>
      <instancedMesh ref={trail} args={[undefined, undefined, N]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} blending={ADD} depthWrite={false} />
      </instancedMesh>
    </group>
  )
}

function Slash({ t0, at, pos, color, index }: { t0: number; at: number; pos: Vec3; color: string; index: number }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(() => {
    const m = ref.current
    if (!m) return
    const t = since(t0, at)
    const k = clamp01(t / 0.26)
    m.visible = t >= 0 && t < 0.3
    if (!m.visible) return
    m.scale.setScalar(0.7 + easeOutCubic(k) * 0.9)
    m.rotation.z = (index % 2 ? 1 : -1) * (0.5 + k * 0.7) + index * 0.9
    ;(m.material as THREE.MeshBasicMaterial).opacity = 1 - k
  })
  return (
    <mesh ref={ref} position={[pos[0], pos[1] + 0.1 * index, pos[2] + 0.5]} visible={false}>
      <ringGeometry args={[0.62, 0.78, 28, 1, 0, Math.PI * 0.85]} />
      <meshBasicMaterial color={color} transparent blending={ADD} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  )
}

function Bubble({ t0, at, pos, color }: { t0: number; at: number; pos: Vec3; color: string }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(() => {
    const m = ref.current
    if (!m) return
    const t = since(t0, at)
    m.visible = t >= 0 && t < 0.9
    if (!m.visible) return
    const k = clamp01(t / 0.9)
    m.scale.setScalar(0.4 + easeOutCubic(Math.min(1, k * 2.2)) * 0.95)
    ;(m.material as THREE.MeshBasicMaterial).opacity = 0.38 * (1 - Math.max(0, k - 0.55) / 0.45)
  })
  return (
    <mesh ref={ref} position={pos} visible={false}>
      <sphereGeometry args={[1.1, 24, 16]} />
      <meshBasicMaterial color={color} transparent blending={ADD} depthWrite={false} />
    </mesh>
  )
}

function Dome({ t0, at, pos, color }: { t0: number; at: number; pos: Vec3; color: string }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(() => {
    const m = ref.current
    if (!m) return
    const t = since(t0, at)
    m.visible = t >= 0 && t < 1
    if (!m.visible) return
    const k = clamp01(t)
    m.scale.setScalar((0.5 + easeOutCubic(Math.min(1, k * 3)) * 0.65) * (1 + Math.sin(k * 20) * 0.02))
    ;(m.material as THREE.MeshBasicMaterial).opacity = 0.34 * (1 - Math.max(0, k - 0.6) / 0.4)
  })
  return (
    <mesh ref={ref} position={[pos[0], 0, pos[2]]} visible={false}>
      <sphereGeometry args={[1.35, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshBasicMaterial color={color} transparent blending={ADD} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  )
}

function Dust({ t0, at, pos, color }: { t0: number; at: number; pos: Vec3; color: string }) {
  const ring = useRef<THREE.Mesh>(null)
  useFrame(() => {
    const m = ring.current
    if (!m) return
    const t = since(t0, at)
    m.visible = t >= 0 && t < 0.6
    if (!m.visible) return
    const k = clamp01(t / 0.6)
    m.scale.setScalar(0.3 + easeOutCubic(k) * 2.4)
    ;(m.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - k)
  })
  return (
    <group>
      <mesh ref={ring} position={[pos[0], 0.05, pos[2]]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.55, 0.75, 32]} />
        <meshBasicMaterial color={color} transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <Burst t0={t0} at={at} pos={[pos[0], 0.1, pos[2]]} color={color} count={16} up />
    </group>
  )
}

function Stars({ t0, at, ms, pos, color }: { t0: number; at: number; ms: number; pos: Vec3; color: string }) {
  const group = useRef<THREE.Group>(null)
  useFrame(() => {
    const g = group.current
    if (!g) return
    const t = since(t0, at)
    g.visible = t >= 0 && t < ms / 1000
    if (!g.visible) return
    g.rotation.y = t * 5
    g.scale.setScalar(Math.min(1, t * 6) * (t > ms / 1000 - 0.2 ? Math.max(0, (ms / 1000 - t) / 0.2) : 1))
  })
  return (
    <group ref={group} position={[pos[0], 2.35, pos[2]]} visible={false}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[Math.cos((i * Math.PI * 2) / 3) * 0.55, Math.sin(i * 2) * 0.05, Math.sin((i * Math.PI * 2) / 3) * 0.55]}>
          <octahedronGeometry args={[0.13, 0]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
    </group>
  )
}

/** Lớp hiệu ứng kỹ năng 3D, bám theo kịch bản trong fxPlans. Remount (key = cast.id) để phát lại từ đầu. */
export default function FxLayer({ cast, playerX, enemyX }: { cast: Cast; playerX: number; enemyX: number }) {
  const t0 = useMemo(() => performance.now(), [])
  const plan = FX_PLANS[cast.fxId]
  if (!plan) return null
  const fromEnemy = cast.side === 'enemy'
  const selfPos: Vec3 = [fromEnemy ? enemyX : playerX, HEAD, 0]
  const foePos: Vec3 = [fromEnemy ? playerX : enemyX, HEAD, 0]
  const at = (on: 'self' | 'foe') => (on === 'self' ? selfPos : foePos)
  return (
    <group>
      {plan.projectile && <Projectile t0={t0} from={selfPos} to={foePos} {...plan.projectile} />}
      {plan.events.map((e: FxEvent, i) => {
        const pos = at(e.on)
        switch (e.kind) {
          case 'burst':
            return <Burst key={i} t0={t0} at={e.at} pos={pos} color={e.color} count={e.count} up={e.up} />
          case 'slash':
            return <Slash key={i} t0={t0} at={e.at} pos={pos} color={e.color} index={i} />
          case 'bubble':
            return <Bubble key={i} t0={t0} at={e.at} pos={pos} color={e.color} />
          case 'dome':
            return <Dome key={i} t0={t0} at={e.at} pos={pos} color={e.color} />
          case 'dust':
            return <Dust key={i} t0={t0} at={e.at} pos={pos} color={e.color} />
          case 'stars':
            return <Stars key={i} t0={t0} at={e.at} ms={e.ms} pos={pos} color={e.color} />
        }
      })}
    </group>
  )
}
