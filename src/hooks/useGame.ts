import { useCallback, useEffect, useRef, useState } from 'react'
import { areAdjacent, collapse, countGems, createBoard, findMatches, hasPossibleMove, removeTiles, swapTiles } from '../game/board'
import { applyGems, canUseSkill, createBattle, enemyAttack, nextStage, tickEnemyTimer, useSkill as castSkill, type Result } from '../game/combat'
import { loadRecord, saveResult } from '../game/storage'
import type { Board, FloatEvent, Pet, Position } from '../game/types'

export interface FloatText extends FloatEvent {
  id: number
  x: number
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const TICK = 100

export interface Cast {
  id: number
  emoji: string
  /** true = đòn tấn công bay sang kẻ địch; false = hiệu ứng hào quang quanh pet */
  offensive: boolean
}

export function useGame(pet: Pet) {
  const [board, setBoard] = useState<Board>(createBoard)
  const [battle, setBattle] = useState(() => createBattle(pet))
  const [clearing, setClearing] = useState<Set<number>>(new Set())
  const [busy, setBusy] = useState(false)
  const [floats, setFloats] = useState<FloatText[]>([])
  const [hitFlash, setHitFlash] = useState<'player' | 'enemy' | null>(null)
  const [attacker, setAttacker] = useState<'player' | 'enemy' | null>(null)
  const [cast, setCast] = useState<Cast | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [best, setBest] = useState(() => loadRecord(pet.id))
  const [newBest, setNewBest] = useState(false)

  const boardRef = useRef(board)
  const battleRef = useRef(battle)
  const busyRef = useRef(false)
  const floatId = useRef(0)

  const flashAttack = useCallback((side: 'player' | 'enemy') => {
    setAttacker(side)
    setTimeout(() => setAttacker(null), 450)
  }, [])

  const setBoardSync = (b: Board) => {
    boardRef.current = b
    setBoard(b)
  }

  const pushFloats = useCallback((events: FloatEvent[]) => {
    if (!events.length) return
    const items = events.map((e) => ({ ...e, id: floatId.current++, x: 20 + Math.random() * 60 }))
    setFloats((f) => [...f, ...items])
    const ids = new Set(items.map((i) => i.id))
    setTimeout(() => setFloats((f) => f.filter((x) => !ids.has(x.id))), 1000)
    const hit = events.find((e) => e.kind === 'damage' || e.kind === 'skill')
    if (hit) {
      setHitFlash(hit.side)
      setTimeout(() => setHitFlash(null), 250)
    }
  }, [])

  /** Cập nhật trạng thái chiến đấu từ hàm thuần, đồng thời đẩy hiệu ứng chữ nổi. */
  const commit = useCallback(
    (res: Result) => {
      const prevStatus = battleRef.current.status
      battleRef.current = res.state
      setBattle(res.state)
      pushFloats(res.events)
      const end = res.state.status === 'lost' || res.state.status === 'won'
      if (prevStatus === 'playing' && end) {
        const out = saveResult(pet.id, res.state.score, res.state.status === 'won')
        setBest(out.record)
        setNewBest(out.isNewBest)
      }
      if (res.state.status === 'stageClear') {
        setTimeout(() => {
          const n = nextStage(battleRef.current)
          battleRef.current = n
          setBattle(n)
        }, 1400)
      }
    },
    [pushFloats, pet.id],
  )

  const trySwap = useCallback(
    async (a: Position, b: Position) => {
      if (busyRef.current || battleRef.current.status !== 'playing' || !areAdjacent(a, b)) return
      busyRef.current = true
      setBusy(true)
      const original = boardRef.current
      let cur = swapTiles(original, a, b)
      setBoardSync(cur)
      await sleep(220)

      if (findMatches(cur).length === 0) {
        setBoardSync(original) // nước đi không hợp lệ → trả lại
        await sleep(220)
      } else {
        let combo = 0
        for (;;) {
          const matches = findMatches(cur)
          if (!matches.length) break
          combo++
          const gems = countGems(cur, matches)
          setClearing(new Set(matches.map(({ r, c }) => cur[r][c]!.id)))
          await sleep(260)
          setClearing(new Set())
          commit(applyGems(battleRef.current, gems, combo))
          cur = collapse(removeTiles(cur, matches))
          setBoardSync(cur)
          await sleep(320)
        }
        if (!hasPossibleMove(cur)) {
          setNotice('Hết nước đi! Đang đổi bàn…')
          await sleep(1100)
          setBoardSync(createBoard())
          setNotice(null)
        }
      }
      busyRef.current = false
      setBusy(false)
    },
    [commit],
  )

  const useSkill = useCallback(() => {
    const cur = battleRef.current
    if (!canUseSkill(cur)) return
    const k = cur.pet.skill
    const offensive = !!k.damage
    const id = floatId.current++
    setCast({ id, emoji: k.emoji, offensive })
    if (offensive) flashAttack('player')
    setTimeout(() => setCast((c) => (c?.id === id ? null : c)), 800)
    // đòn đánh trúng sau khi hiệu ứng bay tới nơi
    setTimeout(() => commit(castSkill(battleRef.current)), offensive ? 450 : 150)
  }, [commit, flashAttack])

  const restart = useCallback(() => {
    const fresh = createBattle(pet)
    battleRef.current = fresh
    setBattle(fresh)
    setBoardSync(createBoard())
    setFloats([])
    setNewBest(false)
  }, [pet])

  // Đồng hồ kẻ địch: dừng khi bàn cờ đang xử lý chuỗi combo.
  useEffect(() => {
    const t = setInterval(() => {
      if (busyRef.current) return
      let s = tickEnemyTimer(battleRef.current, TICK)
      if (s.status === 'playing' && s.enemy.timer <= 0) {
        flashAttack('enemy')
        commit(enemyAttack(s))
        return
      }
      battleRef.current = s
      setBattle(s)
    }, TICK)
    return () => clearInterval(t)
  }, [commit, flashAttack])

  return { board, battle, clearing, busy, floats, hitFlash, attacker, cast, notice, best, newBest, trySwap, useSkill, restart }
}
