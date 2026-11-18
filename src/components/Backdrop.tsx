import { bgUrl, type StageTheme } from '../three/themes'

/** Nền toàn trang: cùng ảnh nền của màn, làm mờ và tối nhẹ để viền hai bên không tranh với khung game. */
export default function Backdrop({ theme }: { theme: StageTheme }) {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden bg-stone-900" aria-hidden>
      <div className="absolute -inset-8 bg-cover bg-center blur-md" style={{ backgroundImage: `url(${bgUrl(theme)})` }} />
      <div className="absolute inset-0 bg-black/25" />
    </div>
  )
}
