import { BALANCE, ENEMIES } from './constants'
import type { BattleState, FloatEvent, GemCounts, Pet } from './types'

export interface Result {
  state: BattleState
  events: FloatEvent[]
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

export function createEnemy(stage: number) {
  const base = ENEMIES[(stage - 1) % ENEMIES.length]
  const maxHp = 80 + (stage - 1) * 40
  return {
    ...base,
    hp: maxHp,
    maxHp,
    attack: 10 + (stage - 1) * 3,
    interval: Math.max(3500, 6500 - (stage - 1) * 400),
    timer: Math.max(3500, 6500 - (stage - 1) * 400),
  }
}

export function createBattle(pet: Pet): BattleState {
  return {
    pet,
    stage: 1,
    status: 'playing',
    score: 0,
    player: {
      name: pet.name,
      emoji: pet.emoji,
      hp: pet.maxHp,
      maxHp: pet.maxHp,
      rage: 0,
      maxRage: BALANCE.maxRage,
      shield: 0,
    },
    enemy: createEnemy(1),
  }
}

export function nextStage(s: BattleState): BattleState {
  const stage = s.stage + 1
  const healed = Math.min(s.player.maxHp, s.player.hp + Math.round(s.player.maxHp * 0.3))
  return { ...s, stage, status: 'playing', player: { ...s.player, hp: healed }, enemy: createEnemy(stage) }
}

export const comboMultiplier = (combo: number) => 1 + BALANCE.comboStep * (combo - 1)

/** Áp dụng hiệu ứng của 1 đợt ngọc bị phá (1 bước của chuỗi combo). */
export function applyGems(s: BattleState, rawGems: GemCounts, combo: number): Result {
  if (s.status !== 'playing') return { state: s, events: [] }
  const gems = { ...rawGems }
  gems[s.pet.element] *= BALANCE.affinity // sở trường của pet
  const m = comboMultiplier(combo)
  const events: FloatEvent[] = []
  const player = { ...s.player }
  const enemy = { ...s.enemy }

  const damage = Math.round(gems.kim * BALANCE.kimDamage * m)
  if (damage > 0) {
    enemy.hp = clamp(enemy.hp - damage, 0, enemy.maxHp)
    events.push({ side: 'enemy', text: `-${damage}`, kind: 'damage' })
  }
  const heal = Math.round((gems.thuy * BALANCE.thuyHeal + gems.moc * BALANCE.mocHeal) * m)
  if (heal > 0) {
    player.hp = clamp(player.hp + heal, 0, player.maxHp)
    events.push({ side: 'player', text: `+${heal}`, kind: 'heal' })
  }
  const rage = Math.round((gems.hoa * BALANCE.hoaRage + gems.moc * BALANCE.mocRage) * m)
  if (rage > 0) {
    player.rage = clamp(player.rage + rage, 0, player.maxRage)
    events.push({ side: 'player', text: `+${rage} Nộ`, kind: 'rage' })
  }
  const shield = Math.round(gems.tho * BALANCE.thoShield * m)
  if (shield > 0) {
    player.shield += shield
    events.push({ side: 'player', text: `+${shield} Giáp`, kind: 'shield' })
  }
  if (combo >= 2) events.push({ side: 'player', text: `Combo x${combo}!`, kind: 'combo' })

  const cleared = Object.values(rawGems).reduce((a, b) => a + b, 0)
  const score = s.score + Math.round(cleared * 10 * m)
  return finalize({ ...s, score, player, enemy }, events)
}

export const canUseSkill = (s: BattleState) => s.status === 'playing' && s.player.rage >= s.player.maxRage

export function useSkill(s: BattleState): Result {
  if (!canUseSkill(s)) return { state: s, events: [] }
  const k = s.pet.skill
  const events: FloatEvent[] = []
  const enemy = { ...s.enemy }
  const player = { ...s.player, rage: 0 }

  if (k.damage) {
    for (let i = 0; i < (k.hits ?? 1); i++) {
      enemy.hp = Math.max(0, enemy.hp - k.damage)
      events.push({ side: 'enemy', text: `-${k.damage}`, kind: 'skill' })
    }
  }
  if (k.healPct) {
    const heal = Math.round(player.maxHp * k.healPct)
    player.hp = Math.min(player.maxHp, player.hp + heal)
    events.push({ side: 'player', text: `+${heal}`, kind: 'heal' })
  }
  if (k.shield) {
    player.shield += k.shield
    events.push({ side: 'player', text: `+${k.shield} Giáp`, kind: 'shield' })
  }
  if (k.stunMs) {
    enemy.timer = enemy.interval + k.stunMs
    events.push({ side: 'enemy', text: 'Choáng!', kind: 'combo' })
  }
  return finalize({ ...s, player, enemy }, events)
}

/** Kẻ địch đánh: giáp hấp thụ trước, phần còn lại trừ HP. */
export function enemyAttack(s: BattleState): Result {
  if (s.status !== 'playing') return { state: s, events: [] }
  const absorbed = Math.min(s.player.shield, s.enemy.attack)
  const dmg = s.enemy.attack - absorbed
  const player = { ...s.player, shield: s.player.shield - absorbed, hp: Math.max(0, s.player.hp - dmg) }
  const enemy = { ...s.enemy, timer: s.enemy.interval }
  const events: FloatEvent[] = [{ side: 'player', text: `-${dmg}`, kind: 'damage' }]
  if (absorbed > 0) events.push({ side: 'player', text: `Chặn ${absorbed}`, kind: 'shield' })
  return finalize({ ...s, player, enemy }, events)
}

export function tickEnemyTimer(s: BattleState, ms: number): BattleState {
  if (s.status !== 'playing') return s
  return { ...s, enemy: { ...s.enemy, timer: s.enemy.timer - ms } }
}

function finalize(s: BattleState, events: FloatEvent[]): Result {
  let status = s.status
  if (s.player.hp <= 0) status = 'lost'
  else if (s.enemy.hp <= 0) status = 'stageClear'
  return { state: { ...s, status }, events }
}
