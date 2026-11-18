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
  const g = useGame(pet, help)
  const [muted, setMutedState] = useState(isMuted)
  const toggleMute = () => {
    setMuted(!muted)
    setMutedState(!muted)
    syncMusicMute()
  }

  // Nhạc nền: đổi bài khi vào màn Boss, tắt dần khi ván kết thúc hoặc đổi pet
  const { status } = g.battle
  const boss = g.battle.enemy.boss
  useEffect(() => {
    if (status === 'won' || status === 'lost') stopMusic()
    else playMusic(boss ? 'boss' : 'battle')
  }, [status, boss])
  useEffect(() => () => stopMusic(), [])
  return (
    <div className="relative h-dvh overflow-hidden bg-stone-950 text-white">
      <Backdrop theme={themeOf(g.battle.stage)} />
      <div className="relative z-10 mx-auto flex h-full w-full max-w-xl flex-col bg-stone-950 lg:max-w-[1800px] lg:flex-row lg:gap-4 lg:bg-transparent lg:p-4">
      <BattleScreen battle={g.battle} floats={g.floats} busy={g.busy} hitFlash={g.hitFlash} shaking={g.shaking} attacker={g.attacker} cast={g.cast} best={g.best} newBest={g.newBest} onSkill={g.useSkill} onRestart={g.restart} onChangePet={onChangePet} onHelp={() => setHelp(true)} muted={muted} onToggleMute={toggleMute} />
      <div className="flex flex-col items-center justify-center gap-1.5 border-t-4 border-amber-900 bg-gradient-to-b from-amber-950 to-stone-950 p-2 lg:self-center lg:rounded-3xl lg:border-4 lg:p-5 lg:shadow-2xl">
        <Board board={g.board} clearing={g.clearing} locked={g.busy || g.battle.status !== 'playing' || g.battle.turn !== 'player'} notice={g.notice} hint={g.enemyPick} blink={g.hintMove} dim={g.battle.status === 'playing' && g.battle.turn === 'enemy'} onSwap={g.trySwap} />
      </div>
      </div>
      {help && <HelpPanel inBattle onClose={() => setHelp(false)} />}
    </div>
  )
}

export default function App() {
  const [pet, setPet] = useState<Pet | null>(null)
  return pet ? <GameView key={pet.id} pet={pet} onChangePet={() => setPet(null)} /> : <PetSelect onPick={setPet} />
}
