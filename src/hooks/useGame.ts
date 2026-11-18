import { useCallback, useEffect, useRef, useState } from 'react'
import { chooseEnemyMove, type Move } from '../game/ai'
import { applyResolution, areAdjacent, collapse, createBoard, findMatches, hasPossibleMove, resolveMatches, suggestMove, swapTiles } from '../game/board'
import {
  applyGems,
  canEnemyCast,
  canUseSkill,
  createBattle,
  enemyCastSkill,
  nextStage,
  passTurn,
  tickTurn,
  useSkill as castSkill,
  type Result,
} from '../game/combat'
import { BALANCE } from '../game/constants'
import { play } from '../game/sfx'
import { FLIGHT_MS, FX_PLANS } from '../three/fxPlans'
import { loadRecord, saveResult } from '../game/storage'
import type { Board, FloatEvent, Pet, Position, Side } from '../game/types'

export interface FloatText extends FloatEvent {
  id: number
  x: number
}

export interface Cast {
  id: number
  /** id pet hoặc kẻ địch (chọn kịch bản hiệu ứng) */
  fxId: string
  side: Side
  /** true = kỹ năng gây sát thương (lao tới, trúng sau thời gian bay) */
  offensive: boolean
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const TICK = 100

/**
 * Điều phối trận đấu theo lượt: mỗi lượt đi 1 nước trên bàn cờ chung, có đồng hồ đếm ngược.
 * Lượt pet: người chơi xếp ngọc (hết giờ thì mất lượt). Lượt kẻ địch: AI tự chọn và xếp ngọc.
 */
export function useGame(pet: Pet, paused = false) {
  const [board, setBoard] = useState<Board>(createBoard)
  const [battle, setBattle] = useState(() => createBattle(pet))
  const [clearing, setClearing] = useState<Set<number>>(new Set())
  const [busy, setBusy] = useState(false)
  const [floats, setFloats] = useState<FloatText[]>([])
  const [hitFlash, setHitFlash] = useState<Side | null>(null)
  const [shaking, setShaking] = useState(false)
  const [attacker, setAttacker] = useState<Side | null>(null)
  const [cast, setCast] = useState<Cast | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [enemyPick, setEnemyPick] = useState<Move | null>(null)
  /** gợi ý nước đi cho người chơi khi sắp hết giờ (hai ô chớp tắt) */
  const [hintMove, setHintMove] = useState<Move | null>(null)
  const [best, setBest] = useState(() => loadRecord(pet.id))
  const [newBest, setNewBest] = useState(false)

  const boardRef = useRef(board)
  const battleRef = useRef(battle)
  const busyRef = useRef(false)
  /** mở hướng dẫn: tạm dừng đồng hồ lượt */
  const pausedRef = useRef(paused)
  pausedRef.current = paused
  const floatId = useRef(0)
  const hitTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  /** tăng khi chơi lại: các chuỗi bất đồng bộ cũ tự dừng */
  const epoch = useRef(0)
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])
  const stale = (e: number) => !alive.current || e !== epoch.current

  const setBusyBoth = (v: boolean) => {
    busyRef.current = v
    setBusy(v)
  }
  const setBoardSync = (b: Board) => {
    boardRef.current = b
    setBoard(b)
  }

  const flashAttack = useCallback((side: Side) => {
    setAttacker(side)
    setTimeout(() => setAttacker(null), 550)
  }, [])

  const pushFloats = useCallback((events: FloatEvent[]) => {
    if (!events.length) return
    const items = events.map((e) => ({ ...e, id: floatId.current++, x: 20 + Math.random() * 60 }))
    setFloats((f) => [...f, ...items])
    const ids = new Set(items.map((i) => i.id))
    setTimeout(() => setFloats((f) => f.filter((x) => !ids.has(x.id))), 1100)
    const hit = events.find((e) => e.kind === 'damage' || e.kind === 'skill')
    if (hit) {
      clearTimeout(hitTimer.current)
      setHitFlash(null) // tách 2 lần bị đánh liên tiếp để hoạt ảnh phát lại
      requestAnimationFrame(() => setHitFlash(hit.side))
      hitTimer.current = setTimeout(() => setHitFlash(null), 450)
    }
    if (events.some((e) => e.kind === 'skill')) {
      setShaking(true)
      setTimeout(() => setShaking(false), 400)
    }
  }, [])

  /** Cập nhật trạng thái chiến đấu từ hàm thuần, đồng thời đẩy hiệu ứng chữ nổi và âm thanh. */
  const commit = (res: Result) => {
    const prevStatus = battleRef.current.status
    battleRef.current = res.state
    setBattle(res.state)
    pushFloats(res.events)
    if (res.events.some((e) => e.side === 'player' && (e.kind === 'damage' || e.kind === 'skill'))) play('hit')
    if (res.events.some((e) => e.side === 'player' && e.kind === 'heal')) play('heal')
    if (prevStatus === 'playing') {
      if (res.state.status === 'stageClear') play('stageClear')
      else if (res.state.status === 'won') play('win')
      else if (res.state.status === 'lost') play('lose')
      if (res.state.status === 'lost' || res.state.status === 'won') {
        const out = saveResult(pet.id, res.state.score, res.state.status === 'won')
        setBest(out.record)
        setNewBest(out.isNewBest)
      }
    }
    if (res.state.status === 'stageClear') {
      const e = epoch.current
      setTimeout(() => {
        if (stale(e)) return
        const n = nextStage(battleRef.current)
        battleRef.current = n
        setBattle(n)
      }, 1400)
    }
  }

  /** Một nước đi (hoán đổi → chuỗi combo). Trả về true nếu nước đi hợp lệ. */
  const runMove = async (side: Side, a: Position, b: Position, e: number): Promise<boolean> => {
    setBusyBoth(true)
    play('swap')
    const original = boardRef.current
    let cur = swapTiles(original, a, b)
    setBoardSync(cur)
    await sleep(200)

    let valid = false
    if (findMatches(cur).length === 0) {
      play('invalid')
      setBoardSync(original) // nước đi không hợp lệ → trả lại
      await sleep(200)
    } else {
      valid = true
      let combo = 0
      let preferred = [a, b] // ngọc đặc biệt ưu tiên sinh ra ở ô vừa đổi
      for (;;) {
        const res = resolveMatches(cur, preferred)
        if (!res.cleared.length) break
        preferred = []
        combo++
        setClearing(new Set(res.cleared.map(({ r, c }) => cur[r][c]!.id)))
        play('match', combo)
        if (res.cleared.some(({ r, c }) => cur[r][c]!.special)) play('boom')
        if (res.spawns.length) play('special')
        // pet lao tới đúng lúc ngọc nổ nếu nước đi gây sát thương
        if (res.gems.kim + res.gems.hoa > 0) flashAttack(side)
        await sleep(260)
        if (stale(e)) return valid
        setClearing(new Set())
        commit(applyGems(battleRef.current, side, res.gems, combo))
        cur = collapse(applyResolution(cur, res))
        setBoardSync(cur)
        await sleep(400)
        if (battleRef.current.status !== 'playing') break
      }
      if (battleRef.current.status === 'playing' && !hasPossibleMove(cur)) {
        setNotice('Hết nước đi! Đang đổi bàn…')
        await sleep(1100)
        setBoardSync(createBoard())
        setNotice(null)
      }
    }
    if (!stale(e)) setBusyBoth(false)
    return valid
  }

  /** Kết thúc lượt: chuyển sang bên kia; nếu tới lượt kẻ địch thì AI bắt đầu. */
  const endTurn = () => {
    const e = epoch.current
    const res = passTurn(battleRef.current)
    commit(res)
    if (res.state.status === 'playing' && res.state.turn === 'enemy') void runEnemyTurn(e)
  }

  /** Lượt kẻ địch: (tung kỹ năng nếu đầy Nộ) → suy nghĩ → chọn nước → xếp ngọc. */
  const runEnemyTurn = async (e: number) => {
    const alright = () => !stale(e) && battleRef.current.status === 'playing' && battleRef.current.turn === 'enemy'
    await sleep(900) // chờ biểu ngữ "Lượt kẻ địch"
    if (!alright()) return

    if (canEnemyCast(battleRef.current)) {
      const cur = battleRef.current
      setBusyBoth(true)
      const id = floatId.current++
      setCast({ id, fxId: cur.enemy.id, side: 'enemy', offensive: true })
      play('skill')
      flashAttack('enemy')
      pushFloats([{ side: 'enemy', text: cur.enemy.skill.name, kind: 'combo' }])
      setTimeout(() => setCast((c) => (c?.id === id ? null : c)), 1500)
      await sleep(FLIGHT_MS)
      if (stale(e)) return
      commit(enemyCastSkill(battleRef.current))
      await sleep(700)
      if (stale(e)) return
      setBusyBoth(false)
      if (!alright()) return
    }

    await sleep(700 + Math.random() * 900) // "suy nghĩ"
    if (!alright()) return
    const move = chooseEnemyMove(boardRef.current, battleRef.current)
    if (!move) {
      endTurn()
      return
    }
    setEnemyPick(move) // nhá hai viên định đổi
    await sleep(550)
    setEnemyPick(null)
    if (!alright()) return
    await runMove('enemy', move[0], move[1], e)
    if (!stale(e) && battleRef.current.status === 'playing') endTurn()
  }

  /** Người chơi đổi 2 ngọc (chỉ trong lượt của mình). */
  const trySwap = async (a: Position, b: Position) => {
    const s = battleRef.current
    if (busyRef.current || s.status !== 'playing' || s.turn !== 'player' || !areAdjacent(a, b)) return
    const e = epoch.current
    const valid = await runMove('player', a, b, e)
    if (valid && !stale(e) && battleRef.current.status === 'playing') endTurn()
  }

  /** Kỹ năng là hành động tự do trong lượt của mình: không tốn lượt đi. */
  const useSkill = async () => {
    const cur = battleRef.current
    if (busyRef.current || !canUseSkill(cur)) return
    const e = epoch.current
    setBusyBoth(true)
    const offensive = !!cur.pet.skill.damage
    const id = floatId.current++
    setCast({ id, fxId: FX_PLANS[cur.pet.id] ? cur.pet.id : `pet-${cur.pet.element}`, side: 'player', offensive })
    play('skill')
    if (offensive) flashAttack('player')
    setTimeout(() => setCast((c) => (c?.id === id ? null : c)), 1500)
    await sleep(offensive ? FLIGHT_MS : 150) // đòn trúng sau khi hiệu ứng bay tới nơi
    if (stale(e)) return
    commit(castSkill(battleRef.current))
    await sleep(600)
    if (!stale(e)) setBusyBoth(false)
  }

  const restart = () => {
    epoch.current++
    const fresh = createBattle(pet)
    battleRef.current = fresh
    setBattle(fresh)
    setBoardSync(createBoard())
    setFloats([])
    setNewBest(false)
    setEnemyPick(null)
    setHintMove(null)
    setClearing(new Set())
    setBusyBoth(false)
  }

  // Đồng hồ lượt: chạy khi bàn cờ không đang xử lý. Hết giờ ở lượt người chơi → mất lượt.
  const endTurnRef = useRef(endTurn)
  endTurnRef.current = endTurn
  useEffect(() => {
    const t = setInterval(() => {
      if (pausedRef.current) return
      if (busyRef.current) {
        setHintMove((h) => (h ? null : h))
        return
      }
      const cur = battleRef.current
      if (cur.status !== 'playing') return
      const s = tickTurn(cur, TICK)
      battleRef.current = s
      setBattle(s)
      // sắp hết giờ mà chưa đi: chớp 2 ngọc của nước đi tốt nhất; sang lượt/đang xử lý thì tắt
      if (s.turn === 'player' && s.turnLeft > 0 && s.turnLeft <= BALANCE.hintMs) setHintMove((h) => h ?? suggestMove(boardRef.current))
      else setHintMove((h) => (h ? null : h))
      if (s.turnLeft <= 0 && s.turn === 'player') {
        pushFloats([{ side: 'player', text: 'Hết giờ!', kind: 'combo' }])
        play('invalid')
        endTurnRef.current()
      }
    }, TICK)
    return () => clearInterval(t)
  }, [pushFloats])

  return { board, battle, clearing, busy, floats, hitFlash, shaking, attacker, cast, notice, enemyPick, hintMove, best, newBest, trySwap, useSkill, restart }
}
