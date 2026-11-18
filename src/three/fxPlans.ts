/** Thời gian đạn bay từ người tung sang mục tiêu (ms). Trùng thời điểm sát thương hiện ra. */
export const FLIGHT_MS = 450

export type FxStyle = 'fire' | 'thorn'

export type FxEvent =
  | { kind: 'burst'; at: number; on: 'self' | 'foe'; color: string; up?: boolean; count?: number }
  | { kind: 'slash'; at: number; on: 'foe'; color: string }
  | { kind: 'bubble'; at: number; on: 'self'; color: string }
  | { kind: 'dome'; at: number; on: 'self'; color: string }
  | { kind: 'dust'; at: number; on: 'foe'; color: string }
  | { kind: 'stars'; at: number; on: 'foe'; color: string; ms: number }

export interface FxPlan {
  /** đạn bay từ người tung sang mục tiêu */
  projectile?: { style: FxStyle; color: string; size?: number }
  events: FxEvent[]
}

/**
 * Kịch bản hiệu ứng kỹ năng theo id pet / kẻ địch. `at` tính bằng ms từ lúc tung kỹ năng;
 * `self` là người tung, `foe` là mục tiêu (kẻ địch tung chiêu thì hai bên đảo lại).
 */
export const FX_PLANS: Record<string, FxPlan> = {
  // pet
  'hoa-ma': { projectile: { style: 'fire', color: '#ff7a1a', size: 0.34 }, events: [{ kind: 'burst', at: FLIGHT_MS, on: 'foe', color: '#ffc14d', count: 22 }] },
  'thuy-ma': {
    events: [
      { kind: 'bubble', at: 0, on: 'self', color: '#5ab4ff' },
      { kind: 'burst', at: 150, on: 'self', color: '#c8ecff', up: true, count: 18 },
    ],
  },
  'moc-cactoro': {
    projectile: { style: 'thorn', color: '#4fd05a', size: 0.3 },
    events: [
      { kind: 'burst', at: FLIGHT_MS, on: 'foe', color: '#9cff8a' },
      { kind: 'stars', at: FLIGHT_MS + 100, on: 'foe', color: '#ffe14d', ms: 1300 },
    ],
  },
  'kim-nhan': {
    events: [
      { kind: 'slash', at: 0, on: 'foe', color: '#e9f0ff' },
      { kind: 'slash', at: 150, on: 'foe', color: '#e9f0ff' },
      { kind: 'slash', at: 300, on: 'foe', color: '#fff3b0' },
    ],
  },
  'tho-toc': {
    events: [
      { kind: 'dome', at: 0, on: 'self', color: '#ffd24a' },
      { kind: 'dust', at: 200, on: 'foe', color: '#b98a54' },
    ],
  },
  // kẻ địch
  'nam-con': { projectile: { style: 'thorn', color: '#b57cff', size: 0.28 }, events: [{ kind: 'burst', at: FLIGHT_MS, on: 'foe', color: '#d9b8ff' }] },
  'orc-chien': { events: [{ kind: 'slash', at: 0, on: 'foe', color: '#a9b8ff' }, { kind: 'slash', at: 180, on: 'foe', color: '#a9b8ff' }] },
  'ca-nho': { projectile: { style: 'thorn', color: '#2de0bf', size: 0.3 }, events: [{ kind: 'burst', at: FLIGHT_MS, on: 'foe', color: '#9ffbe8' }] },
  'orc-xanh': { events: [{ kind: 'dust', at: 150, on: 'foe', color: '#cfc7b0' }, { kind: 'dust', at: 350, on: 'foe', color: '#cfc7b0' }] },
  'rong-lua': { projectile: { style: 'fire', color: '#ffb300', size: 0.42 }, events: [{ kind: 'burst', at: FLIGHT_MS, on: 'foe', color: '#ffe27a', count: 26 }] },
}
