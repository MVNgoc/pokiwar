import { useState } from 'react'
import { canMega, canUseSkill, currentForm, nextEvolveXp, stageRule, turnTime } from '../game/combat'
import { BALANCE, ELEMENT_INFO } from '../game/constants'
import { relicOf } from '../game/relics'
import { NODE_INFO, RULE_INFO, ruleText } from '../game/run'
import type { PetRecord } from '../game/storage'
import type { BattleState, Side } from '../game/types'
import type { Cast, FloatText } from '../hooks/useGame'
import ArenaScene from '../three/ArenaScene'
import { bgUrl, themeOf } from '../three/themes'
import ElementDot from './ElementDot'
import Icon, { type IconName } from './Icon'
import { HelpButton } from './HelpPanel'
import StatusBars from './StatusBars'

interface Props {
  battle: BattleState
  floats: FloatText[]
  hitFlash: Side | null
  shaking: boolean
  attacker: Side | null
  cast: Cast | null
  megaFx: number | null
  best: PetRecord
  newBest: boolean
  busy: boolean
  onSkill: () => void
  onMega: () => void
  onReward: (id: string) => void
  onRest: (choice: 'heal' | 'xp') => void
  onRestart: () => void
  onChangePet: () => void
  onHelp: () => void
  onHome: () => void
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
  badges?: React.ReactNode
  children: React.ReactNode
}

function Chip({ text, tone, icon }: { text: string; tone: string; icon: IconName }) {
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-px text-[10px] font-bold leading-tight text-white shadow ${tone}`}>
      <Icon name={icon} size={10} />
      {text}
    </span>
  )
}

/** Phần giao diện (HTML) của mỗi bên: tên, thanh máu/Nộ/đồng hồ và chữ sát thương nổi. Nhân vật 3D vẽ ở lớp phía sau. */
function Fighter({ name, side, active, floats, badges, children }: FighterProps) {
  return (
    <div className={`relative flex w-[36%] max-w-[220px] flex-col items-center gap-1 transition-[opacity,filter] duration-300 lg:max-w-[300px] ${side === 'left' ? 'ml-[max(8px,calc(14%-min(18%,var(--half))))]' : 'mr-[max(8px,calc(14%-min(18%,var(--half))))]'} ${active ? '' : 'opacity-75 saturate-50'}`}>
      <div className={`rounded-full bg-black/45 px-2 text-xs font-bold lg:px-3 lg:py-0.5 lg:text-base ${active ? 'text-yellow-300' : 'text-amber-100'}`}>
        {active ? '▶ ' : ''}
        {name}
      </div>
      {badges && <div className="flex flex-wrap justify-center gap-0.5">{badges}</div>}
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

export default function BattleScreen({ battle, floats, hitFlash, shaking, attacker, cast, megaFx, best, newBest, busy, onSkill, onMega, onReward, onRest, onRestart, onChangePet, onHelp, onHome, muted, onToggleMute }: Props) {
  const { player, enemy, stage, score, status } = battle
  const ready = canUseSkill(battle) && !busy
  const megaReady = canMega(battle) && !busy
  const finalForm = battle.form === battle.pet.forms.length - 1
  const turnInfo = { pct: (battle.turnLeft / turnTime(battle, battle.turn)) * 100, secs: Math.ceil(battle.turnLeft / 1000) }
  const total = battle.run.length
  const rule = stageRule(battle)
  const rest = status === 'rest'
  const { ailments } = battle
  const [relicInfo, setRelicInfo] = useState<string | null>(null)
  const relicCounts = [...new Set(battle.relics)].map((id) => ({ id, n: battle.relics.filter((r) => r === id).length }))
  const playing = status === 'playing'
  const theme = themeOf(stage)
  return (
    <div
      className={`relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-3 pt-2 lg:rounded-3xl lg:border-4 lg:border-amber-900 lg:px-6 lg:pt-4 lg:shadow-2xl ${shaking ? 'animate-shake' : ''}`}
      style={{ background: `url(${bgUrl(theme)}) center bottom / cover no-repeat, ${theme.skyMid}` }}
    >
      <ArenaScene battle={battle} hitFlash={hitFlash} attacker={attacker} cast={cast} megaFx={megaFx} />
      {megaFx != null && (
        <div key={megaFx} className="pointer-events-none absolute inset-0 z-30">
          <div className="mega-glow absolute inset-0" />
          <div className="mega-white absolute inset-0" />
          <div className="absolute inset-x-0 top-[28%] flex justify-center">
            <span className="mega-title bg-gradient-to-r from-pink-300 via-yellow-200 to-fuchsia-300 bg-clip-text text-4xl font-black tracking-wide text-transparent [filter:drop-shadow(0_2px_6px_#a21caf)]">
              MEGA TIẾN HÓA!
            </span>
          </div>
        </div>
      )}

      <div className="relative z-10 flex justify-between gap-2 text-xs font-bold text-amber-100">
        <span className="rounded-full bg-black/35 px-2 py-0.5 lg:text-sm">
          {enemy.boss && !rest ? (
            <>
              <Icon name="crown" size={14} className="text-yellow-300" /> BOSS · {theme.name}
            </>
          ) : (
            `Màn ${stage}/${total} · ${theme.name}`
          )}
        </span>
        <span className="rounded-full bg-black/35 px-2 py-0.5 lg:text-sm">
          Điểm: {score} · Kỷ lục: {Math.max(best.bestScore, score)}
        </span>
      </div>

      {/* Chuyến đi: mỗi điểm dừng một ô (trận, tinh anh, nghỉ, boss) */}
      <div className="relative z-10 mt-1 flex items-center justify-center gap-0.5">
        {battle.run.map((n, i) => {
          const done = i + 1 < stage
          const cur = i + 1 === stage
          return (
            <span
              key={i}
              title={NODE_INFO[n.kind].label}
              className={`flex h-5 w-5 items-center justify-center rounded-full ${cur ? 'bg-yellow-300 text-black ring-2 ring-white' : done ? 'bg-black/60 text-emerald-300 opacity-70' : n.kind === 'boss' ? 'bg-black/45 text-yellow-300' : n.kind === 'elite' ? 'bg-black/45 text-red-300' : n.kind === 'rest' ? 'bg-black/45 text-emerald-300' : 'bg-black/45 text-amber-100'}`}
            >
              <Icon name={done ? 'check' : NODE_INFO[n.kind].icon} size={12} />
            </span>
          )
        })}
      </div>
      {rule && !rest && (
        <div className="relative z-10 mt-1 flex justify-center">
          <span className="rounded-full bg-fuchsia-900/80 px-2.5 py-0.5 text-[11px] font-bold text-fuchsia-100">
            <Icon name={RULE_INFO[rule.type].icon} size={12} /> {RULE_INFO[rule.type].label}: {ruleText(rule, (e) => ELEMENT_INFO[e].label)}
            {rule.type === 'limit' && ` (${Math.max(0, rule.turns! - battle.stageTurns)} lượt)`}
          </span>
        </div>
      )}

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
          active={playing && battle.turn === 'player'} floats={floats.filter((f) => f.side === 'player')}
          badges={
            <>
              {battle.mega > 0 && <Chip icon="star" tone="bg-fuchsia-600" text={`Mega ${battle.mega}`} />}
              {ailments.poison > 0 && <Chip icon="skull" tone="bg-purple-700" text={`Độc ${ailments.poison}`} />}
              {ailments.seal > 0 && <Chip icon="lock" tone="bg-slate-600" text={`Phong ấn ${ailments.seal}`} />}
              {ailments.weaken > 0 && <Chip icon="down" tone="bg-orange-800" text={`Suy yếu ${ailments.weaken}`} />}
            </>
          }
        >
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
          badges={
            <>
              {enemy.winding > 0 && (
                <Chip icon="warn" tone="animate-pulse bg-red-600" text={`Tụ lực ${enemy.winding}/${enemy.windupNeed}: ${enemy.skill.name}`} />
              )}
              {enemy.form > 0 && <Chip icon="star" tone="bg-fuchsia-700" text={`Tiến hóa ${enemy.form}/${BALANCE.enemyEvolveXp.length}`} />}
              {enemy.elite && <Chip icon="skull" tone="bg-amber-700" text="Tinh anh" />}
              {enemy.traits.includes('armor') && <Chip icon="shield" tone="bg-sky-800" text="Giáp" />}
              {enemy.traits.includes('regen') && <Chip icon="regen" tone="bg-emerald-800" text="Hồi phục" />}
              {enemy.traits.includes('frenzy') && <Chip icon="flame" tone={enemy.enraged ? 'bg-red-700' : 'bg-stone-700'} text={enemy.enraged ? 'Cuồng nộ' : 'Cuồng nộ ở nửa máu'} />}
              {enemy.skill.effect === 'poison' && <Chip icon="skull" tone="bg-purple-800" text="Chiêu gây độc" />}
              {enemy.skill.effect === 'seal' && <Chip icon="lock" tone="bg-slate-700" text="Chiêu phong ấn" />}
              {enemy.skill.effect === 'weaken' && <Chip icon="down" tone="bg-orange-900" text="Chiêu làm yếu" />}
            </>
          }
        >
          <StatusBars hp={enemy.hp} maxHp={enemy.maxHp} rage={enemy.rage} maxRage={enemy.maxRage} shield={enemy.shield} turn={playing && battle.turn === 'enemy' ? turnInfo : null} xp={{ value: enemy.xp, next: enemy.form < BALANCE.enemyEvolveXp.length ? BALANCE.enemyEvolveXp[enemy.form] : null, prev: enemy.form > 0 ? BALANCE.enemyEvolveXp[enemy.form - 1] : 0, label: 'Tiến hóa', tone: 'from-fuchsia-500 to-pink-300' }} />
        </Fighter>
      </div>

      {relicCounts.length > 0 && (
        <div className="relative z-10 mb-1 flex flex-col items-center gap-1">
          <div className="flex flex-wrap justify-center gap-1">
            {relicCounts.map(({ id, n }) => (
              <button
                key={id}
                type="button"
                onClick={() => setRelicInfo(relicInfo === id ? null : id)}
                title={`${relicOf(id)?.name}: ${relicOf(id)?.desc}`}
                className={`rounded-full px-2 py-1 text-xs ${relicInfo === id ? 'bg-amber-500/40 ring-1 ring-amber-300' : 'bg-black/50'}`}
              >
                <Icon name={relicOf(id)?.icon ?? 'star'} size={13} className="text-yellow-200" />
                {n > 1 && <b className="ml-0.5 text-[10px] text-yellow-300">x{n}</b>}
              </button>
            ))}
          </div>
          {relicInfo && relicOf(relicInfo) && (
            <div className="rounded-lg bg-black/70 px-2 py-1 text-center text-[11px] text-amber-100">
              <b className="text-yellow-300">{relicOf(relicInfo)?.name}</b>: {relicOf(relicInfo)?.desc}
            </div>
          )}
        </div>
      )}

      <div className="relative z-10 mx-auto mb-2 flex items-center gap-2">
      <button
        onClick={onSkill}
        disabled={!ready}
        className={`rounded-full border-2 px-5 py-1.5 text-sm font-black transition ${
          ready
            ? 'animate-ready border-yellow-200 bg-gradient-to-b from-orange-400 to-red-600 text-white shadow-[0_0_16px_#fb923c]'
            : 'border-stone-600 bg-stone-700 text-stone-400'
        }`}
      >
        <ElementDot element={battle.pet.element} size={16} /> {currentForm(battle).skill.name}
      </button>
        {finalForm && (
          <button
            onClick={onMega}
            disabled={!megaReady}
            title="Mega: tốn đầy Nộ, mạnh hơn hẳn trong 4 lượt, mỗi trận một lần"
            className={`flex items-center gap-1 rounded-full border-2 px-4 py-1.5 text-sm font-black transition ${
              megaReady
                ? 'animate-ready border-pink-200 bg-gradient-to-b from-fuchsia-400 to-purple-700 text-white shadow-[0_0_16px_#e879f9]'
                : battle.mega > 0
                  ? 'border-pink-300 bg-fuchsia-900/80 text-pink-200'
                  : 'border-stone-600 bg-stone-700 text-stone-400'
            }`}
          >
            <Icon name="star" size={15} /> {battle.mega > 0 ? `MEGA ${battle.mega}` : battle.megaUsed ? 'Đã Mega' : 'MEGA'}
          </button>
        )}
      </div>

      <HelpButton onClick={onHelp} className="absolute bottom-[max(0.5rem,env(safe-area-inset-bottom))] left-[max(0.75rem,env(safe-area-inset-left))] z-20" />
      <button
        onClick={onHome}
        aria-label="Về trang chủ"
        className="absolute bottom-[max(0.5rem,env(safe-area-inset-bottom))] left-[max(3.25rem,calc(env(safe-area-inset-left)+2.5rem))] z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-amber-200 ring-1 ring-amber-200/40 active:scale-95"
      >
        <Icon name="home" size={16} />
      </button>

      <button
        onClick={onToggleMute}
        aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
        className="absolute bottom-[max(0.5rem,env(safe-area-inset-bottom))] right-[max(0.75rem,env(safe-area-inset-right))] z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-lg"
      >
        <Icon name={muted ? 'mute' : 'volume'} size={20} className="text-amber-100" />
      </button>

      {status === 'reward' && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-2 overflow-y-auto bg-black/75 p-3 text-center">
          <div className="text-2xl font-black text-yellow-300">Chọn phần thưởng</div>
          <div className="text-xs text-amber-100">{battle.picks > 1 ? `Tinh anh: được chọn ${battle.picks} lần` : 'Hồi 30% máu sau trận'}</div>
          <div className="flex w-full max-w-sm flex-col gap-1.5">
            {battle.offer.map((id) => {
              const r = relicOf(id)
              const n = battle.relics.filter((x) => x === id).length
              return (
                <button key={id} onClick={() => onReward(id)} className="flex items-center gap-3 rounded-xl border-2 border-amber-500 bg-stone-900 px-3 py-2 text-left active:scale-[0.98]">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-yellow-300">
                    <Icon name={r?.icon ?? 'heart'} size={22} />
                  </span>
                  <span>
                    <span className="block text-sm font-black text-yellow-200">
                      {r?.name ?? 'Nghỉ ngơi'}
                      {n > 0 && <span className="ml-1 text-xs text-sky-300">(đang có x{n})</span>}
                    </span>
                    <span className="block text-xs text-amber-100">{r?.desc ?? `Hồi ${Math.round(BALANCE.rewardHeal * 100)}% máu tối đa`}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {status === 'rest' && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-2 bg-black/75 p-3 text-center">
          <div className="text-2xl font-black text-emerald-300"><Icon name="camp" size={24} /> Điểm nghỉ</div>
          <div className="text-xs text-amber-100">Dừng chân nghỉ ngơi trước khi đi tiếp</div>
          <div className="flex w-full max-w-sm flex-col gap-1.5">
            <button onClick={() => onRest('heal')} className="rounded-xl border-2 border-emerald-500 bg-stone-900 px-3 py-2 text-left active:scale-[0.98]">
              <span className="block text-sm font-black text-emerald-200"><Icon name="regen" size={14} /> Hồi máu</span>
              <span className="block text-xs text-amber-100">Hồi {Math.round(BALANCE.restHeal * 100)}% máu tối đa</span>
            </button>
            <button onClick={() => onRest('xp')} className="rounded-xl border-2 border-sky-500 bg-stone-900 px-3 py-2 text-left active:scale-[0.98]">
              <span className="block text-sm font-black text-sky-200"><Icon name="star" size={14} /> Tu luyện</span>
              <span className="block text-xs text-amber-100">Nhận {BALANCE.restXp} XP, đẩy nhanh tiến hóa</span>
            </button>
          </div>
        </div>
      )}

      {status !== 'playing' && status !== 'reward' && status !== 'rest' && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-black/60 text-center">
          {status === 'stageClear' ? (
            <>
              <div className="text-3xl font-black text-yellow-300">Hạ gục {enemy.name}!</div>
              <div className="text-amber-100">Chuẩn bị chọn phần thưởng…</div>
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
              <div className="text-sm text-amber-100">{status === 'won' ? `${player.name} đã hạ gục Boss!` : `Dừng chân ở màn ${stage}/${total}`}</div>
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
