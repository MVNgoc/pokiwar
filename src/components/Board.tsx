import { useRef, useState } from 'react'
import { BOARD_SIZE } from '../game/constants'
import { areAdjacent } from '../game/board'
import type { Board as BoardData, Position } from '../game/types'
import Tile from './Tile'

interface Props {
  board: BoardData
  clearing: Set<number>
  locked: boolean
  onSwap: (a: Position, b: Position) => void
}

const DRAG_THRESHOLD = 18

export default function Board({ board, clearing, locked, onSwap }: Props) {
  const [selected, setSelected] = useState<Position | null>(null)
  const drag = useRef<{ pos: Position; x: number; y: number } | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const cellFromEvent = (e: React.PointerEvent): Position | null => {
    const rect = ref.current!.getBoundingClientRect()
    const c = Math.floor(((e.clientX - rect.left) / rect.width) * BOARD_SIZE)
    const r = Math.floor(((e.clientY - rect.top) / rect.height) * BOARD_SIZE)
    return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE ? { r, c } : null
  }

  const down = (e: React.PointerEvent) => {
    if (locked) return
    const pos = cellFromEvent(e)
    if (pos) drag.current = { pos, x: e.clientX, y: e.clientY }
  }

  const move = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || locked) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    if (Math.max(Math.abs(dx), Math.abs(dy)) < DRAG_THRESHOLD) return
    const to =
      Math.abs(dx) > Math.abs(dy) ? { r: d.pos.r, c: d.pos.c + Math.sign(dx) } : { r: d.pos.r + Math.sign(dy), c: d.pos.c }
    drag.current = null
    setSelected(null)
    if (to.r >= 0 && to.r < BOARD_SIZE && to.c >= 0 && to.c < BOARD_SIZE) onSwap(d.pos, to)
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
    <div
      ref={ref}
      className="relative aspect-square touch-none rounded-2xl border-4 border-amber-900 bg-stone-900/80 shadow-xl"
      style={{ width: 'min(calc(100vw - 16px), 52dvh)' }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerLeave={() => (drag.current = null)}
    >
      {board.flatMap((row, r) =>
        row.map((tile, c) =>
          tile ? (
            <Tile
              key={tile.id}
              tile={tile}
              row={r}
              col={c}
              size={BOARD_SIZE}
              selected={selected?.r === r && selected?.c === c}
              clearing={clearing.has(tile.id)}
            />
          ) : null,
        ),
      )}
    </div>
  )
}
