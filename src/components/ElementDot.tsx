import { useEffect, useState } from 'react'
import { ELEMENT_INFO } from '../game/constants'
import type { Element } from '../game/types'
import { gemIconUrl, loadGemIcon } from '../three/gemIcons'

/** Chấm tròn theo hệ: dùng icon hệ cá nhân nếu có, không thì emoji trên nền màu. Dùng ở chú thích và chọn pet. */
export default function ElementDot({ element, size = 14 }: { element: Element; size?: number }) {
  const info = ELEMENT_INFO[element]
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let live = true
    void loadGemIcon(element).then((t) => live && setUrl(t ? gemIconUrl(element) : null))
    return () => {
      live = false
    }
  }, [element])
  if (url) return <img src={url} alt={info.label} title={info.label} width={size} height={size} className="inline-block shrink-0 align-text-bottom" />
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${info.gradient} align-text-bottom`}
      style={{ width: size, height: size, fontSize: size * 0.6 }}
      title={info.label}
    >
      {info.icon}
    </span>
  )
}
