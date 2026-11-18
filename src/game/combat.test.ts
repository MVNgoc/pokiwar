import assert from 'node:assert/strict'
import { chooseEnemyMove } from './ai'
import { BALANCE, COUNTER, ELEMENTS, TOTAL_STAGES } from './constants'
import { applyGems, canEnemyCast, currentForm, gainXp, canUseSkill, createBattle, enemyCastSkill, matchup, nextStage, passTurn, tickTurn, useSkill } from './combat'
import { createBoard } from './board'
import { PETS } from './pets'
import type { BattleState } from './types'

const zero = { kim: 0, moc: 0, thuy: 0, hoa: 0, tho: 0 }
const gems = (o: Partial<typeof zero>) => ({ ...zero, ...o })
const hoaHo = PETS.find((p) => p.id === 'charmander')! // Hỏa khắc Kim
const withEnemy = (s: BattleState, e: Partial<BattleState['enemy']>): BattleState => ({ ...s, enemy: { ...s.enemy, ...e } })
const withPlayer = (s: BattleState, p: Partial<BattleState['player']>): BattleState => ({ ...s, player: { ...s.player, ...p } })
const base = createBattle(hoaHo)

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
const cast = withEnemy({ ...base, turn: 'enemy' }, { rage: 100, element: 'tho' })
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
let run = createBattle(hoaHo)
for (let i = 1; i < TOTAL_STAGES; i++) run = nextStage(run)
assert.ok(run.enemy.boss)
assert.equal(run.turn, 'player')
const dying = withEnemy(run, { hp: 1, element: 'tho' })
assert.equal(applyGems(dying, 'player', gems({ kim: 3 }), 1).state.status, 'won')
const mid = withEnemy(createBattle(hoaHo), { hp: 1 })
assert.equal(applyGems(mid, 'player', gems({ kim: 3 }), 1).state.status, 'stageClear')
const lose = withPlayer({ ...createBattle(hoaHo), turn: 'enemy' }, { hp: 1 })
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
const evoBase = createBattle(hoaHo)
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
assert.equal(nextStage(e1.state).form, 1)
assert.equal(nextStage(e1.state).xp, e1.state.xp)
// mọi pokemon đều có đủ 3 dạng với chỉ số tăng dần
for (const pet of PETS) {
  assert.equal(pet.forms.length, 3)
  assert.ok(pet.forms[1].maxHp > pet.forms[0].maxHp && pet.forms[2].maxHp > pet.forms[1].maxHp)
  assert.ok(pet.forms[2].skill.damage! > pet.forms[1].skill.damage! && pet.forms[1].skill.damage! > pet.forms[0].skill.damage!)
}

console.log('combat tests OK')
