export type Element = 'kim' | 'moc' | 'thuy' | 'hoa' | 'tho'

export interface Tile {
  id: number
  type: Element
}

/** null = ô trống (đang bị xoá, chờ rơi ngọc xuống) */
export type Board = (Tile | null)[][]

export interface Position {
  r: number
  c: number
}

export type GemCounts = Record<Element, number>

export interface Fighter {
  name: string
  emoji: string
  hp: number
  maxHp: number
}

export interface PlayerState extends Fighter {
  rage: number
  maxRage: number
  shield: number
}

export interface EnemyState extends Fighter {
  attack: number
  /** ms giữa 2 lần đánh */
  interval: number
  /** ms còn lại tới đòn đánh kế tiếp */
  timer: number
}

export type Status = 'playing' | 'stageClear' | 'lost'

export interface BattleState {
  pet: Pet
  stage: number
  status: Status
  score: number
  player: PlayerState
  enemy: EnemyState
}

export interface FloatEvent {
  side: 'player' | 'enemy'
  text: string
  kind: 'damage' | 'heal' | 'shield' | 'rage' | 'skill' | 'combo'
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
  /** làm kẻ địch choáng (hoãn đòn đánh) */
  stunMs?: number
}

export interface Pet {
  id: string
  name: string
  emoji: string
  /** hệ sở trường: ngọc cùng hệ hiệu quả x1.5 */
  element: Element
  maxHp: number
  desc: string
  skill: Skill
}
