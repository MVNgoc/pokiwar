import type { Pet } from './types'

/**
 * Mỗi pet có 1 nguyên tố sở trường (ngọc cùng hệ hiệu quả x1.5) và 1 kỹ năng riêng.
 * Kỹ năng được mô tả bằng dữ liệu, combat.ts đọc và áp dụng.
 */
export const PETS: Pet[] = [
  {
    id: 'hoa-ho',
    name: 'Hỏa Hồ',
    emoji: '🦊',
    element: 'hoa',
    maxHp: 120,
    desc: 'Cáo lửa nhanh nhẹn, nạp Nộ cực nhanh.',
    skill: { name: 'Hỏa Cầu Thiêu Đốt', emoji: '🔥', desc: 'Gây 60 sát thương', damage: 60 },
  },
  {
    id: 'thuy-quy',
    name: 'Thủy Quy',
    emoji: '🐢',
    element: 'thuy',
    maxHp: 150,
    desc: 'Rùa nước trâu bò, trụ vững nhờ hồi máu.',
    skill: { name: 'Suối Nguồn Sinh Mệnh', emoji: '💧', desc: 'Hồi 40% HP và +15 giáp', healPct: 0.4, shield: 15 },
  },
  {
    id: 'moc-loc',
    name: 'Mộc Lộc',
    emoji: '🦌',
    element: 'moc',
    maxHp: 130,
    desc: 'Hươu rừng thiêng, khống chế kẻ địch.',
    skill: { name: 'Dây Leo Trói Buộc', emoji: '🌿', desc: 'Gây 25 sát thương, kẻ địch bị choáng 5 giây', damage: 25, stunMs: 5000 },
  },
  {
    id: 'kim-ho',
    name: 'Kim Hổ',
    emoji: '🐯',
    element: 'kim',
    maxHp: 110,
    desc: 'Hổ sắt sát thương cao, máu giấy.',
    skill: { name: 'Liên Hoàn Trảo', emoji: '⚔️', desc: '3 đòn x 24 sát thương', damage: 24, hits: 3 },
  },
  {
    id: 'tho-te',
    name: 'Thổ Tê',
    emoji: '🦏',
    element: 'tho',
    maxHp: 140,
    desc: 'Tê giác giáp dày, vừa thủ vừa công.',
    skill: { name: 'Địa Chấn Thiết Giáp', emoji: '🪨', desc: 'Gây 30 sát thương và +40 giáp', damage: 30, shield: 40 },
  },
]
