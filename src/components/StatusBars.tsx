interface BarProps {
  value: number
  max: number
  color: string
  label: string
  extra?: string
}

export function Bar({ value, max, color, label, extra }: BarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className="w-full">
      <div className="relative h-4 overflow-hidden rounded-full border border-black/60 bg-black/50">
        <div className={`h-full ${color} transition-[width] duration-300`} style={{ width: `${pct}%` }} />
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
  rage?: number
  maxRage?: number
  shield?: number
  timerPct?: number
}

export default function StatusBars({ hp, maxHp, rage, maxRage, shield, timerPct }: FighterBarsProps) {
  return (
    <div className="flex w-full flex-col gap-1">
      <Bar value={hp} max={maxHp} color="bg-gradient-to-r from-red-600 to-rose-400" label="HP" extra={shield ? `  🛡${shield}` : ''} />
      {rage !== undefined && maxRage !== undefined && (
        <Bar value={rage} max={maxRage} color={`bg-gradient-to-r from-orange-500 to-yellow-300 ${rage >= maxRage ? 'animate-pulse' : ''}`} label="Nộ" />
      )}
      {timerPct !== undefined && (
        <div className="h-1.5 overflow-hidden rounded-full bg-black/50">
          <div className="h-full bg-purple-400" style={{ width: `${timerPct}%` }} />
        </div>
      )}
    </div>
  )
}
