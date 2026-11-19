import { BALANCE, COUNTER, enemyDef } from './constants'
import { MAX_STACK, RELICS, countRelic } from './relics'
import { buildRun } from './run'
import type { Ailment, BattleState, Combatant, Element, EnemyState, EnemyTrait, FloatEvent, GemCounts, Pet, PetForm, Side, StageDef, StageRule } from './types'

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

const TRAIT_ORDER: EnemyTrait[] = ['armor', 'regen', 'frenzy']

/** Tạo kẻ địch cho một điểm dừng (độ khó theo `level`, nhân hệ số riêng từng loài, Boss và Tinh anh mạnh hơn). */
export function createEnemy(def: StageDef): EnemyState {
  const base = enemyDef(def.enemy!)
  const boss = def.kind === 'boss'
  const elite = def.kind === 'elite'
  const bossMul = boss ? BALANCE.bossPower : 1
  const eliteMul = elite ? BALANCE.elitePower : 1
  const L = def.level - 1
  const maxHp = Math.round((BALANCE.enemyHp + L * BALANCE.enemyHpStep) * base.hp * (boss ? BALANCE.bossHp : 1) * (elite ? BALANCE.eliteHp : 1))
  const traits = [...base.traits]
  if (elite) {
    const extra = TRAIT_ORDER.find((t) => !traits.includes(t))
    if (extra) traits.push(extra)
  }
  return {
    id: base.id,
    name: boss ? `${base.name} (Boss)` : elite ? `${base.name} Tinh Anh` : base.name,
    emoji: base.emoji,
    element: base.element,
    boss,
    elite,
    hp: maxHp,
    maxHp,
    rage: 0,
    maxRage: BALANCE.maxRage,
    shield: 0,
    power: (BALANCE.enemyPower + L * BALANCE.enemyPowerStep) * base.power * bossMul * eliteMul,
    skill: { name: base.skill, effect: base.effect, damage: Math.round((BALANCE.enemySkillDamage + L * BALANCE.enemySkillStep) * base.skillMul * bossMul * eliteMul) },
    stunned: false,
    mistake: boss ? BALANCE.enemyMistakeMin : Math.max(BALANCE.enemyMistakeMin, BALANCE.enemyMistake - L * BALANCE.enemyMistakeStep),
    traits,
    windupNeed: base.windup,
    winding: 0,
    windupDmg: 0,
    enraged: false,
    form: 0,
    xp: 0,
    evoIds: base.evo ?? [],
  }
}

export const stageDef = (s: BattleState): StageDef => s.run[s.stage - 1]
export const stageRule = (s: BattleState): StageRule | undefined => stageDef(s)?.rule
const relicN = (s: BattleState, id: string) => countRelic(s.relics, id)

/** Thời gian của một lượt (ms): luật Chớp Nhoáng rút ngắn lượt của pet, Đồng Hồ Cát kéo dài thêm. */
export function turnTime(s: BattleState, side: Side): number {
  if (side === 'enemy') return BALANCE.turnMs
  const base = stageRule(s)?.type === 'swift' ? BALANCE.swiftMs : BALANCE.turnMs
  return base + relicN(s, 'clock') * 3000
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
  amount *= 1 + 0.3 * relicN(s, 'sage')
  let state: BattleState = { ...s, xp: s.xp + amount }
  const events: FloatEvent[] = [{ side: 'player', text: `+${Math.round(amount)} XP`, kind: 'xp' }]
  for (let t = nextEvolveXp(state); t !== null && state.xp >= t; t = nextEvolveXp(state)) {
    const form = state.pet.forms[state.form + 1]
    const maxHp = form.maxHp + state.bonusHp
    const gainedHp = maxHp - state.player.maxHp
    const hp = Math.min(maxHp, state.player.hp + gainedHp + Math.round(form.maxHp * BALANCE.evolveHeal))
    state = { ...state, form: state.form + 1, player: { ...state.player, name: form.name, maxHp, hp, power: form.power, rageMul: form.rageMul } }
    events.push({ side: 'player', text: `Tiến hóa! ${form.name}`, kind: 'combo' })
  }
  return { state, events }
}

export function createBattle(pet: Pet, run: StageDef[] = buildRun()): BattleState {
  const s: BattleState = {
    pet,
    form: 0,
    xp: 0,
    run,
    stage: 1,
    status: 'playing',
    score: 0,
    relics: [],
    offer: [],
    picks: 0,
    bonusHp: 0,
    ailments: { poison: 0, seal: 0, weaken: 0 },
    mega: 0,
    megaUsed: false,
    stageTurns: 0,
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
    enemy: createEnemy(run[0]),
  }
  return { ...s, turnLeft: turnTime(s, 'player') }
}

/**
 * Sang điểm dừng kế tiếp. Trận mới: hồi một phần máu (trừ khi vừa nghỉ), kẻ địch mới, đồng hồ lượt mới.
 * Điểm nghỉ: dừng lại chờ người chơi chọn (status 'rest').
 */
export function nextStage(s: BattleState): BattleState {
  const stage = s.stage + 1
  const def = s.run[stage - 1]
  const base: BattleState = { ...s, stage, stageTurns: 0, mega: 0, megaUsed: false, offer: [], picks: 0, turn: 'player', turnNo: s.turnNo + 1, enemy: s.enemy }
  if (def.kind === 'rest') return { ...base, status: 'rest' }
  const heal = s.status === 'rest' ? 0 : Math.round(s.player.maxHp * (BALANCE.stageHeal + 0.15 * relicN(s, 'recover')))
  const rage = Math.max(s.player.rage, 35 * Math.min(1, relicN(s, 'spark')))
  const next: BattleState = {
    ...base,
    status: 'playing',
    player: { ...s.player, hp: Math.min(s.player.maxHp, s.player.hp + heal), rage, shield: 0 },
    ailments: { poison: 0, seal: 0, weaken: 0 },
    enemy: createEnemy(def),
  }
  return { ...next, turnLeft: turnTime(next, 'player') }
}

// ---- Phần thưởng sau trận và điểm nghỉ ----

function makeOffer(s: BattleState, rand: () => number): string[] {
  const pool = RELICS.filter((r) => relicN(s, r.id) < MAX_STACK).map((r) => r.id)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return [...pool.slice(0, 3), 'heal']
}

/** Sau khi hạ kẻ địch (status 'stageClear'): mở bảng chọn thưởng. Tinh anh cho chọn 2 lần. */
export function toReward(s: BattleState, rand: () => number = Math.random): BattleState {
  if (s.status !== 'stageClear') return s
  return { ...s, status: 'reward', picks: s.enemy.elite ? 2 : 1, offer: makeOffer(s, rand) }
}

/** Chọn một phần thưởng ('heal' = nghỉ ngơi hồi máu). Hết lượt chọn thì sang điểm dừng kế tiếp. */
export function pickReward(s: BattleState, id: string, rand: () => number = Math.random): BattleState {
  if (s.status !== 'reward' || !s.offer.includes(id)) return s
  let state: BattleState = s
  const player = { ...s.player }
  if (id === 'heal') {
    player.hp = Math.min(player.maxHp, player.hp + Math.round(player.maxHp * BALANCE.rewardHeal))
    state = { ...s, player }
  } else {
    state = { ...s, relics: [...s.relics, id] }
    if (id === 'vitality') {
      const bonus = Math.round(s.pet.forms[s.form].maxHp * 0.15)
      state = { ...state, bonusHp: s.bonusHp + bonus, player: { ...player, maxHp: player.maxHp + bonus, hp: player.hp + bonus } }
    }
    if (id === 'ward') state = { ...state, ailments: { ...state.ailments, seal: 0, weaken: 0 } }
  }
  const picks = state.picks - 1
  if (picks > 0) return { ...state, picks, offer: makeOffer(state, rand) }
  return nextStage({ ...state, picks: 0, offer: [] })
}

/** Điểm nghỉ: hồi máu hoặc nhận XP (đẩy nhanh tiến hóa), rồi sang trận kế tiếp. */
export function chooseRest(s: BattleState, choice: 'heal' | 'xp'): Result {
  if (s.status !== 'rest') return { state: s, events: [] }
  if (choice === 'heal') {
    const hp = Math.min(s.player.maxHp, s.player.hp + Math.round(s.player.maxHp * BALANCE.restHeal))
    return { state: nextStage({ ...s, player: { ...s.player, hp } }), events: [] }
  }
  const g = gainXp(s, BALANCE.restXp)
  return { state: nextStage(g.state), events: g.events }
}

export const comboMultiplier = (combo: number, step: number = BALANCE.comboStep) => 1 + step * (combo - 1)

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

/** Kẻ địch đang tụ lực bị đánh: đủ ngưỡng sát thương thì ngắt chiêu (mất tụ lực và phần lớn Nộ). Sửa trực tiếp `enemy`. */
function windupHit(enemy: EnemyState, lost: number): FloatEvent[] {
  if (enemy.winding <= 0 || enemy.windupNeed <= 0) return []
  enemy.windupDmg += lost
  if (enemy.windupDmg < enemy.maxHp * BALANCE.interruptPct) return []
  return cancelWindup(enemy)
}

function cancelWindup(enemy: EnemyState): FloatEvent[] {
  if (enemy.winding <= 0) return []
  enemy.winding = 0
  enemy.windupDmg = 0
  enemy.rage = Math.round(enemy.rage * BALANCE.interruptRageKeep)
  return [{ side: 'enemy', text: 'Ngắt chiêu!', kind: 'combo' }]
}

/**
 * Kẻ địch nhận XP (từ ngọc nó xếp được và mỗi lượt); đủ mốc thì tiến hóa: máu tối đa, sức mạnh và chiêu tăng,
 * hồi máu, đổi hình/tên/chiêu nếu có dạng kế tiếp. Sửa trực tiếp `e`.
 */
function enemyGainXp(e: EnemyState, amount: number): FloatEvent[] {
  e.xp += amount
  const events: FloatEvent[] = []
  while (e.hp > 0 && e.form < BALANCE.enemyEvolveXp.length && e.xp >= BALANCE.enemyEvolveXp[e.form]) {
    const target = e.evoIds[e.form] ? enemyDef(e.evoIds[e.form]) : undefined
    const maxHp = Math.round(e.maxHp * BALANCE.enemyEvoHp)
    e.hp = Math.min(maxHp, e.hp + (maxHp - e.maxHp) + Math.round(maxHp * BALANCE.enemyEvoHeal))
    e.maxHp = maxHp
    e.power *= BALANCE.enemyEvoPower
    e.skill = { ...e.skill, damage: Math.round(e.skill.damage * BALANCE.enemyEvoSkill) }
    e.mistake = Math.max(BALANCE.enemyMistakeMin, e.mistake - 0.05)
    if (target) {
      e.id = target.id
      e.emoji = target.emoji
      e.name = target.name + (e.boss ? ' (Boss)' : e.elite ? ' Tinh Anh' : '')
      e.skill = { ...e.skill, name: target.skill, effect: target.effect ?? e.skill.effect }
      e.traits = [...new Set([...e.traits, ...target.traits])]
    }
    e.form++
    events.push({ side: 'enemy', text: `Tiến hóa! ${e.name}`, kind: 'combo' })
  }
  return events
}

/** Làm kẻ địch cuồng nộ (một lần): mạnh hơn hẳn. */
function enrage(enemy: EnemyState, powerMul: number, skillMul: number, fillRage = false): FloatEvent[] {
  if (enemy.enraged) return []
  enemy.enraged = true
  enemy.power *= powerMul
  enemy.skill = { ...enemy.skill, damage: Math.round(enemy.skill.damage * skillMul) }
  if (fillRage) enemy.rage = enemy.maxRage
  return [{ side: 'enemy', text: 'Cuồng nộ!', kind: 'skill' }]
}

/**
 * Áp dụng hiệu ứng của 1 đợt ngọc bị phá (1 bước của chuỗi combo) cho bên `side` vừa xếp ngọc.
 * Cùng một công thức cho pet và kẻ địch: Kim/Hỏa gây sát thương, Thủy/Mộc hồi máu,
 * Thổ tạo giáp, ngọc cùng hệ nạp Nộ. Vật phẩm, luật màn và hiệu ứng xấu chỉ ảnh hưởng pet.
 */
export function applyGems(s: BattleState, side: Side, rawGems: GemCounts, combo: number): Result {
  if (s.status !== 'playing') return { state: s, events: [] }
  const foeSide = otherSide(side)
  const me = { ...s[side] }
  const foe = { ...s[foeSide] }
  const mine = side === 'player'
  const rel = (id: string) => (mine ? relicN(s, id) : 0)
  const gems = { ...rawGems }
  gems[me.element] *= BALANCE.affinity // sở trường
  const rule = stageRule(s)
  if (rule?.type === 'surge') for (const e of Object.keys(gems) as Element[]) gems[e] *= e === rule.element ? BALANCE.surgeMul : BALANCE.surgeOther
  const m = comboMultiplier(combo, BALANCE.comboStep + 0.15 * rel('chain'))
  const mu = sideMatchup(s, side)
  const power = me.power * (mine && s.ailments.weaken > 0 ? BALANCE.weakenMul : 1) * (mine && s.mega > 0 ? BALANCE.megaPower : 1)
  const events: FloatEvent[] = []

  const damage = Math.round((gems.kim * BALANCE.kimDamage + gems.hoa * BALANCE.hoaDamage) * m * mu * power * (1 + 0.2 * rel('ember')))
  if (damage > 0) {
    const dm = dealDamage(foe, damage)
    events.push(...damageEvents(foeSide, dm), ...matchupEvent(foeSide, mu))
    if (mine) events.push(...windupHit(foe as EnemyState, dm.lost))
    const drain = Math.round(dm.lost * 0.2 * rel('vampire'))
    if (drain > 0) {
      me.hp = clamp(me.hp + drain, 0, me.maxHp)
      events.push({ side, text: `+${drain}`, kind: 'heal' })
    }
  }

  const heal = Math.round((gems.thuy * BALANCE.thuyHeal + gems.moc * BALANCE.mocHeal) * m * power * (1 + 0.3 * rel('tide')))
  if (heal > 0) {
    me.hp = clamp(me.hp + heal, 0, me.maxHp)
    events.push({ side, text: `+${heal}`, kind: 'heal' })
  }
  // Nộ: ngọc cùng hệ nạp nhiều, ngọc hệ khác nạp ít
  const own = rawGems[me.element]
  const others = Object.values(rawGems).reduce((a, b) => a + b, 0) - own
  const rage = Math.round((own * BALANCE.ownRage + others * BALANCE.otherRage) * m * (me.rageMul ?? 1) * (1 + 0.25 * rel('focus')) * (mine && s.mega > 0 ? BALANCE.megaRage : 1))
  if (rage > 0) {
    me.rage = clamp(me.rage + rage, 0, me.maxRage)
    events.push({ side, text: `+${rage} Nộ`, kind: 'rage' })
  }
  const shield = Math.round(gems.tho * BALANCE.thoShield * m * power * (1 + 0.3 * rel('bulwark')))
  if (shield > 0) {
    me.shield = Math.min(BALANCE.maxShield + 10 * rel('bulwark'), me.shield + shield)
    events.push({ side, text: `+${shield} Giáp`, kind: 'shield' })
  }
  if (combo >= 2) events.push({ side, text: `Combo x${combo}!`, kind: 'combo' })

  let score = s.score
  if (mine) {
    const cleared = Object.values(rawGems).reduce((a, b) => a + b, 0)
    score += Math.round(cleared * 10 * m)
  }
  if (!mine) {
    const total = Object.values(rawGems).reduce((a, b) => a + b, 0)
    events.push(...enemyGainXp(me as EnemyState, ((total - own) * BALANCE.xpGem + own * BALANCE.xpOwnGem) * m))
  }
  let next: BattleState = { ...s, score, [side]: me, [foeSide]: foe }
  if (mine) {
    // XP từ ngọc xếp được: ngọc cùng hệ với pet nhiều hơn, combo nhân thêm
    const total = Object.values(rawGems).reduce((a, b) => a + b, 0)
    const xp = (total - rawGems[me.element]) * BALANCE.xpGem + rawGems[me.element] * BALANCE.xpOwnGem
    const g = gainXp(next, xp * m)
    next = g.state
    events.push(...g.events)
  }
  return finalize(next, events)
}

/** Chỉ dùng kỹ năng được trong lượt của mình và khi không bị phong ấn. */
export const canUseSkill = (s: BattleState) => s.status === 'playing' && s.turn === 'player' && s.player.rage >= s.player.maxRage && s.ailments.seal <= 0
/** Kẻ địch tung chiêu khi đầy Nộ và đã tụ lực đủ lượt. */
export const canEnemyCast = (s: BattleState) => s.status === 'playing' && s.turn === 'enemy' && s.enemy.rage >= s.enemy.maxRage && s.enemy.winding >= s.enemy.windupNeed

export function useSkill(s: BattleState): Result {
  if (!canUseSkill(s)) return { state: s, events: [] }
  const k = currentForm(s).skill
  const events: FloatEvent[] = []
  const enemy = { ...s.enemy }
  const player = { ...s.player, rage: 0 }

  if (k.damage) {
    const mu = sideMatchup(s, 'player')
    const dmg = Math.round(k.damage * mu * (1 + 0.3 * relicN(s, 'might')) * (s.mega > 0 ? BALANCE.megaSkill : 1))
    for (let i = 0; i < (k.hits ?? 1); i++) {
      const dm = dealDamage(enemy, dmg)
      events.push(...damageEvents('enemy', dm, 'skill'), ...windupHit(enemy, dm.lost))
    }
    events.push(...matchupEvent('enemy', mu))
  }
  if (k.healPct) {
    const heal = Math.round(player.maxHp * k.healPct)
    player.hp = Math.min(player.maxHp, player.hp + heal)
    events.push({ side: 'player', text: `+${heal}`, kind: 'heal' })
  }
  if (k.shield) {
    player.shield = Math.min(BALANCE.maxShield + 10 * relicN(s, 'bulwark'), player.shield + k.shield)
    events.push({ side: 'player', text: `+${k.shield} Giáp`, kind: 'shield' })
  }
  if (k.stun) {
    enemy.stunned = true
    events.push({ side: 'enemy', text: 'Choáng!', kind: 'combo' }, ...cancelWindup(enemy))
  }
  return finalize({ ...s, player, enemy }, events)
}

/** Mega dùng được khi: pet ở dạng cuối, đầy Nộ, trong lượt của mình, chưa dùng ở trận này. */
export const canMega = (s: BattleState) =>
  s.status === 'playing' && s.turn === 'player' && s.form === s.pet.forms.length - 1 && !s.megaUsed && s.mega <= 0 && s.player.rage >= s.player.maxRage

/** Kích hoạt Mega: tốn hết Nộ, mạnh hơn hẳn trong vài lượt, hồi một phần máu và dựng giáp. Không tốn lượt đi. */
export function activateMega(s: BattleState): Result {
  if (!canMega(s)) return { state: s, events: [] }
  const heal = Math.round(s.player.maxHp * BALANCE.megaHeal)
  const player = {
    ...s.player,
    rage: 0,
    hp: Math.min(s.player.maxHp, s.player.hp + heal),
    shield: Math.min(BALANCE.maxShield + 10 * relicN(s, 'bulwark'), s.player.shield + BALANCE.megaShield),
  }
  return {
    state: { ...s, player, mega: BALANCE.megaTurns, megaUsed: true },
    events: [
      { side: 'player', text: `Mega ${s.player.name}!`, kind: 'skill' },
      { side: 'player', text: `+${heal}`, kind: 'heal' },
      { side: 'player', text: `+${BALANCE.megaShield} Giáp`, kind: 'shield' },
    ],
  }
}

const AILMENT_TEXT: Record<Ailment, string> = { poison: 'Trúng độc!', seal: 'Bị phong ấn!', weaken: 'Suy yếu!' }
const AILMENT_TURNS: Record<Ailment, number> = { poison: BALANCE.poisonTurns, seal: BALANCE.sealTurns, weaken: BALANCE.weakenTurns }

/** Kẻ địch tung kỹ năng khi đầy Nộ (trong lượt của nó): gây sát thương và có thể kèm hiệu ứng xấu. */
export function enemyCastSkill(s: BattleState): Result {
  if (!canEnemyCast(s)) return { state: s, events: [] }
  const mu = sideMatchup(s, 'enemy')
  const player = { ...s.player }
  const enemy = { ...s.enemy, rage: 0, winding: 0, windupDmg: 0 }
  const events = [...damageEvents('player', dealDamage(player, Math.round(s.enemy.skill.damage * mu)), 'skill'), ...matchupEvent('player', mu)]
  let ailments = s.ailments
  const fx = s.enemy.skill.effect
  if (fx && player.hp > 0) {
    if (fx !== 'poison' && relicN(s, 'ward') > 0) events.push({ side: 'player', text: 'Miễn nhiễm!', kind: 'shield' })
    else {
      ailments = { ...ailments, [fx]: Math.max(ailments[fx], AILMENT_TURNS[fx]) }
      events.push({ side: 'player', text: AILMENT_TEXT[fx], kind: 'combo' })
    }
  }
  return finalize({ ...s, player, enemy, ailments }, events)
}

/** Đầu lượt kẻ địch: đặc tính Giáp dựng giáp, đặc tính Hồi phục hồi máu. */
export function enemyUpkeep(s: BattleState): Result {
  if (s.status !== 'playing' || s.turn !== 'enemy') return { state: s, events: [] }
  const enemy = { ...s.enemy }
  const events: FloatEvent[] = []
  if (enemy.traits.includes('armor')) {
    const gain = Math.round(BALANCE.armorGain + (stageDef(s)?.level ?? 1) * BALANCE.armorStep)
    enemy.shield = Math.min(BALANCE.maxShield, enemy.shield + gain)
    events.push({ side: 'enemy', text: `+${gain} Giáp`, kind: 'shield' })
  }
  if (enemy.traits.includes('regen') && enemy.hp < enemy.maxHp) {
    const heal = Math.round(enemy.maxHp * BALANCE.regenPct)
    enemy.hp = Math.min(enemy.maxHp, enemy.hp + heal)
    events.push({ side: 'enemy', text: `+${heal}`, kind: 'heal' })
  }
  events.push(...enemyGainXp(enemy, BALANCE.enemyXpTurn))
  return { state: { ...s, enemy }, events }
}

/** Kẻ địch đầy Nộ nhưng chưa tụ lực đủ: bắt đầu/tiếp tục báo trước đòn (người chơi có thể ngắt bằng sát thương hoặc choáng). */
export function chargeWindup(s: BattleState): Result {
  const e = s.enemy
  if (s.status !== 'playing' || s.turn !== 'enemy' || e.rage < e.maxRage || e.winding >= e.windupNeed) return { state: s, events: [] }
  return { state: { ...s, enemy: { ...e, winding: e.winding + 1 } }, events: [{ side: 'enemy', text: 'Đang tụ lực!', kind: 'combo' }] }
}

export function tickTurn(s: BattleState, ms: number): BattleState {
  if (s.status !== 'playing') return s
  return { ...s, turnLeft: Math.max(0, s.turnLeft - ms) }
}

/** Đầu lượt pet: độc rút máu (xuyên giáp), mỗi lần giảm 1 lượt hiệu lực. */
function poisonTick(s: BattleState): Result {
  if (s.ailments.poison <= 0) return { state: s, events: [] }
  const dmg = Math.max(1, Math.round(s.player.maxHp * BALANCE.poisonPct))
  const lost = Math.min(s.player.hp, dmg)
  return {
    state: { ...s, player: { ...s.player, hp: s.player.hp - lost }, ailments: { ...s.ailments, poison: s.ailments.poison - 1 } },
    events: [{ side: 'player', text: `Độc -${lost}`, kind: 'damage' }],
  }
}

/**
 * Chuyển lượt sang bên kia. Hết lượt pet: phong ấn/suy yếu giảm 1, đếm lượt của màn (luật giới hạn lượt).
 * Đầu lượt pet: độc phát tác. Nếu kẻ địch đang bị choáng thì nó mất lượt và lượt quay lại pet.
 */
export function passTurn(s: BattleState): Result {
  if (s.status !== 'playing') return { state: s, events: [] }
  const events: FloatEvent[] = []
  let state: BattleState = s
  if (s.turn === 'player') {
    const a = s.ailments
    const megaLeft = Math.max(0, s.mega - 1)
    if (s.mega > 0 && megaLeft === 0) events.push({ side: 'player', text: 'Hết Mega', kind: 'combo' })
    state = { ...s, mega: megaLeft, stageTurns: s.stageTurns + 1, ailments: { ...a, seal: Math.max(0, a.seal - 1), weaken: Math.max(0, a.weaken - 1) } }
    const rule = stageRule(state)
    if (rule?.type === 'limit' && state.stageTurns >= rule.turns!) {
      const enemy = { ...state.enemy }
      events.push(...enrage(enemy, BALANCE.limitEnrage, BALANCE.limitEnrage, true))
      state = { ...state, enemy }
    }
  }
  let next = otherSide(s.turn)
  let turnNo = state.turnNo + 1
  if (next === 'enemy' && state.enemy.stunned) {
    next = 'player'
    turnNo++
    state = { ...state, enemy: { ...state.enemy, stunned: false } }
    events.push({ side: 'enemy', text: 'Mất lượt!', kind: 'combo' })
  }
  state = { ...state, turn: next, turnNo }
  state = { ...state, turnLeft: turnTime(state, next) }
  if (next === 'player') {
    const p = poisonTick(state)
    state = p.state
    events.push(...p.events)
  }
  return finalize(state, events)
}

function finalize(s: BattleState, events: FloatEvent[]): Result {
  let status = s.status
  let state = s
  // Cuồng nộ khi còn nửa máu (đặc tính Frenzy)
  if (s.enemy.hp > 0 && !s.enemy.enraged && s.enemy.traits.includes('frenzy') && s.enemy.hp <= s.enemy.maxHp * BALANCE.frenzyHp) {
    const enemy = { ...s.enemy }
    events = [...events, ...enrage(enemy, BALANCE.frenzyPower, BALANCE.frenzySkill)]
    state = { ...s, enemy }
  }
  if (s.player.hp <= 0) status = 'lost'
  else if (s.enemy.hp <= 0) {
    status = s.stage >= s.run.length ? 'won' : 'stageClear'
    // Kết liễu kẻ địch: thưởng XP lớn (chỉ một lần khi màn vừa kết thúc)
    if (s.status === 'playing') {
      const xp = (BALANCE.xpKill + (s.stage - 1) * BALANCE.xpKillStep) * (s.enemy.elite ? BALANCE.eliteXp : 1)
      const g = gainXp(state, xp)
      state = g.state
      events = [...events, ...g.events]
    }
  }
  return { state: { ...state, status }, events }
}
