import { useEffect, useState } from 'react'
import Board from './components/Board'
import BattleScreen from './components/BattleScreen'
import PetSelect from './components/PetSelect'
import { GEM_IMAGES } from './assets/gems'
import { BALANCE, ELEMENTS, ELEMENT_INFO } from './game/constants'
import type { Pet } from './game/types'
import { playMusic, stopMusic, syncMusicMute } from './game/music'
import { isMuted, setMuted } from './game/sfx'
import { useGame } from './hooks/useGame'

function GameView({ pet, onChangePet }: { pet: Pet; onChangePet: () => void }) {
  const g = useGame(pet)
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
    <div className="mx-auto flex h-dvh max-w-xl flex-col bg-stone-950 text-white">
      <BattleScreen battle={g.battle} floats={g.floats} hitFlash={g.hitFlash} attacker={g.attacker} cast={g.cast} best={g.best} newBest={g.newBest} onSkill={g.useSkill} onRestart={g.restart} onChangePet={onChangePet} muted={muted} onToggleMute={toggleMute} />
      <div className="flex flex-col items-center gap-1.5 border-t-4 border-amber-900 bg-gradient-to-b from-amber-950 to-stone-950 p-2">
        <div className="flex flex-wrap justify-center gap-x-3 text-[10px] text-amber-100/80">
          {ELEMENTS.map((e) => (
            <span key={e} className={e === pet.element ? 'font-bold text-yellow-300' : ''}>
              <img src={GEM_IMAGES[e]} alt={ELEMENT_INFO[e].label} className="mr-0.5 inline h-3.5 w-3.5 align-text-bottom" />
              {ELEMENT_INFO[e].label}: {ELEMENT_INFO[e].effect}
            </span>
          ))}
        </div>
        <div className="text-[10px] text-amber-100/80">Match 4 hoặc chữ L/T → 💣 nổ 3x3 · Match 5 → ⚡ quét cả hàng và cột</div>
        <div className="text-[10px] text-yellow-300">
          Ngọc <img src={GEM_IMAGES[pet.element]} alt={ELEMENT_INFO[pet.element].label} className="inline h-3.5 w-3.5 align-text-bottom" /> nạp +{BALANCE.ownRage} Nộ, ngọc khác +{BALANCE.otherRage}
        </div>
        <Board board={g.board} clearing={g.clearing} locked={g.busy || g.battle.status !== 'playing'} notice={g.notice} onSwap={g.trySwap} />
      </div>
    </div>
  )
}

export default function App() {
  const [pet, setPet] = useState<Pet | null>(null)
  return pet ? <GameView key={pet.id} pet={pet} onChangePet={() => setPet(null)} /> : <PetSelect onPick={setPet} />
}
