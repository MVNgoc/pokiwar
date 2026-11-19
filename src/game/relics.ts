import type { IconName } from '../components/Icon'

/** Vật phẩm nhận được sau mỗi trận thắng (cộng dồn khi nhận nhiều lần, tối đa MAX_STACK). */
export interface Relic {
  id: string
  name: string
  icon: IconName
  desc: string
}

export const MAX_STACK = 3

export const RELICS: Relic[] = [
  { id: 'ember', name: 'Hỏa Tâm', icon: 'flame', desc: 'Sát thương từ ngọc +20%' },
  { id: 'tide', name: 'Thủy Tinh', icon: 'drop', desc: 'Hồi máu từ ngọc +30%' },
  { id: 'bulwark', name: 'Thổ Giáp', icon: 'shield', desc: 'Giáp từ ngọc +30%, giáp tối đa +10' },
  { id: 'focus', name: 'Nộ Tâm', icon: 'target', desc: 'Nạp Nộ nhanh +25%' },
  { id: 'vitality', name: 'Sinh Mệnh', icon: 'heart', desc: 'Máu tối đa +15% (hồi ngay phần tăng thêm)' },
  { id: 'sage', name: 'Trí Giả', icon: 'book', desc: 'XP nhận được +30%' },
  { id: 'chain', name: 'Chuỗi Liên Hoàn', icon: 'link', desc: 'Mỗi bậc combo cộng thêm +15%' },
  { id: 'clock', name: 'Đồng Hồ Cát', icon: 'timer', desc: 'Thời gian mỗi lượt +3 giây' },
  { id: 'ward', name: 'Bùa Hộ Mệnh', icon: 'ward', desc: 'Miễn nhiễm phong ấn và suy yếu' },
  { id: 'vampire', name: 'Hút Máu', icon: 'fang', desc: 'Hồi máu bằng 20% sát thương ngọc gây ra' },
  { id: 'might', name: 'Sức Mạnh Kỹ Năng', icon: 'sword', desc: 'Sát thương kỹ năng +30%' },
  { id: 'spark', name: 'Tia Lửa Khởi Nộ', icon: 'spark', desc: 'Bắt đầu mỗi trận với 35 Nộ' },
  { id: 'recover', name: 'Hồi Sinh', icon: 'regen', desc: 'Hồi thêm 15% máu sau mỗi trận' },
]

export const relicOf = (id: string): Relic | undefined => RELICS.find((r) => r.id === id)
export const countRelic = (relics: string[], id: string) => relics.reduce((n, r) => n + (r === id ? 1 : 0), 0)
