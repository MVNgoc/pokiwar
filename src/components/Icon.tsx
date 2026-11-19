/** Bộ icon nét đơn giản dùng chung trong màn chơi (thay emoji để đồng bộ, đổi màu theo chữ). */
const PATHS = {
  crown: 'M3 18h18M4 18L3 7l5 4 4-7 4 7 5-4-1 11',
  sword: 'M14 4h6v6L9 21H3v-6zM12 8l4 4',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7z',
  star: 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z',
  trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0zM17 5h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  volume: 'M11 5L6 9H3v6h3l5 4zM15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13',
  skull: 'M12 3a8 8 0 00-8 8c0 2.6 1.2 4.2 3 5v3h10v-3c1.8-.8 3-2.4 3-5a8 8 0 00-8-8zM9 12h.01M15 12h.01M10 19v2M14 19v2',
  camp: 'M2 20h20M12 4L4 20M12 4l8 16M12 20l-3-5h6z',
  check: 'M5 12.5l4.5 4.5L19 7',
  lock: 'M6 11h12v9H6zM8 11V8a4 4 0 018 0v3',
  warn: 'M12 3L2 20h20zM12 10v5M12 17.5h.01',
  down: 'M4 7l6 6 4-4 6 6M20 15v-5h-5',
  flame: 'M12 3c1 4 5 6 5 11a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-10z',
  regen: 'M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10zM12 9v6M9 12h6',
  timer: 'M12 8v5l3 2M9 2h6M12 4a8 8 0 100 16 8 8 0 000-16z',
  swirl: 'M12 12m-1 0a1 1 0 102 0 1 1 0 10-2 0M12 8a4 4 0 014 4 6 6 0 01-6 6 8 8 0 01-8-8 10 10 0 0110-10',
  home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  drop: 'M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z',
  heart: 'M12 20s-8-4.8-8-10.5A4.5 4.5 0 0112 7a4.5 4.5 0 018 2.5C20 15.2 12 20 12 20z',
  book: 'M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM4 19V5M8 7h7',
  link: 'M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1',
  ward: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM8.5 12l2.5 2.5 4.5-5',
  fang: 'M4 5c4 1 12 1 16 0l-2 7c-1 3-2 5-3.5 8L12 15l-2.5 5C8 17 7 15 6 12z',
  spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z',
  target: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 8a4 4 0 100 8 4 4 0 000-8zM12 12h.01',
  rock: 'M4 16l3-8 5-4 6 3 3 7-4 5H8zM9 9l3 3 4-1M12 12l-1 6',
  snow: 'M12 2v20M4 7l16 10M20 7L4 17M9 4l3 2 3-2M9 20l3-2 3 2',
  mute: 'M11 5L6 9H3v6h3l5 4zM16 9l5 6M21 9l-5 6',
} as const

export type IconName = keyof typeof PATHS

export default function Icon({ name, size = 16, className = '' }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={`inline-block shrink-0 align-text-bottom ${className}`} aria-hidden>
      <path d={PATHS[name]} />
    </svg>
  )
}
