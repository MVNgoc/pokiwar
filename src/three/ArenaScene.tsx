import { Suspense, useEffect } from 'react'
import * as THREE from 'three'
import { Canvas, useThree } from '@react-three/fiber'
import type { BattleState, Side } from '../game/types'
import type { Cast } from '../hooks/useGame'
import { ENEMIES } from '../game/constants'
import { GEM_COLOR } from './gems'
import Creature from './Creature'
import { CharacterLights, Platform } from './SceneLights'
import FxLayer from './Fx3D'
import { loadCharacter } from './loadCharacter'
import Scenery from './Scenery'
import { themeOf } from './themes'

interface Props {
  battle: BattleState
  hitFlash: Side | null
  attacker: Side | null
  cast: Cast | null
}

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

function Stage({ battle, hitFlash, attacker, cast }: Props) {
  const viewport = useThree((s) => s.viewport)
  // pet đứng ở 1/4 chiều rộng, kẻ địch ở 3/4, bất kể tỉ lệ khung hình
  const x = viewport.width * 0.25
  const { player, enemy, stage } = battle

  // tải sẵn model kẻ địch của màn kế tiếp
  useEffect(() => {
    void loadCharacter(battle.pet.id, true)
  }, [battle.pet.id])
  useEffect(() => {
    const next = ENEMIES[stage % ENEMIES.length]
    if (next) void loadCharacter(next.id)
  }, [stage])

  return (
    <>
      <Scenery theme={themeOf(stage)} />
      <Platform position={[-x, 0, 0]} color={GEM_COLOR[battle.pet.element]} />
      <Platform position={[x, 0, 0]} color={GEM_COLOR[enemy.element]} />
      <Creature
        key={battle.pet.id}
        id={battle.pet.id}
        position={[-x, 0, 0]}
        dir={1}
        back
        hurt={hitFlash === 'player'}
        attacking={attacker === 'player'}
        defeated={player.hp <= 0}
        enterKey={battle.pet.id}
      />
      <Creature
        key={`${enemy.id}-${stage}`}
        id={enemy.id}
        position={[x, 0, 0]}
        dir={-1}
        hurt={hitFlash === 'enemy'}
        attacking={attacker === 'enemy'}
        defeated={enemy.hp <= 0}
        enterKey={`${enemy.id}-${stage}`}
      />
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
