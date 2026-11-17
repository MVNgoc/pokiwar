import { FLIGHT_MS, SKILL_FX } from '../assets/fx'
import type { Cast } from '../hooks/useGame'
import FxSprite from './FxSprite'

const SIZE = 64

/** Lớp phủ hiệu ứng kỹ năng trên sàn đấu: pet ở bên trái, kẻ địch ở bên phải. */
export default function SkillFx({ cast }: { cast: Cast }) {
  const plan = SKILL_FX[cast.fxId]
  const fromEnemy = cast.side === 'enemy'
  // pet đứng bên trái, kẻ địch bên phải; kẻ địch tung chiêu thì hướng bay và mục tiêu đảo lại
  const selfSide = fromEnemy ? 'right-[22%]' : 'left-[22%]'
  const targetSide = fromEnemy ? 'left-[22%]' : 'right-[22%]'
  const selfShift = fromEnemy ? '50% 0' : '-50% 0'
  const targetShift = fromEnemy ? '-50% 0' : '50% 0'
  if (!plan) return null
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {plan.projectile && (
        <div
          className="absolute bottom-[34%]"
          style={{ translate: '-50% 0', animation: `${fromEnemy ? 'fx-fly-rev' : 'fx-fly'} ${FLIGHT_MS}ms ease-in forwards, fx-hide 1ms ${FLIGHT_MS}ms forwards` }}
        >
          <FxSprite id={plan.projectile} size={SIZE} loop />
        </div>
      )}
      {plan.onSelf?.map((e, i) => (
        <div key={`s${i}`} className={`absolute bottom-[30%] ${selfSide}`} style={{ translate: selfShift }}>
          <FxSprite id={e.id} size={SIZE * 1.5} delay={e.at} />
        </div>
      ))}
      {plan.onEnemy?.map((e, i) => (
        <div key={`e${i}`} className={`absolute ${targetSide} ${e.loop ? 'bottom-[58%]' : 'bottom-[34%]'}`} style={{ translate: targetShift }}>
          <FxSprite id={e.id} size={SIZE * (e.loop ? 1 : 1.5)} delay={e.at} loop={e.loop} />
        </div>
      ))}
    </div>
  )
}
