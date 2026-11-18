import type { Pet } from './types'

/**
 * Mỗi pet có 1 nguyên tố sở trường (ngọc cùng hệ hiệu quả x1.5) và 1 kỹ năng riêng.
 * Kỹ năng được mô tả bằng dữ liệu, combat.ts đọc và áp dụng.
 */
export const PETS: Pet[] = [
  {
    id: 'cao-lua',
    name: 'Cáo Lửa',
    emoji: '🦊',
    element: 'hoa',
    maxHp: 150,
    desc: 'Cáo con lanh lẹ, nạp Nộ cực nhanh.',
    skill: { name: 'Hỏa Cầu Thiêu Đốt', emoji: '🔥', desc: 'Gây 80 sát thương', damage: 80 },
  },
  {
    id: 'cut-thuy',
    name: 'Cánh Cụt Thủy',
    emoji: '🐧',
    element: 'thuy',
    maxHp: 150,
    desc: 'Cánh cụt mũm mĩm, trụ vững nhờ hồi máu.',
    skill: { name: 'Suối Nguồn Sinh Mệnh', emoji: '💧', desc: 'Gây 30 sát thương, hồi 40% HP và +15 giáp', damage: 30, healPct: 0.4, shield: 15 },
  },
  {
    id: 'huou-moc',
    name: 'Hươu Mộc',
    emoji: '🦌',
    element: 'moc',
    maxHp: 130,
    desc: 'Hươu con linh thiêng, khống chế kẻ địch.',
    skill: { name: 'Dây Leo Trói Buộc', emoji: '🌿', desc: 'Gây 25 sát thương, kẻ địch mất 1 lượt', damage: 25, stun: true },
  },
  {
    id: 'ho-kim',
    name: 'Hổ Kim',
    emoji: '🐯',
    element: 'kim',
    maxHp: 145,
    desc: 'Hổ con vuốt thép, sát thương cao.',
    skill: { name: 'Liên Hoàn Trảo', emoji: '⚔️', desc: '3 đòn x 28 sát thương', damage: 28, hits: 3 },
  },
  {
    id: 'voi-tho',
    name: 'Voi Thổ',
    emoji: '🐘',
    element: 'tho',
    maxHp: 140,
    desc: 'Voi con giáp dày, vừa thủ vừa công.',
    skill: { name: 'Địa Chấn Thiết Giáp', emoji: '🪨', desc: 'Gây 30 sát thương và +40 giáp', damage: 30, shield: 40 },
  },
]
