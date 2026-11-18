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
export const FX_PLANS: Record<string, FxPlan> = {
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
  // kẻ địch
  'sau-xanh': { projectiles: [{ style: 'thorn', color: '#b57cff', size: 0.28 }], events: [{ kind: 'burst', at: FLIGHT_MS, on: 'foe', color: '#d9b8ff' }] },
  'meo-xam': { events: [{ kind: 'slash', at: 0, on: 'foe', color: '#a9b8ff' }, { kind: 'slash', at: 180, on: 'foe', color: '#a9b8ff' }] },
  'ca-hay': { projectiles: [{ style: 'thorn', color: '#2de0bf', size: 0.3 }], events: [{ kind: 'burst', at: FLIGHT_MS, on: 'foe', color: '#9ffbe8' }] },
  'heo-rung': { events: [{ kind: 'dust', at: 150, on: 'foe', color: '#cfc7b0' }, { kind: 'dust', at: 350, on: 'foe', color: '#cfc7b0' }] },
  'su-tu-lua': { projectiles: [{ style: 'fire', color: '#ffb300', size: 0.42 }], events: [{ kind: 'burst', at: FLIGHT_MS, on: 'foe', color: '#ffe27a', count: 26 }] },
}
