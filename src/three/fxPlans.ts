/** Thời gian đạn bay từ người tung sang mục tiêu (ms). Trùng thời điểm sát thương hiện ra. */
export const FLIGHT_MS = 450


export type FxEvent =
  | { kind: 'burst'; at: number; on: 'self' | 'foe'; color: string; up?: boolean; count?: number }
  | { kind: 'slash'; at: number; on: 'foe'; color: string }
  | { kind: 'bubble'; at: number; on: 'self'; color: string }
  | { kind: 'dome'; at: number; on: 'self' | 'foe'; color: string }
  | { kind: 'dust'; at: number; on: 'foe'; color: string }
  | { kind: 'stars'; at: number; on: 'foe'; color: string; ms: number }
  | { kind: 'beam'; at: number; on: 'self'; ms: number; color: string; size?: number }

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
  // pet: chiêu riêng từng con (thiếu thì dùng kịch bản theo hệ pet-<hệ> bên dưới)
  // Mộc
  bulbasaur: {
    projectiles: [
      { style: 'thorn', color: '#3fbf4a', size: 0.26, arc: 0.9, yOff: 0.25 },
      { style: 'thorn', color: '#7fe36a', size: 0.26, delay: 130, arc: -0.3, yOff: -0.2 },
    ],
    events: [
      { kind: 'slash', at: FLIGHT_MS, on: 'foe', color: '#7dff7a' },
      { kind: 'slash', at: FLIGHT_MS + 120, on: 'foe', color: '#3fbf4a' },
      { kind: 'stars', at: FLIGHT_MS + 100, on: 'foe', color: '#ffe14d', ms: 1300 },
    ],
  },
  chikorita: {
    projectiles: [0, 1, 2, 3, 4].map((i) => ({ style: 'leaf' as const, color: i % 2 ? '#9cf06a' : '#4fd05a', size: 0.2, delay: i * 70, arc: 0.4 + i * 0.18, yOff: (i - 2) * 0.16, flight: 380 })),
    events: [
      { kind: 'burst', at: FLIGHT_MS, on: 'foe', color: '#b9ff8a', count: 20 },
      { kind: 'stars', at: FLIGHT_MS + 100, on: 'foe', color: '#ffe14d', ms: 1300 },
    ],
  },
  treecko: {
    projectiles: [0, 1, 2, 3, 4, 5].map((i) => ({ style: 'seed' as const, color: i % 2 ? '#e8ff6a' : '#6fd05a', size: 0.14, delay: i * 55, arc: 0.15, yOff: (i % 3 - 1) * 0.14, flight: 300 })),
    events: [
      { kind: 'burst', at: 330, on: 'foe', color: '#e8ff6a', count: 16 },
      { kind: 'burst', at: 400, on: 'foe', color: '#9cff8a', count: 10 },
      { kind: 'stars', at: 520, on: 'foe', color: '#ffe14d', ms: 1300 },
    ],
  },
  turtwig: {
    projectiles: [{ style: 'ball', color: '#a9783f', size: 0.3, arc: 1.2 }],
    events: [
      { kind: 'dust', at: FLIGHT_MS, on: 'foe', color: '#b98a54' },
      { kind: 'burst', at: FLIGHT_MS, on: 'foe', color: '#7dd35a', count: 18 },
      { kind: 'stars', at: FLIGHT_MS + 100, on: 'foe', color: '#ffe14d', ms: 1300 },
    ],
  },
  snivy: {
    projectiles: [0, 1, 2, 3, 4, 5].map((i) => ({ style: 'leaf' as const, color: i % 2 ? '#c5f58a' : '#3fbf6a', size: 0.18, delay: i * 45, arc: Math.sin(i * 1.3) * 0.9, yOff: Math.cos(i * 1.3) * 0.3, flight: 400 })),
    events: [
      { kind: 'dome', at: FLIGHT_MS - 40, on: 'foe', color: '#7fe36a' },
      { kind: 'burst', at: FLIGHT_MS, on: 'foe', color: '#c5f58a', count: 22 },
      { kind: 'stars', at: FLIGHT_MS + 100, on: 'foe', color: '#ffe14d', ms: 1300 },
    ],
  },
  // Hỏa
  charmander: {
    events: [
      { kind: 'beam', at: 0, on: 'self', ms: 620, color: '#ff8a2a', size: 0.2 },
      { kind: 'beam', at: 0, on: 'self', ms: 620, color: '#ffd24d', size: 0.11 },
      { kind: 'burst', at: FLIGHT_MS, on: 'foe', color: '#ffc14d', count: 26 },
    ],
  },
  cyndaquil: {
    projectiles: [{ style: 'wheel', color: '#ff7a1a', size: 0.4, arc: 0.1 }],
    events: [
      { kind: 'burst', at: 0, on: 'self', color: '#ffb347', count: 12 },
      { kind: 'dust', at: FLIGHT_MS, on: 'foe', color: '#ff9a3d' },
      { kind: 'burst', at: FLIGHT_MS, on: 'foe', color: '#ffc14d', count: 26 },
    ],
  },
  torchic: {
    projectiles: [0, 1, 2, 3, 4].map((i) => ({ style: 'fire' as const, color: i % 2 ? '#ffd24d' : '#ff6a1a', size: 0.16, delay: i * 65, arc: 0.5, yOff: (i - 2) * 0.14, flight: 360 })),
    events: [
      { kind: 'burst', at: 400, on: 'foe', color: '#ffb347', count: 16 },
      { kind: 'burst', at: 480, on: 'foe', color: '#ff6a1a', count: 16 },
    ],
  },
  chimchar: {
    projectiles: [{ style: 'fire', color: '#ff5a1a', size: 0.3, arc: 0.6 }],
    events: [
      { kind: 'dome', at: FLIGHT_MS - 40, on: 'foe', color: '#ff7a1a' },
      { kind: 'burst', at: FLIGHT_MS, on: 'foe', color: '#ffc14d', count: 30, up: true },
      { kind: 'burst', at: FLIGHT_MS + 140, on: 'foe', color: '#ff5a1a', count: 20, up: true },
    ],
  },
  tepig: {
    projectiles: [{ style: 'ball', color: '#ff5a1a', size: 0.32, arc: 0.3 }],
    events: [
      { kind: 'burst', at: 0, on: 'self', color: '#ffb347', count: 10 },
      { kind: 'dust', at: FLIGHT_MS, on: 'foe', color: '#d98a4a' },
      { kind: 'burst', at: FLIGHT_MS, on: 'foe', color: '#ffc14d', count: 32 },
    ],
  },
  // Thủy (tung chiêu rồi hồi máu: có bóng nước quanh người tung)
  squirtle: {
    events: [
      { kind: 'beam', at: 0, on: 'self', ms: 600, color: '#4aa8ff', size: 0.17 },
      { kind: 'beam', at: 0, on: 'self', ms: 600, color: '#d8f1ff', size: 0.09 },
      { kind: 'burst', at: FLIGHT_MS, on: 'foe', color: '#bfe6ff', count: 22 },
      { kind: 'bubble', at: 350, on: 'self', color: '#5ab4ff' },
    ],
  },
  totodile: {
    events: [
      { kind: 'slash', at: 150, on: 'foe', color: '#6ec8ff' },
      { kind: 'slash', at: 300, on: 'foe', color: '#bfe6ff' },
      { kind: 'burst', at: FLIGHT_MS, on: 'foe', color: '#8fd3ff', count: 24 },
      { kind: 'bubble', at: 350, on: 'self', color: '#5ab4ff' },
    ],
    projectiles: [{ style: 'ball', color: '#3a9bff', size: 0.2, arc: 0.4, flight: 330 }],
  },
  mudkip: {
    projectiles: [0, 1, 2].map((i) => ({ style: 'mud' as const, color: '#8a5a2a', size: 0.22, delay: i * 90, arc: 0.7 - i * 0.2, yOff: (i - 1) * 0.15, flight: 380 })),
    events: [
      { kind: 'dust', at: 440, on: 'foe', color: '#8a5a2a' },
      { kind: 'burst', at: 440, on: 'foe', color: '#b98a54', count: 18 },
      { kind: 'bubble', at: 300, on: 'self', color: '#5ab4ff' },
    ],
  },
  piplup: {
    projectiles: [0, 1, 2, 3, 4, 5].map((i) => ({ style: 'bubble' as const, color: '#bfe6ff', size: 0.2, delay: i * 70, arc: 0.3 + (i % 3) * 0.25, yOff: (i % 3 - 1) * 0.2, flight: 420 })),
    events: [
      { kind: 'burst', at: 450, on: 'foe', color: '#d8f1ff', count: 22 },
      { kind: 'burst', at: 600, on: 'foe', color: '#8fd3ff', count: 14 },
      { kind: 'bubble', at: 300, on: 'self', color: '#5ab4ff' },
    ],
  },
  oshawott: {
    events: [
      { kind: 'slash', at: 120, on: 'foe', color: '#a5e8ff' },
      { kind: 'slash', at: 240, on: 'foe', color: '#4aa8ff' },
      { kind: 'slash', at: 360, on: 'foe', color: '#ffffff' },
      { kind: 'beam', at: 100, on: 'self', ms: 350, color: '#8fd3ff', size: 0.12 },
      { kind: 'burst', at: FLIGHT_MS, on: 'foe', color: '#bfe6ff', count: 20 },
      { kind: 'bubble', at: 350, on: 'self', color: '#5ab4ff' },
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
