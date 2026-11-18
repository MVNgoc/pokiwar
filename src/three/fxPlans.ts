/** Thời gian đạn bay từ người tung sang mục tiêu (ms). Trùng thời điểm sát thương hiện ra. */
export const FLIGHT_MS = 450


export type FxEvent =
  | { kind: 'burst'; at: number; on: 'self' | 'foe'; color: string; up?: boolean; count?: number }
  | { kind: 'slash'; at: number; on: 'foe'; color: string }
  | { kind: 'bubble'; at: number; on: 'self'; color: string }
  | { kind: 'dome'; at: number; on: 'self' | 'foe'; color: string }
  | { kind: 'dust'; at: number; on: 'foe'; color: string }
  | { kind: 'stars'; at: number; on: 'foe'; color: string; ms: number }
  | { kind: 'beam'; at: number; on: 'self'; ms: number; color: string; size?: number; sprite?: string }
  | { kind: 'sprite'; at: number; on: 'self' | 'foe'; name: string; size?: number; ms?: number; spin?: number }
  | { kind: 'bite'; at: number; on: 'foe' }

import type { ProjectileProps } from './Fx3D'

export interface FxPlan {
  /** các đạn bay từ người tung sang mục tiêu (có thể nhiều viên, mỗi viên trễ riêng) */
  projectiles?: Omit<ProjectileProps, 't0' | 'from' | 'to'>[]
  events: FxEvent[]
}

/**
 * Kịch bản hiệu ứng kỹ năng: pet theo hệ (`pet-<hệ>`), kẻ địch theo id. `at` tính bằng ms từ lúc tung kỹ năng;
 * `self` là người tung, `foe` là mục tiêu (kẻ địch tung chiêu thì hai bên đảo lại).
 */
// ---- Hàm dựng kịch bản cho chiêu dạng 2 và 3 (chỉ dùng ảnh hiệu ứng, cỡ nhỏ gọn) ----
type Proj = NonNullable<FxPlan['projectiles']>[number]
const volley = (n: number, sprites: string[], o: { style?: Proj['style']; size: number; step?: number; flight?: number; arc?: number; spread?: number; spin?: number; color?: string }): Proj[] =>
  Array.from({ length: n }, (_, i) => ({
    style: o.style ?? 'seed',
    sprite: sprites[i % sprites.length],
    color: o.color ?? '#ffffff',
    size: o.size,
    delay: i * (o.step ?? 40),
    flight: o.flight ?? 320,
    arc: (o.arc ?? 0.4) + (i % 3) * 0.18,
    yOff: ((i % 5) - 2) * (o.spread ?? 0.1),
    spin: (o.spin ?? 0) * (i % 2 ? 1 : -1),
  }))
const pop = (name: string, at: number, size: number, ms = 380, spin?: number): FxEvent => ({ kind: 'sprite', at, on: 'foe', name, size, ms, spin })
const beam = (sprite: string, ms: number, size: number, at = 0): FxEvent => ({ kind: 'beam', at, on: 'self', ms, color: '#ffffff', size, sprite })
const bite = (at: number): FxEvent => ({ kind: 'bite', at, on: 'foe' })

/** Chiêu của dạng 2 (tên dạng) và dạng 3: mạnh dần, nhiều viên hơn, kèm tia sáng và va chạm lúc trúng. */
const EVOLVED_FX: Record<string, FxPlan> = {
  // Mộc
  ivysaur: { projectiles: volley(4, ['leaf2', 'leaf1'], { style: 'thorn', size: 0.42, step: 80, spin: 0.4, flight: 380, arc: 0.7 }), events: [pop('shine', 450, 0.8), pop('shine', 540, 0.7)] },
  venusaur: { projectiles: [...volley(6, ['leaf2', 'leaf1'], { style: 'thorn', size: 0.45, step: 60, spin: 0.4, flight: 380, arc: 0.8 }), ...volley(4, ['petal'], { style: 'leaf', size: 0.36, step: 70, spin: 1.2, flight: 400 })], events: [pop('shine', 450, 0.9), pop('energyball', 520, 0.8, 350)] },
  bayleef: { projectiles: volley(7, ['leaf1', 'leaf2'], { style: 'leaf', size: 0.4, step: 45, spin: 1, flight: 360, arc: 0.6 }), events: [pop('shine', 440, 0.9)] },
  meganium: { projectiles: [...volley(10, ['leaf1', 'leaf2'], { style: 'leaf', size: 0.4, step: 35, spin: 1, flight: 360, arc: 0.7 }), ...volley(4, ['petal'], { style: 'leaf', size: 0.34, step: 90, spin: 1.4, flight: 420, arc: 1.2 })], events: [pop('shine', 450, 1.0), pop('shine', 540, 0.8)] },
  grovyle: { projectiles: volley(9, ['energyball'], { size: 0.3, step: 30, flight: 290, arc: 0.15, spread: 0.12 }), events: [pop('energyball', 380, 0.8, 330), pop('shine', 450, 0.7)] },
  sceptile: { projectiles: volley(14, ['energyball'], { size: 0.3, step: 24, flight: 290, arc: 0.15, spread: 0.13 }), events: [pop('energyball', 380, 0.9, 330), pop('energyball', 470, 0.9, 330), pop('shine', 520, 0.9)] },
  grotle: { projectiles: [{ style: 'ball', sprite: 'rock3', spin: 0.6, color: '#a9783f', size: 0.7, arc: 1.2 }, { style: 'ball', sprite: 'rock2', spin: -0.6, color: '#a9783f', size: 0.5, delay: 110, arc: 0.9, yOff: -0.2 }], events: [pop('impact', 450, 1.1, 380), pop('shine', 480, 0.7)] },
  torterra: { projectiles: [{ style: 'ball', sprite: 'rock3', spin: 0.6, color: '#a9783f', size: 0.85, arc: 1.3 }, { style: 'ball', sprite: 'rock1', spin: -0.5, color: '#a9783f', size: 0.6, delay: 90, arc: 1.0, yOff: 0.2 }, { style: 'ball', sprite: 'rock2', spin: 0.5, color: '#a9783f', size: 0.5, delay: 160, arc: 0.8, yOff: -0.2 }], events: [pop('impact', 450, 1.3, 400), pop('impact', 560, 1.0, 380), pop('shine', 500, 0.8)] },
  servine: { projectiles: volley(8, ['petal', 'leaf1'], { style: 'leaf', size: 0.38, step: 40, spin: 1.4, flight: 380, arc: 0.9, spread: 0.14 }), events: [pop('shine', 450, 0.9)] },
  serperior: { projectiles: volley(12, ['petal', 'leaf1', 'leaf2'], { style: 'leaf', size: 0.38, step: 30, spin: 1.5, flight: 380, arc: 1.0, spread: 0.16 }), events: [pop('shine', 440, 1.0), pop('energyball', 500, 0.8, 340), pop('shine', 560, 0.8)] },
  // Hỏa
  charmeleon: { events: [beam('fireball', 740, 0.14), beam('flareball', 740, 0.1), pop('flareball', 420, 1.0, 420), pop('flareball', 540, 0.8, 360)] },
  charizard: { events: [beam('fireball', 900, 0.15), beam('flareball', 900, 0.11), beam('bluefireball', 900, 0.1, 80), pop('flareball', 420, 1.1, 460), pop('flareball', 540, 0.9, 400), pop('shine', 600, 0.9)] },
  quilava: { projectiles: [{ style: 'wheel', sprite: 'flareball', spin: 1.5, color: '#ff7a1a', size: 0.7, arc: 0.1 }, { style: 'wheel', sprite: 'flareball', spin: -1.5, color: '#ff7a1a', size: 0.7, delay: 110, arc: 0.1, yOff: -0.15 }, { style: 'fire', sprite: 'fireball', color: '#ff7a1a', size: 0.5, delay: 40, arc: 0.1 }], events: [pop('flareball', 440, 1.0, 400), pop('impact', 520, 0.8, 340)] },
  typhlosion: { projectiles: [{ style: 'wheel', sprite: 'flareball', spin: 1.5, color: '#ff7a1a', size: 0.8, arc: 0.1 }, { style: 'wheel', sprite: 'flareball', spin: -1.5, color: '#ff7a1a', size: 0.7, delay: 90, arc: 0.1, yOff: -0.18 }, { style: 'wheel', sprite: 'flareball', spin: 1.5, color: '#ff7a1a', size: 0.7, delay: 170, arc: 0.1, yOff: 0.18 }, { style: 'fire', sprite: 'fireball', color: '#ff7a1a', size: 0.55, delay: 40, arc: 0.1 }], events: [pop('flareball', 440, 1.2, 440), pop('impact', 520, 1.0, 360), pop('flareball', 600, 0.9, 380)] },
  combusken: { projectiles: volley(8, ['fireball'], { style: 'fire', size: 0.45, step: 40, flight: 330, arc: 0.5, spread: 0.12 }), events: [pop('flareball', 430, 0.9, 380), pop('flareball', 520, 0.8, 360)] },
  blaziken: { projectiles: volley(12, ['fireball', 'flareball'], { style: 'fire', size: 0.45, step: 28, flight: 330, arc: 0.55, spread: 0.13 }), events: [pop('flareball', 430, 1.0, 400), pop('flareball', 520, 0.9, 380), pop('shine', 580, 0.8)] },
  monferno: { projectiles: volley(3, ['fireball'], { style: 'fire', size: 0.8, step: 90, flight: 380, arc: 0.6 }), events: [pop('flareball', 440, 1.1, 480, 1), pop('fireball', 560, 0.9, 400)] },
  infernape: { projectiles: [...volley(4, ['fireball'], { style: 'fire', size: 0.8, step: 80, flight: 380, arc: 0.7 }), ...volley(2, ['bluefireball'], { style: 'fire', size: 0.7, step: 120, flight: 380, arc: 0.4 })], events: [pop('flareball', 440, 1.2, 520, 1), pop('flareball', 560, 1.0, 440, -1), pop('fireball', 620, 0.9, 400)] },
  pignite: { projectiles: [{ style: 'ball', sprite: 'flareball', color: '#ff5a1a', size: 1.0, arc: 0.3 }, { style: 'ball', sprite: 'fireball', color: '#ff5a1a', size: 0.6, delay: 80, arc: 0.3, yOff: -0.15 }], events: [pop('impact', 450, 1.4, 400), pop('flareball', 480, 1.0, 380)] },
  emboar: { projectiles: [{ style: 'ball', sprite: 'flareball', color: '#ff5a1a', size: 1.2, arc: 0.3 }, { style: 'ball', sprite: 'flareball', color: '#ff5a1a', size: 0.9, delay: 100, arc: 0.4, yOff: 0.2 }, { style: 'ball', sprite: 'fireball', color: '#ff5a1a', size: 0.6, delay: 170, arc: 0.3, yOff: -0.2 }], events: [pop('impact', 450, 1.6, 420), pop('impact', 560, 1.2, 380), pop('flareball', 520, 1.1, 400)] },
  // Thủy
  wartortle: { events: [beam('waterwisp', 740, 0.15), pop('waterwisp', 420, 1.1, 420), pop('shine', 520, 0.7)] },
  blastoise: { events: [beam('waterwisp', 900, 0.16), beam('waterwisp', 900, 0.1, 70), pop('waterwisp', 420, 1.3, 460), pop('waterwisp', 560, 1.0, 400), pop('shine', 620, 0.8)] },
  croconaw: { events: [bite(150), bite(360), pop('waterwisp', 450, 0.9, 360)] },
  feraligatr: { events: [bite(120), bite(300), bite(480), pop('waterwisp', 450, 1.0, 380), pop('waterwisp', 600, 1.0, 380), pop('shine', 640, 0.8)] },
  marshtomp: { projectiles: volley(5, ['mudwisp'], { style: 'mud', size: 0.7, step: 70, flight: 380, arc: 0.7, spread: 0.12 }), events: [pop('mudwisp', 450, 1.2, 400), pop('impact', 520, 0.9, 340)] },
  swampert: { projectiles: [...volley(7, ['mudwisp'], { style: 'mud', size: 0.7, step: 55, flight: 380, arc: 0.7, spread: 0.13 }), ...volley(2, ['rock1', 'rock2'], { style: 'ball', size: 0.5, step: 120, flight: 420, arc: 1.0, spin: 0.6 })], events: [pop('mudwisp', 450, 1.3, 420), pop('impact', 540, 1.2, 380), pop('impact', 620, 0.9, 340)] },
  prinplup: { projectiles: volley(9, ['waterwisp'], { style: 'bubble', size: 0.45, step: 40, flight: 400, arc: 0.4, spread: 0.12 }), events: [pop('waterwisp', 450, 1.1, 400), pop('shine', 540, 0.7)] },
  empoleon: { projectiles: [...volley(12, ['waterwisp'], { style: 'bubble', size: 0.45, step: 30, flight: 400, arc: 0.5, spread: 0.13 }), ...volley(3, ['iceball'], { style: 'bubble', size: 0.5, step: 110, flight: 400, arc: 0.3 })], events: [pop('waterwisp', 450, 1.2, 420), pop('iceball', 540, 1.0, 380), pop('shine', 600, 0.8)] },
  dewott: { projectiles: volley(2, ['shell'], { style: 'ball', size: 0.75, step: 140, flight: 400, arc: 0.5, spin: 2 }), events: [pop('shine', 460, 0.9), pop('shine', 600, 0.8)] },
  samurott: { projectiles: volley(3, ['shell'], { style: 'ball', size: 0.8, step: 110, flight: 400, arc: 0.5, spin: 2 }), events: [pop('sword', 470, 1.1, 360), pop('shine', 480, 0.9), pop('shine', 620, 0.9)] },
}

export const FX_PLANS: Record<string, FxPlan> = {
  ...EVOLVED_FX,
  // pet: chiêu riêng từng con (dùng ảnh hiệu ứng nếu có, thiếu thì dùng hình 3D vẽ sẵn; thiếu cả kịch bản thì theo hệ pet-<hệ> bên dưới)
  // Mộc
  bulbasaur: {
    projectiles: [
      { style: 'thorn', sprite: 'leaf2', spin: 0.3, color: '#3fbf4a', size: 0.43, arc: 0.9, yOff: 0.25 },
      { style: 'thorn', sprite: 'leaf1', spin: -0.3, color: '#7fe36a', size: 0.43, delay: 130, arc: -0.3, yOff: -0.2 },
    ],
    events: [
      { kind: 'sprite', at: FLIGHT_MS, on: 'foe', name: 'shine', size: 0.74 },
    ],
  },
  chikorita: {
    projectiles: [0, 1, 2, 3, 4].map((i) => ({ style: 'leaf' as const, sprite: i % 2 ? 'leaf2' : 'leaf1', spin: i % 2 ? 1 : -1, color: '#4fd05a', size: 0.34, delay: i * 70, arc: 0.4 + i * 0.18, yOff: (i - 2) * 0.16, flight: 380 })),
    events: [
      { kind: 'sprite', at: FLIGHT_MS, on: 'foe', name: 'shine', size: 0.81 },
    ],
  },
  treecko: {
    projectiles: [0, 1, 2, 3, 4, 5].map((i) => ({ style: 'seed' as const, sprite: 'energyball', color: '#6fd05a', size: 0.21, delay: i * 55, arc: 0.15, yOff: (i % 3 - 1) * 0.14, flight: 300 })),
    events: [
      { kind: 'sprite', at: 380, on: 'foe', name: 'energyball', size: 0.68, ms: 350 },
    ],
  },
  turtwig: {
    projectiles: [{ style: 'ball', sprite: 'rock3', spin: 0.6, color: '#a9783f', size: 0.56, arc: 1.2 }],
    events: [
      { kind: 'sprite', at: FLIGHT_MS, on: 'foe', name: 'impact', size: 1.05, ms: 380 },
    ],
  },
  snivy: {
    projectiles: [0, 1, 2, 3, 4, 5].map((i) => ({ style: 'leaf' as const, sprite: i % 2 ? 'petal' : 'leaf1', spin: i % 2 ? 1.4 : -1, color: '#3fbf6a', size: 0.31, delay: i * 45, arc: Math.sin(i * 1.3) * 0.9, yOff: Math.cos(i * 1.3) * 0.3, flight: 400 })),
    events: [
      { kind: 'sprite', at: FLIGHT_MS, on: 'foe', name: 'shine', size: 0.81 },
    ],
  },
  // Hỏa
  charmander: {
    events: [
      { kind: 'beam', at: 0, on: 'self', ms: 620, color: '#ff8a2a', size: 0.12, sprite: 'fireball' },
      { kind: 'beam', at: 0, on: 'self', ms: 620, color: '#ffd24d', size: 0.07, sprite: 'flareball' },
      { kind: 'sprite', at: FLIGHT_MS - 40, on: 'foe', name: 'flareball', size: 1.12, ms: 420 },
    ],
  },
  cyndaquil: {
    projectiles: [{ style: 'wheel', sprite: 'flareball', spin: 1.5, color: '#ff7a1a', size: 0.68, arc: 0.1 }, { style: 'fire', sprite: 'fireball', color: '#ff7a1a', size: 0.43, delay: 60, arc: 0.1 }],
    events: [
      { kind: 'sprite', at: FLIGHT_MS, on: 'foe', name: 'flareball', size: 1.12, ms: 400 },
    ],
  },
  torchic: {
    projectiles: [0, 1, 2, 3, 4].map((i) => ({ style: 'fire' as const, sprite: 'fireball', color: '#ff6a1a', size: 0.31, delay: i * 65, arc: 0.5, yOff: (i - 2) * 0.14, flight: 360 })),
    events: [
      { kind: 'sprite', at: 430, on: 'foe', name: 'flareball', size: 0.93, ms: 380 },
    ],
  },
  chimchar: {
    projectiles: [{ style: 'fire', sprite: 'fireball', color: '#ff5a1a', size: 0.56, arc: 0.6 }],
    events: [
      { kind: 'sprite', at: FLIGHT_MS, on: 'foe', name: 'flareball', size: 1.36, ms: 600, spin: 1 },
      { kind: 'sprite', at: FLIGHT_MS + 120, on: 'foe', name: 'fireball', size: 0.81, ms: 500 },
    ],
  },
  tepig: {
    projectiles: [{ style: 'ball', sprite: 'flareball', color: '#ff5a1a', size: 0.74, arc: 0.3 }],
    events: [
      { kind: 'sprite', at: FLIGHT_MS, on: 'foe', name: 'impact', size: 1.18, ms: 380 },
    ],
  },
  // Thủy (tung chiêu rồi hồi máu: có bóng nước quanh người tung)
  squirtle: {
    events: [
      { kind: 'beam', at: 0, on: 'self', ms: 600, color: '#4aa8ff', size: 0.1, sprite: 'waterwisp' },
      { kind: 'sprite', at: FLIGHT_MS - 40, on: 'foe', name: 'waterwisp', size: 1.24, ms: 420 },
    ],
  },
  totodile: {
    events: [
      { kind: 'bite', at: 200, on: 'foe' },
      { kind: 'sprite', at: FLIGHT_MS, on: 'foe', name: 'waterwisp', size: 1.12, ms: 380 },
    ],
    projectiles: [{ style: 'ball', sprite: 'waterwisp', color: '#3a9bff', size: 0.43, arc: 0.4, flight: 250 }],
  },
  mudkip: {
    projectiles: [0, 1, 2].map((i) => ({ style: 'mud' as const, sprite: 'mudwisp', color: '#8a5a2a', size: 0.46, delay: i * 90, arc: 0.7 - i * 0.2, yOff: (i - 1) * 0.15, flight: 380 })),
    events: [
      { kind: 'sprite', at: 440, on: 'foe', name: 'mudwisp', size: 1.12, ms: 400 },
    ],
  },
  piplup: {
    projectiles: [0, 1, 2, 3, 4, 5].map((i) => ({ style: 'bubble' as const, sprite: 'waterwisp', color: '#bfe6ff', size: 0.31, delay: i * 70, arc: 0.3 + (i % 3) * 0.25, yOff: (i % 3 - 1) * 0.2, flight: 420 })),
    events: [
      { kind: 'sprite', at: 470, on: 'foe', name: 'waterwisp', size: 1.12, ms: 400 },
    ],
  },
  oshawott: {
    projectiles: [{ style: 'ball', sprite: 'shell', spin: 2, color: '#4aa8ff', size: 0.5, arc: 0.5, flight: 400 }],
    events: [
      { kind: 'sprite', at: 400, on: 'foe', name: 'shine', size: 0.87 },
    ],
  },
  // pet
  'pet-hoa': { projectiles: [{ style: 'fire', color: '#ff7a1a', size: 0.34 }], events: [{ kind: 'burst', at: FLIGHT_MS, on: 'foe', color: '#ffc14d', count: 22 }] },
  'pet-thuy': {
    events: [
      { kind: 'bubble', at: 0, on: 'self', color: '#5ab4ff' },
      { kind: 'burst', at: 150, on: 'self', color: '#c8ecff', up: true, count: 18 },
    ],
  },
  'pet-moc': {
    projectiles: [{ style: 'thorn', color: '#4fd05a', size: 0.3 }],
    events: [
      { kind: 'burst', at: FLIGHT_MS, on: 'foe', color: '#9cff8a' },
      { kind: 'stars', at: FLIGHT_MS + 100, on: 'foe', color: '#ffe14d', ms: 1300 },
    ],
  },
  'pet-kim': {
    events: [
      { kind: 'slash', at: 0, on: 'foe', color: '#e9f0ff' },
      { kind: 'slash', at: 150, on: 'foe', color: '#e9f0ff' },
      { kind: 'slash', at: 300, on: 'foe', color: '#fff3b0' },
    ],
  },
  'pet-tho': {
    events: [
      { kind: 'dome', at: 0, on: 'self', color: '#ffd24a' },
      { kind: 'dust', at: 200, on: 'foe', color: '#b98a54' },
    ],
  },
  // kẻ địch: cũng dùng ảnh hiệu ứng Showdown (Oddish độc, Magnemite điện, Magikarp cắn, Onix đá, Charizard lửa)
  'sau-xanh': {
    projectiles: [0, 1, 2, 3].map((i) => ({ style: 'seed' as const, sprite: 'poisonwisp', color: '#b57cff', size: 0.45, delay: i * 80, arc: 0.4 + (i % 2) * 0.3, yOff: (i - 1.5) * 0.12, flight: 380 })),
    events: [{ kind: 'sprite', at: 440, on: 'foe', name: 'poisonwisp', size: 1.1, ms: 400 }],
  },
  'meo-xam': {
    projectiles: [{ style: 'ball', sprite: 'electroball', color: '#ffe14d', size: 0.45, arc: 0.3, flight: 350 }],
    events: [
      { kind: 'sprite', at: 360, on: 'foe', name: 'lightning', size: 1.3, ms: 300 },
      { kind: 'sprite', at: 460, on: 'foe', name: 'lightning', size: 1.1, ms: 300, spin: 0.2 },
    ],
  },
  'ca-hay': {
    events: [
      { kind: 'bite', at: 150, on: 'foe' },
      { kind: 'sprite', at: 380, on: 'foe', name: 'waterwisp', size: 0.9, ms: 350 },
    ],
  },
  'heo-rung': {
    projectiles: [
      { style: 'ball', sprite: 'rock1', spin: 0.6, color: '#b9a98a', size: 0.55, arc: 1.0, flight: 450 },
      { style: 'ball', sprite: 'rock2', spin: -0.6, color: '#b9a98a', size: 0.45, delay: 120, arc: 0.7, yOff: -0.2, flight: 400 },
    ],
    events: [{ kind: 'sprite', at: 450, on: 'foe', name: 'impact', size: 1.1, ms: 380 }],
  },
  'su-tu-lua': {
    events: [
      { kind: 'beam', at: 0, on: 'self', ms: 620, color: '#ff8a2a', size: 0.14, sprite: 'fireball' },
      { kind: 'beam', at: 0, on: 'self', ms: 620, color: '#ffd24d', size: 0.09, sprite: 'flareball' },
      { kind: 'sprite', at: 400, on: 'foe', name: 'flareball', size: 1.1, ms: 420 },
    ],
  },
}
