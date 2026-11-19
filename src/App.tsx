import { useEffect, useState } from 'react'
import Board from './components/Board'
import BattleScreen from './components/BattleScreen'
import PetSelect from './components/PetSelect'
import Backdrop from './components/Backdrop'
import HelpPanel from './components/HelpPanel'
import { themeOf } from './three/themes'
import type { Pet } from './game/types'
import { playMusic, stopMusic, syncMusicMute } from './game/music'
import { isMuted, setMuted } from './game/sfx'
import { useGame } from './hooks/useGame'

function GameView({ pet, onChangePet }: { pet: Pet; onChangePet: () => void }) {
  const [help, setHelp] = useState(false)
  const [leave, setLeave] = useState(false)
  const g = useGame(pet, help || leave)
  const [muted, setMutedState] = useState(isMuted)
  const toggleMute = () => {
    setMuted(!muted)
    setMutedState(!muted)
    syncMusicMute()
  }

  // Nhạc nền: đổi bài khi vào màn Boss, tắt dần khi ván kết thúc hoặc đổi pet
  const { status } = g.battle
  const boss = g.battle.enemy.boss && g.battle.status !== 'rest' && g.battle.status !== 'reward'
  useEffect(() => {
    if (status === 'won' || status === 'lost') stopMusic()
    else playMusic(boss ? 'boss' : 'battle')
  }, [status, boss])
  useEffect(() => () => stopMusic(), [])
  return (
    <div className="relative h-dvh overflow-hidden bg-stone-950 text-white">
      <Backdrop theme={themeOf(g.battle.stage)} />
      <div className="relative z-10 mx-auto flex h-full w-full max-w-xl flex-col bg-stone-950 lg:max-w-[1800px] lg:flex-row lg:gap-4 lg:bg-transparent lg:p-4">
      <BattleScreen battle={g.battle} floats={g.floats} busy={g.busy} hitFlash={g.hitFlash} shaking={g.shaking} attacker={g.attacker} cast={g.cast} megaFx={g.megaFx} best={g.best} newBest={g.newBest} onSkill={g.useSkill} onMega={g.doMega} onReward={g.chooseReward} onRest={g.chooseRest} onRestart={g.restart} onChangePet={onChangePet} onHelp={() => setHelp(true)} onHome={() => (g.battle.status === 'won' || g.battle.status === 'lost' ? onChangePet() : setLeave(true))} muted={muted} onToggleMute={toggleMute} />
      <div className="flex flex-col items-center justify-center gap-1.5 border-t-4 border-amber-900 bg-gradient-to-b from-amber-950 to-stone-950 p-2 lg:self-center lg:rounded-3xl lg:border-4 lg:p-5 lg:shadow-2xl">
        <Board board={g.board} clearing={g.clearing} locked={g.busy || g.battle.status !== 'playing' || g.battle.turn !== 'player'} notice={g.notice} hint={g.enemyPick} blink={g.hintMove} dim={g.battle.status === 'playing' && g.battle.turn === 'enemy'} onSwap={g.trySwap} />
      </div>
      </div>
      {help && <HelpPanel inBattle onClose={() => setHelp(false)} />}
      {leave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3" onClick={() => setLeave(false)}>
          <div className="w-full max-w-xs rounded-2xl border-2 border-amber-700 bg-stone-950 p-4 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-lg font-black text-amber-300">Về trang chủ?</div>
            <div className="mt-1 text-sm text-amber-100">Chuyến đi hiện tại sẽ bị bỏ và không được tính điểm.</div>
            <div className="mt-3 flex justify-center gap-2">
              <button onClick={() => setLeave(false)} className="rounded-lg bg-stone-200 px-4 py-2 font-bold text-black">
                Ở lại
              </button>
              <button onClick={onChangePet} className="rounded-lg bg-red-500 px-4 py-2 font-bold text-white">
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [pet, setPet] = useState<Pet | null>(null)
  return pet ? <GameView key={pet.id} pet={pet} onChangePet={() => setPet(null)} /> : <PetSelect onPick={setPet} />
}
