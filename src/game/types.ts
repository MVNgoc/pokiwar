export type Element = 'kim' | 'moc' | 'thuy' | 'hoa' | 'tho'

/** bomb: nổ 3x3 (match 4 / chữ L, T) · lightning: quét cả hàng và cột (match 5+) */
export type Special = 'bomb' | 'lightning'

export interface Tile {
  id: number
  type: Element
  special?: Special
  /** Ngọc mới sinh: hàng (âm = phía trên bàn cờ) nơi nó bắt đầu rơi xuống. Chỉ phục vụ hoạt ảnh. */
  spawnRow?: number
}

/** null = ô trống (đang bị xoá, chờ rơi ngọc xuống) */
export type Board = (Tile | null)[][]

export interface Position {
  r: number
  c: number
}

export type GemCounts = Record<Element, number>

export type Side = 'player' | 'enemy'

/** Hai bên dùng chung một cơ chế: xếp ngọc → sát thương / hồi máu / Nộ / giáp. */
export interface Combatant {
  name: string
  emoji: string
  element: Element
  hp: number
  maxHp: number
  rage: number
  maxRage: number
  shield: number
  /** hệ số nạp Nộ (mặc định 1; riêng từng pokemon) */
  rageMul?: number
  /** hệ số sức mạnh nhân vào sát thương (pet = 1, kẻ địch tăng theo màn) */
  power: number
}

export type PlayerState = Combatant

/** Hiệu ứng xấu kẻ địch gây lên pet: độc (mất máu mỗi lượt), phong ấn (không dùng được kỹ năng), suy yếu (ngọc yếu đi) */
export type Ailment = 'poison' | 'seal' | 'weaken'
export type Ailments = Record<Ailment, number>

/** Đặc tính bị động của kẻ địch: giáp tự dựng, tự hồi máu, cuồng nộ khi còn nửa máu */
export type EnemyTrait = 'armor' | 'regen' | 'frenzy'

export interface EnemySkill {
  name: string
  damage: number
  /** hiệu ứng xấu kèm theo khi trúng đòn */
  effect?: Ailment
}

export interface EnemyState extends Combatant {
  id: string
  boss: boolean
  skill: EnemySkill
  /** bị choáng: mất lượt kế tiếp */
  stunned: boolean
  /** xác suất đi nước ngẫu nhiên thay vì nước tốt nhất (AI càng về sau càng ít sai) */
  mistake: number
  traits: EnemyTrait[]
  /** tinh anh: mạnh hơn, thưởng nhiều hơn */
  elite: boolean
  /** số lượt kẻ địch phải tụ lực sau khi đầy Nộ rồi mới tung chiêu (0 = tung ngay) */
  windupNeed: number
  /** số lượt đã tụ lực; > 0 nghĩa là đang báo trước đòn */
  winding: number
  /** sát thương pet gây ra trong lúc kẻ địch tụ lực (đủ ngưỡng thì ngắt chiêu) */
  windupDmg: number
  /** đã cuồng nộ (chỉ một lần) */
  enraged: boolean
  /** dạng tiến hóa hiện tại (0, 1, 2) và XP tích lũy trong trận (từ ngọc xếp được và theo thời gian) */
  form: number
  xp: number
  /** id các dạng kế tiếp (đổi hình, tên, chiêu); thiếu thì chỉ mạnh lên chứ không đổi hình */
  evoIds: string[]
}

/** Loại điểm dừng trên chuyến đi */
export type NodeKind = 'normal' | 'elite' | 'rest' | 'boss'

/** Luật riêng của một màn: giới hạn lượt (quá hạn kẻ địch cuồng nộ), ngọc một hệ mạnh lên, đồng hồ lượt ngắn */
export type RuleType = 'limit' | 'surge' | 'swift'
export interface StageRule {
  type: RuleType
  /** surge: hệ được tăng sức mạnh */
  element?: Element
  /** limit: số lượt của pet trước khi kẻ địch cuồng nộ */
  turns?: number
}

/** Một điểm dừng trong chuyến đi (tạo sẵn lúc bắt đầu ván) */
export interface StageDef {
  kind: NodeKind
  /** id kẻ địch (kind khác 'rest') */
  enemy?: string
  /** độ khó 1..5, tăng dần theo tiến độ chuyến đi */
  level: number
  rule?: StageRule
}

export type Status = 'playing' | 'stageClear' | 'reward' | 'rest' | 'won' | 'lost'

export interface BattleState {
  pet: Pet
  /** dạng tiến hóa hiện tại: 0, 1, 2 */
  form: number
  /** kinh nghiệm tích lũy trong ván */
  xp: number
  /** chuyến đi: danh sách điểm dừng; `stage` là số thứ tự (từ 1) của điểm đang đứng */
  run: StageDef[]
  stage: number
  status: Status
  score: number
  /** vật phẩm đã nhận (id, có thể lặp lại để cộng dồn) */
  relics: string[]
  /** lựa chọn thưởng đang chờ (id vật phẩm, hoặc 'heal') và số lần còn được chọn */
  offer: string[]
  picks: number
  /** máu tối đa cộng thêm từ vật phẩm (giữ nguyên khi tiến hóa) */
  bonusHp: number
  ailments: Ailments
  /** Mega: số lượt của pet còn lại (0 = không ở dạng Mega) và đã dùng Mega ở trận này chưa */
  mega: number
  megaUsed: boolean
  /** số lượt pet đã đi ở màn này (cho luật giới hạn lượt) */
  stageTurns: number
  /** bên đang có lượt */
  turn: Side
  /** thời gian còn lại của lượt (ms) */
  turnLeft: number
  /** đếm số lượt đã qua (dùng làm khóa hoạt ảnh) */
  turnNo: number
  player: PlayerState
  enemy: EnemyState
}

export interface FloatEvent {
  side: 'player' | 'enemy'
  text: string
  kind: 'damage' | 'heal' | 'shield' | 'rage' | 'skill' | 'combo' | 'xp'
}

/** Một dạng tiến hóa: tên, tên file hình, chỉ số và chiêu riêng */
export interface PetForm {
  /** tên file hình (public/local-assets/<id>.png / .gif) */
  id: string
  name: string
  maxHp: number
  power: number
  rageMul: number
  skill: Skill
}

export interface Skill {
  name: string
  emoji: string
  desc: string
  damage?: number
  /** số đòn đánh (mặc định 1) */
  hits?: number
  /** hồi máu theo % HP tối đa */
  healPct?: number
  shield?: number
  /** làm kẻ địch choáng: mất lượt kế tiếp */
  stun?: boolean
}

export interface Pet {
  id: string
  name: string
  emoji: string
  /** hệ sở trường: ngọc cùng hệ hiệu quả x1.5 */
  element: Element
  /** thế hệ (chỉ để nhóm khi chọn pet) */
  gen: number
  /** 3 dạng tiến hóa; forms[0] là dạng khởi đầu (trùng chỉ số ở trên) */
  forms: PetForm[]
  /** sức mạnh ngọc (nhân sát thương, hồi máu, giáp từ ngọc) */
  power: number
  /** tốc độ nạp Nộ */
  rageMul: number
  maxHp: number
  desc: string
  skill: Skill
}
