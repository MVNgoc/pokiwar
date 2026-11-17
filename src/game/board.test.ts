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
import { resolveMatches } from './board'
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

console.log('board tests OK')
