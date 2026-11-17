import { useState } from 'react'
import Board from './components/Board'
import BattleScreen from './components/BattleScreen'
import PetSelect from './components/PetSelect'
import { BALANCE, ELEMENTS, ELEMENT_INFO } from './game/constants'
import type { Pet } from './game/types'
import { useGame } from './hooks/useGame'

function GameView({ pet, onChangePet }: { pet: Pet; onChangePet: () => void }) {
  const g = useGame(pet)
  return (
    <div className="mx-auto flex h-dvh max-w-xl flex-col bg-stone-950 text-white">
      <BattleScreen battle={g.battle} floats={g.floats} hitFlash={g.hitFlash} attacker={g.attacker} cast={g.cast} best={g.best} newBest={g.newBest} onSkill={g.useSkill} onRestart={g.restart} onChangePet={onChangePet} />
      <div className="flex flex-col items-center gap-1.5 border-t-4 border-amber-900 bg-gradient-to-b from-amber-950 to-stone-950 p-2">
        <div className="flex flex-wrap justify-center gap-x-3 text-[10px] text-amber-100/80">
          {ELEMENTS.map((e) => (
            <span key={e} className={e === pet.element ? 'font-bold text-yellow-300' : ''}>
              {ELEMENT_INFO[e].glyph} {ELEMENT_INFO[e].effect}
            </span>
          ))}
        </div>
        <div className="text-[10px] text-yellow-300">
          Ngọc {ELEMENT_INFO[pet.element].glyph} nạp +{BALANCE.ownRage} Nộ, ngọc khác +{BALANCE.otherRage}
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
