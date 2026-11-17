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

console.log('board tests OK')
