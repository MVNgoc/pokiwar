import { Suspense, useRef, useState } from 'react'
import { Canvas, type ThreeEvent } from '@react-three/fiber'
import { areAdjacent } from '../game/board'
import type { Board, Position } from '../game/types'
import { ELEMENTS } from '../game/constants'
import { loadGem } from './gemModels'
import { loadGemIcon } from './gemIcons'
import { Env } from './SceneLights'
import Tile3D, { BOARD_N, cellX, cellY } from './Tile3D'

interface Props {
  board: Board
  clearing: Set<number>
  locked: boolean
  hint?: [Position, Position] | null
  blink?: [Position, Position] | null
  onSwap: (a: Position, b: Position) => void
}

ELEMENTS.forEach((e) => {
  // tải sẵn icon ngọc cá nhân; thiếu thì tải model ngọc 3D
  void loadGemIcon(e).then((icon) => (icon ? null : loadGem(e)))
})

const DRAG_THRESHOLD = 18
const TILT = 0.42 // nghiêng bàn cờ về phía sau (rad)

/** Bàn cờ: khay gỗ tối với các ô xen kẽ để nhìn ra lưới. */
function Tray() {
  const cells = []
  for (let r = 0; r < BOARD_N; r++)
    for (let c = 0; c < BOARD_N; c++)
      cells.push(
        <mesh key={`${r}-${c}`} position={[cellX(c), cellY(r), 0.02]}>
          <planeGeometry args={[0.96, 0.96]} />
          <meshStandardMaterial color={(r + c) % 2 ? '#3b2d24' : '#32261e'} roughness={0.9} />
        </mesh>,
      )
  return (
    <group>
      <mesh position={[0, 0, -0.18]}>
        <boxGeometry args={[BOARD_N + 0.45, BOARD_N + 0.45, 0.36]} />
        <meshStandardMaterial color="#1f1611" roughness={0.8} />
      </mesh>
      {cells}
    </group>
  )
}

function Scene({ board, clearing, locked, hint, blink, onSwap }: Props) {
  const [selected, setSelected] = useState<Position | null>(null)
  const drag = useRef<{ pos: Position; x: number; y: number } | null>(null)

  const cellOf = (e: ThreeEvent<PointerEvent>): Position | null => {
    const p = e.object.worldToLocal(e.point.clone())
    const c = Math.floor(p.x + BOARD_N / 2)
    const r = Math.floor(BOARD_N / 2 - p.y)
    return r >= 0 && r < BOARD_N && c >= 0 && c < BOARD_N ? { r, c } : null
  }

  const down = (e: ThreeEvent<PointerEvent>) => {
    if (locked) return
    const pos = cellOf(e)
    if (pos) drag.current = { pos, x: e.nativeEvent.clientX, y: e.nativeEvent.clientY }
  }

  const move = (e: ThreeEvent<PointerEvent>) => {
    const d = drag.current
    if (!d || locked) return
    const dx = e.nativeEvent.clientX - d.x
    const dy = e.nativeEvent.clientY - d.y
    if (Math.max(Math.abs(dx), Math.abs(dy)) < DRAG_THRESHOLD) return
    const to = Math.abs(dx) > Math.abs(dy) ? { r: d.pos.r, c: d.pos.c + Math.sign(dx) } : { r: d.pos.r + Math.sign(dy), c: d.pos.c }
    drag.current = null
    setSelected(null)
    if (to.r >= 0 && to.r < BOARD_N && to.c >= 0 && to.c < BOARD_N) onSwap(d.pos, to)
  }

  const up = () => {
    const d = drag.current
    drag.current = null
    if (!d || locked) return
    // Click (không kéo): chọn ô, rồi click ô liền kề để hoán đổi
    if (selected && areAdjacent(selected, d.pos)) {
      onSwap(selected, d.pos)
      setSelected(null)
    } else if (selected && selected.r === d.pos.r && selected.c === d.pos.c) {
      setSelected(null)
    } else {
      setSelected(d.pos)
    }
  }

  return (
    <group rotation={[-TILT, 0, 0]}>
      <Tray />
      {board.flatMap((row, r) =>
        row.map((tile, c) =>
          tile ? (
            <Tile3D
              key={tile.id}
              tile={tile}
              row={r}
              col={c}
              clearing={clearing.has(tile.id)}
              blink={!!blink?.some((p) => p.r === r && p.c === c)}
              selected={(selected?.r === r && selected?.c === c) || !!hint?.some((p) => p.r === r && p.c === c)}
            />
          ) : null,
        ),
      )}
      {/* tấm nhận thao tác chuột/chạm phủ toàn bàn cờ */}
      <mesh position={[0, 0, 0.9]} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={() => (drag.current = null)}>
        <planeGeometry args={[BOARD_N, BOARD_N]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}

export default function BoardScene(props: Props) {
  return (
    <Canvas
      style={{ position: 'absolute', inset: 0, touchAction: 'none' }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      camera={{ fov: 32, position: [0, 0, 15.8] }}
    >
      <Env intensity={0.45} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 4, 9]} intensity={2.2} />
      <pointLight position={[-4, -4, 6]} intensity={30} color="#ffb86b" />
      <Suspense fallback={null}>
        <Scene {...props} />
      </Suspense>
    </Canvas>
  )
}
