import { FX, type FxId } from '../assets/fx'

interface Props {
  id: FxId
  /** kích thước hiển thị (px) */
  size: number
  /** bắt đầu sau bao nhiêu ms (trước đó ẩn) */
  delay?: number
  loop?: boolean
  frameMs?: number
}

/** Phát một sprite sheet ngang bằng CSS: không cần JS cho từng khung hình. */
export default function FxSprite({ id, size, delay = 0, loop = false, frameMs = 70 }: Props) {
  const { src, frames } = FX[id]
  const total = frames * frameMs
  const animations = [
    `fx-play ${total}ms steps(${frames}, jump-none) ${delay}ms ${loop ? 'infinite' : 1} both`,
    `fx-show 1ms ${delay}ms both`,
    ...(loop ? [] : [`fx-hide 1ms ${delay + total}ms forwards`]),
  ]
  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${src})`,
        backgroundSize: `${frames * 100}% 100%`,
        imageRendering: 'pixelated',
        animation: animations.join(', '),
      }}
    />
  )
}
