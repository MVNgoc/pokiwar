import { Suspense, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useThree } from '@react-three/fiber'
import { megaSpriteId } from '../game/pets'
import type { BattleState, Side } from '../game/types'
import type { Cast } from '../hooks/useGame'
import { GEM_COLOR } from './gems'
import Creature from './Creature'
import { CharacterLights, Platform } from './SceneLights'
import FxLayer, { EVOLVE_TIMING, MegaEvolveFx } from './Fx3D'
import { loadCharacter } from './loadCharacter'
import Scenery from './Scenery'
import { themeOf } from './themes'

interface Props {
  battle: BattleState
  hitFlash: Side | null
  attacker: Side | null
  cast: Cast | null
  /** đang phát hoạt ảnh tiến hóa Mega (id lượt) */
  megaFx?: number | null
}

/** khoảng cách mỗi bên so với tâm, theo tỉ lệ chiều rộng khung (HUD ở BattleScreen căn theo cùng số này) */
const SPREAD = 0.36
const FOV = 34
const CAM_DIST = 8.2
/** Chiều rộng cảnh tối thiểu hiển thị tại mặt phẳng nhân vật (đơn vị thế giới) */
const MIN_WIDTH = 7.4
/** Khoảng cách (px) từ chân bục tới đáy khung: giữ nhân vật đứng ngay trên thanh máu dù khung cao hay thấp. */
const FEET_FROM_BOTTOM = 118

/** Đặt camera sao cho chân nhân vật luôn cách đáy khung một đoạn cố định; khung càng cao thì càng lộ nhiều ngoại cảnh phía trên. */
function CameraRig() {
  const size = useThree((s) => s.size)
  const camera = useThree((s) => s.camera)
  useEffect(() => {
    const tan = Math.tan(THREE.MathUtils.degToRad(FOV / 2))
    // khung hẹp (cao hơn rộng): lùi camera ra để hai bục luôn đủ chỗ đứng cạnh nhau
    const dist = Math.max(CAM_DIST, MIN_WIDTH / (2 * tan * (size.width / size.height)))
    const h = tan * dist
    const look = h - (2 * h * FEET_FROM_BOTTOM) / size.height
    camera.position.set(0, look + 0.65, dist)
    camera.lookAt(0, look, 0)
  }, [size.width, size.height, camera])
  return null
}

/**
 * Tiến hóa thường: khi `form` tăng, hình cũ gồng năng lượng, đến đỉnh sáng (EVOLVE_TIMING.evo.peak) mới đổi sang hình mới.
 * Trả về hình đang hiển thị, id lượt phát hoạt ảnh (null = không phát) và cờ đang gồng.
 */
function useEvolveReveal(form: number, id: string) {
  const [shown, setShown] = useState({ form, id })
  const [fx, setFx] = useState<number | null>(null)
  const counter = useRef(0)
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    if (form > shown.form) {
      setFx(++counter.current)
      timers.push(setTimeout(() => setShown({ form, id }), EVOLVE_TIMING.evo.peak * 1000))
      timers.push(setTimeout(() => setFx(null), EVOLVE_TIMING.evo.end * 1000))
    } else {
      setShown({ form, id })
      setFx(null)
    }
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, id])
  return { shown, fx, charging: fx != null && shown.form < form }
}

function Stage({ battle, hitFlash, attacker, cast, megaFx }: Props) {
  const viewport = useThree((s) => s.viewport)
  // hai bên đứng cách tâm 32% chiều rộng (pet ở 14%, kẻ địch ở 86%), bất kể tỉ lệ khung hình
  const x = viewport.width * SPREAD
  const { player, enemy, stage } = battle
  const petEvo = useEvolveReveal(battle.form, battle.pet.forms[battle.form].id)
  const foeEvo = useEvolveReveal(enemy.form, enemy.id)
  // đang Mega: đổi sang hình Mega nếu có
  const megaId = battle.mega > 0 ? megaSpriteId(battle.pet.forms[battle.form].id) : null
  // đổi hình Mega (vào hoặc ra) diễn ra tại chỗ, không phát hoạt ảnh rơi xuống
  const hadMega = useRef(false)
  const megaToggled = (megaId != null) !== hadMega.current
  useEffect(() => {
    hadMega.current = megaId != null
  }, [megaId])

  // tải sẵn model kẻ địch của màn kế tiếp
  useEffect(() => {
    const next = battle.run.slice(stage).find((n) => n.enemy)?.enemy
    if (next) void loadCharacter(next)
  }, [stage, battle.run])
  // tải sẵn hình Mega của pet (nếu có) để đổi hình không bị khựng
  useEffect(() => {
    const m = megaSpriteId(battle.pet.forms[battle.pet.forms.length - 1].id)
    if (m) void loadCharacter(m, true)
  }, [battle.pet])
  // tải sẵn hình các dạng tiến hóa của kẻ địch đang đấu
  useEffect(() => {
    for (const id of enemy.evoIds) void loadCharacter(id)
  }, [enemy.evoIds])

  return (
    <>
      <Scenery theme={themeOf(stage)} />
      <Platform position={[-x, 0, 0]} color={GEM_COLOR[battle.pet.element]} element={battle.pet.element} />
      <Platform position={[x, 0, 0]} color={GEM_COLOR[enemy.element]} element={enemy.element} />
      <Creature
        key={`${battle.pet.id}-${petEvo.shown.form}-${megaId ? 'mega' : ''}`}
        id={megaId ?? petEvo.shown.id}
        position={[-x, 0, 0]}
        dir={1}
        hurt={hitFlash === 'player'}
        attacking={attacker === 'player'}
        defeated={player.hp <= 0}
        enterKey={`${battle.pet.id}-${petEvo.shown.form}-${megaId ? 'mega' : ''}`}
        evolved={petEvo.shown.form > 0}
        mega={battle.mega > 0}
        megaSprite={!!megaId}
        charging={(megaFx != null && battle.mega === 0) || petEvo.charging}
        skipEnter={megaToggled || petEvo.fx != null}
      />
      <Creature
        key={`${foeEvo.shown.id}-${stage}-${foeEvo.shown.form}`}
        id={foeEvo.shown.id}
        position={[x, 0, 0]}
        dir={-1}
        hurt={hitFlash === 'enemy'}
        attacking={attacker === 'enemy'}
        defeated={enemy.hp <= 0}
        enterKey={`${foeEvo.shown.id}-${stage}-${foeEvo.shown.form}`}
        evolved={foeEvo.shown.form > 0}
        charging={foeEvo.charging}
        skipEnter={foeEvo.fx != null}
      />
      {petEvo.fx != null && <MegaEvolveFx key={`p${petEvo.fx}`} x={-x} variant="evo" />}
      {foeEvo.fx != null && <MegaEvolveFx key={`e${foeEvo.fx}`} x={x} variant="evo" />}
      {megaFx != null && <MegaEvolveFx key={megaFx} x={-x} />}
      {cast && <FxLayer key={cast.id} cast={cast} playerX={-x} enemyX={x} />}
    </>
  )
}

/** Sàn đấu 3D phía trên: pet bên trái, kẻ địch bên phải, hiệu ứng kỹ năng bay giữa hai bên. */
export default function ArenaScene(props: Props) {
  return (
    <Canvas
      className="!pointer-events-none"
      style={{ position: 'absolute', inset: 0 }}
      dpr={[1, 1.5]}
      flat
      gl={{ alpha: true, antialias: true }}
      camera={{ fov: FOV, position: [0, 1.5, CAM_DIST] }}
    >
      <CameraRig />
      <CharacterLights />
      <Suspense fallback={null}>
        <Stage {...props} />
      </Suspense>
    </Canvas>
  )
}
