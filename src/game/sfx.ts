/**
 * Âm thanh tổng hợp bằng Web Audio API (không cần file âm thanh).
 * Mọi hàm đều an toàn khi chạy ngoài trình duyệt hoặc khi bị chặn autoplay.
 */
export type Sfx = 'swap' | 'invalid' | 'match' | 'special' | 'boom' | 'skill' | 'hit' | 'heal' | 'stageClear' | 'win' | 'lose'

const MUTE_KEY = 'linh-thu-xep-ngoc:muted'

let ctx: AudioContext | null = null
let muted = (() => {
  try {
    return globalThis.localStorage?.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
})()

export const isMuted = () => muted

export function setMuted(value: boolean) {
  muted = value
  try {
    globalThis.localStorage?.setItem(MUTE_KEY, value ? '1' : '0')
  } catch {
    /* bỏ qua */
  }
}

function getCtx(): AudioContext | null {
  if (typeof AudioContext === 'undefined') return null
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

interface Tone {
  from: number
  to?: number
  dur: number
  type?: OscillatorType
  vol?: number
  delay?: number
}

function tone(c: AudioContext, { from, to = from, dur, type = 'sine', vol = 0.15, delay = 0 }: Tone) {
  const t0 = c.currentTime + delay
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(from, t0)
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + dur)
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(gain).connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

/** Giai điệu ngắn: dãy tần số, mỗi nốt cách nhau `step` giây. */
const melody = (c: AudioContext, notes: number[], step: number, type: OscillatorType = 'triangle') =>
  notes.forEach((f, i) => tone(c, { from: f, dur: step * 1.6, type, delay: i * step }))

/** `level` (≥1) làm âm cao dần theo combo. */
export function play(name: Sfx, level = 1) {
  if (muted) return
  const c = getCtx()
  if (!c) return
  switch (name) {
    case 'swap':
      tone(c, { from: 380, to: 520, dur: 0.08, type: 'triangle', vol: 0.1 })
      break
    case 'invalid':
      tone(c, { from: 220, to: 140, dur: 0.18, type: 'square', vol: 0.08 })
      break
    case 'match': {
      const base = 440 * Math.pow(1.122, Math.min(level, 8) - 1) // mỗi combo cao hơn 2 bán cung
      tone(c, { from: base, to: base * 1.5, dur: 0.14, type: 'triangle', vol: 0.14 })
      break
    }
    case 'special':
      melody(c, [660, 880, 1320], 0.06)
      break
    case 'boom':
      tone(c, { from: 160, to: 40, dur: 0.35, type: 'sawtooth', vol: 0.2 })
      break
    case 'skill':
      tone(c, { from: 200, to: 900, dur: 0.4, type: 'sawtooth', vol: 0.12 })
      tone(c, { from: 400, to: 1400, dur: 0.4, type: 'square', vol: 0.05, delay: 0.05 })
      break
    case 'hit':
      tone(c, { from: 180, to: 60, dur: 0.2, type: 'square', vol: 0.15 })
      break
    case 'heal':
      melody(c, [523, 659, 784], 0.07, 'sine')
      break
    case 'stageClear':
      melody(c, [523, 659, 784, 1047], 0.1)
      break
    case 'win':
      melody(c, [523, 659, 784, 1047, 784, 1047, 1319], 0.13)
      break
    case 'lose':
      melody(c, [392, 330, 262, 196], 0.18, 'sawtooth')
      break
  }
}
