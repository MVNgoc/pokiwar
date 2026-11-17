import { canUseSkill } from '../game/combat'
import type { PetRecord } from '../game/storage'
import type { BattleState } from '../game/types'
import type { Cast, FloatText } from '../hooks/useGame'
import { ENEMY_IMAGES, PET_IMAGES } from '../assets/creatures'
import { BALANCE, ELEMENT_INFO, TOTAL_STAGES } from '../game/constants'
import SkillFx from './SkillFx'
import StatusBars from './StatusBars'

interface Props {
  battle: BattleState
  floats: FloatText[]
  hitFlash: 'player' | 'enemy' | null
  shaking: boolean
  attacker: 'player' | 'enemy' | null
  cast: Cast | null
  best: PetRecord
  newBest: boolean
  busy: boolean
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

interface FighterProps {
  side: 'player' | 'enemy'
  image: string
  name: string
  hurt: boolean
  attacking: boolean
  /** đang có lượt */
  active: boolean
  defeated: boolean
  /** đổi giá trị này để phát lại hoạt ảnh xuất hiện */
  enterKey: string
  floats: FloatText[]
  children: React.ReactNode
}

function Fighter({ side, image, name, hurt, attacking, active, defeated, enterKey, floats, children }: FighterProps) {
  const isPlayer = side === 'player'
  // Ưu tiên: bị hạ > tấn công > bị đánh. Hoạt ảnh thở chạy ở lớp trong cùng.
  const state = defeated
    ? 'animate-defeat'
    : attacking
      ? isPlayer ? 'animate-lunge-r' : 'animate-lunge-l'
      : hurt
        ? isPlayer ? 'animate-hurt-l' : 'animate-hurt-r'
        : ''
  return (
    <div className={`relative flex w-1/2 max-w-[220px] flex-col items-center gap-1 transition-[opacity,filter] duration-300 ${active ? '' : 'opacity-70 saturate-50'}`}>
      <div className={`text-xs font-bold ${active ? 'text-yellow-300' : 'text-amber-100'}`}>{active ? '▶ ' : ''}{name}</div>
      <div className="relative">
        <div className={`absolute -bottom-1 left-1/2 h-2.5 w-3/4 -translate-x-1/2 rounded-full bg-black/45 blur-[3px] ${defeated ? 'opacity-0 transition-opacity duration-500' : 'animate-shadow'}`} />
        <div key={enterKey} className={isPlayer ? 'animate-enter-l' : 'animate-enter-r'}>
          <div className={state} style={{ '--rot': isPlayer ? '-70deg' : '70deg' } as React.CSSProperties}>
            <div className={`origin-bottom ${defeated ? '' : 'animate-breathe'}`} style={{ animationDelay: isPlayer ? '0s' : '-0.9s' }}>
              <img
                src={image}
                alt={name}
                draggable={false}
                className={`h-[clamp(64px,17dvh,120px)] w-auto [image-rendering:pixelated] ${isPlayer ? '' : '[transform:scaleX(-1)]'}`}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="relative w-full">
        {children}
        {floats.map((f) => (
          <span
            key={f.id}
            className={`float-up pointer-events-none absolute bottom-full text-xl font-black [text-shadow:0_2px_2px_#000] ${FLOAT_COLOR[f.kind]}`}
            style={{ left: `${f.x}%`, '--dx': `${(f.x - 50) * 0.8}px` } as React.CSSProperties}
          >
            {f.text}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function BattleScreen({ battle, floats, hitFlash, shaking, attacker, cast, best, newBest, busy, onSkill, onRestart, onChangePet, muted, onToggleMute }: Props) {
  const { player, enemy, stage, score, status } = battle
  const ready = canUseSkill(battle) && !busy
  const turnInfo = { pct: (battle.turnLeft / BALANCE.turnMs) * 100, secs: Math.ceil(battle.turnLeft / 1000) }
  return (
    <div className="relative flex flex-1 flex-col bg-gradient-to-b from-sky-900 via-emerald-900 to-emerald-950 px-3 pt-2">
      <div className="flex justify-between text-xs font-bold text-amber-100">
        <span>{enemy.boss ? '👑 BOSS' : `Màn ${stage}/${TOTAL_STAGES}`}</span>
        <span className="text-[10px] font-normal text-amber-100/70">Kim›Mộc›Thổ›Thủy›Hỏa›Kim</span>
        <span>Điểm: {score} · Kỷ lục: {Math.max(best.bestScore, score)}</span>
      </div>

      <div className={`relative flex flex-1 items-end justify-around gap-2 pb-2 ${shaking ? 'animate-shake' : ''}`}>
        {cast && <SkillFx key={cast.id} cast={cast} />}
        {status === 'playing' && (
          <div key={battle.turnNo} className="turn-banner pointer-events-none absolute inset-x-0 top-[18%] z-30 flex justify-center">
            <span className={`rounded-full px-4 py-1 text-sm font-black shadow-lg ${battle.turn === 'player' ? 'bg-emerald-400 text-black' : 'bg-red-500 text-white'}`}>
              {battle.turn === 'player' ? '⚔ LƯỢT CỦA BẠN' : '💢 LƯỢT KẺ ĐỊCH'}
            </span>
          </div>
        )}
        <Fighter side="player" image={PET_IMAGES[battle.pet.id]} name={`${ELEMENT_INFO[battle.pet.element].glyph} ${player.name}`} hurt={hitFlash === 'player'} attacking={attacker === 'player'} active={status === 'playing' && battle.turn === 'player'} defeated={player.hp <= 0} enterKey={battle.pet.id} floats={floats.filter((f) => f.side === 'player')}>
          <StatusBars hp={player.hp} maxHp={player.maxHp} rage={player.rage} maxRage={player.maxRage} shield={player.shield} turn={status === 'playing' && battle.turn === 'player' ? turnInfo : null} />
        </Fighter>
        <div className="mb-16 text-2xl font-black text-amber-200">VS</div>
        <Fighter side="enemy" image={ENEMY_IMAGES[enemy.id]} name={`${enemy.boss ? '無' : ELEMENT_INFO[enemy.element].glyph} ${enemy.name}${enemy.stunned ? ' 💫' : ''}`} hurt={hitFlash === 'enemy'} attacking={attacker === 'enemy'} active={status === 'playing' && battle.turn === 'enemy'} defeated={enemy.hp <= 0} enterKey={`${enemy.id}-${stage}`} floats={floats.filter((f) => f.side === 'enemy')}>
          <StatusBars hp={enemy.hp} maxHp={enemy.maxHp} rage={enemy.rage} maxRage={enemy.maxRage} shield={enemy.shield} turn={status === 'playing' && battle.turn === 'enemy' ? turnInfo : null} />
        </Fighter>
      </div>

      <button
        onClick={onSkill}
        disabled={!ready}
        className={`mx-auto mb-2 rounded-full border-2 px-5 py-1.5 text-sm font-black transition ${
          ready
            ? 'animate-ready border-yellow-200 bg-gradient-to-b from-orange-400 to-red-600 text-white shadow-[0_0_16px_#fb923c]'
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
