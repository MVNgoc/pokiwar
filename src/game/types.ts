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

export interface EnemySkill {
  name: string
  damage: number
}

export interface EnemyState extends Combatant {
  id: string
  boss: boolean
  skill: EnemySkill
  /** bị choáng: mất lượt kế tiếp */
  stunned: boolean
  /** xác suất đi nước ngẫu nhiên thay vì nước tốt nhất (AI càng về sau càng ít sai) */
  mistake: number
}

export type Status = 'playing' | 'stageClear' | 'won' | 'lost'

export interface BattleState {
  pet: Pet
  /** dạng tiến hóa hiện tại: 0, 1, 2 */
  form: number
  /** kinh nghiệm tích lũy trong ván */
  xp: number
  stage: number
  status: Status
  score: number
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
