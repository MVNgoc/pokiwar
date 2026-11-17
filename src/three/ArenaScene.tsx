import { Suspense, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import type { BattleState, Side } from '../game/types'
import type { Cast } from '../hooks/useGame'
import { ENEMIES } from '../game/constants'
import Creature from './Creature'
import FxLayer from './Fx3D'
import { loadCharacter } from './loadCharacter'

interface Props {
  battle: BattleState
  hitFlash: Side | null
  attacker: Side | null
  cast: Cast | null
}

function Stage({ battle, hitFlash, attacker, cast }: Props) {
  const viewport = useThree((s) => s.viewport)
  // pet đứng ở 1/4 chiều rộng, kẻ địch ở 3/4, bất kể tỉ lệ khung hình
  const x = viewport.width * 0.25
  const { player, enemy, stage } = battle

  // tải sẵn model kẻ địch của màn kế tiếp
  useEffect(() => {
    const next = ENEMIES[stage % ENEMIES.length]
    if (next) void loadCharacter(next.id)
  }, [stage])

  return (
    <>
      <Creature
        key={battle.pet.id}
        id={battle.pet.id}
        position={[-x, 0, 0]}
        dir={1}
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
      camera={{ fov: 34, position: [0, 1.5, 8.2] }}
      onCreated={({ camera }) => camera.lookAt(0, 0.85, 0)}
    >
      <ambientLight intensity={1.7} />
      <directionalLight position={[3, 6, 6]} intensity={2.4} />
      <directionalLight position={[-4, 2, 3]} intensity={0.8} color="#9fc4ff" />
      <Suspense fallback={null}>
        <Stage {...props} />
      </Suspense>
    </Canvas>
  )
}
