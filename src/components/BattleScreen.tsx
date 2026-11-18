import { canUseSkill, currentForm, nextEvolveXp } from '../game/combat'
import { BALANCE, TOTAL_STAGES } from '../game/constants'
import type { PetRecord } from '../game/storage'
import type { BattleState, Side } from '../game/types'
import type { Cast, FloatText } from '../hooks/useGame'
import ArenaScene from '../three/ArenaScene'
import { bgUrl, themeOf } from '../three/themes'
import ElementDot from './ElementDot'
import Icon from './Icon'
import { HelpButton } from './HelpPanel'
import StatusBars from './StatusBars'

interface Props {
  battle: BattleState
  floats: FloatText[]
  hitFlash: Side | null
  shaking: boolean
  attacker: Side | null
  cast: Cast | null
  best: PetRecord
  newBest: boolean
  busy: boolean
  onSkill: () => void
  onRestart: () => void
  onChangePet: () => void
  onHelp: () => void
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
  xp: 'text-sky-300 text-base',
}

interface FighterProps {
  name: React.ReactNode
  side: 'left' | 'right'
  /** đang có lượt */
  active: boolean
  floats: FloatText[]
  children: React.ReactNode
}

/** Phần giao diện (HTML) của mỗi bên: tên, thanh máu/Nộ/đồng hồ và chữ sát thương nổi. Nhân vật 3D vẽ ở lớp phía sau. */
function Fighter({ name, side, active, floats, children }: FighterProps) {
  return (
    <div className={`relative flex w-[36%] max-w-[220px] flex-col items-center gap-1 transition-[opacity,filter] duration-300 lg:max-w-[300px] ${side === 'left' ? 'ml-[max(8px,calc(14%-min(18%,var(--half))))]' : 'mr-[max(8px,calc(14%-min(18%,var(--half))))]'} ${active ? '' : 'opacity-75 saturate-50'}`}>
      <div className={`rounded-full bg-black/45 px-2 text-xs font-bold lg:px-3 lg:py-0.5 lg:text-base ${active ? 'text-yellow-300' : 'text-amber-100'}`}>
        {active ? '▶ ' : ''}
        {name}
      </div>
      {/* chỗ trống để nhân vật 3D hiện ra phía sau */}
      <div className="h-[clamp(80px,19dvh,140px)] w-full lg:h-[clamp(140px,22dvh,210px)]" />
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

export default function BattleScreen({ battle, floats, hitFlash, shaking, attacker, cast, best, newBest, busy, onSkill, onRestart, onChangePet, onHelp, muted, onToggleMute }: Props) {
  const { player, enemy, stage, score, status } = battle
  const ready = canUseSkill(battle) && !busy
  const turnInfo = { pct: (battle.turnLeft / BALANCE.turnMs) * 100, secs: Math.ceil(battle.turnLeft / 1000) }
  const playing = status === 'playing'
  const theme = themeOf(stage)
  return (
    <div
      className={`relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-3 pt-2 lg:rounded-3xl lg:border-4 lg:border-amber-900 lg:px-6 lg:pt-4 lg:shadow-2xl ${shaking ? 'animate-shake' : ''}`}
      style={{ background: `url(${bgUrl(theme)}) center bottom / cover no-repeat, ${theme.skyMid}` }}
    >
      <ArenaScene battle={battle} hitFlash={hitFlash} attacker={attacker} cast={cast} />

      <div className="relative z-10 flex justify-between text-xs font-bold text-amber-100">
        <span className="rounded-full bg-black/35 px-2 py-0.5 lg:text-sm">{enemy.boss ? (
            <>
              <Icon name="crown" size={14} className="text-yellow-300" /> BOSS · {theme.name}
            </>
          ) : (
            `Màn ${stage}/${TOTAL_STAGES} · ${theme.name}`
          )}
        </span>
        <span className="rounded-full bg-black/35 px-2 py-0.5 lg:text-sm">
          Điểm: {score} · Kỷ lục: {Math.max(best.bestScore, score)}
        </span>
      </div>

      <div className="relative z-10 flex flex-1 items-end justify-between gap-2 pb-2 [--half:110px] lg:[--half:150px]">
        {playing && (
          <div key={battle.turnNo} className="turn-banner pointer-events-none absolute inset-x-0 top-[8%] z-30 flex justify-center">
            <span className={`rounded-full px-4 py-1 text-sm font-black shadow-lg ${battle.turn === 'player' ? 'bg-emerald-400 text-black' : 'bg-red-500 text-white'}`}>
              {battle.turn === 'player' ? (
                <>
                  <Icon name="sword" size={16} /> LƯỢT CỦA BẠN
                </>
              ) : (
                <>
                  <Icon name="bolt" size={16} /> LƯỢT KẺ ĐỊCH
                </>
              )}
            </span>
          </div>
        )}
        <Fighter
          side="left"
          name={
            <>
              <ElementDot element={battle.pet.element} size={16} /> {player.name}
            </>
          }
          active={playing && battle.turn === 'player'} floats={floats.filter((f) => f.side === 'player')}>
          <StatusBars hp={player.hp} maxHp={player.maxHp} rage={player.rage} maxRage={player.maxRage} shield={player.shield} turn={playing && battle.turn === 'player' ? turnInfo : null} xp={{ value: battle.xp, next: nextEvolveXp(battle), prev: battle.form > 0 ? BALANCE.evolveXp[battle.form - 1] : 0 }} />
        </Fighter>
        <Fighter
          side="right"
          name={
            <>
              <ElementDot element={enemy.element} size={16} /> {enemy.name}
              {enemy.stunned && <Icon name="star" size={14} className="ml-1 text-yellow-300" />}
            </>
          }
          active={playing && battle.turn === 'enemy'}
          floats={floats.filter((f) => f.side === 'enemy')}
        >
          <StatusBars hp={enemy.hp} maxHp={enemy.maxHp} rage={enemy.rage} maxRage={enemy.maxRage} shield={enemy.shield} turn={playing && battle.turn === 'enemy' ? turnInfo : null} />
        </Fighter>
      </div>

      <button
        onClick={onSkill}
        disabled={!ready}
        className={`relative z-10 mx-auto mb-2 rounded-full border-2 px-5 py-1.5 text-sm font-black transition ${
          ready
            ? 'animate-ready border-yellow-200 bg-gradient-to-b from-orange-400 to-red-600 text-white shadow-[0_0_16px_#fb923c]'
            : 'border-stone-600 bg-stone-700 text-stone-400'
        }`}
      >
        <ElementDot element={battle.pet.element} size={16} /> {currentForm(battle).skill.name}
      </button>

      <HelpButton onClick={onHelp} className="absolute bottom-2 left-3 z-20" />

      <button
        onClick={onToggleMute}
        aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
        className="absolute bottom-2 right-3 z-20 rounded-full bg-black/40 px-2 py-1 text-lg"
      >
        <Icon name={muted ? 'mute' : 'volume'} size={20} className="text-amber-100" />
      </button>

      {status !== 'playing' && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-black/60 text-center">
          {status === 'stageClear' ? (
            <>
              <div className="text-3xl font-black text-yellow-300">Hạ gục {enemy.name}!</div>
              <div className="text-amber-100">Hồi 30% HP, chuẩn bị màn tiếp theo…</div>
            </>
          ) : (
            <>
              <div className={`text-3xl font-black ${status === 'won' ? 'text-yellow-300' : 'text-red-400'}`}>{status === 'won' ? (
                  <>
                    <Icon name="trophy" size={30} /> Chiến thắng!
                  </>
                ) : (
                  'Thất bại!'
                )}</div>
              <div className="text-sm text-amber-100">{status === 'won' ? `${player.name} đã hạ gục Boss!` : `Dừng chân ở màn ${stage}/${TOTAL_STAGES}`}</div>
              <div className="text-lg font-bold text-white">Điểm: {score}</div>
              <div className="text-xs text-amber-200">
                {newBest ? (
                  <>
                    <Icon name="star" size={13} className="text-yellow-300" /> Kỷ lục mới!
                  </>
                ) : (
                  `Kỷ lục: ${best.bestScore}`
                )} · Thắng: {best.wins} lần
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
