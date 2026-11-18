/** Bộ icon nét đơn giản dùng chung trong màn chơi (thay emoji để đồng bộ, đổi màu theo chữ). */
const PATHS = {
  crown: 'M3 18h18M4 18L3 7l5 4 4-7 4 7 5-4-1 11',
  sword: 'M14 4h6v6L9 21H3v-6zM12 8l4 4',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7z',
  star: 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z',
  trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0zM17 5h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  volume: 'M11 5L6 9H3v6h3l5 4zM15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13',
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
