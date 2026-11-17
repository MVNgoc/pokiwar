import { BOARD_SIZE, ELEMENTS, MIN_MATCH } from './constants'
import type { Board, Element, GemCounts, Position, Tile } from './types'

let nextId = 1
const newTile = (type: Element): Tile => ({ id: nextId++, type })
const randomElement = (): Element => ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)]

export const posKey = (p: Position) => `${p.r},${p.c}`

export function areAdjacent(a: Position, b: Position): boolean {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1
}

/** Tạo bàn cờ ngẫu nhiên, không có sẵn chuỗi match và chắc chắn còn nước đi. */
export function createBoard(): Board {
  for (;;) {
    const board: Board = []
    for (let r = 0; r < BOARD_SIZE; r++) {
      const row: (Tile | null)[] = []
      for (let c = 0; c < BOARD_SIZE; c++) {
        let type: Element
        do {
          type = randomElement()
        } while (
          (c >= 2 && row[c - 1]?.type === type && row[c - 2]?.type === type) ||
          (r >= 2 && board[r - 1][c]?.type === type && board[r - 2][c]?.type === type)
        )
        row.push(newTile(type))
      }
      board.push(row)
    }
    if (hasPossibleMove(board)) return board
  }
}

/** Tìm mọi ô thuộc chuỗi ≥3 ngọc giống nhau (ngang hoặc dọc). */
export function findMatches(board: Board): Position[] {
  const found = new Map<string, Position>()
  const mark = (r: number, c: number) => found.set(`${r},${c}`, { r, c })

  for (let r = 0; r < BOARD_SIZE; r++) {
    let run = 1
    for (let c = 1; c <= BOARD_SIZE; c++) {
      const prev = board[r][c - 1]
      const cur = c < BOARD_SIZE ? board[r][c] : null
      if (cur && prev && cur.type === prev.type) {
        run++
      } else {
        if (run >= MIN_MATCH) for (let k = 1; k <= run; k++) mark(r, c - k)
        run = 1
      }
    }
  }
  for (let c = 0; c < BOARD_SIZE; c++) {
    let run = 1
    for (let r = 1; r <= BOARD_SIZE; r++) {
      const prev = board[r - 1][c]
      const cur = r < BOARD_SIZE ? board[r][c] : null
      if (cur && prev && cur.type === prev.type) {
        run++
      } else {
        if (run >= MIN_MATCH) for (let k = 1; k <= run; k++) mark(r - k, c)
        run = 1
      }
    }
  }
  return [...found.values()]
}

export function swapTiles(board: Board, a: Position, b: Position): Board {
  const next = board.map((row) => [...row])
  const tmp = next[a.r][a.c]
  next[a.r][a.c] = next[b.r][b.c]
  next[b.r][b.c] = tmp
  return next
}

/** Nước đi hợp lệ = sau khi hoán đổi tạo ra ít nhất 1 match. */
export function isValidSwap(board: Board, a: Position, b: Position): boolean {
  return areAdjacent(a, b) && findMatches(swapTiles(board, a, b)).length > 0
}

export function hasPossibleMove(board: Board): boolean {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const here = { r, c }
      if (c + 1 < BOARD_SIZE && isValidSwap(board, here, { r, c: c + 1 })) return true
      if (r + 1 < BOARD_SIZE && isValidSwap(board, here, { r: r + 1, c })) return true
    }
  }
  return false
}

export function removeTiles(board: Board, positions: Position[]): Board {
  const next = board.map((row) => [...row])
  for (const { r, c } of positions) next[r][c] = null
  return next
}

/** Ngọc rơi xuống lấp chỗ trống, ngọc mới sinh ra ở trên cùng. */
export function collapse(board: Board): Board {
  const next: Board = Array.from({ length: BOARD_SIZE }, () => Array<Tile | null>(BOARD_SIZE).fill(null))
  for (let c = 0; c < BOARD_SIZE; c++) {
    let write = BOARD_SIZE - 1
    for (let r = BOARD_SIZE - 1; r >= 0; r--) {
      const t = board[r][c]
      if (t) next[write--][c] = t
    }
    while (write >= 0) next[write--][c] = newTile(randomElement())
  }
  return next
}

export function countGems(board: Board, positions: Position[]): GemCounts {
  const counts: GemCounts = { kim: 0, moc: 0, thuy: 0, hoa: 0, tho: 0 }
  for (const { r, c } of positions) {
    const t = board[r][c]
    if (t) counts[t.type]++
  }
  return counts
}
