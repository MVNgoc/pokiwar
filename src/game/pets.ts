import type { Element, Pet, PetForm, Skill } from './types'

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
    skill: { name: 'Hỏa Cầu Thiêu Đốt', emoji: '🔥', desc: 'Gây 85 sát thương', damage: 85 },
  },
  thuy: {
    maxHp: 150,
    desc: 'Khởi đầu hệ nước, trụ vững nhờ hồi máu.',
    skill: { name: 'Suối Nguồn Sinh Mệnh', emoji: '💧', desc: 'Gây 30 sát thương, hồi 35% HP và +15 giáp', damage: 30, healPct: 0.35, shield: 15 },
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

/** Chỉ số riêng từng pokemon: [máu, sức mạnh ngọc, tốc độ nạp Nộ, hệ số sát thương chiêu]. Cùng hệ thì tổng thể cân bằng nhau. */
const STATS: Record<string, [number, number, number, number]> = {
  bulbasaur: [135, 1.0, 1.0, 1.0],
  chikorita: [145, 0.95, 0.95, 0.95],
  treecko: [120, 1.05, 1.15, 1.0],
  turtwig: [150, 1.0, 0.95, 1.1],
  snivy: [120, 1.1, 1.05, 1.05],
  charmander: [150, 1.0, 1.0, 1.0],
  cyndaquil: [140, 1.05, 1.1, 1.0],
  torchic: [130, 1.1, 1.2, 0.9],
  chimchar: [135, 1.05, 1.05, 1.05],
  tepig: [170, 1.0, 0.95, 1.0],
  squirtle: [155, 1.0, 1.0, 1.0],
  totodile: [145, 1.05, 1.0, 1.05],
  mudkip: [160, 0.95, 1.05, 1.0],
  piplup: [140, 1.0, 1.15, 0.95],
  oshawott: [150, 1.1, 1.0, 0.95],
}

/** Dạng 2 và 3 của từng pokemon: [id hình, tên, tên chiêu]. Dạng 1 lấy từ bảng STARTERS. */
const EVOLUTIONS: Record<string, [[string, string, string], [string, string, string]]> = {
  bulbasaur: [['ivysaur', 'Ivysaur', 'Roi Gai Kép'], ['venusaur', 'Venusaur', 'Bão Roi Gai']],
  chikorita: [['bayleef', 'Bayleef', 'Lá Dao Xoáy'], ['meganium', 'Meganium', 'Mưa Lá Dao']],
  treecko: [['grovyle', 'Grovyle', 'Bom Hạt Liên Hoàn'], ['sceptile', 'Sceptile', 'Mưa Hạt Bão']],
  turtwig: [['grotle', 'Grotle', 'Búa Gỗ Nặng'], ['torterra', 'Torterra', 'Búa Đại Thụ']],
  snivy: [['servine', 'Servine', 'Lốc Lá Xoáy'], ['serperior', 'Serperior', 'Bão Lá Hoàng Gia']],
  charmander: [['charmeleon', 'Charmeleon', 'Phun Lửa Dữ'], ['charizard', 'Charizard', 'Bão Hỏa Diệm']],
  cyndaquil: [['quilava', 'Quilava', 'Bánh Xe Lửa Kép'], ['typhlosion', 'Typhlosion', 'Bánh Xe Núi Lửa']],
  torchic: [['combusken', 'Combusken', 'Tàn Lửa Dữ'], ['blaziken', 'Blaziken', 'Mưa Lửa']],
  chimchar: [['monferno', 'Monferno', 'Lốc Lửa Dữ'], ['infernape', 'Infernape', 'Lốc Lửa Địa Ngục']],
  tepig: [['pignite', 'Pignite', 'Đại Bác Lửa Nặng'], ['emboar', 'Emboar', 'Đại Bác Hỏa Diệm']],
  squirtle: [['wartortle', 'Wartortle', 'Súng Nước Mạnh'], ['blastoise', 'Blastoise', 'Đại Bác Thủy']],
  totodile: [['croconaw', 'Croconaw', 'Nanh Nước Sắc'], ['feraligatr', 'Feraligatr', 'Nanh Thủy Vương']],
  mudkip: [['marshtomp', 'Marshtomp', 'Bùn Bắn Nặng'], ['swampert', 'Swampert', 'Địa Chấn Bùn']],
  piplup: [['prinplup', 'Prinplup', 'Chùm Bọt Lớn'], ['empoleon', 'Empoleon', 'Bão Bọt Hoàng Đế']],
  oshawott: [['dewott', 'Dewott', 'Vỏ Sò Kép'], ['samurott', 'Samurott', 'Vỏ Sò Kiếm Vương']],
}

/** Hệ số theo dạng: [máu, sức mạnh ngọc, nạp Nộ, sát thương và giáp của chiêu] */
const FORM_MUL: [number, number, number, number][] = [
  [1, 1, 1, 1],
  [1.2, 1.1, 1.05, 1.25],
  [1.4, 1.2, 1.1, 1.5],
]

export const GENERATIONS = STARTERS.map((_, i) => i + 1)

export const PETS: Pet[] = STARTERS.flatMap((gen, gi) =>
  gen.map(([id, name, el, move]): Pet => {
      const [maxHp, power, rageMul, skillMul] = STATS[id]
      const base0 = KIT[el].skill
      const damage = base0.damage ? Math.round(base0.damage * skillMul) : undefined
      const desc = damage ? base0.desc.replace(/Gây \d+/, `Gây ${damage}`) : base0.desc
      const base: PetForm = { id, name, maxHp, power, rageMul, skill: { ...base0, name: move, damage, desc } }
      const evo = EVOLUTIONS[id]
      const forms: PetForm[] = [base, ...evo.map(([fid, fname, fmove], i): PetForm => {
        const [hpM, powM, rageM, skM] = FORM_MUL[i + 1]
        const dmg = base0.damage ? Math.round(base0.damage * skillMul * skM) : undefined
        const shield = base0.shield ? Math.round(base0.shield * skM) : undefined
        let d = base0.desc
        if (dmg) d = d.replace(/Gây \d+/, `Gây ${dmg}`)
        if (shield) d = d.replace(/\+\d+ giáp/, `+${shield} giáp`)
        return { id: fid, name: fname, maxHp: Math.round(maxHp * hpM), power: +(power * powM).toFixed(3), rageMul: +(rageMul * rageM).toFixed(3), skill: { ...base0, name: fmove, damage: dmg, shield, desc: d } }
      })]
      return { id, name, emoji: EMOJI[el], element: el as Element, gen: gi + 1, desc: KIT[el].desc, maxHp, power, rageMul, forms, skill: base.skill }
    }),
)
