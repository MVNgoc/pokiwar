import { BALANCE, COUNTER, ENEMIES, TOTAL_STAGES } from './constants'
import type { BattleState, Combatant, PetForm, Element, EnemyState, FloatEvent, GemCounts, Pet, Side } from './types'

export interface Result {
  state: BattleState
  events: FloatEvent[]
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
export const otherSide = (s: Side): Side => (s === 'player' ? 'enemy' : 'player')

/** Hệ số sát thương khi `attacker` đánh `defender` (tương khắc ngũ hành). */
export function matchup(attacker: Element, defender: Element): number {
  if (COUNTER[attacker] === defender) return BALANCE.advantage
  if (COUNTER[defender] === attacker) return BALANCE.disadvantage
  return 1
}

/** Hệ số tương khắc của `side` đánh bên kia. Boss vô hệ nên luôn là 1. */
export function sideMatchup(s: BattleState, side: Side): number {
  if (s.enemy.boss) return 1
  return side === 'player' ? matchup(s.pet.element, s.enemy.element) : matchup(s.enemy.element, s.pet.element)
}

const matchupEvent = (side: Side, mult: number): FloatEvent[] =>
  mult > 1 ? [{ side, text: 'Khắc chế!', kind: 'combo' }] : mult < 1 ? [{ side, text: 'Bị kháng', kind: 'shield' }] : []

export function createEnemy(stage: number): EnemyState {
  const base = ENEMIES[(stage - 1) % ENEMIES.length]
  const boss = stage >= TOTAL_STAGES
  const bossMul = boss ? BALANCE.bossPower : 1
  const maxHp = Math.round((BALANCE.enemyHp + (stage - 1) * BALANCE.enemyHpStep) * (boss ? BALANCE.bossHp : 1))
  return {
    id: base.id,
    name: boss ? `${base.name} (Boss)` : base.name,
    emoji: base.emoji,
    element: base.element,
    boss,
    hp: maxHp,
    maxHp,
    rage: 0,
    maxRage: BALANCE.maxRage,
    shield: 0,
    power: (BALANCE.enemyPower + (stage - 1) * BALANCE.enemyPowerStep) * bossMul,
    skill: { name: base.skill, damage: Math.round((BALANCE.enemySkillDamage + (stage - 1) * BALANCE.enemySkillStep) * bossMul) },
    stunned: false,
    mistake: boss ? BALANCE.enemyMistakeMin : Math.max(BALANCE.enemyMistakeMin, BALANCE.enemyMistake - (stage - 1) * BALANCE.enemyMistakeStep),
  }
}

/** Dạng tiến hóa hiện tại của pet (tên, chỉ số, chiêu). */
export const currentForm = (s: BattleState): PetForm => s.pet.forms[s.form]

/** XP cần tích lũy (tổng) để lên dạng kế tiếp; null nếu đã ở dạng cuối. */
export const nextEvolveXp = (s: BattleState): number | null => (s.form < s.pet.forms.length - 1 ? BALANCE.evolveXp[s.form] : null)

/**
 * Cộng XP cho pet; đủ mốc thì tiến hóa ngay (có thể liên tiếp nhiều dạng): đổi tên, tăng máu tối đa
 * và sức mạnh, hồi một phần máu. Chiêu mới dùng được từ lần tung kế tiếp.
 */
export function gainXp(s: BattleState, amount: number): Result {
  if (amount <= 0) return { state: s, events: [] }
  let state: BattleState = { ...s, xp: s.xp + amount }
  const events: FloatEvent[] = [{ side: 'player', text: `+${Math.round(amount)} XP`, kind: 'xp' }]
  for (let t = nextEvolveXp(state); t !== null && state.xp >= t; t = nextEvolveXp(state)) {
    const form = state.pet.forms[state.form + 1]
    const gainedHp = form.maxHp - state.player.maxHp
    const hp = Math.min(form.maxHp, state.player.hp + gainedHp + Math.round(form.maxHp * BALANCE.evolveHeal))
    state = { ...state, form: state.form + 1, player: { ...state.player, name: form.name, maxHp: form.maxHp, hp, power: form.power, rageMul: form.rageMul } }
    events.push({ side: 'player', text: `Tiến hóa! ${form.name}`, kind: 'combo' })
  }
  return { state, events }
}

export function createBattle(pet: Pet): BattleState {
  return {
    pet,
    form: 0,
    xp: 0,
    stage: 1,
    status: 'playing',
    score: 0,
    turn: 'player',
    turnLeft: BALANCE.turnMs,
    turnNo: 1,
    player: {
      name: pet.name,
      emoji: pet.emoji,
      element: pet.element,
      hp: pet.maxHp,
      maxHp: pet.maxHp,
      rage: 0,
      maxRage: BALANCE.maxRage,
      shield: 0,
      power: pet.power,
      rageMul: pet.rageMul,
    },
    enemy: createEnemy(1),
  }
}

export function nextStage(s: BattleState): BattleState {
  const stage = s.stage + 1
  const healed = Math.min(s.player.maxHp, s.player.hp + Math.round(s.player.maxHp * 0.3))
  return {
    ...s,
    stage,
    status: 'playing',
    turn: 'player',
    turnLeft: BALANCE.turnMs,
    turnNo: s.turnNo + 1,
    player: { ...s.player, hp: healed },
    enemy: createEnemy(stage),
  }
}

export const comboMultiplier = (combo: number) => 1 + BALANCE.comboStep * (combo - 1)

/** Trừ máu: giáp hấp thụ trước, phần còn lại trừ HP. Trả về lượng máu mất và lượng giáp đã chắn. */
function dealDamage(target: Combatant, dmg: number) {
  const blocked = Math.min(target.shield, dmg)
  const lost = Math.min(target.hp, dmg - blocked)
  target.shield -= blocked
  target.hp -= lost
  return { lost, blocked }
}

const damageEvents = (side: Side, dmg: { lost: number; blocked: number }, kind: 'damage' | 'skill' = 'damage'): FloatEvent[] => [
  ...(dmg.lost > 0 || dmg.blocked === 0 ? [{ side, text: `-${dmg.lost}`, kind } as FloatEvent] : []),
  ...(dmg.blocked > 0 ? [{ side, text: `Chặn ${dmg.blocked}`, kind: 'shield' } as FloatEvent] : []),
]

/**
 * Áp dụng hiệu ứng của 1 đợt ngọc bị phá (1 bước của chuỗi combo) cho bên `side` vừa xếp ngọc.
 * Cùng một công thức cho pet và kẻ địch: Kim/Hỏa gây sát thương, Thủy/Mộc hồi máu,
 * Thổ tạo giáp, ngọc cùng hệ nạp Nộ.
 */
export function applyGems(s: BattleState, side: Side, rawGems: GemCounts, combo: number): Result {
  if (s.status !== 'playing') return { state: s, events: [] }
  const foeSide = otherSide(side)
  const me = { ...s[side] }
  const foe = { ...s[foeSide] }
  const gems = { ...rawGems }
  gems[me.element] *= BALANCE.affinity // sở trường
  const m = comboMultiplier(combo)
  const mu = sideMatchup(s, side)
  const events: FloatEvent[] = []

  const damage = Math.round((gems.kim * BALANCE.kimDamage + gems.hoa * BALANCE.hoaDamage) * m * mu * me.power)
  if (damage > 0) events.push(...damageEvents(foeSide, dealDamage(foe, damage)), ...matchupEvent(foeSide, mu))

  const heal = Math.round((gems.thuy * BALANCE.thuyHeal + gems.moc * BALANCE.mocHeal) * m * me.power)
  if (heal > 0) {
    me.hp = clamp(me.hp + heal, 0, me.maxHp)
    events.push({ side, text: `+${heal}`, kind: 'heal' })
  }
  // Nộ: ngọc cùng hệ nạp nhiều, ngọc hệ khác nạp ít
  const own = rawGems[me.element]
  const others = Object.values(rawGems).reduce((a, b) => a + b, 0) - own
  const rage = Math.round((own * BALANCE.ownRage + others * BALANCE.otherRage) * m * (me.rageMul ?? 1))
  if (rage > 0) {
    me.rage = clamp(me.rage + rage, 0, me.maxRage)
    events.push({ side, text: `+${rage} Nộ`, kind: 'rage' })
  }
  const shield = Math.round(gems.tho * BALANCE.thoShield * m * me.power)
  if (shield > 0) {
    me.shield = Math.min(BALANCE.maxShield, me.shield + shield)
    events.push({ side, text: `+${shield} Giáp`, kind: 'shield' })
  }
  if (combo >= 2) events.push({ side, text: `Combo x${combo}!`, kind: 'combo' })

  let score = s.score
  if (side === 'player') {
    const cleared = Object.values(rawGems).reduce((a, b) => a + b, 0)
    score += Math.round(cleared * 10 * m)
  }
  let next: BattleState = { ...s, score, [side]: me, [foeSide]: foe }
  if (side === 'player') {
    // XP từ ngọc xếp được: ngọc cùng hệ với pet nhiều hơn, combo nhân thêm
    const total = Object.values(rawGems).reduce((a, b) => a + b, 0)
    const xp = (total - rawGems[me.element]) * BALANCE.xpGem + rawGems[me.element] * BALANCE.xpOwnGem
    const g = gainXp(next, xp * m)
    next = g.state
    events.push(...g.events)
  }
  return finalize(next, events)
}

/** Chỉ dùng kỹ năng được trong lượt của mình. */
export const canUseSkill = (s: BattleState) => s.status === 'playing' && s.turn === 'player' && s.player.rage >= s.player.maxRage
export const canEnemyCast = (s: BattleState) => s.status === 'playing' && s.turn === 'enemy' && s.enemy.rage >= s.enemy.maxRage

export function useSkill(s: BattleState): Result {
  if (!canUseSkill(s)) return { state: s, events: [] }
  const k = currentForm(s).skill
  const events: FloatEvent[] = []
  const enemy = { ...s.enemy }
  const player = { ...s.player, rage: 0 }

  if (k.damage) {
    const mu = sideMatchup(s, 'player')
    const dmg = Math.round(k.damage * mu)
    for (let i = 0; i < (k.hits ?? 1); i++) events.push(...damageEvents('enemy', dealDamage(enemy, dmg), 'skill'))
    events.push(...matchupEvent('enemy', mu))
  }
  if (k.healPct) {
    const heal = Math.round(player.maxHp * k.healPct)
    player.hp = Math.min(player.maxHp, player.hp + heal)
    events.push({ side: 'player', text: `+${heal}`, kind: 'heal' })
  }
  if (k.shield) {
    player.shield = Math.min(BALANCE.maxShield, player.shield + k.shield)
    events.push({ side: 'player', text: `+${k.shield} Giáp`, kind: 'shield' })
  }
  if (k.stun) {
    enemy.stunned = true
    events.push({ side: 'enemy', text: 'Choáng!', kind: 'combo' })
  }
  return finalize({ ...s, player, enemy }, events)
}

/** Kẻ địch tung kỹ năng khi đầy Nộ (trong lượt của nó). */
export function enemyCastSkill(s: BattleState): Result {
  if (!canEnemyCast(s)) return { state: s, events: [] }
  const mu = sideMatchup(s, 'enemy')
  const player = { ...s.player }
  const enemy = { ...s.enemy, rage: 0 }
  const events = [...damageEvents('player', dealDamage(player, Math.round(s.enemy.skill.damage * mu)), 'skill'), ...matchupEvent('player', mu)]
  return finalize({ ...s, player, enemy }, events)
}

export function tickTurn(s: BattleState, ms: number): BattleState {
  if (s.status !== 'playing') return s
  return { ...s, turnLeft: Math.max(0, s.turnLeft - ms) }
}

/** Chuyển lượt sang bên kia. Nếu kẻ địch đang bị choáng thì nó mất lượt và lượt quay lại pet. */
export function passTurn(s: BattleState): Result {
  if (s.status !== 'playing') return { state: s, events: [] }
  const next = otherSide(s.turn)
  if (next === 'enemy' && s.enemy.stunned) {
    return {
      state: { ...s, turn: 'player', turnLeft: BALANCE.turnMs, turnNo: s.turnNo + 2, enemy: { ...s.enemy, stunned: false } },
      events: [{ side: 'enemy', text: 'Mất lượt!', kind: 'combo' }],
    }
  }
  return { state: { ...s, turn: next, turnLeft: BALANCE.turnMs, turnNo: s.turnNo + 1 }, events: [] }
}

function finalize(s: BattleState, events: FloatEvent[]): Result {
  let status = s.status
  let state = s
  if (s.player.hp <= 0) status = 'lost'
  else if (s.enemy.hp <= 0) {
    status = s.stage >= TOTAL_STAGES ? 'won' : 'stageClear'
    // Kết liễu kẻ địch: thưởng XP lớn (chỉ một lần khi màn vừa kết thúc)
    if (s.status === 'playing') {
      const g = gainXp(s, BALANCE.xpKill + (s.stage - 1) * BALANCE.xpKillStep)
      state = g.state
      events = [...events, ...g.events]
    }
  }
  return { state: { ...state, status }, events }
}
