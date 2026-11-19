import type { Ailment, Element, EnemyTrait, Hazard } from './types'

export const BOARD_SIZE = 8
/** Độ dài chuyến đi (số điểm dừng, tính cả điểm nghỉ và Boss): ngẫu nhiên trong khoảng này. */
export const RUN_LENGTH: [number, number] = [8, 10]
export const MIN_MATCH = 3

export const ELEMENTS: Element[] = ['kim', 'moc', 'thuy', 'hoa', 'tho']

export const ELEMENT_INFO: Record<
  Element,
  { label: string; icon: string; gradient: string; effect: string }
> = {
  kim: { label: 'Kim', icon: '⚙️', gradient: 'from-zinc-200 to-slate-500', effect: 'Sát thương' },
  moc: { label: 'Mộc', icon: '🌿', gradient: 'from-lime-300 to-green-600', effect: 'Hồi máu nhẹ' },
  thuy: { label: 'Thủy', icon: '💧', gradient: 'from-sky-300 to-blue-600', effect: 'Hồi máu' },
  hoa: { label: 'Hỏa', icon: '🔥', gradient: 'from-orange-300 to-red-600', effect: 'Sát thương nhẹ' },
  tho: { label: 'Thổ', icon: '🪨', gradient: 'from-amber-300 to-yellow-700', effect: 'Giáp' },
}

/** Cân bằng chiến đấu (chỉnh tại đây) */
export const BALANCE = {
  // Lượt chơi
  turnMs: 12000, // thời gian mỗi lượt; hết giờ là mất lượt
  hintMs: 4500, // còn ngần này ms mà người chơi chưa đi thì chớp gợi ý nước đi
  // Kẻ địch: giá trị màn n = base + (n-1) * step
  enemyHp: 145,
  enemyHpStep: 72,
  enemyPower: 0.365, // hệ số sát thương/hiệu quả ngọc so với pet
  enemyPowerStep: 0.075,
  enemySkillDamage: 17.5, // sát thương kỹ năng kẻ địch (đầy Nộ)
  enemySkillStep: 4.8,
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
  // Kinh nghiệm và tiến hóa (XP tích lũy trong ván)
  evolveXp: [90, 240], // XP cần để lên dạng 2 và dạng 3
  xpGem: 1, // XP mỗi ngọc xếp được
  xpOwnGem: 1.6, // ngọc cùng hệ với pet
  xpKill: 30, // XP khi hạ kẻ địch ở màn 1
  xpKillStep: 10, // cộng thêm mỗi màn
  evolveHeal: 0.4, // hồi % máu tối đa khi tiến hóa
  // Kẻ địch cũng tiến hóa trong trận: trận càng kéo dài càng mạnh
  enemyEvolveXp: [300, 700], // XP để lên dạng 2 và dạng 3
  enemyXpTurn: 2, // XP tự nhận mỗi lượt của nó
  enemyEvoHp: 1.2, // mỗi lần tiến hóa: máu tối đa x1.2
  enemyEvoPower: 1.1, // sức mạnh ngọc x1.1
  enemyEvoSkill: 1.15, // sát thương chiêu x1.15
  enemyEvoHeal: 0.15, // hồi thêm 15% máu tối đa
  // Mega: dạng cuối bấm nút (tốn đầy Nộ), mạnh hơn hẳn trong vài lượt, mỗi trận một lần
  megaTurns: 4, // số lượt của pet ở dạng Mega (tính cả lượt đang đi)
  megaPower: 1.35, // sức mạnh ngọc x1.35
  megaRage: 1.25, // nạp Nộ x1.25
  megaSkill: 1.5, // sát thương kỹ năng x1.5
  megaHeal: 0.2, // hồi 20% máu tối đa khi kích hoạt
  megaShield: 15, // và +15 giáp
  // Chướng ngại bàn cờ
  rockHp: 2, // đá chịu 2 lần có match liền kề
  rubbleCount: 5, // luật Đống Đổ Nát: số đá lúc vào trận
  frostCount: 5, // luật Băng Giá: số ngọc bị đóng băng lúc vào trận
  eliteHp: 1.4, // Tinh anh máu x1.4
  elitePower: 1.15,
  eliteXp: 1.5, // XP hạ Tinh anh x1.5
  stageHeal: 0.3, // hồi % máu tối đa sau mỗi trận thắng
  restHeal: 0.5, // điểm nghỉ: chọn hồi máu
  restXp: 60, // điểm nghỉ: hoặc nhận XP
  rewardHeal: 0.25, // phần thưởng "nghỉ ngơi" thay vì vật phẩm
  interruptPct: 0.2, // gây ≥ 20% máu tối đa kẻ địch lúc nó tụ lực thì ngắt chiêu
  interruptRageKeep: 0.3, // bị ngắt: giữ lại 30% Nộ
  poisonPct: 0.05, // độc: mất 5% máu tối đa mỗi lượt
  poisonTurns: 3,
  sealTurns: 2,
  weakenTurns: 3,
  weakenMul: 0.7, // suy yếu: ngọc của pet còn 70% hiệu quả
  armorGain: 4, // đặc tính Giáp: giáp tự dựng mỗi lượt = armorGain + level * armorStep
  armorStep: 1.5,
  regenPct: 0.04, // đặc tính Hồi phục: % máu tối đa mỗi lượt
  frenzyHp: 0.5, // cuồng nộ khi máu ≤ 50%
  frenzyPower: 1.25,
  frenzySkill: 1.3,
  limitEnrage: 1.5, // quá giới hạn lượt: kẻ địch mạnh x1.5 và đầy Nộ
  surgeMul: 1.5, // luật Cộng Hưởng: ngọc hệ được chọn mạnh x1.5, hệ khác x0.8
  surgeOther: 0.8,
  swiftMs: 7000, // luật Chớp Nhoáng: đồng hồ lượt pet
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

/** Kẻ địch: `tier` 1 xuất hiện sớm, 3 xuất hiện muộn. hp/power/skill là hệ số so với mức chuẩn của màn. windup = số lượt tụ lực trước khi tung chiêu. */
export interface EnemyDef {
  id: string
  name: string
  emoji: string
  element: Element
  skill: string
  effect?: Ailment
  tier: 1 | 2 | 3
  traits: EnemyTrait[]
  hp: number
  power: number
  skillMul: number
  windup: number
  /** mô tả ngắn hiện khi gặp */
  desc: string
  /** các dạng tiến hóa kế tiếp (id kẻ địch có sẵn hình) */
  evo?: string[]
  /** chiêu làm hỏng bàn cờ */
  hazard?: Hazard
}

export const ENEMIES: EnemyDef[] = [
  // Tier 1: dễ, ít chiêu trò
  { id: 'sau-xanh', name: 'Oddish', emoji: '🌿', element: 'moc', skill: 'Phun Tơ Độc', effect: 'poison', tier: 1, traits: [], hp: 0.9, power: 1, skillMul: 0.8, windup: 0, desc: 'Chiêu gây độc' },
  { id: 'ca-hay', name: 'Magikarp', emoji: '🐟', element: 'thuy', skill: 'Cắn Xé', tier: 1, traits: ['frenzy'], hp: 1.1, power: 0.85, skillMul: 1, windup: 0, desc: 'Cuồng nộ khi còn nửa máu' },
  { id: 'meo-xam', name: 'Magnemite', emoji: '🧲', element: 'kim', skill: 'Vuốt Sắt', tier: 1, traits: ['armor'], hp: 0.9, power: 1, skillMul: 1, windup: 0, desc: 'Tự dựng giáp mỗi lượt' },
  { id: 'combusken', name: 'Combusken', emoji: '🐔', element: 'hoa', skill: 'Tàn Lửa Dữ', tier: 1, traits: [], hp: 1, power: 1.1, skillMul: 1, windup: 0, desc: 'Nạp Nộ nhanh, đòn mạnh', evo: ['blaziken'] },
  { id: 'grotle', name: 'Grotle', emoji: '🐢', element: 'tho', skill: 'Búa Gỗ Nặng', tier: 1, traits: ['armor'], hp: 1.15, power: 0.9, skillMul: 1.1, windup: 1, desc: 'Trâu bò, tụ lực trước đòn', evo: ['torterra'], hazard: { kind: 'rock', count: 2 } },
  // Tier 2: bắt đầu có báo trước đòn và hiệu ứng xấu
  { id: 'heo-rung', name: 'Onix', emoji: '🪨', element: 'tho', skill: 'Húc Đất', tier: 2, traits: [], hp: 1.2, power: 0.9, skillMul: 1.6, windup: 2, desc: 'Tụ lực 2 lượt, đòn rất đau', hazard: { kind: 'rock', count: 3 } },
  { id: 'servine', name: 'Servine', emoji: '🐍', element: 'moc', skill: 'Lá Phong Ấn', effect: 'seal', tier: 2, traits: [], hp: 1, power: 1, skillMul: 0.9, windup: 1, desc: 'Phong ấn kỹ năng của bạn', evo: ['serperior'] },
  { id: 'monferno', name: 'Monferno', emoji: '🐵', element: 'hoa', skill: 'Lốc Lửa Suy Yếu', effect: 'weaken', tier: 2, traits: [], hp: 1, power: 1, skillMul: 0.9, windup: 1, desc: 'Làm ngọc của bạn yếu đi', evo: ['infernape'] },
  { id: 'marshtomp', name: 'Marshtomp', emoji: '🐸', element: 'thuy', skill: 'Bùn Lầy', tier: 2, traits: ['regen'], hp: 1.1, power: 0.95, skillMul: 1, windup: 1, desc: 'Tự hồi máu mỗi lượt', evo: ['swampert'], hazard: { kind: 'ice', count: 2 } },
  { id: 'croconaw', name: 'Croconaw', emoji: '🐊', element: 'thuy', skill: 'Nanh Nước Độc', effect: 'poison', tier: 2, traits: ['frenzy'], hp: 1, power: 1.05, skillMul: 1, windup: 1, desc: 'Cuồng nộ khi còn nửa máu', evo: ['feraligatr'], hazard: { kind: 'ice', count: 2 } },
  // Tier 3: nhiều chiêu trò
  { id: 'torterra', name: 'Torterra', emoji: '🌳', element: 'tho', skill: 'Địa Chấn', tier: 3, traits: ['armor', 'regen'], hp: 1.15, power: 0.95, skillMul: 1.5, windup: 2, desc: 'Giáp và hồi máu, đòn nặng', hazard: { kind: 'rock', count: 3 } },
  { id: 'empoleon', name: 'Empoleon', emoji: '🐧', element: 'kim', skill: 'Cánh Thép Suy Yếu', effect: 'weaken', tier: 3, traits: ['armor'], hp: 1, power: 1.05, skillMul: 1.1, windup: 1, desc: 'Giáp dày, làm bạn suy yếu', hazard: { kind: 'ice', count: 3 } },
  { id: 'blaziken', name: 'Blaziken', emoji: '🥊', element: 'hoa', skill: 'Cước Hỏa Diệm', tier: 3, traits: ['frenzy'], hp: 0.95, power: 1.2, skillMul: 1.2, windup: 1, desc: 'Đòn mạnh, cuồng nộ' },
  { id: 'serperior', name: 'Serperior', emoji: '🐍', element: 'moc', skill: 'Bão Lá Độc', effect: 'poison', tier: 3, traits: ['regen'], hp: 1.05, power: 1, skillMul: 1.1, windup: 1, desc: 'Độc và tự hồi máu' },
  { id: 'feraligatr', name: 'Feraligatr', emoji: '🦖', element: 'thuy', skill: 'Nanh Thủy Vương', tier: 3, traits: ['frenzy'], hp: 1.1, power: 1.1, skillMul: 1.3, windup: 1, desc: 'Hung hãn, cuồng nộ', hazard: { kind: 'ice', count: 3 } },
]

/** Boss cuối chuyến (vô hệ, bị khắc chế vô hiệu). Mỗi chuyến chọn ngẫu nhiên một. */
export const BOSSES: EnemyDef[] = [
  { id: 'su-tu-lua', name: 'Charizard', emoji: '🐲', element: 'hoa', skill: 'Gầm Lửa', effect: 'weaken', tier: 3, traits: ['frenzy'], hp: 1, power: 1, skillMul: 1, windup: 1, desc: 'Cuồng nộ ở nửa máu, làm yếu ngọc' },
  { id: 'sceptile', name: 'Sceptile', emoji: '🦎', element: 'moc', skill: 'Mưa Lá Phong Ấn', effect: 'seal', tier: 3, traits: ['regen', 'frenzy'], hp: 1, power: 1, skillMul: 1, windup: 1, desc: 'Hồi máu, phong ấn kỹ năng' },
  { id: 'swampert', name: 'Swampert', emoji: '🦈', element: 'thuy', skill: 'Địa Chấn Bùn', tier: 3, traits: ['armor', 'frenzy'], hp: 1.05, power: 0.95, skillMul: 1.4, windup: 2, desc: 'Giáp dày, tụ lực 2 lượt', hazard: { kind: 'rock', count: 3 } },
  { id: 'infernape', name: 'Infernape', emoji: '🙉', element: 'hoa', skill: 'Lốc Lửa Độc', effect: 'poison', tier: 3, traits: ['frenzy'], hp: 0.95, power: 1.1, skillMul: 1.1, windup: 1, desc: 'Nhanh và độc' },
]

export const enemyDef = (id: string): EnemyDef => [...ENEMIES, ...BOSSES].find((e) => e.id === id) ?? ENEMIES[0]
