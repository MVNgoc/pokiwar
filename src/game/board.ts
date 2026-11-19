import { BALANCE, BOARD_SIZE, ELEMENTS, MIN_MATCH } from './constants'
import type { Board, Element, GemCounts, Hazard, ObstacleKind, Position, Special, StageRule, Tile } from './types'

let nextId = 1
const newTile = (type: Element): Tile => ({ id: nextId++, type })
const randomElement = (): Element => ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)]

/** Ô có đổi chỗ được không: không phải đá, không bị đóng băng. */
export const isMovable = (t: Tile | null | undefined): t is Tile => !!t && !t.block && !t.ice

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
        if (!(cur && prev && !cur.block && !prev.block && cur.type === prev.type)) {
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
  /** Ngọc đóng băng bị match/nổ trúng: tan băng nhưng ngọc vẫn ở lại */
  thawed: Position[]
  /** Khối đá bị đánh trúng nhưng chưa vỡ (giảm độ bền) */
  cracked: Position[]
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
  if (!runs.length) return { cleared: [], spawns: [], gems, thawed: [], cracked: [] }

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
    if (board[pos.r][pos.c]?.special || board[pos.r][pos.c]?.ice) return // ô đã là ngọc đặc biệt (sẽ kích hoạt) hoặc đang đóng băng: không nâng cấp
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

  // Chướng ngại: băng tan thay vì ngọc bị xoá; đá liền kề ô vừa nổ bị nứt rồi vỡ; đá nằm trong vùng nổ vỡ ngay
  const thawed: Position[] = []
  const cracked: Position[] = []
  const sources = [...cleared.values()].filter((p) => !board[p.r][p.c]?.block)
  for (const [k, p] of [...cleared]) {
    if (board[p.r][p.c]?.ice) {
      thawed.push(p)
      cleared.delete(k)
    }
  }
  const touched = new Set<string>()
  for (const p of [...sources]) for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) touched.add(posKey({ r: p.r + dr, c: p.c + dc }))
  for (let r = 0; r < BOARD_SIZE; r++)
    for (let c = 0; c < BOARD_SIZE; c++) {
      const t = board[r][c]
      if (t?.block !== 'rock' || cleared.has(posKey({ r, c })) || !touched.has(posKey({ r, c }))) continue
      if ((t.hp ?? BALANCE.rockHp) <= 1) cleared.set(posKey({ r, c }), { r, c })
      else cracked.push({ r, c })
    }

  const spawns = [...spawnMap.values()].filter((s) => cleared.has(posKey(s.pos)))
  const spawnKeys = new Set(spawns.map((s) => posKey(s.pos)))
  const counted = [...cleared.values()]
  for (const k of spawnKeys) cleared.delete(k)
  return { cleared: [...cleared.values()], spawns, gems: countGems(board, counted), thawed, cracked }
}

/** Xoá các ô đã resolve và nâng cấp ô sinh ngọc đặc biệt. */
export function applyResolution(board: Board, res: Resolution): Board {
  const next = removeTiles(board, res.cleared)
  for (const { pos, special } of res.spawns) {
    const t = next[pos.r][pos.c]
    if (t) next[pos.r][pos.c] = { ...t, special }
  }
  for (const { r, c } of res.thawed) {
    const t = next[r][c]
    if (t) next[r][c] = { ...t, ice: false }
  }
  for (const { r, c } of res.cracked) {
    const t = next[r][c]
    if (t) next[r][c] = { ...t, hp: (t.hp ?? BALANCE.rockHp) - 1 }
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
  return areAdjacent(a, b) && isMovable(board[a.r][a.c]) && isMovable(board[b.r][b.c]) && findMatches(swapTiles(board, a, b)).length > 0
}

/** Mọi nước đi hợp lệ (hoán đổi 2 ô liền kề tạo được match). */
export function listMoves(board: Board): [Position, Position][] {
  const out: [Position, Position][] = []
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const here = { r, c }
      if (c + 1 < BOARD_SIZE && isValidSwap(board, here, { r, c: c + 1 })) out.push([here, { r, c: c + 1 }])
      if (r + 1 < BOARD_SIZE && isValidSwap(board, here, { r: r + 1, c })) out.push([here, { r: r + 1, c }])
    }
  }
  return out
}

/** Gợi ý cho người chơi: nước đi ăn được nhiều ngọc nhất (ưu tiên ngọc đặc biệt). null nếu hết nước. */
export function suggestMove(board: Board): [Position, Position] | null {
  let best: [Position, Position] | null = null
  let bestScore = -1
  for (const mv of listMoves(board)) {
    const res = resolveMatches(swapTiles(board, mv[0], mv[1]), mv)
    const score = res.cleared.length + res.spawns.length * 3
    if (score > bestScore) {
      bestScore = score
      best = mv
    }
  }
  return best
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
    if (t && !t.block) counts[t.type]++
  }
  return counts
}

const wouldMatch = (board: Board, r: number, c: number, type: Element): boolean => {
  const same = (rr: number, cc: number) => {
    const t = board[rr]?.[cc]
    return !!t && !t.block && t.type === type
  }
  return (
    (same(r, c - 1) && same(r, c - 2)) || (same(r, c + 1) && same(r, c + 2)) || (same(r, c - 1) && same(r, c + 1)) ||
    (same(r - 1, c) && same(r - 2, c)) || (same(r + 1, c) && same(r + 2, c)) || (same(r - 1, c) && same(r + 1, c))
  )
}

/**
 * Thả chướng ngại lên bàn cờ: đá thay thế một ngọc thường (khối nặng, độ bền `BALANCE.rockHp`),
 * băng bọc một ngọc thường. Không chạm ngọc đặc biệt hay ô đã có chướng ngại.
 */
export function placeObstacles(board: Board, kind: ObstacleKind, count: number, rand: () => number = Math.random): Board {
  const next = board.map((row) => [...row])
  const cells: Position[] = []
  for (let r = 0; r < BOARD_SIZE; r++)
    for (let c = 0; c < BOARD_SIZE; c++) {
      const t = next[r][c]
      if (t && !t.special && !t.block && !t.ice) cells.push({ r, c })
    }
  for (let n = 0; n < count && cells.length; n++) {
    const { r, c } = cells.splice(Math.floor(rand() * cells.length), 1)[0]
    const t = next[r][c]!
    next[r][c] = kind === 'rock' ? { id: nextId++, type: 'tho', block: 'rock', hp: BALANCE.rockHp } : { ...t, ice: true }
  }
  return next
}

export const applyHazard = (board: Board, h: Hazard | undefined, rand?: () => number): Board => (h ? placeObstacles(board, h.kind, h.count, rand) : board)

/** Chướng ngại do luật màn đặt lúc vào trận. */
export function ruleHazard(rule?: StageRule): Hazard | undefined {
  if (rule?.type === 'rubble') return { kind: 'rock', count: BALANCE.rubbleCount }
  if (rule?.type === 'frost') return { kind: 'ice', count: BALANCE.frostCount }
  return undefined
}

/** Dọn sạch chướng ngại (sang trận mới): đá đổi lại thành ngọc thường, băng tan. */
export function clearObstacles(board: Board): Board {
  const next = board.map((row) => [...row])
  for (let r = 0; r < BOARD_SIZE; r++)
    for (let c = 0; c < BOARD_SIZE; c++) {
      const t = next[r][c]
      if (t?.block) {
        const options = ELEMENTS.filter((e) => !wouldMatch(next, r, c, e))
        next[r][c] = newTile((options.length ? options : ELEMENTS)[Math.floor(Math.random() * (options.length || ELEMENTS.length))])
      } else if (t?.ice) next[r][c] = { ...t, ice: false }
    }
  return next
}

export const hasObstacles = (board: Board): boolean => board.some((row) => row.some((t) => t && (t.block || t.ice)))
