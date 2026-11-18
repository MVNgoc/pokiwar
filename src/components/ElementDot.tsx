import { ELEMENT_INFO } from '../game/constants'
import type { Element } from '../game/types'

/** Chấm tròn màu theo hệ kèm chữ Hán: dùng ở chú thích và chọn pet. */
export default function ElementDot({ element, size = 14 }: { element: Element; size?: number }) {
  const info = ELEMENT_INFO[element]
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${info.gradient} align-text-bottom font-black text-white [text-shadow:0_1px_1px_rgba(0,0,0,.6)]`}
      style={{ width: size, height: size, fontSize: size * 0.62 }}
      title={info.label}
    >
      {info.glyph}
    </span>
  )
}
