import assert from 'node:assert/strict'
import { COUNTER, ELEMENTS } from './constants'
import { applyGems, createBattle, enemyAttack, matchup, useSkill } from './combat'
import { PETS } from './pets'

// vòng tương khắc: mỗi hệ khắc đúng 1 hệ, bị đúng 1 hệ khắc
for (const e of ELEMENTS) {
  assert.equal(matchup(e, COUNTER[e]), 1.5)
  assert.equal(matchup(COUNTER[e], e), 0.7)
  assert.equal(matchup(e, e), 1)
}

const gems = { kim: 3, moc: 0, thuy: 0, hoa: 0, tho: 0 }
const hoaHo = PETS.find((p) => p.id === 'hoa-ho')! // Hỏa khắc Kim
const base = createBattle(hoaHo)

// enemy Kim (bị Hỏa khắc) → đòn của pet x1.5
const vsKim = { ...base, enemy: { ...base.enemy, element: 'kim' as const } }
const vsTho = { ...base, enemy: { ...base.enemy, element: 'tho' as const } } // trung tính
const dKim = vsKim.enemy.hp - applyGems(vsKim, gems, 1).state.enemy.hp
const dTho = vsTho.enemy.hp - applyGems(vsTho, gems, 1).state.enemy.hp
assert.equal(dTho, 12)
assert.equal(dKim, 18)

// enemy Thủy khắc Hỏa → đánh pet x1.5; pet bị khắc
const thuyEnemy = { ...base, enemy: { ...base.enemy, element: 'thuy' as const, attack: 10 } }
assert.equal(thuyEnemy.player.hp - enemyAttack(thuyEnemy).state.player.hp, 15)
const kimEnemy = { ...base, enemy: { ...base.enemy, element: 'kim' as const, attack: 10 } }
assert.equal(kimEnemy.player.hp - enemyAttack(kimEnemy).state.player.hp, 7)

// kỹ năng cũng chịu tương khắc
const ready = { ...vsKim, player: { ...vsKim.player, rage: 100 }, enemy: { ...vsKim.enemy, hp: 500, maxHp: 500 } }
assert.equal(ready.enemy.hp - useSkill(ready).state.enemy.hp, 90)

console.log('combat tests OK')
