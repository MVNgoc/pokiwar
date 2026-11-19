import assert from 'node:assert/strict'
import { collapse, createBoard, findMatches, hasPossibleMove, isValidSwap, removeTiles, swapTiles } from './board'
import type { Board, Element } from './types'

const mk = (rows: string[]): Board => {
  const map: Record<string, Element> = { K: 'kim', M: 'moc', T: 'thuy', H: 'hoa', O: 'tho' }
  let id = 1000
  return rows.map((row) => [...row].map((ch) => ({ id: id++, type: map[ch] })))
}

// 1. không có match sẵn + còn nước đi
for (let i = 0; i < 200; i++) {
  const b = createBoard()
  assert.equal(findMatches(b).length, 0)
  assert.ok(hasPossibleMove(b))
}

// 2. match ngang 4 + dọc 3 (chữ L → 6 ô)
const b = mk(['KKKKMT HO'.replace(' ', ''), 'TMHOTMHO', 'TMHOTMHO', 'TKHOTMHO', 'MTHOMTHO', 'HOMTHOMT', 'OHTMOHTM', 'MOHTMOHT'])
assert.ok(findMatches(b).length >= 4)

// 3. swap hợp lệ / không hợp lệ
const s = mk(['KMKTHOKM', 'MKTHOKMT', 'THOKMTHO', 'HOKMTHOK', 'OKMTHOKM', 'KMTHOKMT', 'MTHOKMTH', 'THOKMTHO'])
assert.equal(isValidSwap(s, { r: 0, c: 0 }, { r: 0, c: 2 }), false) // không liền kề
assert.equal(isValidSwap(s, { r: 0, c: 0 }, { r: 1, c: 0 }), false)

// 4. swap tạo match
const w = mk(['KKMKTHOT', 'MTHOKMTH', 'THOKMTHO', 'HOKMTHOK', 'OKMTHOKM', 'KMTHOKMT', 'MTHOKMTH', 'THOKMTHO'])
assert.equal(isValidSwap(w, { r: 0, c: 2 }, { r: 0, c: 3 }), true)
assert.equal(findMatches(swapTiles(w, { r: 0, c: 2 }, { r: 0, c: 3 })).length, 3)

// 5. collapse lấp đầy, giữ id ngọc cũ
const cleared = removeTiles(w, [{ r: 7, c: 0 }, { r: 6, c: 0 }])
const col = collapse(cleared)
assert.ok(col.every((row) => row.every(Boolean)))
assert.equal(col[7][0]?.id, w[5][0]?.id)

// 6. Ngọc đặc biệt
import { countGems, listMoves, resolveMatches, suggestMove } from './board'
const LETTERS = 'KMTHO'
const base = () => mk(Array.from({ length: 8 }, (_, r) => Array.from({ length: 8 }, (_, c) => LETTERS[(c + 2 * r) % 5]).join('')))
assert.equal(findMatches(base()).length, 0)
const setType = (bd: Board, r: number, cs: number[], t: Element) => cs.forEach((c) => (bd[r][c] = { ...bd[r][c]!, type: t }))

// match 4 → bomb tại ô người chơi đổi
const b4 = base()
setType(b4, 0, [0, 1, 2, 3], 'kim')
const r4 = resolveMatches(b4, [{ r: 0, c: 1 }])
assert.deepEqual(r4.spawns, [{ pos: { r: 0, c: 1 }, special: 'bomb' }])
assert.equal(r4.cleared.length, 3)

// match 5 → lightning
const b5 = base()
setType(b5, 0, [0, 1, 2, 3, 4], 'kim')
assert.equal(resolveMatches(b5, [{ r: 0, c: 2 }]).spawns[0].special, 'lightning')

// bomb bị phá → nổ 3x3
const bb = base()
setType(bb, 3, [2, 3, 4], 'kim')
bb[3][3] = { ...bb[3][3]!, special: 'bomb' }
assert.equal(resolveMatches(bb).cleared.length, 9)

// lightning bị phá → xoá cả hàng + cột (8 + 8 - 1)
const bl = base()
setType(bl, 3, [2, 3, 4], 'kim')
bl[3][3] = { ...bl[3][3]!, special: 'lightning' }
assert.equal(resolveMatches(bl).cleared.length, 15)

// --- gợi ý: luôn là nước hợp lệ trên bàn mới tạo ---
for (let i = 0; i < 20; i++) {
  const b = createBoard()
  const mv = suggestMove(b)
  assert.ok(mv && isValidSwap(b, mv[0], mv[1]))
}

// --- Chướng ngại: đá và băng ---
import { applyHazard, applyResolution, clearObstacles, hasObstacles, isMovable, placeObstacles, ruleHazard } from './board'
import { BALANCE } from './constants'
const rock = (id = 9000) => ({ id, type: 'tho' as Element, block: 'rock' as const, hp: BALANCE.rockHp })

// đá không tạo match dù xếp thành hàng, không đổi chỗ được
const rb = base()
for (const c of [0, 1, 2]) rb[0][c] = rock(9000 + c)
assert.equal(findMatches(rb).length, 0)
assert.ok(!isMovable(rb[0][0]) && isMovable(rb[1][0]))
assert.ok(!isValidSwap(rb, { r: 0, c: 0 }, { r: 1, c: 0 }))
assert.ok(listMovesNoRock(rb))
function listMovesNoRock(bd: Board) {
  return listMoves(bd).every(([a, b]) => isMovable(bd[a.r][a.c]) && isMovable(bd[b.r][b.c]))
}
// đá không được tính vào ngọc thu được
assert.equal(countGems(rb, [{ r: 0, c: 0 }]).tho, 0)

// match liền kề làm đá nứt rồi vỡ
const adj = base()
setType(adj, 3, [2, 3, 4], 'kim')
adj[2][3] = rock()
const ra = resolveMatches(adj)
assert.equal(ra.cracked.length, 1)
assert.equal(ra.cleared.length, 3)
const after1 = applyResolution(adj, ra)
assert.equal(after1[2][3]?.hp, BALANCE.rockHp - 1)
const adj2 = base()
setType(adj2, 3, [2, 3, 4], 'kim')
adj2[2][3] = { ...rock(), hp: 1 }
const rb2 = resolveMatches(adj2)
assert.equal(rb2.cleared.length, 4) // 3 ngọc + đá vỡ
assert.equal(rb2.gems.kim, 3) // đá không tính là ngọc
// đá nằm xa thì không sao
const far = base()
setType(far, 3, [2, 3, 4], 'kim')
far[6][6] = rock()
assert.equal(resolveMatches(far).cracked.length, 0)
// bom phá đá trong vùng nổ
const bomb = base()
setType(bomb, 3, [2, 3, 4], 'kim')
bomb[3][3] = { ...bomb[3][3]!, special: 'bomb' }
bomb[4][3] = rock()
assert.ok(resolveMatches(bomb).cleared.some((p) => p.r === 4 && p.c === 3))

// băng: không đổi chỗ được; match với ngọc băng chỉ làm tan băng, ngọc ở lại
const ib = base()
ib[2][2] = { ...ib[2][2]!, ice: true }
assert.ok(!isMovable(ib[2][2]))
assert.ok(!isValidSwap(ib, { r: 2, c: 2 }, { r: 2, c: 3 }))
const ice = base()
setType(ice, 3, [2, 3, 4], 'kim')
ice[3][3] = { ...ice[3][3]!, ice: true }
const ri = resolveMatches(ice)
assert.equal(ri.thawed.length, 1)
assert.equal(ri.cleared.length, 2)
assert.equal(ri.gems.kim, 2)
const thawedBoard = applyResolution(ice, ri)
assert.equal(thawedBoard[3][3]?.ice, false)
assert.ok(thawedBoard[3][3]) // ngọc vẫn còn
assert.equal(thawedBoard[3][2], null)
// ngọc băng không sinh ngọc đặc biệt
const ice4 = base()
setType(ice4, 0, [0, 1, 2, 3], 'kim')
ice4[0][1] = { ...ice4[0][1]!, ice: true }
assert.equal(resolveMatches(ice4, [{ r: 0, c: 1 }]).spawns.filter((s2) => s2.pos.c === 1).length, 0)

// thả chướng ngại: đúng số lượng, không đè ngọc đặc biệt / ô đã có chướng ngại
const clean = createBoard()
const special = clean.map((row) => [...row])
special[0][0] = { ...special[0][0]!, special: 'bomb' }
const withRocks = placeObstacles(special, 'rock', 6)
assert.equal(withRocks.flat().filter((t) => t?.block).length, 6)
assert.equal(withRocks[0][0]?.special, 'bomb')
const withIce = placeObstacles(clean, 'ice', 4)
assert.equal(withIce.flat().filter((t) => t?.ice).length, 4)
assert.equal(placeObstacles(withIce, 'ice', 3).flat().filter((t) => t?.ice).length, 7)
assert.equal(placeObstacles(clean, 'rock', 999).flat().filter((t) => t?.block).length, 64) // không vượt quá số ô
assert.ok(hasObstacles(withRocks) && !hasObstacles(clean))
assert.equal(applyHazard(clean, undefined), clean)
assert.equal(ruleHazard({ type: 'rubble' })?.kind, 'rock')
assert.equal(ruleHazard({ type: 'frost' })?.kind, 'ice')
assert.equal(ruleHazard({ type: 'swift' }), undefined)
// dọn chướng ngại: không còn đá/băng, không sinh match sẵn
for (let i = 0; i < 50; i++) {
  const messy = placeObstacles(placeObstacles(createBoard(), 'rock', 5), 'ice', 5)
  const cleaned = clearObstacles(messy)
  assert.ok(!hasObstacles(cleaned))
  assert.equal(findMatches(cleaned).length, 0)
}
// đá rơi theo trọng lực như ngọc thường
const fall = createBoard().map((row) => [...row])
fall[7][0] = rock(9100)
const dropped = collapse(removeTiles(fall, [{ r: 6, c: 0 }, { r: 5, c: 0 }]).map((row, r) => (r === 7 ? row : row)))
assert.ok(dropped.flat().some((t) => t?.block))
// tạo bàn cờ mới luôn sạch chướng ngại
for (let i = 0; i < 30; i++) assert.ok(!hasObstacles(createBoard()))

console.log('board tests OK')
