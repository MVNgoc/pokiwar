import type { Element, Pet, Skill } from './types'

/**
 * Pet khởi đầu: mỗi thế hệ có 3 con (Mộc, Hỏa, Thủy). Bộ chỉ số và kỹ năng theo hệ,
 * nên cùng hệ thì chơi giống nhau, khác nhau ở hình ảnh. Kim và Thổ chỉ xuất hiện ở ngọc và kẻ địch.
 */
const KIT: Record<'moc' | 'hoa' | 'thuy', { maxHp: number; desc: string; skill: Skill }> = {
  moc: {
    maxHp: 130,
    desc: 'Khởi đầu hệ cỏ, khống chế kẻ địch.',
    skill: { name: 'Dây Leo Trói Buộc', emoji: '🌿', desc: 'Gây 25 sát thương, kẻ địch mất 1 lượt', damage: 25, stun: true },
  },
  hoa: {
    maxHp: 150,
    desc: 'Khởi đầu hệ lửa, nạp Nộ cực nhanh.',
    skill: { name: 'Hỏa Cầu Thiêu Đốt', emoji: '🔥', desc: 'Gây 80 sát thương', damage: 80 },
  },
  thuy: {
    maxHp: 150,
    desc: 'Khởi đầu hệ nước, trụ vững nhờ hồi máu.',
    skill: { name: 'Suối Nguồn Sinh Mệnh', emoji: '💧', desc: 'Gây 30 sát thương, hồi 40% HP và +15 giáp', damage: 30, healPct: 0.4, shield: 15 },
  },
}
const EMOJI: Record<'moc' | 'hoa' | 'thuy', string> = { moc: '🌱', hoa: '🔥', thuy: '💧' }

/** [id (cũng là tên file ảnh), tên hiển thị, hệ] theo từng thế hệ, thứ tự Mộc, Hỏa, Thủy */
/** [id, tên, hệ, tên chiêu đặc biệt (khi đầy Nộ)] theo từng thế hệ, thứ tự Mộc, Hỏa, Thủy */
const STARTERS: [string, string, 'moc' | 'hoa' | 'thuy', string][][] = [
  [['bulbasaur', 'Bulbasaur', 'moc', 'Roi Gai'], ['charmander', 'Charmander', 'hoa', 'Phun Lửa'], ['squirtle', 'Squirtle', 'thuy', 'Súng Nước']],
  [['chikorita', 'Chikorita', 'moc', 'Lá Dao Cắt'], ['cyndaquil', 'Cyndaquil', 'hoa', 'Bánh Xe Lửa'], ['totodile', 'Totodile', 'thuy', 'Nanh Nước']],
  [['treecko', 'Treecko', 'moc', 'Bom Hạt'], ['torchic', 'Torchic', 'hoa', 'Tàn Lửa'], ['mudkip', 'Mudkip', 'thuy', 'Bùn Bắn']],
  [['turtwig', 'Turtwig', 'moc', 'Búa Gỗ'], ['chimchar', 'Chimchar', 'hoa', 'Lốc Lửa'], ['piplup', 'Piplup', 'thuy', 'Chùm Bong Bóng']],
  [['snivy', 'Snivy', 'moc', 'Lốc Lá'], ['tepig', 'Tepig', 'hoa', 'Đại Bác Lửa'], ['oshawott', 'Oshawott', 'thuy', 'Vỏ Sò Chém']],
]

export const GENERATIONS = STARTERS.map((_, i) => i + 1)

export const PETS: Pet[] = STARTERS.flatMap((gen, gi) =>
  gen.map(([id, name, el, move]): Pet => ({ id, name, emoji: EMOJI[el], element: el as Element, gen: gi + 1, ...KIT[el], skill: { ...KIT[el].skill, name: move } })),
)
