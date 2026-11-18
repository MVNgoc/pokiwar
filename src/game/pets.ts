import type { Pet } from './types'

/**
 * Mỗi pet có 1 nguyên tố sở trường (ngọc cùng hệ hiệu quả x1.5) và 1 kỹ năng riêng.
 * Kỹ năng được mô tả bằng dữ liệu, combat.ts đọc và áp dụng.
 */
export const PETS: Pet[] = [
  {
    id: 'hoa-ma',
    name: 'Hỏa Ma',
    emoji: '😈',
    element: 'hoa',
    maxHp: 150,
    desc: 'Tiểu quỷ lửa nhanh nhẹn, nạp Nộ cực nhanh.',
    skill: { name: 'Hỏa Cầu Thiêu Đốt', emoji: '🔥', desc: 'Gây 80 sát thương', damage: 80 },
  },
  {
    id: 'thuy-ma',
    name: 'Thủy Ma',
    emoji: '👾',
    element: 'thuy',
    maxHp: 150,
    desc: 'Quỷ nước trâu bò, trụ vững nhờ hồi máu.',
    skill: { name: 'Suối Nguồn Sinh Mệnh', emoji: '💧', desc: 'Gây 30 sát thương, hồi 40% HP và +15 giáp', damage: 30, healPct: 0.4, shield: 15 },
  },
  {
    id: 'moc-cactoro',
    name: 'Mộc Xương Rồng',
    emoji: '🌵',
    element: 'moc',
    maxHp: 130,
    desc: 'Xương rồng đội nón, khống chế kẻ địch.',
    skill: { name: 'Dây Leo Trói Buộc', emoji: '🌿', desc: 'Gây 25 sát thương, kẻ địch mất 1 lượt', damage: 25, stun: true },
  },
  {
    id: 'kim-nhan',
    name: 'Kim Nhẫn',
    emoji: '🥷',
    element: 'kim',
    maxHp: 145,
    desc: 'Ninja thép sát thương cao.',
    skill: { name: 'Liên Hoàn Trảo', emoji: '⚔️', desc: '3 đòn x 28 sát thương', damage: 28, hits: 3 },
  },
  {
    id: 'tho-toc',
    name: 'Thổ Thần',
    emoji: '🗿',
    element: 'tho',
    maxHp: 140,
    desc: 'Thần bộ tộc giáp dày, vừa thủ vừa công.',
    skill: { name: 'Địa Chấn Thiết Giáp', emoji: '🪨', desc: 'Gây 30 sát thương và +40 giáp', damage: 30, shield: 40 },
  },
]
