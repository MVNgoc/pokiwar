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
const STARTERS: [string, string, 'moc' | 'hoa' | 'thuy'][][] = [
  [['bulbasaur', 'Bulbasaur', 'moc'], ['charmander', 'Charmander', 'hoa'], ['squirtle', 'Squirtle', 'thuy']],
  [['chikorita', 'Chikorita', 'moc'], ['cyndaquil', 'Cyndaquil', 'hoa'], ['totodile', 'Totodile', 'thuy']],
  [['treecko', 'Treecko', 'moc'], ['torchic', 'Torchic', 'hoa'], ['mudkip', 'Mudkip', 'thuy']],
  [['turtwig', 'Turtwig', 'moc'], ['chimchar', 'Chimchar', 'hoa'], ['piplup', 'Piplup', 'thuy']],
  [['snivy', 'Snivy', 'moc'], ['tepig', 'Tepig', 'hoa'], ['oshawott', 'Oshawott', 'thuy']],
]

export const GENERATIONS = STARTERS.map((_, i) => i + 1)

export const PETS: Pet[] = STARTERS.flatMap((gen, gi) =>
  gen.map(([id, name, el]): Pet => ({ id, name, emoji: EMOJI[el], element: el as Element, gen: gi + 1, ...KIT[el] })),
)
