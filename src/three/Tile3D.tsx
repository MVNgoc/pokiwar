import { memo, use, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Tile } from '../game/types'
import { clamp01 } from './easing'
import GemAura from './GemAura'
import { loadGem } from './gemModels'
import { buildMedallion, loadGemIcon } from './gemIcons'
import { emojiTexture, GEM_COLOR } from './gems'

export const BOARD_N = 8
/** Tâm ô theo cột / hàng (bàn cờ căn giữa gốc tọa độ, hàng 0 ở trên cùng). */
export const cellX = (c: number) => c - (BOARD_N - 1) / 2
export const cellY = (r: number) => (BOARD_N - 1) / 2 - r

const GRAVITY = 110
const RESTITUTION = 0.18
const OMEGA = 30 // lò xo hoán đổi: ~0.2 giây là vào chỗ, hơi vượt qua một chút
const ZETA = 0.72
const CLEAR_S = 0.26

interface Props {
  tile: Tile
  row: number
  col: number
  selected: boolean
  clearing: boolean
  /** gợi ý nước đi: chớp sáng/tắt */
  blink?: boolean
}

/** Tia sáng bắn ra khi ngọc nổ. */
function GemBurst({ color }: { color: string }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const parts = useMemo(
    () => Array.from({ length: 8 }, (_, i) => ({ a: (i / 8) * Math.PI * 2 + Math.random() * 0.4, sp: 1.8 + Math.random() * 1.4 })),
    [],
  )
  const age = useRef(0)
  useFrame((_, dt) => {
    age.current += Math.min(dt, 1 / 30)
    const k = clamp01(age.current / 0.32)
    const m = mesh.current
    if (!m) return
    parts.forEach((p, i) => {
      dummy.position.set(Math.cos(p.a) * p.sp * age.current, Math.sin(p.a) * p.sp * age.current, 0.3)
      dummy.scale.setScalar(0.09 * (1 - k))
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, 8]}>
      <sphereGeometry args={[1, 6, 4]} />
      <meshBasicMaterial color={color} blending={THREE.AdditiveBlending} transparent depthWrite={false} />
    </instancedMesh>
  )
}

function TileView({ tile, row, col, selected, clearing, blink }: Props) {
  const group = useRef<THREE.Group>(null)
  const inner = useRef<THREE.Group>(null)
  const halo = useRef<THREE.Mesh>(null)
  const icon = use(loadGemIcon(tile.type))
  const model = icon ? null : use(loadGem(tile.type))
  // mỗi ô có bản sao riêng (vật liệu riêng để loé sáng độc lập)
  const gem = useMemo(() => {
    if (icon) {
      const med = buildMedallion(tile.type, icon)
      return { root: med.root, materials: med.materials.map((mat) => ({ mat, base: mat.emissive.clone() })) }
    }
    const root = model!.clone(true)
    const materials: { mat: THREE.MeshStandardMaterial; base: THREE.Color }[] = []
    root.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (mesh.isMesh) {
        const mat = (mesh.material as THREE.MeshStandardMaterial).clone()
        mesh.material = mat
        materials.push({ mat, base: mat.emissive.clone() })
      }
    })
    return { root, materials }
  }, [model, icon, tile.type])
  const white = useMemo(() => new THREE.Color('#ffffff'), [])
  const phase = useMemo(() => Math.random() * 6, [])
  // vật lý riêng của từng ngọc: ngọc mới sinh bắt đầu ở phía trên bàn cờ rồi rơi xuống
  const st = useRef({ x: cellX(col), y: cellY(tile.spawnRow ?? row), vx: 0, vy: 0, falling: false, squash: 0, clearT: -1 })

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 1 / 30)
    const s = st.current
    const g = group.current
    const n = inner.current
    if (!g || !n) return
    const tx = cellX(col)
    const ty = cellY(row)

    // ngang: lò xo; dọc: rơi theo trọng lực và nảy nhẹ nếu ở xa, còn lại là lò xo
    s.vx += (-OMEGA * OMEGA * (s.x - tx) - 2 * ZETA * OMEGA * s.vx) * dt
    s.x += s.vx * dt
    if (!s.falling && s.y - ty > 1.05) s.falling = true
    if (s.falling) {
      s.vy -= GRAVITY * dt
      s.y += s.vy * dt
      if (s.y <= ty) {
        const impact = -s.vy
        s.y = ty
        if (impact > 3) {
          s.vy = impact * RESTITUTION
          s.squash = Math.min(0.32, impact * 0.022)
        } else {
          s.vy = 0
          s.falling = false
        }
      }
    } else {
      s.vy += (-OMEGA * OMEGA * (s.y - ty) - 2 * ZETA * OMEGA * s.vy) * dt
      s.y += s.vy * dt
    }
    s.squash *= Math.exp(-dt * 13)

    const t = state.clock.elapsedTime + phase
    let scale = 1
    let flash = 0
    let rz = Math.sin(t * 1.3) * 0.05
    let lift = 0
    let px = 0
    let py = 0
    let ry = 0
    if (icon && !clearing) {
      // chuyển động riêng của từng hệ
      if (tile.type === 'hoa') {
        scale *= 1 + Math.sin(t * 9) * 0.03 + Math.sin(t * 23) * 0.02
        flash = 0.12 + Math.max(0, Math.sin(t * 13) * Math.sin(t * 7.3)) * 0.25
        rz = Math.sin(t * 11) * 0.03
      } else if (tile.type === 'thuy') {
        py = Math.sin(t * 2.2) * 0.04
        scale *= 1 + Math.sin(t * 2.2) * 0.03
        rz = Math.sin(t * 1.1) * 0.04
      } else if (tile.type === 'moc') {
        rz = Math.sin(t * 1.8) * 0.13
        px = Math.sin(t * 1.8) * 0.02
      } else if (tile.type === 'kim') {
        ry = Math.sin(t * 1.6) * 0.4
        flash = Math.max(0, Math.sin(t * 1.6 - 0.4)) * 0.18
      } else {
        const rumble = Math.sin(t * 0.9) > 0.82 ? 1 : 0
        px = Math.sin(t * 45) * 0.016 * rumble
        py = Math.sin(t * 38) * 0.01 * rumble
        rz = 0
      }
    }
    if (selected && !clearing) {
      scale = 1.12 + Math.sin(t * 10) * 0.05
      lift = 0.3
      rz += Math.sin(t * 7) * 0.12
      flash = 0.35 + Math.sin(t * 8) * 0.15
    }
    if (blink && !clearing) {
      // chớp tắt dứt khoát (~3 lần/giây), cả hai ngọc cùng nhịp (không cộng phase riêng)
      const on = Math.sin(state.clock.elapsedTime * 19) > 0
      flash = on ? 1 : 0
      scale = on ? 1.18 : 0.92
      lift = on ? 0.25 : 0
    }
    if (tile.special && !clearing) {
      scale *= 1 + Math.sin(t * 5) * 0.06
      flash = Math.max(flash, 0.45 + Math.sin(t * 5) * 0.25)
    }
    if (clearing) {
      if (s.clearT < 0) s.clearT = 0
      s.clearT += dt
      const k = clamp01(s.clearT / CLEAR_S)
      scale = k < 0.3 ? 1 + 0.4 * (k / 0.3) : 1.4 * (1 - Math.pow((k - 0.3) / 0.7, 1.5))
      rz += k * 3
      flash = 1 - k * 0.4
    }

    g.position.set(s.x + px, s.y + py, 0.35 + lift)
    n.scale.set(scale * (1 + s.squash * 0.9), scale * (1 - s.squash), scale * (1 + s.squash * 0.9))
    n.rotation.z = rz
    n.rotation.y = ry
    for (const { mat, base } of gem.materials) mat.emissive.copy(base).lerp(white, flash)
    if (halo.current) (halo.current.material as THREE.MeshBasicMaterial).opacity = 0.18 + Math.sin(t * 5) * 0.08
  })

  return (
    <group ref={group} position={[cellX(col), cellY(tile.spawnRow ?? row), 0.35]}>
      <group ref={inner}>
        <primitive object={gem.root} />
        {icon && !clearing && <GemAura type={tile.type} />}
        {tile.special && (
          <>
            <mesh ref={halo}>
              <sphereGeometry args={[0.62, 16, 12]} />
              <meshBasicMaterial color="#fff" transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
            <sprite position={[0.3, 0.32, 0.45]} scale={[0.42, 0.42, 1]}>
              <spriteMaterial map={emojiTexture(tile.special === 'bomb' ? '💣' : '⚡')} depthWrite={false} />
            </sprite>
          </>
        )}
      </group>
      {clearing && <GemBurst color={GEM_COLOR[tile.type]} />}
    </group>
  )
}

export default memo(TileView)
