import type { Board as BoardData, Position } from '../game/types'
import BoardScene from '../three/BoardScene'

interface Props {
  board: BoardData
  clearing: Set<number>
  locked: boolean
  notice?: string | null
  /** hai ô kẻ địch sắp đổi (nhá cho người chơi thấy) */
  hint?: [Position, Position] | null
  /** gợi ý cho người chơi: hai ô chớp tắt */
  blink?: [Position, Position] | null
  /** lượt kẻ địch: làm tối bàn cờ */
  dim?: boolean
  onSwap: (a: Position, b: Position) => void
}

/** Bàn cờ 3D (khung HTML + cảnh three.js). Toàn bộ logic xếp ngọc nằm trong `src/game`. */
export default function Board({ board, clearing, locked, notice, hint, blink, dim, onSwap }: Props) {
  return (
    <div
      className={`relative aspect-square w-[min(calc(100vw-16px),52dvh)] touch-none overflow-hidden rounded-2xl border-4 bg-stone-900/80 shadow-xl lg:w-[min(40vw,calc(100dvh-120px),780px)] transition-[filter,border-color] duration-300 ${
        dim ? 'border-red-900 brightness-75 saturate-75' : 'border-amber-900'
      }`}
    >
      <BoardScene board={board} clearing={clearing} locked={locked} hint={hint} blink={blink} onSwap={onSwap} />
      {notice && (
        <div className="notice-pop absolute inset-0 z-10 flex items-center justify-center bg-black/55">
          <span className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-black text-black shadow-lg">{notice}</span>
        </div>
      )}
    </div>
  )
}
