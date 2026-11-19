import Icon from './Icon'

interface BarProps {
  value: number
  max: number
  color: string
  label: string
  extra?: React.ReactNode
}

export function Bar({ value, max, color, label, extra }: BarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className="w-full">
      <div className="relative h-4 overflow-hidden rounded-full border border-black/60 bg-black/50">
        {/* vệt trắng tụt chậm phía sau: cho thấy lượng máu vừa mất */}
        <div className="absolute inset-y-0 left-0 bg-white/80 [transition:width_600ms_ease-out_350ms]" style={{ width: `${pct}%` }} />
        <div className={`relative h-full ${color} [transition:width_220ms_ease-out]`} style={{ width: `${pct}%` }} />
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white [text-shadow:0_1px_1px_#000]">
          {label} {Math.ceil(value)}/{max}
          {extra}
        </span>
      </div>
    </div>
  )
}

interface FighterBarsProps {
  hp: number
  maxHp: number
  rage: number
  maxRage: number
  shield: number
  /** đồng hồ lượt: chỉ hiện cho bên đang có lượt */
  turn?: { pct: number; secs: number } | null
  /** kinh nghiệm (chỉ pet của người chơi): giá trị hiện tại, mốc tiến hóa kế tiếp (null = dạng cuối) */
  xp?: { value: number; next: number | null; prev: number; label?: string; tone?: string } | null
}

export default function StatusBars({ hp, maxHp, rage, maxRage, shield, turn, xp }: FighterBarsProps) {
  return (
    <div className="flex w-full flex-col gap-1">
      <Bar value={hp} max={maxHp} color="bg-gradient-to-r from-red-600 to-rose-400" label="HP" extra={shield ? <span className="ml-1.5 inline-flex items-center gap-0.5 text-sky-200"><Icon name="shield" size={10} />{shield}</span> : null} />
      <Bar value={rage} max={maxRage} color={`bg-gradient-to-r from-orange-500 to-yellow-300 ${rage >= maxRage ? 'animate-pulse' : ''}`} label="Nộ" />
      {xp && (
        <div className="relative h-3 overflow-hidden rounded-full border border-black/60 bg-black/50">
          <div className={`h-full bg-gradient-to-r ${xp.tone ?? 'from-sky-500 to-cyan-300'} [transition:width_300ms_ease-out]`} style={{ width: `${xp.next === null ? 100 : Math.min(100, ((xp.value - xp.prev) / (xp.next - xp.prev)) * 100)}%` }} />
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white [text-shadow:0_1px_1px_#000]">
            {xp.next === null ? `${xp.label ?? 'XP'} MAX` : `${xp.label ?? 'XP'} ${Math.floor(xp.value - xp.prev)}/${xp.next - xp.prev}`}
          </span>
        </div>
      )}
      <div className={`relative h-3 overflow-hidden rounded-full border border-black/60 bg-black/50 transition-opacity ${turn ? 'opacity-100' : 'opacity-0'}`}>
        <div
          className={`h-full ${turn && turn.secs <= 3 ? 'animate-pulse bg-red-500' : 'bg-emerald-400'} [transition:width_100ms_linear]`}
          style={{ width: `${turn?.pct ?? 0}%` }}
        />
      </div>
    </div>
  )
}
