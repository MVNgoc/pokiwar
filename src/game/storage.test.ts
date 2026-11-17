import assert from 'node:assert/strict'
import { loadRecord, saveResult } from './storage'

const mem = () => {
  const m = new Map<string, string>()
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }
}

const st = mem()
assert.deepEqual(loadRecord('a', st), { bestScore: 0, wins: 0 })
assert.deepEqual(saveResult('a', 500, false, st), { record: { bestScore: 500, wins: 0 }, isNewBest: true })
assert.deepEqual(saveResult('a', 300, true, st), { record: { bestScore: 500, wins: 1 }, isNewBest: false })
assert.equal(loadRecord('b', st).bestScore, 0) // kỷ lục tách theo pet

// storage hỏng/bị chặn không làm crash
const broken = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') } }
assert.equal(loadRecord('a', broken).bestScore, 0)
assert.equal(saveResult('a', 10, false, broken).isNewBest, true)
assert.equal(loadRecord('a', null).bestScore, 0)

console.log('storage tests OK')
