import { BOSSES, ELEMENTS, ENEMIES, RUN_LENGTH } from './constants'
import type { IconName } from '../components/Icon'
import type { Element, NodeKind, StageDef, StageRule } from './types'

type Rand = () => number
const pick = <T,>(arr: T[], rand: Rand): T => arr[Math.floor(rand() * arr.length)]

export const NODE_INFO: Record<NodeKind, { label: string; icon: IconName }> = {
  normal: { label: 'Trận thường', icon: 'sword' },
  elite: { label: 'Tinh anh', icon: 'skull' },
  rest: { label: 'Điểm nghỉ', icon: 'camp' },
  boss: { label: 'Boss', icon: 'crown' },
}

export const RULE_INFO: Record<StageRule['type'], { label: string; icon: IconName }> = {
  limit: { label: 'Giới hạn lượt', icon: 'timer' },
  surge: { label: 'Cộng hưởng', icon: 'swirl' },
  swift: { label: 'Chớp nhoáng', icon: 'bolt' },
  rubble: { label: 'Đống đổ nát', icon: 'rock' },
  frost: { label: 'Băng giá', icon: 'snow' },
}

export function ruleText(rule: StageRule, elementLabel: (e: Element) => string): string {
  if (rule.type === 'limit') return `Quá ${rule.turns} lượt kẻ địch sẽ cuồng nộ`
  if (rule.type === 'surge') return `Ngọc ${elementLabel(rule.element!)} mạnh x1.5, hệ khác yếu đi`
  if (rule.type === 'rubble') return 'Bàn cờ có sẵn đá chắn đường'
  if (rule.type === 'frost') return 'Bàn cờ có sẵn ngọc bị đóng băng'
  return 'Đồng hồ lượt của bạn rút còn 7 giây'
}

function makeRule(kind: NodeKind, level: number, rand: Rand): StageRule | undefined {
  if (kind === 'boss' || kind === 'rest' || level < 1.5 || rand() > 0.4) return undefined
  const types: StageRule['type'][] = kind === 'elite' ? ['surge', 'swift', 'rubble', 'frost'] : ['limit', 'surge', 'swift', 'rubble', 'frost']
  const type = pick(types, rand)
  if (type === 'limit') return { type, turns: 9 + Math.floor(rand() * 3) }
  if (type === 'surge') return { type, element: pick(ELEMENTS, rand) }
  return { type }
}

/**
 * Sinh chuyến đi mới: độ dài ngẫu nhiên, Boss ở cuối, điểm nghỉ trước Boss, 1-2 Tinh anh và có thể
 * thêm một điểm nghỉ giữa đường. Kẻ địch mạnh dần theo tiến độ (level 1 → 5), không lặp lại trong một chuyến.
 */
export function buildRun(rand: Rand = Math.random): StageDef[] {
  const [lo, hi] = RUN_LENGTH
  const len = lo + Math.floor(rand() * (hi - lo + 1))
  const kinds: NodeKind[] = Array(len).fill('normal')
  kinds[len - 1] = 'boss'
  kinds[len - 2] = 'rest'
  const free = () => {
    const idx: number[] = []
    for (let i = 2; i < len - 3; i++) if (kinds[i] === 'normal') idx.push(i)
    return idx
  }
  const elites = len >= 9 ? 2 : 1
  for (let n = 0; n < elites; n++) {
    const idx = free()
    if (idx.length) kinds[pick(idx, rand)] = 'elite'
  }
  if (rand() < 0.6) {
    const idx = free().filter((i) => kinds[i - 1] !== 'elite' && kinds[i + 1] !== 'elite')
    if (idx.length) kinds[pick(idx, rand)] = 'rest'
  }

  const used = new Set<string>()
  return kinds.map((kind, i) => {
    const progress = i / (len - 1)
    const level = 1 + 4 * progress
    if (kind === 'rest') return { kind, level }
    if (kind === 'boss') return { kind, level, enemy: pick(BOSSES, rand).id }
    const tier = kind === 'elite' ? (progress < 0.55 ? 2 : 3) : progress < 0.3 ? 1 : progress < 0.65 ? 2 : 3
    let pool = ENEMIES.filter((e) => e.tier === tier && !used.has(e.id))
    if (!pool.length) pool = ENEMIES.filter((e) => e.tier === tier)
    const enemy = pick(pool, rand).id
    used.add(enemy)
    return { kind, level, enemy, rule: makeRule(kind, level, rand) }
  })
}
