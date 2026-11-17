import { BOARD_SIZE, ELEMENTS, MIN_MATCH } from './constants'
import type { Board, Element, GemCounts, Position, Special, Tile } from './types'

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

interface Run {
  cells: Position[]
  dir: 'h' | 'v'
}

/** Mọi chuỗi liên tiếp ≥3 ngọc cùng hệ (ngang hoặc dọc). */
export function findRuns(board: Board): Run[] {
  const runs: Run[] = []
  const scan = (dir: 'h' | 'v') => {
    for (let a = 0; a < BOARD_SIZE; a++) {
      let start = 0
      for (let b = 1; b <= BOARD_SIZE; b++) {
        const at = (k: number) => (dir === 'h' ? board[a][k] : board[k][a])
        const prev = at(b - 1)
        const cur = b < BOARD_SIZE ? at(b) : null
        if (!(cur && prev && cur.type === prev.type)) {
          if (b - start >= MIN_MATCH) {
            const cells: Position[] = []
            for (let k = start; k < b; k++) cells.push(dir === 'h' ? { r: a, c: k } : { r: k, c: a })
            runs.push({ cells, dir })
          }
          start = b
        }
      }
    }
  }
  scan('h')
  scan('v')
  return runs
}

/** Tìm mọi ô thuộc chuỗi ≥3 ngọc giống nhau (ngang hoặc dọc). */
export function findMatches(board: Board): Position[] {
  const found = new Map<string, Position>()
  for (const run of findRuns(board)) for (const p of run.cells) found.set(posKey(p), p)
  return [...found.values()]
}

export interface Resolution {
  /** Các ô bị xoá (gồm cả ô bị ngọc đặc biệt kích hoạt, trừ ô sinh ra ngọc đặc biệt mới) */
  cleared: Position[]
  /** Ngọc đặc biệt mới sinh ra: ô giữ lại và nâng cấp thay vì bị xoá */
  spawns: { pos: Position; special: Special }[]
  gems: GemCounts
}

/** Vùng ảnh hưởng của ngọc đặc biệt tại `at`. */
function blastArea(special: Special, at: Position): Position[] {
  const out: Position[] = []
  if (special === 'bomb') {
    for (let r = at.r - 1; r <= at.r + 1; r++)
      for (let c = at.c - 1; c <= at.c + 1; c++) if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) out.push({ r, c })
  } else {
    for (let k = 0; k < BOARD_SIZE; k++) out.push({ r: at.r, c: k }, { r: k, c: at.c })
  }
  return out
}

/**
 * Xử lý 1 bước match: tìm chuỗi, quyết định ngọc đặc biệt sinh ra (4 → bomb, 5+ → lightning,
 * chữ L/T → bomb), rồi lan truyền kích hoạt các ngọc đặc biệt bị phá.
 * `preferred`: ô người chơi vừa hoán đổi — ngọc đặc biệt ưu tiên sinh ra ở đó.
 */
export function resolveMatches(board: Board, preferred: Position[] = []): Resolution {
  const runs = findRuns(board)
  const gems = countGems(board, [])
  if (!runs.length) return { cleared: [], spawns: [], gems }

  const matched = new Map<string, Position>()
  const inH = new Set<string>()
  const inV = new Set<string>()
  for (const run of runs)
    for (const p of run.cells) {
      matched.set(posKey(p), p)
      ;(run.dir === 'h' ? inH : inV).add(posKey(p))
    }

  const spawnMap = new Map<string, { pos: Position; special: Special }>()
  const addSpawn = (pos: Position, special: Special) => {
    const k = posKey(pos)
    if (board[pos.r][pos.c]?.special) return // ô đã là ngọc đặc biệt: sẽ kích hoạt, không nâng cấp
    if (special === 'bomb' && spawnMap.has(k)) return
    spawnMap.set(k, { pos, special })
  }
  for (const run of runs) {
    if (run.cells.length < 4) continue
    const pick = preferred.find((p) => run.cells.some((c) => c.r === p.r && c.c === p.c))
    addSpawn(pick ?? run.cells[Math.floor(run.cells.length / 2)], run.cells.length >= 5 ? 'lightning' : 'bomb')
  }
  for (const k of inH) if (inV.has(k)) addSpawn(matched.get(k)!, 'bomb') // chữ L / T / +

  // Kích hoạt dây chuyền các ngọc đặc biệt nằm trong vùng bị phá
  const cleared = new Map(matched)
  const queue = [...matched.values()]
  while (queue.length) {
    const p = queue.pop()!
    const special = board[p.r][p.c]?.special
    if (!special) continue
    for (const q of blastArea(special, p)) {
      if (!cleared.has(posKey(q))) {
        cleared.set(posKey(q), q)
        queue.push(q)
      }
    }
  }

  const spawns = [...spawnMap.values()].filter((s) => cleared.has(posKey(s.pos)))
  const spawnKeys = new Set(spawns.map((s) => posKey(s.pos)))
  const counted = [...cleared.values()]
  for (const k of spawnKeys) cleared.delete(k)
  return { cleared: [...cleared.values()], spawns, gems: countGems(board, counted) }
}

/** Xoá các ô đã resolve và nâng cấp ô sinh ngọc đặc biệt. */
export function applyResolution(board: Board, res: Resolution): Board {
  const next = removeTiles(board, res.cleared)
  for (const { pos, special } of res.spawns) {
    const t = next[pos.r][pos.c]
    if (t) next[pos.r][pos.c] = { ...t, special }
  }
  return next
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
    const missing = write + 1
    while (write >= 0) {
      next[write][c] = { ...newTile(randomElement()), spawnRow: write - missing }
      write--
    }
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
