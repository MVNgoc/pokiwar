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
  // Lượt chơi
  turnMs: 12000, // thời gian mỗi lượt; hết giờ là mất lượt
  hintMs: 4500, // còn ngần này ms mà người chơi chưa đi thì chớp gợi ý nước đi
  // Kẻ địch: giá trị màn n = base + (n-1) * step
  enemyHp: 110,
  enemyHpStep: 55,
  enemyPower: 0.28, // hệ số sát thương/hiệu quả ngọc so với pet
  enemyPowerStep: 0.055,
  enemySkillDamage: 14, // sát thương kỹ năng kẻ địch (đầy Nộ)
  enemySkillStep: 3.5,
  enemyMistake: 0.5, // xác suất đi nước ngẫu nhiên ở màn 1
  enemyMistakeStep: 0.1,
  enemyMistakeMin: 0.1,
  kimDamage: 4,
  mocHeal: 2,
  thuyHeal: 1.5,
  hoaDamage: 4,
  thoShield: 3,
  maxShield: 40, // giáp tối đa tích được
  ownRage: 5, // Nộ nhận được từ mỗi ngọc cùng hệ với pet
  otherRage: 1, // Nộ nhận được từ mỗi ngọc hệ khác
  comboStep: 0.25, // mỗi combo tăng thêm 25% hiệu quả
  maxRage: 100,
  bossHp: 1.6, // Boss máu x1.6
  bossPower: 1.2, // Boss mạnh x1.2 (cả đòn thường lẫn kỹ năng)
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

export const ENEMIES: { id: string; name: string; emoji: string; element: Element; skill: string }[] = [
  { id: 'sau-xanh', name: 'Oddish', emoji: '🌿', element: 'moc', skill: 'Phun Tơ Độc' },
  { id: 'meo-xam', name: 'Magnemite', emoji: '🧲', element: 'kim', skill: 'Vuốt Sắt' },
  { id: 'ca-hay', name: 'Magikarp', emoji: '🐟', element: 'thuy', skill: 'Cắn Xé' },
  { id: 'heo-rung', name: 'Onix', emoji: '🪨', element: 'tho', skill: 'Húc Đất' },
  { id: 'su-tu-lua', name: 'Charizard', emoji: '🐲', element: 'hoa', skill: 'Gầm Lửa' },
]
