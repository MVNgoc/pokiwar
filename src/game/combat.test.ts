import assert from 'node:assert/strict'
import { chooseEnemyMove } from './ai'
import { BALANCE, BOSSES, COUNTER, ELEMENTS, ENEMIES } from './constants'
import { activateMega, canMega, applyGems, canEnemyCast, chargeWindup, chooseRest, currentForm, enemyUpkeep, gainXp, canUseSkill, createBattle, createEnemy, enemyCastSkill, matchup, nextStage, passTurn, pickReward, tickTurn, toReward, turnTime, useSkill } from './combat'
import { createBoard } from './board'
import { PETS } from './pets'
import { RELICS, countRelic } from './relics'
import { buildRun } from './run'
import type { BattleState } from './types'

const zero = { kim: 0, moc: 0, thuy: 0, hoa: 0, tho: 0 }
const gems = (o: Partial<typeof zero>) => ({ ...zero, ...o })
const hoaHo = PETS.find((p) => p.id === 'charmander')! // Hỏa khắc Kim
const withEnemy = (s: BattleState, e: Partial<BattleState['enemy']>): BattleState => ({ ...s, enemy: { ...s.enemy, ...e } })
const withPlayer = (s: BattleState, p: Partial<BattleState['player']>): BattleState => ({ ...s, player: { ...s.player, ...p } })
// chuyến đi cố định cho test: trận 1 là Magikarp... (đổi kẻ địch bằng withEnemy khi cần)
const RUN = buildRun(() => 0.5)
const TOTAL = RUN.length
const base = createBattle(hoaHo, RUN)

// --- vòng tương khắc ---
for (const e of ELEMENTS) {
  assert.equal(matchup(e, COUNTER[e]), BALANCE.advantage)
  assert.equal(matchup(COUNTER[e], e), BALANCE.disadvantage)
  assert.equal(matchup(e, e), 1)
}

// --- pet xếp ngọc: Kim gây sát thương, khắc chế hệ Mộc ---
const vsTho = withEnemy(base, { element: 'tho' }) // trung tính
const dTho = vsTho.enemy.hp - applyGems(vsTho, 'player', gems({ kim: 3 }), 1).state.enemy.hp
assert.equal(dTho, 12)
const vsKim = withEnemy(base, { element: 'kim' }) // Hỏa khắc Kim → x1.5
assert.equal(vsKim.enemy.hp - applyGems(vsKim, 'player', gems({ kim: 3 }), 1).state.enemy.hp, 18)

// --- kẻ địch cũng xếp ngọc để tấn công: sát thương theo power, giáp pet chặn trước ---
const foe = withEnemy(base, { element: 'tho', power: 1 })
assert.equal(foe.player.hp - applyGems({ ...foe, turn: 'enemy' }, 'enemy', gems({ kim: 3 }), 1).state.player.hp, 12)
const shielded = withPlayer({ ...foe, turn: 'enemy' }, { shield: 5 })
const r = applyGems(shielded, 'enemy', gems({ kim: 3 }), 1).state
assert.equal(r.player.shield, 0)
assert.equal(shielded.player.hp - r.player.hp, 7)
const weak = withEnemy(base, { element: 'tho', power: 0.5 })
assert.equal(weak.player.hp - applyGems({ ...weak, turn: 'enemy' }, 'enemy', gems({ kim: 3 }), 1).state.player.hp, 6)

// --- kẻ địch hồi máu / nạp Nộ / dựng giáp từ ngọc của nó ---
const hurtFoe = withEnemy({ ...base, turn: 'enemy' }, { element: 'thuy', power: 1, hp: 50 })
assert.ok(applyGems(hurtFoe, 'enemy', gems({ moc: 3 }), 1).state.enemy.hp > 50)
const ragey = applyGems(withEnemy({ ...base, turn: 'enemy' }, { element: 'thuy', power: 1 }), 'enemy', gems({ thuy: 3 }), 1).state
assert.equal(ragey.enemy.rage, 15) // 3 ngọc cùng hệ x 5
assert.equal(ragey.player.rage, 0) // Nộ của pet không bị đụng tới
assert.ok(applyGems(hurtFoe, 'enemy', gems({ tho: 3 }), 1).state.enemy.shield > 0)

// --- ngọc của pet cộng Nộ theo hệ, mỗi pet đúng công thức cũ ---
for (const pet of PETS) {
  const b = createBattle(pet)
  assert.equal(applyGems(b, 'player', { ...zero, [pet.element]: 3 }, 1).state.player.rage, Math.round(15 * pet.rageMul))
  const other = ELEMENTS.find((e) => e !== pet.element)!
  assert.equal(applyGems(b, 'player', { ...zero, [other]: 3 }, 1).state.player.rage, Math.round(3 * pet.rageMul))
}

// --- kỹ năng: chỉ dùng trong lượt của mình ---
const ready = withEnemy(withPlayer(base, { rage: 100 }), { element: 'kim', hp: 500, maxHp: 500 })
assert.ok(canUseSkill(ready))
assert.ok(!canUseSkill({ ...ready, turn: 'enemy' }))
assert.equal(ready.enemy.hp - useSkill(ready).state.enemy.hp, Math.round(hoaHo.skill.damage! * 1.5)) // x1.5 khắc chế
assert.equal(useSkill({ ...ready, turn: 'enemy' }).state.enemy.hp, 500)
// kỹ năng choáng: kẻ địch mất lượt kế tiếp
const mocLoc = createBattle(PETS.find((p) => p.id === 'bulbasaur')!)
const stunned = useSkill(withEnemy(withPlayer(mocLoc, { rage: 100 }), { hp: 500, maxHp: 500 })).state
assert.ok(stunned.enemy.stunned)
const skipped = passTurn(stunned)
assert.equal(skipped.state.turn, 'player') // lượt kẻ địch bị bỏ qua
assert.equal(skipped.state.enemy.stunned, false)
assert.ok(skipped.events.some((e) => e.text.includes('Mất lượt')))

// --- kỹ năng kẻ địch ---
const cast = withEnemy({ ...base, turn: 'enemy' }, { rage: 100, element: 'tho', windupNeed: 0 })
assert.ok(canEnemyCast(cast))
assert.ok(!canEnemyCast({ ...cast, turn: 'player' }))
const afterCast = enemyCastSkill(cast).state
assert.equal(afterCast.enemy.rage, 0)
assert.equal(cast.player.hp - afterCast.player.hp, cast.enemy.skill.damage)

// --- lượt và đồng hồ ---
assert.equal(base.turn, 'player')
const p1 = passTurn(base).state
assert.equal(p1.turn, 'enemy')
assert.equal(p1.turnLeft, BALANCE.turnMs)
assert.equal(passTurn(p1).state.turn, 'player')
assert.equal(tickTurn(base, 1000).turnLeft, BALANCE.turnMs - 1000)
assert.equal(tickTurn(base, BALANCE.turnMs * 2).turnLeft, 0)

// --- thắng / thua / Boss ---
let run = createBattle(hoaHo, RUN)
for (let i = 1; i < TOTAL; i++) run = nextStage(run)
assert.equal(run.status, 'playing')
assert.ok(run.enemy.boss)
assert.equal(run.turn, 'player')
const dying = withEnemy(run, { hp: 1, element: 'tho' })
assert.equal(applyGems(dying, 'player', gems({ kim: 3 }), 1).state.status, 'won')
const mid = withEnemy(createBattle(hoaHo, RUN), { hp: 1 })
assert.equal(applyGems(mid, 'player', gems({ kim: 3 }), 1).state.status, 'stageClear')
const lose = withPlayer({ ...createBattle(hoaHo, RUN), turn: 'enemy' }, { hp: 1 })
assert.equal(applyGems(withEnemy(lose, { element: 'tho', power: 1 }), 'enemy', gems({ kim: 3 }), 1).state.status, 'lost')
// Boss vô hệ: không bị ảnh hưởng bởi tương khắc
assert.equal(applyGems({ ...run, enemy: { ...run.enemy, element: 'kim' } }, 'player', gems({ kim: 3 }), 1).state.enemy.hp, run.enemy.maxHp - 12)

// --- AI: luôn chọn nước hợp lệ; không sai thì chọn nước ăn nhiều ngọc hơn nước ngẫu nhiên ---
const board = createBoard()
const mv = chooseEnemyMove(board, withEnemy({ ...base, turn: 'enemy' }, { mistake: 0 }))
assert.ok(mv)
const sure = withEnemy({ ...base, turn: 'enemy' }, { mistake: 0, power: 1, element: 'kim' })
assert.deepEqual(chooseEnemyMove(board, sure, () => 0.5), chooseEnemyMove(board, sure, () => 0.5)) // xác định khi rand cố định

// --- XP và tiến hóa ---
const evoBase = createBattle(hoaHo, RUN)
assert.equal(evoBase.form, 0)
assert.equal(currentForm(evoBase).name, 'Charmander')
// ngọc xếp được cho XP: ngọc cùng hệ (Hỏa) nhiều hơn ngọc khác
const own = applyGems(evoBase, 'player', gems({ hoa: 3 }), 1).state.xp
const oth = applyGems(evoBase, 'player', gems({ thuy: 3 }), 1).state.xp
assert.ok(own > oth && oth === 3 * BALANCE.xpGem)
// kẻ địch xếp ngọc không cho pet XP
assert.equal(applyGems({ ...evoBase, turn: 'enemy' }, 'enemy', gems({ kim: 3 }), 1).state.xp, 0)
// đủ mốc: tiến hóa dạng 2, tăng máu tối đa, hồi máu, đổi tên, chiêu mạnh hơn
const hurt = { ...evoBase, player: { ...evoBase.player, hp: 50 } }
const e1 = gainXp(hurt, BALANCE.evolveXp[0])
assert.equal(e1.state.form, 1)
assert.equal(e1.state.player.name, 'Charmeleon')
assert.ok(e1.state.player.maxHp > evoBase.player.maxHp && e1.state.player.hp > 50)
assert.ok(e1.state.player.power > evoBase.player.power)
assert.ok(currentForm(e1.state).skill.damage! > evoBase.pet.skill.damage!)
assert.ok(e1.events.some((e) => e.text.startsWith('Tiến hóa')))
// một lần nhận rất nhiều XP: lên thẳng dạng 3, không vượt quá dạng cuối
const e3 = gainXp(evoBase, 9999)
assert.equal(e3.state.form, 2)
assert.equal(gainXp(e3.state, 500).state.form, 2)
// kết liễu kẻ địch thưởng XP và giữ nguyên dạng khi sang màn sau
const killed = applyGems(withEnemy(evoBase, { hp: 1, element: 'tho' }), 'player', gems({ kim: 3 }), 1).state
assert.equal(killed.status, 'stageClear')
assert.ok(killed.xp >= BALANCE.xpKill)
const afterClear = { ...e1.state, status: 'stageClear' as const }
assert.equal(nextStage(afterClear).form, 1)
assert.equal(nextStage(afterClear).xp, e1.state.xp)
// mọi pokemon đều có đủ 3 dạng với chỉ số tăng dần
for (const pet of PETS) {
  assert.equal(pet.forms.length, 3)
  assert.ok(pet.forms[1].maxHp > pet.forms[0].maxHp && pet.forms[2].maxHp > pet.forms[1].maxHp)
  assert.ok(pet.forms[2].skill.damage! > pet.forms[1].skill.damage! && pet.forms[1].skill.damage! > pet.forms[0].skill.damage!)
}

// =====================  Chuyến đi, kẻ địch, thưởng  =====================

// --- chuyến đi: độ dài thay đổi, Boss ở cuối, điểm nghỉ trước Boss, kẻ địch hợp lệ ---
const lens = new Set<number>()
for (let i = 0; i < 300; i++) {
  const r = buildRun()
  lens.add(r.length)
  assert.ok(r.length >= 8 && r.length <= 10)
  assert.equal(r[0].kind, 'normal')
  assert.equal(r[r.length - 1].kind, 'boss')
  assert.equal(r[r.length - 2].kind, 'rest')
  assert.ok(r.some((n) => n.kind === 'elite'))
  assert.ok(r.every((n) => (n.kind === 'rest') === !n.enemy))
  assert.ok(r.every((n, k) => k === 0 || n.level >= r[k - 1].level))
  assert.ok(!r.slice(0, -1).some((n) => n.kind === 'boss'))
  for (const n of r) if (n.enemy) assert.ok([...ENEMIES, ...BOSSES].some((e) => e.id === n.enemy))
  assert.ok(r.slice(0, 2).every((n) => !n.rule || n.level >= 1.5))
}
assert.ok(lens.size >= 2)
assert.equal(new Set(Array.from({ length: 40 }, () => buildRun().map((n) => n.enemy).join())).size > 5, true)

// --- kẻ địch: tinh anh mạnh hơn, Boss mạnh nhất, đặc tính riêng ---
const normalDef = { kind: 'normal' as const, level: 3, enemy: 'torterra' }
const nm = createEnemy(normalDef)
const el = createEnemy({ ...normalDef, kind: 'elite' })
const bs = createEnemy({ ...normalDef, kind: 'boss' })
assert.ok(el.maxHp > nm.maxHp && el.power > nm.power && el.elite && el.traits.length > nm.traits.length)
assert.ok(bs.maxHp > el.maxHp && bs.boss)
for (const d of ENEMIES) {
  const e = createEnemy({ kind: 'normal', level: 1, enemy: d.id })
  assert.equal(e.hp, e.maxHp)
  assert.ok(e.maxHp > 50 && e.skill.damage > 0)
}

// --- đặc tính: Giáp và Hồi phục chạy ở đầu lượt kẻ địch ---
const armored = withEnemy({ ...base, turn: 'enemy' }, { traits: ['armor', 'regen'], hp: 50, shield: 0 })
const up = enemyUpkeep(armored).state.enemy
assert.ok(up.shield > 0 && up.hp > 50)
assert.equal(enemyUpkeep(withEnemy({ ...base, turn: 'enemy' }, { traits: [], hp: 50 })).state.enemy.hp, 50)

// --- cuồng nộ khi còn nửa máu (một lần) ---
const frenzy = withEnemy({ ...base, turn: 'player' }, { traits: ['frenzy'], element: 'tho', hp: 100, maxHp: 100, power: 1, skill: { name: 'x', damage: 20 } })
const f1 = applyGems(frenzy, 'player', gems({ kim: 15 }), 1).state // 15*4 = 60 sát thương → còn 40/100 máu
assert.ok(f1.enemy.enraged && f1.enemy.power > 1 && f1.enemy.skill.damage > 20)
const f2 = applyGems(f1, 'player', gems({ kim: 1 }), 1).state
assert.equal(f2.enemy.power, f1.enemy.power) // chỉ cuồng nộ một lần

// --- báo trước đòn: tụ lực rồi mới tung; bị đánh đủ mạnh hoặc choáng thì ngắt ---
const slow = withEnemy({ ...base, turn: 'enemy' }, { rage: 100, windupNeed: 1, winding: 0, element: 'tho' })
assert.ok(!canEnemyCast(slow))
const wound = chargeWindup(slow)
assert.equal(wound.state.enemy.winding, 1)
assert.ok(wound.events.some((e) => e.text.includes('tụ lực')))
assert.ok(canEnemyCast(wound.state))
assert.equal(chargeWindup(wound.state).state.enemy.winding, 1) // đủ rồi thì không tăng thêm
assert.equal(enemyCastSkill(wound.state).state.enemy.winding, 0) // tung xong reset
const heavy = withEnemy({ ...base, turn: 'player' }, { rage: 100, windupNeed: 2, winding: 1, maxHp: 100, hp: 100, element: 'tho' })
const small = applyGems(heavy, 'player', gems({ kim: 3 }), 1).state // 12 dmg < 20%
assert.equal(small.enemy.winding, 1)
const big = applyGems(small, 'player', gems({ kim: 3 }), 1).state // tổng 24 ≥ 20 máu → ngắt
assert.equal(big.enemy.winding, 0)
assert.ok(big.enemy.rage < 100)
const stunSkill = useSkill(withEnemy(withPlayer({ ...mocLoc, turn: 'player' }, { rage: 100 }), { hp: 500, maxHp: 500, winding: 1, windupNeed: 2, rage: 100 })).state
assert.equal(stunSkill.enemy.winding, 0)

// --- hiệu ứng xấu: độc, phong ấn, suy yếu ---
const poisonCast = { ...withEnemy({ ...base, turn: 'enemy' }, { rage: 100, windupNeed: 0, element: 'tho', skill: { name: 'x', damage: 10, effect: 'poison' as const } }) }
const pz = enemyCastSkill(poisonCast).state
assert.equal(pz.ailments.poison, BALANCE.poisonTurns)
const tick2 = passTurn(pz).state // kẻ địch tung chiêu xong, về lượt pet → độc phát tác
assert.ok(tick2.player.hp < pz.player.hp)
assert.equal(tick2.ailments.poison, BALANCE.poisonTurns - 1)
const sealCast = enemyCastSkill({ ...poisonCast, enemy: { ...poisonCast.enemy, skill: { name: 'x', damage: 10, effect: 'seal' } } }).state
assert.equal(sealCast.ailments.seal, BALANCE.sealTurns)
assert.ok(!canUseSkill({ ...withPlayer(sealCast, { rage: 100 }), turn: 'player' }))
let sealT = passTurn({ ...sealCast, turn: 'player' }).state
sealT = passTurn(passTurn(sealT).state).state
assert.equal(sealT.ailments.seal, 0)
const weakened = { ...base, ailments: { ...base.ailments, weaken: 2 } }
const wd = (b: BattleState) => b.enemy.hp - applyGems(withEnemy(b, { element: 'tho' }), 'player', gems({ kim: 3 }), 1).state.enemy.hp
assert.ok(wd(weakened) < wd(base))
// Bùa Hộ Mệnh: miễn nhiễm phong ấn
const warded = { ...poisonCast, relics: ['ward'] }
assert.equal(enemyCastSkill({ ...warded, enemy: { ...warded.enemy, skill: { name: 'x', damage: 10, effect: 'seal' } } }).state.ailments.seal, 0)

// --- luật màn ---
const surge = { ...base, run: base.run.map((n, i) => (i === 0 ? { ...n, rule: { type: 'surge' as const, element: 'kim' as const } } : n)) }
const plain = withEnemy(base, { element: 'tho' })
const surged = withEnemy(surge, { element: 'tho' })
assert.ok(plain.enemy.hp - applyGems(surged, 'player', gems({ kim: 3 }), 1).state.enemy.hp > plain.enemy.hp - applyGems(plain, 'player', gems({ kim: 3 }), 1).state.enemy.hp)
const swiftRun = { ...base, run: base.run.map((n, i) => (i === 0 ? { ...n, rule: { type: 'swift' as const } } : n)) }
assert.equal(turnTime(swiftRun, 'player'), BALANCE.swiftMs)
assert.equal(turnTime(swiftRun, 'enemy'), BALANCE.turnMs)
const limited = { ...base, stageTurns: 0, run: base.run.map((n, i) => (i === 0 ? { ...n, rule: { type: 'limit' as const, turns: 2 } } : n)) }
const l1 = passTurn(limited).state
assert.ok(!l1.enemy.enraged)
const l2 = passTurn(passTurn(l1).state).state
assert.ok(l2.enemy.enraged && l2.enemy.rage === l2.enemy.maxRage)

// --- thưởng sau trận: chọn vật phẩm, cộng dồn, Tinh anh chọn 2 lần ---
const won1 = applyGems(withEnemy(createBattle(hoaHo, RUN), { hp: 1, element: 'tho' }), 'player', gems({ kim: 3 }), 1).state
assert.equal(won1.status, 'stageClear')
const rw = toReward(won1, () => 0.1)
assert.equal(rw.status, 'reward')
assert.equal(rw.offer.length, 4)
assert.equal(rw.offer[3], 'heal')
assert.equal(new Set(rw.offer).size, 4)
assert.equal(rw.picks, 1)
const chosen = pickReward(rw, rw.offer[0])
assert.ok(chosen.status === 'playing' || chosen.status === 'rest')
assert.equal(chosen.stage, 2)
assert.equal(chosen.relics.length, 1)
assert.equal(pickReward(rw, 'không-có').status, 'reward') // lựa chọn không hợp lệ bị bỏ qua
const eliteWin = toReward({ ...won1, enemy: { ...won1.enemy, elite: true } })
assert.equal(eliteWin.picks, 2)
const first = pickReward(eliteWin, eliteWin.offer[0])
assert.equal(first.status, 'reward')
assert.equal(first.picks, 1)
assert.equal(first.relics.length, 1)
assert.equal(pickReward(first, first.offer[0]).stage, 2)
// nghỉ ngơi hồi máu
const injured = toReward({ ...won1, player: { ...won1.player, hp: 10 } })
assert.ok(pickReward(injured, 'heal').player.hp > 10 + Math.round(won1.player.maxHp * BALANCE.stageHeal) - 1)
// mọi vật phẩm có hiệu lực đúng
const withRelic = (id: string, n = 1) => ({ ...base, relics: Array(n).fill(id) })
const dmgOf = (b: BattleState) => b.enemy.hp - applyGems(withEnemy(b, { element: 'tho' }), 'player', gems({ kim: 3 }), 1).state.enemy.hp
assert.ok(dmgOf(withRelic('ember')) > dmgOf(base))
assert.ok(dmgOf(withRelic('ember', 2)) > dmgOf(withRelic('ember')))
const rageOf = (b: BattleState) => applyGems(b, 'player', gems({ hoa: 3 }), 1).state.player.rage
assert.ok(rageOf(withRelic('focus')) > rageOf(base))
const xpOf = (b: BattleState) => applyGems(b, 'player', gems({ hoa: 3 }), 1).state.xp
assert.ok(xpOf(withRelic('sage')) > xpOf(base))
const healOf = (b: BattleState) => applyGems(withPlayer(b, { hp: 10 }), 'player', gems({ moc: 3 }), 1).state.player.hp
assert.ok(healOf(withRelic('tide')) > healOf(base))
const shOf = (b: BattleState) => applyGems(b, 'player', gems({ tho: 3 }), 1).state.player.shield
assert.ok(shOf(withRelic('bulwark')) > shOf(base))
const comboOf = (b: BattleState) => dmgOf({ ...b })
const c3 = (b: BattleState) => b.enemy.hp - applyGems(withEnemy(b, { element: 'tho' }), 'player', gems({ kim: 3 }), 3).state.enemy.hp
assert.ok(c3(withRelic('chain')) > c3(base))
void comboOf
assert.equal(turnTime(withRelic('clock'), 'player'), BALANCE.turnMs + 3000)
const vamp = withPlayer(withRelic('vampire'), { hp: 50 })
assert.ok(applyGems(withEnemy(vamp, { element: 'tho' }), 'player', gems({ kim: 3 }), 1).state.player.hp > 50)
const mightOf = (b: BattleState) => b.enemy.hp - useSkill(withEnemy(withPlayer(b, { rage: 100 }), { element: 'tho', hp: 500, maxHp: 500 })).state.enemy.hp
assert.ok(mightOf(withRelic('might')) > mightOf(base))
// Sinh Mệnh: máu tối đa tăng và giữ khi tiến hóa
const vit = pickReward({ ...toReward(won1), offer: ['vitality', 'heal'] }, 'vitality')
assert.ok(vit.player.maxHp > won1.player.maxHp && vit.bonusHp > 0)
const vitEvo = gainXp(vit, 9999).state
assert.equal(vitEvo.player.maxHp, vitEvo.pet.forms[2].maxHp + vit.bonusHp)
// Khởi Nộ và Hồi Sinh khi sang trận mới
const sparky = nextStage({ ...withRelic('spark'), status: 'stageClear' })
assert.ok(sparky.player.rage >= 35)
assert.ok(nextStage({ ...withRelic('recover', 2), status: 'stageClear', player: { ...base.player, hp: 10 } }).player.hp > nextStage({ ...base, status: 'stageClear', player: { ...base.player, hp: 10 } }).player.hp)
assert.equal(RELICS.length, new Set(RELICS.map((r) => r.id)).size)
assert.equal(countRelic(['a', 'b', 'a'], 'a'), 2)
// không đưa ra vật phẩm đã đạt tối đa
const maxed = { ...won1, relics: RELICS.slice(0, 11).flatMap((r) => [r.id, r.id, r.id]) }
const mo = toReward(maxed).offer
assert.ok(mo.filter((id) => id !== 'heal').every((id) => !maxed.relics.includes(id)))

// --- điểm nghỉ ---
const restIdx = RUN.findIndex((n) => n.kind === 'rest')
let atRest = createBattle(hoaHo, RUN)
for (let i = 0; i < restIdx; i++) atRest = nextStage({ ...atRest, status: 'stageClear' })
assert.equal(atRest.status, 'rest')
assert.equal(atRest.stage, restIdx + 1)
const hurtRest = withPlayer(atRest, { hp: 20 })
const healed = chooseRest(hurtRest, 'heal').state
assert.ok(healed.player.hp > 20 + Math.round(hurtRest.player.maxHp * 0.4))
assert.equal(healed.stage, restIdx + 2)
assert.equal(healed.status, RUN[restIdx + 1].kind === 'rest' ? 'rest' : 'playing')
const trained = chooseRest(atRest, 'xp')
assert.ok(trained.state.xp >= atRest.xp + BALANCE.restXp)
assert.equal(chooseRest(base, 'heal').state, base) // không ở điểm nghỉ thì bỏ qua

// --- chạy hết chuyến đi (thắng liên tục) ---
let tour = createBattle(hoaHo, RUN)
for (let guard = 0; guard < 60 && tour.status !== 'won'; guard++) {
  if (tour.status === 'rest') tour = chooseRest(tour, 'heal').state
  else if (tour.status === 'reward') tour = pickReward(tour, tour.offer[0])
  else if (tour.status === 'stageClear') tour = toReward(tour)
  else tour = applyGems({ ...withEnemy(tour, { hp: 1, element: 'tho' }), turn: 'player' }, 'player', gems({ kim: 3 }), 1).state
}
assert.equal(tour.status, 'won')
assert.equal(tour.stage, TOTAL)

// --- kẻ địch tiến hóa: nhận XP từ ngọc và theo lượt, mạnh lên, đổi hình nếu có dạng kế tiếp ---
const chick = createEnemy({ kind: 'normal', level: 2, enemy: 'combusken' })
assert.equal(chick.form, 0)
assert.deepEqual(chick.evoIds, ['blaziken'])
const evoB = { ...base, turn: 'enemy' as const, enemy: { ...chick, element: 'hoa' as const } }
// ngọc của kẻ địch cho XP, ngọc cùng hệ nhiều hơn
const exOwn = applyGems(evoB, 'enemy', gems({ hoa: 3 }), 1).state.enemy.xp
const exOth = applyGems(evoB, 'enemy', gems({ thuy: 3 }), 1).state.enemy.xp
assert.ok(exOwn > exOth && exOth > 0)
// mỗi lượt cũng nhận XP
assert.equal(enemyUpkeep(evoB).state.enemy.xp, BALANCE.enemyXpTurn)
// đủ mốc: dạng 2 đổi hình/tên/chiêu, máu và sức mạnh tăng, hồi máu
const hurtE = { ...evoB, enemy: { ...evoB.enemy, hp: 20, xp: BALANCE.enemyEvolveXp[0] - 1 } }
const ev = enemyUpkeep(hurtE)
assert.equal(ev.state.enemy.form, 1)
assert.equal(ev.state.enemy.id, 'blaziken')
assert.equal(ev.state.enemy.name, 'Blaziken')
assert.ok(ev.state.enemy.maxHp > hurtE.enemy.maxHp && ev.state.enemy.hp > 20 + (ev.state.enemy.maxHp - hurtE.enemy.maxHp))
assert.ok(ev.state.enemy.power > hurtE.enemy.power && ev.state.enemy.skill.damage > hurtE.enemy.skill.damage)
assert.ok(ev.events.some((e) => e.side === 'enemy' && e.text.startsWith('Tiến hóa')))
// loài không có dạng kế tiếp vẫn mạnh lên (giữ hình), tối đa 2 lần
const karp = { ...evoB, enemy: { ...createEnemy({ kind: 'normal', level: 2, enemy: 'ca-hay' }), xp: 9999 } }
const kEv = enemyUpkeep(karp).state.enemy
assert.equal(kEv.form, 2)
assert.equal(kEv.id, 'ca-hay')
assert.equal(enemyUpkeep({ ...evoB, enemy: kEv }).state.enemy.form, 2)
// Tinh anh và Boss giữ hậu tố tên
const eliteC = createEnemy({ kind: 'elite', level: 3, enemy: 'combusken' })
assert.equal(enemyUpkeep({ ...evoB, enemy: { ...eliteC, xp: BALANCE.enemyEvolveXp[0] } }).state.enemy.name, 'Blaziken Tinh Anh')

// --- Mega: chỉ ở dạng cuối, đầy Nộ, trong lượt mình, mỗi trận một lần ---
const finalB = gainXp(createBattle(hoaHo, RUN), 9999).state
const readyMega = withEnemy(withPlayer(finalB, { rage: 100, hp: 100 }), { element: 'tho', hp: 500, maxHp: 500 })
assert.ok(canMega(readyMega))
assert.ok(!canMega(withPlayer(readyMega, { rage: 50 }))) // chưa đủ Nộ
assert.ok(!canMega({ ...readyMega, turn: 'enemy' }))
assert.ok(!canMega(withPlayer(gainXp(createBattle(hoaHo, RUN), BALANCE.evolveXp[0]).state, { rage: 100 }))) // chưa tới dạng cuối
const mg = activateMega(readyMega)
assert.equal(mg.state.mega, BALANCE.megaTurns)
assert.ok(mg.state.megaUsed && mg.state.player.rage === 0 && mg.state.player.hp > 100 && mg.state.player.shield >= BALANCE.megaShield)
assert.ok(!canMega(withPlayer(mg.state, { rage: 100 }))) // đã Mega, không dùng lại trong trận
const lowRage = withPlayer(readyMega, { rage: 10 })
assert.equal(activateMega(lowRage).state, lowRage)
// Mega: ngọc, nạp Nộ và kỹ năng mạnh hơn
const gemDmg = (b: BattleState) => b.enemy.hp - applyGems(b, 'player', gems({ kim: 3 }), 1).state.enemy.hp
const normalF = withPlayer(withEnemy(finalB, { element: 'tho' }), { rage: 0 })
assert.ok(gemDmg({ ...normalF, mega: 3 }) > gemDmg(normalF))
const rg = (b: BattleState) => applyGems(b, 'player', gems({ hoa: 3 }), 1).state.player.rage
assert.ok(rg({ ...normalF, mega: 3 }) > rg(normalF))
const sk = (b: BattleState) => b.enemy.hp - useSkill(withEnemy(withPlayer(b, { rage: 100 }), { element: 'tho', hp: 900, maxHp: 900 })).state.enemy.hp
assert.ok(sk({ ...normalF, mega: 3 }) > sk(normalF))
// Mega giảm theo lượt của pet, hết thì báo; sang trận mới thì dùng lại được
let mt: BattleState = { ...mg.state, turn: 'player' }
for (let i = 0; i < BALANCE.megaTurns; i++) mt = passTurn({ ...passTurn(mt).state, turn: 'player' }).state
assert.equal(mt.mega, 0)
assert.ok(passTurn({ ...mg.state, mega: 1, turn: 'player' }).events.some((e) => e.text === 'Hết Mega'))
assert.equal(nextStage({ ...mg.state, status: 'stageClear' }).megaUsed, false)
assert.equal(nextStage({ ...mg.state, status: 'stageClear' }).mega, 0)

console.log('combat tests OK')
