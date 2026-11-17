/**
 * Mô phỏng cân bằng: bot chơi N ván cho mỗi pet, in tỉ lệ thắng và màn trung bình.
 * Chạy: npx tsx scripts/sim.ts [số ván] [thời gian nghĩ mỗi nước, ms]
 *
 * Mô hình thời gian giống game thật: đồng hồ kẻ địch chỉ chạy khi người chơi "nghĩ",
 * dừng khi bàn cờ đang xử lý combo.
 */
import { applyResolution, collapse, createBoard, hasPossibleMove, isValidSwap, resolveMatches, swapTiles } from '../src/game/board'
import { applyGems, canUseSkill, createBattle, enemyAttack, nextStage, tickEnemyTimer, useSkill } from '../src/game/combat'
import { BALANCE, BOARD_SIZE, TOTAL_STAGES } from '../src/game/constants'
import { PETS } from '../src/game/pets'
import type { Board, BattleState, Position } from '../src/game/types'

type Skill = 'greedy' | 'random'

function allMoves(board: Board): [Position, Position][] {
  const out: [Position, Position][] = []
  for (let r = 0; r < BOARD_SIZE; r++)
    for (let c = 0; c < BOARD_SIZE; c++) {
      const a = { r, c }
      if (c + 1 < BOARD_SIZE && isValidSwap(board, a, { r, c: c + 1 })) out.push([a, { r, c: c + 1 }])
      if (r + 1 < BOARD_SIZE && isValidSwap(board, a, { r: r + 1, c })) out.push([a, { r: r + 1, c }])
    }
  return out
}

function play(board: Board, battle: BattleState, a: Position, b: Position) {
  let cur = swapTiles(board, a, b)
  let combo = 0
  let preferred = [a, b]
  for (;;) {
    const res = resolveMatches(cur, preferred)
    if (!res.cleared.length) break
    preferred = []
    combo++
    battle = applyGems(battle, res.gems, combo).state
    cur = collapse(applyResolution(cur, res))
    if (battle.status !== 'playing') break
  }
  return { board: cur, battle }
}

function pickMove(board: Board, skill: Skill): [Position, Position] {
  const moves = allMoves(board)
  if (skill === 'random') return moves[Math.floor(Math.random() * moves.length)]
  let best = moves[0]
  let bestScore = -1
  for (const m of moves) {
    const score = resolveMatches(swapTiles(board, m[0], m[1]), m).cleared.length + Math.random()
    if (score > bestScore) {
      bestScore = score
      best = m
    }
  }
  return best
}

function runGame(petIndex: number, skill: Skill, thinkMs: number) {
  let board = createBoard()
  let battle = createBattle(PETS[petIndex])
  let moves = 0
  while (battle.status === 'playing' && moves < 2000) {
    if (!hasPossibleMove(board)) board = createBoard()
    if (canUseSkill(battle)) battle = useSkill(battle).state
    if (battle.status === 'stageClear') {
      battle = nextStage(battle)
      continue
    }
    if (battle.status !== 'playing') break
    const [a, b] = pickMove(board, skill)
    ;({ board, battle } = play(board, battle, a, b))
    moves++
    if (battle.status === 'stageClear') {
      battle = nextStage(battle)
      continue
    }
    if (battle.status !== 'playing') break
    // thời gian nghĩ → đồng hồ kẻ địch chạy
    battle = tickEnemyTimer(battle, thinkMs)
    while (battle.status === 'playing' && battle.enemy.timer <= 0) battle = enemyAttack(battle).state
  }
  return { won: battle.status === 'won', stage: battle.stage, moves, score: battle.score }
}

if (process.env.BAL) Object.assign(BALANCE, JSON.parse(process.env.BAL)) // thử thông số: BAL='{"enemyHp":200}'
const SKILLS = (process.env.SKILLS ?? 'greedy,random').split(',') as Skill[]
const N = Number(process.argv[2] ?? 200)
const THINK = Number(process.argv[3] ?? 3000)
console.log(`Mô phỏng ${N} ván/pet, nghĩ ${THINK}ms/nước, ${TOTAL_STAGES} màn\n`)
for (const skill of SKILLS) {
  console.log(`== Bot ${skill === 'greedy' ? 'khá (chọn nước ăn nhiều nhất)' : 'ngẫu nhiên (nước hợp lệ bất kỳ)'} ==`)
  let totalWin = 0
  for (let i = 0; i < PETS.length; i++) {
    let wins = 0
    let stageSum = 0
    let moveSum = 0
    for (let g = 0; g < N; g++) {
      const r = runGame(i, skill, THINK)
      if (r.won) wins++
      stageSum += r.stage
      moveSum += r.moves
    }
    totalWin += wins
    console.log(
      `${PETS[i].emoji} ${PETS[i].name.padEnd(9)} thắng ${((wins / N) * 100).toFixed(0).padStart(3)}%  màn TB ${(stageSum / N).toFixed(2)}  nước TB ${(moveSum / N).toFixed(0)}`,
    )
  }
  console.log(`   → trung bình ${((totalWin / (N * PETS.length)) * 100).toFixed(0)}%\n`)
}
