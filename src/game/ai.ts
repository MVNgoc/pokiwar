import { BALANCE } from './constants'
import { listMoves, resolveMatches, swapTiles } from './board'
import { sideMatchup } from './combat'
import type { BattleState, Board, Position, Side } from './types'

export type Move = [Position, Position]

/**
 * Giá trị của một nước đi với bên `side`: ước lượng hiệu ứng của các ngọc bị phá ở bước đầu
 * (sát thương, hồi máu khi bị thương, giáp, Nộ, ngọc đặc biệt) bằng đúng công thức chiến đấu.
 */
export function scoreMove(board: Board, s: BattleState, move: Move, side: Side = 'enemy'): number {
  const me = s[side]
  const foe = s[side === 'enemy' ? 'player' : 'enemy']
  const res = resolveMatches(swapTiles(board, move[0], move[1]), move)
  const raw = { ...res.gems }
  const g = { ...res.gems }
  g[me.element] *= BALANCE.affinity
  const mu = sideMatchup(s, side)
  const hurt = 1 - me.hp / me.maxHp // càng bị thương càng cần hồi máu
  let value = 0
  value += (g.kim * BALANCE.kimDamage + g.hoa * BALANCE.hoaDamage) * mu * me.power * (foe.shield > 20 ? 0.8 : 1)
  value += (g.thuy * BALANCE.thuyHeal + g.moc * BALANCE.mocHeal) * me.power * (0.3 + 2 * hurt)
  value += g.tho * BALANCE.thoShield * me.power * 0.7
  const own = raw[me.element]
  const others = Object.values(raw).reduce((a, b) => a + b, 0) - own
  value += (own * BALANCE.ownRage + others * BALANCE.otherRage) * 0.35 // gần đầy Nộ thì kỹ năng đáng giá
  value += res.spawns.length * 6
  return value
}

/**
 * Kẻ địch chọn nước đi: thường chọn nước giá trị nhất, nhưng với xác suất `enemy.mistake`
 * đi nước ngẫu nhiên (màn đầu hay sai, màn sau ít sai).
 */
export function chooseEnemyMove(board: Board, s: BattleState, rand: () => number = Math.random, mistake = s.enemy.mistake, side: Side = 'enemy'): Move | null {
  const moves = listMoves(board)
  if (!moves.length) return null
  if (rand() < mistake) return moves[Math.floor(rand() * moves.length)]
  let best = moves[0]
  let bestValue = -Infinity
  for (const m of moves) {
    const v = scoreMove(board, s, m, side) + rand() * 1.5
    if (v > bestValue) {
      bestValue = v
      best = m
    }
  }
  return best
}
