import Motes from './Motes'
import type { StageTheme } from './themes'

/** Ngoại cảnh là ảnh nền vẽ tay (CSS, phía sau canvas); phần 3D chỉ thêm đốm sáng trôi theo màu từng màn. */
export default function Scenery({ theme }: { theme: StageTheme }) {
  return <Motes count={theme.mood === 'volcano' ? 60 : 40} color={theme.mote} />
}
