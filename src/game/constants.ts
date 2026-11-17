import type { Element } from './types'

export const BOARD_SIZE = 8
/** Số màn của 1 ván; màn cuối là Boss. */
export const TOTAL_STAGES = 5
export const MIN_MATCH = 3

export const ELEMENTS: Element[] = ['kim', 'moc', 'thuy', 'hoa', 'tho']

export const ELEMENT_INFO: Record<
  Element,
  { label: string; glyph: string; gradient: string; effect: string }
> = {
  kim: { label: 'Kim', glyph: '金', gradient: 'from-zinc-200 to-slate-500', effect: 'Sát thương' },
  moc: { label: 'Mộc', glyph: '木', gradient: 'from-lime-300 to-green-600', effect: 'Hồi máu nhẹ' },
  thuy: { label: 'Thủy', glyph: '水', gradient: 'from-sky-300 to-blue-600', effect: 'Hồi máu' },
  hoa: { label: 'Hỏa', glyph: '火', gradient: 'from-orange-300 to-red-600', effect: 'Sát thương nhẹ' },
  tho: { label: 'Thổ', glyph: '土', gradient: 'from-amber-300 to-yellow-700', effect: 'Giáp' },
}

/** Cân bằng chiến đấu (chỉnh tại đây) */
export const BALANCE = {
  // Kẻ địch: giá trị màn n = base + (n-1) * step
  enemyHp: 160,
  enemyHpStep: 80,
  enemyAtk: 15,
  enemyAtkStep: 4,
  enemyInterval: 5500, // ms giữa 2 đòn đánh
  enemyIntervalStep: 400,
  enemyIntervalMin: 3500,
  kimDamage: 4,
  mocHeal: 2,
  thuyHeal: 2,
  hoaDamage: 4,
  thoShield: 3,
  maxShield: 40, // giáp tối đa tích được
  ownRage: 5, // Nộ nhận được từ mỗi ngọc cùng hệ với pet
  otherRage: 1, // Nộ nhận được từ mỗi ngọc hệ khác
  comboStep: 0.25, // mỗi combo tăng thêm 25% hiệu quả
  maxRage: 100,
  bossHp: 1.6, // Boss máu x1.6
  bossAttack: 1.3, // Boss đánh mạnh x1.3
  advantage: 1.5, // khắc chế: sát thương gây ra x1.5
  disadvantage: 0.7, // bị khắc: sát thương gây ra x0.7
  affinity: 1.5, // ngọc cùng hệ với pet
}

/** Ngũ hành tương khắc: khóa khắc giá trị (Kim → Mộc → Thổ → Thủy → Hỏa → Kim) */
export const COUNTER: Record<Element, Element> = {
  kim: 'moc',
  moc: 'tho',
  tho: 'thuy',
  thuy: 'hoa',
  hoa: 'kim',
}

export const ENEMIES: { name: string; emoji: string; element: Element }[] = [
  { name: 'Sâu Rừng', emoji: '🐛', element: 'moc' },
  { name: 'Sói Xám', emoji: '🐺', element: 'kim' },
  { name: 'Nhện Độc', emoji: '🕷️', element: 'thuy' },
  { name: 'Quỷ Đá', emoji: '👹', element: 'tho' },
  { name: 'Rồng Bóng Tối', emoji: '🐉', element: 'hoa' },
]

