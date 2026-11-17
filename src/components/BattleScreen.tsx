import { canUseSkill } from '../game/combat'
import type { PetRecord } from '../game/storage'
import type { BattleState } from '../game/types'
import type { Cast, FloatText } from '../hooks/useGame'
import { ENEMY_IMAGES, PET_IMAGES } from '../assets/creatures'
import { ELEMENT_INFO, TOTAL_STAGES } from '../game/constants'
import StatusBars from './StatusBars'

interface Props {
  battle: BattleState
  floats: FloatText[]
  hitFlash: 'player' | 'enemy' | null
  attacker: 'player' | 'enemy' | null
  cast: Cast | null
  best: PetRecord
  newBest: boolean
  onSkill: () => void
  onRestart: () => void
  onChangePet: () => void
  muted: boolean
  onToggleMute: () => void
}

const FLOAT_COLOR: Record<FloatText['kind'], string> = {
  damage: 'text-red-400',
  heal: 'text-green-300',
  shield: 'text-amber-300',
  rage: 'text-orange-300',
  skill: 'text-yellow-300 text-4xl',
  combo: 'text-fuchsia-300',
}

function Fighter({ side, image, name, flash, attacking, floats, children }: {
  side: 'player' | 'enemy'
  image: string
  name: string
  flash: boolean
  attacking: boolean
  floats: FloatText[]
  children: React.ReactNode
}) {
  return (
    <div className="relative flex w-1/2 max-w-[220px] flex-col items-center gap-1">
      <div className="text-xs font-bold text-amber-100">{name}</div>
      <div className={`relative leading-none transition-transform ${attacking ? (side === 'player' ? 'animate-lunge-r' : 'animate-lunge-l') : flash ? 'translate-x-1 scale-95 brightness-150' : 'animate-bob'} ${side === 'enemy' ? '[transform:scaleX(-1)]' : ''}`}>
        <img src={image} alt={name} draggable={false} className="h-[clamp(64px,17dvh,120px)] w-auto [image-rendering:pixelated]" />
      </div>
      <div className="relative w-full">
        {children}
        {floats.map((f) => (
          <span
            key={f.id}
            className={`float-up pointer-events-none absolute bottom-full text-xl font-black [text-shadow:0_2px_2px_#000] ${FLOAT_COLOR[f.kind]}`}
            style={{ left: `${f.x}%` }}
          >
            {f.text}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function BattleScreen({ battle, floats, hitFlash, attacker, cast, best, newBest, onSkill, onRestart, onChangePet, muted, onToggleMute }: Props) {
  const { player, enemy, stage, score, status } = battle
  const ready = canUseSkill(battle)
  return (
    <div className="relative flex flex-1 flex-col bg-gradient-to-b from-sky-900 via-emerald-900 to-emerald-950 px-3 pt-2">
      <div className="flex justify-between text-xs font-bold text-amber-100">
        <span>{enemy.boss ? '👑 BOSS' : `Màn ${stage}/${TOTAL_STAGES}`}</span>
        <span className="text-[10px] font-normal text-amber-100/70">Kim›Mộc›Thổ›Thủy›Hỏa›Kim</span>
        <span>Điểm: {score} · Kỷ lục: {Math.max(best.bestScore, score)}</span>
      </div>

      <div className="relative flex flex-1 items-end justify-around gap-2 pb-2">
        {cast && (
          <span key={cast.id} className={`pointer-events-none absolute bottom-1/3 z-20 text-5xl ${cast.offensive ? 'animate-fly' : 'animate-aura left-[8%]'}`}>
            {cast.emoji}
          </span>
        )}
        <Fighter side="player" image={PET_IMAGES[battle.pet.id]} name={`${ELEMENT_INFO[battle.pet.element].glyph} ${player.name}`} flash={hitFlash === 'player'} attacking={attacker === 'player'} floats={floats.filter((f) => f.side === 'player')}>
          <StatusBars hp={player.hp} maxHp={player.maxHp} rage={player.rage} maxRage={player.maxRage} shield={player.shield} />
        </Fighter>
        <div className="mb-16 text-2xl font-black text-amber-200">VS</div>
        <Fighter side="enemy" image={ENEMY_IMAGES[enemy.id]} name={`${enemy.boss ? '無' : ELEMENT_INFO[enemy.element].glyph} ${enemy.name}`} flash={hitFlash === 'enemy'} attacking={attacker === 'enemy'} floats={floats.filter((f) => f.side === 'enemy')}>
          <StatusBars hp={enemy.hp} maxHp={enemy.maxHp} timerPct={Math.min(100, (enemy.timer / enemy.interval) * 100)} />
        </Fighter>
      </div>

      <button
        onClick={onSkill}
        disabled={!ready}
        className={`mx-auto mb-2 rounded-full border-2 px-5 py-1.5 text-sm font-black transition ${
          ready
            ? 'animate-pulse border-yellow-200 bg-gradient-to-b from-orange-400 to-red-600 text-white shadow-[0_0_16px_#fb923c]'
            : 'border-stone-600 bg-stone-700 text-stone-400'
        }`}
      >
        {battle.pet.skill.emoji} {battle.pet.skill.name}
      </button>

      <button
        onClick={onToggleMute}
        aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
        className="absolute bottom-2 right-3 z-20 rounded-full bg-black/40 px-2 py-1 text-lg"
      >
        {muted ? '🔇' : '🔊'}
      </button>

      {status !== 'playing' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/60 text-center">
          {status === 'stageClear' ? (
            <>
              <div className="text-3xl font-black text-yellow-300">Hạ gục {enemy.name}!</div>
              <div className="text-amber-100">Hồi 30% HP, chuẩn bị màn tiếp theo…</div>
            </>
          ) : (
            <>
              <div className={`text-3xl font-black ${status === 'won' ? 'text-yellow-300' : 'text-red-400'}`}>
                {status === 'won' ? '🏆 Chiến thắng!' : 'Thất bại!'}
              </div>
              <div className="text-sm text-amber-100">
                {status === 'won' ? `${player.name} đã hạ gục Boss!` : `Dừng chân ở màn ${stage}/${TOTAL_STAGES}`}
              </div>
              <div className="text-lg font-bold text-white">Điểm: {score}</div>
              <div className="text-xs text-amber-200">
                {newBest ? '🎉 Kỷ lục mới!' : `Kỷ lục: ${best.bestScore}`} · Thắng: {best.wins} lần
              </div>
              <div className="flex gap-2">
                <button onClick={onRestart} className="rounded-lg bg-amber-500 px-5 py-2 font-bold text-black">
                  Chơi lại
                </button>
                <button onClick={onChangePet} className="rounded-lg bg-stone-200 px-5 py-2 font-bold text-black">
                  Đổi pet
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
