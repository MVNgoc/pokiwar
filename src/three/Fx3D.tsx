import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Cast } from '../hooks/useGame'
import { clamp01, easeOutCubic } from './easing'
import { FLIGHT_MS, FX_PLANS, type FxEvent } from './fxPlans'
import { getFx, isGlow, preloadFx } from './fxTextures'

preloadFx()

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

export type ProjectileStyle = 'fire' | 'thorn' | 'leaf' | 'seed' | 'ball' | 'wheel' | 'bubble' | 'mud'

export interface ProjectileProps {
  t0: number
  from: Vec3
  to: Vec3
  style: ProjectileStyle
  color: string
  size?: number
  /** trễ so với lúc tung (ms) */
  delay?: number
  /** bay trong bao lâu (ms), mặc định bằng FLIGHT_MS để trúng đúng lúc sát thương hiện ra */
  flight?: number
  /** độ cong quỹ đạo (đơn vị cao), âm = cong xuống */
  arc?: number
  /** lệch độ cao điểm trúng */
  yOff?: number
  /** dùng ảnh hiệu ứng (tên file trong fx/) thay cho hình 3D vẽ sẵn */
  sprite?: string
  spin?: number
}

function ProjectileShape({ style, size }: { style: ProjectileStyle; size: number }) {
  switch (style) {
    case 'thorn':
      return <octahedronGeometry args={[size * 1.2, 0]} />
    case 'leaf':
      return <sphereGeometry args={[size * 1.4, 10, 6]} />
    case 'seed':
      return <sphereGeometry args={[size * 0.8, 8, 6]} />
    case 'wheel':
      return <torusGeometry args={[size * 1.1, size * 0.4, 8, 18]} />
    case 'mud':
      return <dodecahedronGeometry args={[size, 0]} />
    case 'bubble':
      return <sphereGeometry args={[size * 1.2, 14, 10]} />
    default:
      return <icosahedronGeometry args={[style === 'ball' ? size * 1.5 : size, 1]} />
  }
}

const spriteScale = (tex: THREE.Texture, size: number): [number, number, number] => {
  const img = tex.image as { width: number; height: number }
  return [size * (img.width / img.height), size, 1]
}

/** Đạn bằng ảnh: viên chính cộng vệt mờ dần phía sau. */
function SpriteProjectile({ t0, from, to, tex, glow, size, delay = 0, flight = FLIGHT_MS, arc = 0.7, yOff = 0, spin = 0 }: ProjectileProps & { tex: THREE.Texture; glow: boolean }) {
  const refs = useRef<(THREE.Sprite | null)[]>([])
  const N = 6
  const tmp = useMemo(() => new THREE.Vector3(), [])
  const sz = size ?? 0.4
  useFrame(() => {
    const k = (performance.now() - t0 - delay) / flight
    const on = k >= 0 && k <= 1
    refs.current.forEach((sp, i) => {
      if (!sp) return
      sp.visible = on
      if (!on) return
      const kk = Math.max(0, k - i * 0.035)
      tmp.set(from[0] + (to[0] - from[0]) * kk, from[1] + (to[1] + yOff - from[1]) * kk + Math.sin(kk * Math.PI) * arc, from[2] + (to[2] - from[2]) * kk + 0.2)
      sp.position.copy(tmp)
      const sc = spriteScale(tex, sz * (1 - i * 0.12))
      sp.scale.set(sc[0], sc[1], 1)
      sp.material.rotation = spin * k * 6
      sp.material.opacity = i === 0 ? 1 : 0.5 * (1 - i / N)
    })
  })
  return (
    <group>
      {Array.from({ length: N }, (_, i) => (
        <sprite key={i} ref={(r) => void (refs.current[i] = r)} visible={false}>
          <spriteMaterial map={tex} transparent depthWrite={false} blending={glow ? ADD : THREE.NormalBlending} />
        </sprite>
      ))}
    </group>
  )
}

function Projectile(props: ProjectileProps) {
  const tex = getFx(props.sprite)
  if (tex && props.sprite) return <SpriteProjectile {...props} tex={tex} glow={isGlow(props.sprite)} />
  return <ShapeProjectile {...props} />
}

function ShapeProjectile({ t0, from, to, style, color, size = 0.32, delay = 0, flight = FLIGHT_MS, arc = 0.7, yOff = 0 }: ProjectileProps) {
  const group = useRef<THREE.Group>(null)
  const core = useRef<THREE.Mesh>(null)
  const trail = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const N = style === 'bubble' || style === 'leaf' ? 5 : 12
  const pos = (k: number, out: THREE.Vector3) =>
    out.set(from[0] + (to[0] - from[0]) * k, from[1] + (to[1] + yOff - from[1]) * k + Math.sin(k * Math.PI) * arc, from[2] + (to[2] - from[2]) * k)
  const tmp = useMemo(() => new THREE.Vector3(), [])
  useFrame((_, dt) => {
    const k = (performance.now() - t0 - delay) / flight
    const on = k >= 0 && k <= 1
    if (group.current) group.current.visible = on
    if (!on) return
    if (core.current) {
      pos(k, core.current.position)
      if (style === 'wheel') {
        core.current.rotation.z += dt * 18
      } else if (style === 'leaf') {
        core.current.rotation.x += dt * 14
        core.current.scale.set(1, 0.22, 0.6)
      } else {
        core.current.rotation.x += dt * 9
        core.current.rotation.y += dt * 7
        core.current.scale.setScalar(1 + Math.sin(k * 40) * 0.08)
      }
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
  const glassy = style === 'bubble'
  return (
    <group ref={group} visible={false}>
      <mesh ref={core}>
        <ProjectileShape style={style} size={size} />
        <meshBasicMaterial color={color} transparent={glassy} opacity={glassy ? 0.65 : 1} />
      </mesh>
      <instancedMesh ref={trail} args={[undefined, undefined, N]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial color={color} transparent opacity={style === 'mud' ? 0.9 : 0.8} blending={style === 'mud' ? THREE.NormalBlending : ADD} depthWrite={false} />
      </instancedMesh>
    </group>
  )
}

/** Luồng tia kéo dài từ người tung tới mục tiêu (phun lửa, súng nước): hạt chảy liên tục dọc đường bay. */
function Beam({ t0, at, ms, from, to, color, size = 0.16, sprite }: { t0: number; at: number; ms: number; from: Vec3; to: Vec3; color: string; size?: number; sprite?: string }) {
  const tex = getFx(sprite)
  if (tex && sprite) return <SpriteBeam t0={t0} at={at} ms={ms} from={from} to={to} tex={tex} glow={isGlow(sprite)} size={size} />
  return <ShapeBeam t0={t0} at={at} ms={ms} from={from} to={to} color={color} size={size} />
}

function ShapeBeam({ t0, at, ms, from, to, color, size = 0.16 }: { t0: number; at: number; ms: number; from: Vec3; to: Vec3; color: string; size?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const glow = useRef<THREE.Mesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const N = 46
  const parts = useMemo(() => Array.from({ length: N }, (_, i) => ({ o: i / N, jx: (Math.random() - 0.5) * 0.28, jy: (Math.random() - 0.5) * 0.28, sp: 1.6 + Math.random() * 0.8, s: 0.6 + Math.random() * 0.8 })), [])
  const dx = to[0] - from[0]
  const angle = Math.atan2(to[1] - from[1], dx)
  const len = Math.hypot(dx, to[1] - from[1])
  useFrame(() => {
    const t = since(t0, at)
    const on = t >= 0 && t < ms / 1000
    if (mesh.current) mesh.current.visible = on
    if (glow.current) glow.current.visible = on
    if (!on || !mesh.current) return
    const env = Math.min(1, t * 8) * Math.min(1, (ms / 1000 - t) * 8)
    parts.forEach((p, i) => {
      const k = (t * p.sp + p.o) % 1
      const spread = 0.35 + k
      dummy.position.set(from[0] + dx * k + p.jx * spread, from[1] + (to[1] - from[1]) * k + p.jy * spread, 0.1)
      dummy.scale.setScalar(size * p.s * (0.5 + k) * env)
      dummy.updateMatrix()
      mesh.current!.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
    if (glow.current) (glow.current.material as THREE.MeshBasicMaterial).opacity = 0.28 * env
  })
  return (
    <>
      <instancedMesh ref={mesh} args={[undefined, undefined, N]} visible={false} frustumCulled={false}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial color={color} transparent blending={ADD} depthWrite={false} />
      </instancedMesh>
      <mesh ref={glow} position={[(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, 0.05]} rotation={[0, 0, angle]} visible={false}>
        <planeGeometry args={[len, 0.45]} />
        <meshBasicMaterial color={color} transparent opacity={0.28} blending={ADD} depthWrite={false} />
      </mesh>
    </>
  )
}

/** Luồng tia bằng ảnh: các viên chảy liên tục từ người tung tới mục tiêu. */
function SpriteBeam({ t0, at, ms, from, to, tex, glow, size }: { t0: number; at: number; ms: number; from: Vec3; to: Vec3; tex: THREE.Texture; glow: boolean; size: number }) {
  const refs = useRef<(THREE.Sprite | null)[]>([])
  const N = 16
  const parts = useMemo(() => Array.from({ length: N }, (_, i) => ({ o: i / N, jy: (Math.random() - 0.5) * 0.32, sp: 1.7 + Math.random() * 0.6, s: 0.7 + Math.random() * 0.6, r: Math.random() * 6 })), [])
  useFrame(() => {
    const t = since(t0, at)
    const on = t >= 0 && t < ms / 1000
    const env = on ? Math.min(1, t * 8) * Math.min(1, (ms / 1000 - t) * 8) : 0
    refs.current.forEach((sp, i) => {
      if (!sp) return
      sp.visible = on
      if (!on) return
      const p = parts[i]
      const k = (t * p.sp + p.o) % 1
      sp.position.set(from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k + p.jy * (0.3 + k), 0.2)
      const sc = spriteScale(tex, size * p.s * (0.8 + k * 1.4) * 2.4 * env)
      sp.scale.set(sc[0], sc[1], 1)
      sp.material.rotation = p.r + t * 2
      sp.material.opacity = 0.9 * env
    })
  })
  return (
    <group>
      {parts.map((_, i) => (
        <sprite key={i} ref={(r) => void (refs.current[i] = r)} visible={false}>
          <spriteMaterial map={tex} transparent depthWrite={false} blending={glow ? ADD : THREE.NormalBlending} />
        </sprite>
      ))}
    </group>
  )
}

/** Hình ảnh bật lên tại mục tiêu hoặc người tung (nổ sáng, va chạm...), phình ra rồi mờ dần. */
function PopSprite({ t0, at, ms, pos, tex, glow, size, spin }: { t0: number; at: number; ms: number; pos: Vec3; tex: THREE.Texture; glow: boolean; size: number; spin: number }) {
  const ref = useRef<THREE.Sprite>(null)
  useFrame(() => {
    const sp = ref.current
    if (!sp) return
    const t = since(t0, at)
    const k = clamp01(t / (ms / 1000))
    sp.visible = t >= 0 && k < 1
    if (!sp.visible) return
    const sc = spriteScale(tex, size * (glow ? 0.55 : 1) * (0.5 + easeOutCubic(Math.min(1, k * 2.5)) * 0.7))
    sp.scale.set(sc[0], sc[1], 1)
    sp.material.rotation = spin * k * 4
    sp.material.opacity = (glow ? 0.7 : 1) * (1 - k * k)
  })
  return (
    <sprite ref={ref} position={[pos[0], pos[1], pos[2] + 0.4]} visible={false}>
      <spriteMaterial map={tex} transparent depthWrite={false} blending={glow ? ADD : THREE.NormalBlending} />
    </sprite>
  )
}

/** Cắn: hai hàm răng khép lại tại mục tiêu rồi mờ dần. */
function Bite({ t0, at, pos, top, bottom }: { t0: number; at: number; pos: Vec3; top: THREE.Texture; bottom: THREE.Texture }) {
  const a = useRef<THREE.Sprite>(null)
  const b = useRef<THREE.Sprite>(null)
  useFrame(() => {
    const t = since(t0, at)
    const on = t >= 0 && t < 0.7
    ;[a.current, b.current].forEach((sp) => sp && (sp.visible = on))
    if (!on || !a.current || !b.current) return
    const close = easeOutCubic(clamp01(t / 0.22))
    const fade = t > 0.38 ? 1 - (t - 0.38) / 0.3 : 1
    const off = 0.75 - close * 0.52
    a.current.position.set(pos[0], pos[1] + off, pos[2] + 0.4)
    b.current.position.set(pos[0], pos[1] - off, pos[2] + 0.4)
    ;[a.current, b.current].forEach((sp) => (sp.material.opacity = fade))
  })
  const sa = spriteScale(top, 0.95)
  const sb = spriteScale(bottom, 0.95)
  return (
    <>
      <sprite ref={a} scale={sa} visible={false}>
        <spriteMaterial map={top} transparent depthWrite={false} />
      </sprite>
      <sprite ref={b} scale={sb} visible={false}>
        <spriteMaterial map={bottom} transparent depthWrite={false} />
      </sprite>
    </>
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
      {plan.projectiles?.map((p, i) => (
        <Projectile key={`p${i}`} t0={t0} from={selfPos} to={foePos} {...p} />
      ))}
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
          case 'beam':
            return <Beam key={i} t0={t0} at={e.at} ms={e.ms} from={selfPos} to={foePos} color={e.color} size={e.size} sprite={e.sprite} />
          case 'sprite': {
            const tex = getFx(e.name)
            return tex ? <PopSprite key={i} t0={t0} at={e.at} ms={e.ms ?? 450} pos={pos} tex={tex} glow={isGlow(e.name)} size={e.size ?? 1} spin={e.spin ?? 0} /> : null
          }
          case 'bite': {
            const top = getFx('topbite')
            const bottom = getFx('bottombite')
            return top && bottom ? <Bite key={i} t0={t0} at={e.at} pos={pos} top={top} bottom={bottom} /> : <Slash key={i} t0={t0} at={e.at} pos={pos} color="#bfe6ff" index={i} />
          }
          case 'stars':
            return <Stars key={i} t0={t0} at={e.at} ms={e.ms} pos={pos} color={e.color} />
        }
      })}
    </group>
  )
}
