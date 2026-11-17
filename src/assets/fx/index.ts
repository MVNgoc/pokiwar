/**
 * Hiệu ứng kỹ năng: "Pixel Art Spells" của DevWizard (CC0), xem CREDITS.txt.
 * Mỗi sheet là các khung 16x16 xếp ngang; phát bằng CSS `steps()` (xem FxSprite).
 */
import bubble from './bubble.webp'
import dust from './dust.webp'
import fireball from './fireball.webp'
import shield from './shield.webp'
import slash from './slash.webp'
import spark from './spark.webp'
import stun from './stun.webp'
import vine from './vine.webp'

export type FxId = 'bubble' | 'dust' | 'fireball' | 'shield' | 'slash' | 'spark' | 'stun' | 'vine'

export const FX: Record<FxId, { src: string; frames: number }> = {
  bubble: { src: bubble, frames: 6 },
  dust: { src: dust, frames: 6 },
  fireball: { src: fireball, frames: 6 },
  shield: { src: shield, frames: 6 },
  slash: { src: slash, frames: 6 },
  spark: { src: spark, frames: 6 },
  stun: { src: stun, frames: 6 },
  vine: { src: vine, frames: 6 },
}

/**
 * Kịch bản hiệu ứng cho từng pet và kẻ địch (thời gian tính bằng ms từ lúc tung kỹ năng).
 * `onEnemy` = tại mục tiêu của đòn; `onSelf` = quanh người tung. Với kẻ địch tung chiêu thì hai bên đảo lại.
 */
export interface SkillFxPlan {
  /** đạn bay từ pet sang kẻ địch (mất `FLIGHT_MS`) */
  projectile?: FxId
  /** hiệu ứng trúng đích tại kẻ địch: mỗi phần tử là một lần phát, `at` = thời điểm bắt đầu */
  onEnemy?: { id: FxId; at: number; loop?: boolean }[]
  /** hiệu ứng quanh pet */
  onSelf?: { id: FxId; at: number }[]
}

export const FLIGHT_MS = 450

export const SKILL_FX: Record<string, SkillFxPlan> = {
  'hoa-ho': { projectile: 'fireball', onEnemy: [{ id: 'spark', at: FLIGHT_MS }] },
  'thuy-quy': { onSelf: [{ id: 'bubble', at: 0 }, { id: 'spark', at: 200 }] },
  'moc-loc': {
    projectile: 'vine',
    onEnemy: [{ id: 'spark', at: FLIGHT_MS }, { id: 'stun', at: FLIGHT_MS + 100, loop: true }],
  },
  'kim-ho': { onEnemy: [{ id: 'slash', at: 0 }, { id: 'slash', at: 150 }, { id: 'slash', at: 300 }] },
  'tho-te': { onSelf: [{ id: 'shield', at: 0 }], onEnemy: [{ id: 'dust', at: 200 }] },
  // kẻ địch
  'nam-rung': { projectile: 'vine', onEnemy: [{ id: 'spark', at: FLIGHT_MS }] },
  'soi-xam': { onEnemy: [{ id: 'slash', at: 0 }, { id: 'slash', at: 180 }] },
  'bo-cap': { projectile: 'vine', onEnemy: [{ id: 'stun', at: FLIGHT_MS, loop: true }] },
  'quy-da': { onEnemy: [{ id: 'dust', at: 150 }, { id: 'dust', at: 350 }] },
  'rong-bong-toi': { projectile: 'fireball', onEnemy: [{ id: 'spark', at: FLIGHT_MS }] },
}
