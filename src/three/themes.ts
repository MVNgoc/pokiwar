/** Khung cảnh từng màn: màu bầu trời (CSS), mặt đất, đồi, cây và hiệu ứng riêng. Màn 5 (Boss) là núi lửa. */
export type Mood = 'meadow' | 'forest' | 'beach' | 'cave' | 'volcano'

export interface StageTheme {
  name: string
  mood: Mood
  skyTop: string
  skyMid: string
  skyBottom: string
  ground: string
  hillNear: string
  hillFar: string
  foliage: string
  trunk: string
  /** màu mặt trời / mặt trăng; null = không có */
  sun: string | null
  /** màu đốm sáng trôi trong cảnh */
  mote: string
}

export const THEMES: StageTheme[] = [
  { name: 'Đường Số 1', mood: 'meadow', skyTop: '#3d9bf0', skyMid: '#8ccfff', skyBottom: '#e3f6ff', ground: '#5fc152', hillNear: '#6fd45f', hillFar: '#9be08f', foliage: '#3fae48', trunk: '#8a5a34', sun: '#fff2a8', mote: '#ffffff' },
  { name: 'Rừng Tùng Lâm', mood: 'forest', skyTop: '#2c7a82', skyMid: '#6fb7a0', skyBottom: '#d6efc9', ground: '#2f8a4f', hillNear: '#23704a', hillFar: '#4f9a75', foliage: '#1f6b45', trunk: '#6b4a2f', sun: '#e8ffd0', mote: '#d8ff7a' },
  { name: 'Bờ Biển Xanh', mood: 'beach', skyTop: '#27b4ff', skyMid: '#8fe0ff', skyBottom: '#fff0c2', ground: '#f0d58a', hillNear: '#e4c070', hillFar: '#f5dc9d', foliage: '#2fa84f', trunk: '#9b6a3c', sun: '#fff7c4', mote: '#bff3ff' },
  { name: 'Hang Nguyệt Quang', mood: 'cave', skyTop: '#2a1f55', skyMid: '#5a4a96', skyBottom: '#b99be0', ground: '#5d5370', hillNear: '#4a4060', hillFar: '#6e6288', foliage: '#6a5a8a', trunk: '#3d3550', sun: '#f3eaff', mote: '#e0a8ff' },
  { name: 'Đảo Hỏa Diệm', mood: 'volcano', skyTop: '#4a0f14', skyMid: '#b02a1c', skyBottom: '#ff9a45', ground: '#3a2a2c', hillNear: '#2a1a1c', hillFar: '#5a2a24', foliage: '#4a2a28', trunk: '#2a1a1a', sun: null, mote: '#ff9a3d' },
]

export const themeOf = (stage: number): StageTheme => THEMES[(stage - 1 + THEMES.length) % THEMES.length]
