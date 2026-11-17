/**
 * Mô phỏng cân bằng theo lượt: bot đóng vai người chơi, kẻ địch dùng AI thật của game.
 * Chạy: npx tsx scripts/sim.ts [số ván]
 * Thử thông số mà không sửa code:  BAL='{"enemyPower":0.5}' SKILLS=greedy npx tsx scripts/sim.ts 60
 *
 * Mỗi lượt đi 1 nước trên bàn cờ chung; kỹ năng dùng ngay khi đủ Nộ. Giới hạn thời gian lượt
 * không được mô phỏng (bot đi ngay), nên số liệu là cận trên cho người chơi chậm.
 */
import { chooseEnemyMove } from '../src/game/ai'
import { applyResolution, collapse, createBoard, hasPossibleMove, listMoves, resolveMatches, swapTiles } from '../src/game/board'
import { applyGems, canEnemyCast, canUseSkill, createBattle, enemyCastSkill, nextStage, passTurn, useSkill } from '../src/game/combat'
import { BALANCE, TOTAL_STAGES } from '../src/game/constants'
import { PETS } from '../src/game/pets'
import type { Board, BattleState, Position, Side } from '../src/game/types'

type Skill = 'smart' | 'greedy' | 'random'

function play(board: Board, battle: BattleState, side: Side, a: Position, b: Position) {
  let cur = swapTiles(board, a, b)
  let combo = 0
  let preferred = [a, b]
  for (;;) {
    const res = resolveMatches(cur, preferred)
    if (!res.cleared.length) break
    preferred = []
    combo++
    battle = applyGems(battle, side, res.gems, combo).state
    cur = collapse(applyResolution(cur, res))
    if (battle.status !== 'playing') break
  }
  if (!hasPossibleMove(cur)) cur = createBoard()
  return { board: cur, battle }
}

function pickPlayerMove(board: Board, battle: BattleState, skill: Skill): [Position, Position] {
  if (skill === 'smart') return chooseEnemyMove(board, battle, Math.random, 0.1, 'player') ?? listMoves(board)[0]
  const moves = listMoves(board)
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

function runGame(petIndex: number, skill: Skill) {
  let board = createBoard()
  let battle = createBattle(PETS[petIndex])
  let turns = 0
  while ((battle.status === 'playing' || battle.status === 'stageClear') && turns < 1500) {
    if (battle.status === 'stageClear') {
      battle = nextStage(battle)
      continue
    }
    turns++
    if (battle.turn === 'player') {
      if (canUseSkill(battle)) battle = useSkill(battle).state
      if (battle.status !== 'playing') continue
      const [a, b] = pickPlayerMove(board, battle, skill)
      ;({ board, battle } = play(board, battle, 'player', a, b))
    } else {
      if (canEnemyCast(battle)) battle = enemyCastSkill(battle).state
      if (battle.status !== 'playing') continue
      const mv = chooseEnemyMove(board, battle)
      if (mv) ({ board, battle } = play(board, battle, 'enemy', mv[0], mv[1]))
    }
    if (battle.status === 'playing') battle = passTurn(battle).state
  }
  return { won: battle.status === 'won', stage: battle.stage, turns }
}

if (process.env.BAL) Object.assign(BALANCE, JSON.parse(process.env.BAL))
const SKILLS = (process.env.SKILLS ?? 'smart,greedy,random').split(',') as Skill[]
const N = Number(process.argv[2] ?? 200)
console.log(`Mô phỏng ${N} ván/pet, ${TOTAL_STAGES} màn, theo lượt\n`)
for (const skill of SKILLS) {
  console.log(`== Bot ${{ smart: 'thông minh (chấm điểm theo hiệu ứng, như người chơi giỏi)', greedy: 'khá (chọn nước ăn nhiều ngọc nhất)', random: 'ngẫu nhiên (nước hợp lệ bất kỳ)' }[skill]} ==`)
  let totalWin = 0
  for (let i = 0; i < PETS.length; i++) {
    let wins = 0
    let stageSum = 0
    let turnSum = 0
    for (let g = 0; g < N; g++) {
      const r = runGame(i, skill)
      if (r.won) wins++
      stageSum += r.stage
      turnSum += r.turns
    }
    totalWin += wins
    console.log(
      `${PETS[i].emoji} ${PETS[i].name.padEnd(9)} thắng ${((wins / N) * 100).toFixed(0).padStart(3)}%  màn TB ${(stageSum / N).toFixed(2)}  lượt TB ${(turnSum / N).toFixed(0)}`,
    )
  }
  console.log(`   → trung bình ${((totalWin / (N * PETS.length)) * 100).toFixed(0)}%\n`)
}
