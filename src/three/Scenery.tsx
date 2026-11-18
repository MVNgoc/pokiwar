import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Motes from './Motes'
import type { StageTheme } from './themes'

/** Bộ sinh số ngẫu nhiên cố định theo seed: cảnh mỗi màn luôn giống nhau. */
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const flat = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => <meshStandardMaterial color={color} flatShading roughness={1} {...extra} />

function Ground({ theme }: { theme: StageTheme }) {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.16, -14]}>
        <planeGeometry args={[120, 60]} />
        <meshStandardMaterial color={theme.ground} roughness={1} />
      </mesh>
      {/* dải đường sáng chạy ngang giữa hai bục */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, -0.2]}>
        <planeGeometry args={[40, 2.6]} />
        <meshStandardMaterial color={theme.hillFar} roughness={1} transparent opacity={0.55} />
      </mesh>
    </>
  )
}

function Hills({ theme }: { theme: StageTheme }) {
  const hills = useMemo(() => {
    const r = rng(11)
    const out: { x: number; z: number; sx: number; sy: number; far: boolean }[] = []
    for (let i = 0; i < 7; i++) out.push({ x: -26 + i * 8.6 + r() * 3, z: -24 - r() * 4, sx: 8 + r() * 5, sy: 4 + r() * 3.5, far: true })
    for (let i = 0; i < 6; i++) out.push({ x: -20 + i * 8 + r() * 4, z: -13 - r() * 3, sx: 6 + r() * 4, sy: 2.2 + r() * 2.4, far: false })
    return out
  }, [])
  return (
    <>
      {hills.map((h, i) => (
        <mesh key={i} position={[h.x, -0.8, h.z]} scale={[h.sx, h.sy, 6]}>
          <sphereGeometry args={[1, 18, 10]} />
          {flat(h.far ? theme.hillFar : theme.hillNear)}
        </mesh>
      ))}
    </>
  )
}

type TreeKind = 'round' | 'pine' | 'palm'

function Tree({ kind, foliage, trunk, scale, phase }: { kind: TreeKind; foliage: string; trunk: string; scale: number; phase: number }) {
  const g = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (g.current) g.current.rotation.z = Math.sin(clock.elapsedTime * 0.8 + phase) * 0.025
  })
  return (
    <group ref={g} scale={scale}>
      <mesh position={[0, 0.45, 0]} rotation={[0, 0, kind === 'palm' ? 0.18 : 0]}>
        <cylinderGeometry args={[0.1, 0.17, kind === 'palm' ? 1.9 : 0.9, 7]} />
        {flat(trunk)}
      </mesh>
      {kind === 'round' && (
        <>
          <mesh position={[0, 1.25, 0]}>
            <icosahedronGeometry args={[0.62, 1]} />
            {flat(foliage)}
          </mesh>
          <mesh position={[0.35, 0.95, 0.12]}>
            <icosahedronGeometry args={[0.4, 1]} />
            {flat(foliage)}
          </mesh>
        </>
      )}
      {kind === 'pine' &&
        [0, 1, 2].map((i) => (
          <mesh key={i} position={[0, 0.95 + i * 0.5, 0]}>
            <coneGeometry args={[0.65 - i * 0.14, 0.95, 7]} />
            {flat(foliage)}
          </mesh>
        ))}
      {kind === 'palm' &&
        Array.from({ length: 6 }, (_, i) => (
          <mesh key={i} position={[0.3 + Math.cos((i / 6) * Math.PI * 2) * 0.5, 1.75, Math.sin((i / 6) * Math.PI * 2) * 0.5]} rotation={[0, -(i / 6) * Math.PI * 2, -0.35]} scale={[1, 0.12, 0.28]}>
            <sphereGeometry args={[0.6, 8, 6]} />
            {flat(foliage)}
          </mesh>
        ))}
    </group>
  )
}

function Trees({ theme, kind }: { theme: StageTheme; kind: TreeKind }) {
  const trees = useMemo(() => {
    const r = rng(kind.length * 17 + 3)
    return Array.from({ length: 16 }, (_, i) => {
      const side = i % 2 ? 1 : -1
      return { x: side * (3.4 + r() * 9), z: -2.5 - r() * 9, s: 0.9 + r() * 1.1, phase: r() * 6 }
    })
  }, [kind])
  return (
    <>
      {trees.map((t, i) => (
        <group key={i} position={[t.x, -0.15, t.z]}>
          <Tree kind={kind} foliage={theme.foliage} trunk={theme.trunk} scale={t.s} phase={t.phase} />
        </group>
      ))}
    </>
  )
}

function Flowers() {
  const items = useMemo(() => {
    const r = rng(5)
    const colors = ['#ff6fa8', '#ffe14d', '#ffffff', '#ff9a3d', '#b57cff']
    return Array.from({ length: 36 }, () => ({ x: (r() - 0.5) * 18, z: -0.5 - r() * 5, c: colors[Math.floor(r() * colors.length)] }))
  }, [])
  return (
    <>
      {items.map((f, i) => (
        <mesh key={i} position={[f.x, -0.1, f.z]}>
          <icosahedronGeometry args={[0.07, 0]} />
          <meshStandardMaterial color={f.c} emissive={f.c} emissiveIntensity={0.25} />
        </mesh>
      ))}
    </>
  )
}

function Clouds({ tint }: { tint: string }) {
  const refs = useRef<(THREE.Group | null)[]>([])
  const clouds = useMemo(() => {
    const r = rng(21)
    return Array.from({ length: 7 }, () => ({ x: (r() - 0.5) * 44, y: 3.2 + r() * 4, z: -22 - r() * 8, s: 1.2 + r() * 1.4, v: 0.15 + r() * 0.25 }))
  }, [])
  useFrame((_, dt) => {
    refs.current.forEach((g, i) => {
      if (!g) return
      g.position.x += clouds[i].v * dt
      if (g.position.x > 26) g.position.x = -26
    })
  })
  return (
    <>
      {clouds.map((c, i) => (
        <group key={i} ref={(g) => void (refs.current[i] = g)} position={[c.x, c.y, c.z]} scale={c.s}>
          {[
            [0, 0, 1.1],
            [1.1, -0.15, 0.85],
            [-1.1, -0.2, 0.8],
            [0.4, 0.4, 0.8],
          ].map(([x, y, s], k) => (
            <mesh key={k} position={[x, y, 0]} scale={[s * 1.3, s * 0.8, s]}>
              <sphereGeometry args={[1, 12, 8]} />
              <meshBasicMaterial color={tint} transparent opacity={0.92} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  )
}

function Sun({ color }: { color: string }) {
  return (
    <group position={[11, 6.2, -38]}>
      <mesh>
        <circleGeometry args={[2.2, 40]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[0, 0, -0.1]}>
        <circleGeometry args={[5.2, 40]} />
        <meshBasicMaterial color={color} transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  )
}

function Sea() {
  const foam = useRef<THREE.Group>(null)
  const items = useMemo(() => {
    const r = rng(9)
    return Array.from({ length: 22 }, () => ({ x: (r() - 0.5) * 40, z: -6 - r() * 26, w: 0.8 + r() * 1.6, v: 0.2 + r() * 0.3 }))
  }, [])
  useFrame((_, dt) => {
    foam.current?.children.forEach((c, i) => {
      c.position.x += items[i].v * dt
      if (c.position.x > 21) c.position.x = -21
    })
  })
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, -22]}>
        <planeGeometry args={[120, 34]} />
        <meshStandardMaterial color="#2ec4d6" roughness={0.35} metalness={0.1} emissive="#1aa7c4" emissiveIntensity={0.35} />
      </mesh>
      <group ref={foam}>
        {items.map((f, i) => (
          <mesh key={i} position={[f.x, -0.1, f.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[f.w, 0.07]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.65} />
          </mesh>
        ))}
      </group>
    </>
  )
}

function Rocks({ color, crystals }: { color: string; crystals: boolean }) {
  const glow = useRef<THREE.Group>(null)
  const rocks = useMemo(() => {
    const r = rng(33)
    return Array.from({ length: 14 }, (_, i) => ({ x: (i % 2 ? 1 : -1) * (2.6 + r() * 8), z: -2 - r() * 10, h: 1.2 + r() * 3, w: 0.6 + r() * 0.8, cr: r() > 0.55 }))
  }, [])
  useFrame(({ clock }) => {
    glow.current?.children.forEach((c, i) => {
      const m = (c as THREE.Mesh).material as THREE.MeshStandardMaterial
      m.emissiveIntensity = 0.7 + Math.sin(clock.elapsedTime * 2 + i) * 0.35
    })
  })
  return (
    <>
      {rocks.map((k, i) => (
        <mesh key={i} position={[k.x, k.h / 2 - 0.15, k.z]} rotation={[0, i, 0]}>
          <coneGeometry args={[k.w, k.h, 5]} />
          {flat(color)}
        </mesh>
      ))}
      <group ref={glow}>
        {crystals &&
          rocks
            .filter((k) => k.cr)
            .map((k, i) => (
              <mesh key={i} position={[k.x + 0.9, 0.5, k.z + 0.6]} scale={[0.35, 0.8 + (i % 3) * 0.3, 0.35]}>
                <octahedronGeometry args={[1, 0]} />
                <meshStandardMaterial color={i % 2 ? '#7de8ff' : '#e07dff'} emissive={i % 2 ? '#3fcfff' : '#c24dff'} emissiveIntensity={0.9} flatShading />
              </mesh>
            ))}
      </group>
    </>
  )
}

function Volcano() {
  const lava = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    lava.current?.children.forEach((c, i) => {
      const m = (c as THREE.Mesh).material as THREE.MeshStandardMaterial
      m.emissiveIntensity = 1.1 + Math.sin(clock.elapsedTime * 2.4 + i * 1.7) * 0.5
    })
  })
  return (
    <>
      <mesh position={[0, 4.2, -26]}>
        <coneGeometry args={[11, 15, 8]} />
        {flat('#3a2022')}
      </mesh>
      <mesh position={[0, 11.9, -26]}>
        <circleGeometry args={[2.7, 20]} />
        <meshBasicMaterial color="#ffb347" />
      </mesh>
      <mesh position={[0, 12.3, -26.3]}>
        <circleGeometry args={[7, 24]} />
        <meshBasicMaterial color="#ff7a1a" transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <group ref={lava}>
        {[-6, 5].map((x, i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, -0.13, -5 - i * 3]}>
            <planeGeometry args={[7, 1.4]} />
            <meshStandardMaterial color="#ff5a1a" emissive="#ff4a0a" emissiveIntensity={1.2} />
          </mesh>
        ))}
        {[-4, 2, 8].map((x, i) => (
          <mesh key={`c${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, -0.13, -12 - i * 2]}>
            <planeGeometry args={[9, 1.8]} />
            <meshStandardMaterial color="#ff5a1a" emissive="#ff4a0a" emissiveIntensity={1.2} />
          </mesh>
        ))}
      </group>
    </>
  )
}

/** Ngoại cảnh 3D phía sau hai bục: đồi, cây, mây, nước, đá, dung nham… theo chủ đề từng màn. */
export default function Scenery({ theme }: { theme: StageTheme }) {
  const m = theme.mood
  return (
    <>
      <Ground theme={theme} />
      {m !== 'volcano' && <Clouds tint={m === 'cave' ? '#d8c8ff' : '#ffffff'} />}
      {theme.sun && <Sun color={theme.sun} />}
      {m === 'volcano' ? (
        <>
          <Hills theme={theme} />
          <Volcano />
          <Rocks color="#2f1d1f" crystals={false} />
        </>
      ) : m === 'cave' ? (
        <>
          <Hills theme={theme} />
          <Rocks color="#4c4163" crystals />
        </>
      ) : m === 'beach' ? (
        <>
          <Sea />
          <Trees theme={theme} kind="palm" />
        </>
      ) : (
        <>
          <Hills theme={theme} />
          <Trees theme={theme} kind={m === 'forest' ? 'pine' : 'round'} />
          {m === 'meadow' && <Flowers />}
        </>
      )}
      <Motes count={m === 'volcano' ? 60 : 40} color={theme.mote} />
    </>
  )
}
