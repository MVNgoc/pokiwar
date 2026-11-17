export const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

/** Nảy khi chạm đất: 0 → 1 với vài lần nảy tắt dần. */
export function bounceOut(t: number): number {
  const n = 7.5625
  const d = 2.75
  if (t < 1 / d) return n * t * t
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375
  return n * (t -= 2.625 / d) * t + 0.984375
}

/** Nội suy tuyến tính qua dãy mốc [thời điểm 0..1, giá trị], mỗi đoạn nhẹ nhàng vào/ra. */
export function keyframes(t: number, frames: [number, number][]): number {
  if (t <= frames[0][0]) return frames[0][1]
  for (let i = 1; i < frames.length; i++) {
    const [t1, v1] = frames[i]
    if (t <= t1) {
      const [t0, v0] = frames[i - 1]
      return lerp(v0, v1, easeInOut((t - t0) / (t1 - t0)))
    }
  }
  return frames[frames.length - 1][1]
}
