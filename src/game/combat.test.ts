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

// Nộ theo hệ pet: mỗi pet nạp 5/ngọc cùng hệ, 1/ngọc khác
for (const pet of PETS) {
  const b = createBattle(pet)
  const own = { kim: 0, moc: 0, thuy: 0, hoa: 0, tho: 0, [pet.element]: 3 }
  assert.equal(applyGems(b, own, 1).state.player.rage, 15, `${pet.name} nạp từ hệ mình`)
  const other = ELEMENTS.find((e) => e !== pet.element)!
  const mixed = { kim: 0, moc: 0, thuy: 0, hoa: 0, tho: 0, [other]: 3 }
  assert.equal(applyGems(b, mixed, 1).state.player.rage, 3, `${pet.name} nạp từ hệ khác`)
}

// Boss + thắng ván
import { nextStage } from './combat'
import { TOTAL_STAGES } from './constants'
let run = createBattle(hoaHo)
for (let i = 1; i < TOTAL_STAGES; i++) run = nextStage(run)
assert.equal(run.stage, TOTAL_STAGES)
assert.ok(run.enemy.boss)
assert.ok(run.enemy.maxHp > createBattle(hoaHo).enemy.maxHp * 2)
const dying = { ...run, enemy: { ...run.enemy, hp: 1, element: 'tho' as const } }
assert.equal(applyGems(dying, gems, 1).state.status, 'won')
const midDying = { ...createBattle(hoaHo), enemy: { ...createBattle(hoaHo).enemy, hp: 1 } }
assert.equal(applyGems(midDying, gems, 1).state.status, 'stageClear')
assert.equal(createBattle(hoaHo).enemy.boss, false)

console.log('combat tests OK')
