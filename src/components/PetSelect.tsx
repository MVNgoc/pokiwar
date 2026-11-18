import { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import ElementDot from './ElementDot'
import HelpPanel, { HelpButton } from './HelpPanel'
import { ELEMENT_INFO } from '../game/constants'
import { PETS } from '../game/pets'
import type { Pet } from '../game/types'
import Creature from '../three/Creature'
import { CharacterLights, Platform } from '../three/SceneLights'
import { GEM_COLOR } from '../three/gems'
import { loadCharacter } from '../three/loadCharacter'

export default function PetSelect({ onPick }: { onPick: (pet: Pet) => void }) {
  const [sel, setSel] = useState<Pet>(PETS[0])
  const [help, setHelp] = useState(false)
  useEffect(() => {
    PETS.forEach((p) => void loadCharacter(p.id)) // tải sẵn để đổi pet không bị khựng
  }, [])
  return (
    <div className="mx-auto flex h-dvh max-w-xl flex-col gap-2 overflow-hidden bg-gradient-to-b from-emerald-950 to-stone-950 p-3 text-white">
      <div className="relative">
        <h1 className="text-center text-2xl font-black text-amber-300">Linh Thú Xếp Ngọc</h1>
        <HelpButton onClick={() => setHelp(true)} className="absolute right-0 top-1/2 -translate-y-1/2" />
      </div>

      <div className="relative h-[34dvh] min-h-[190px] shrink-0 overflow-hidden rounded-xl border-2 border-amber-900 bg-gradient-to-b from-sky-900 to-emerald-900">
        <Canvas className="!absolute inset-0" dpr={[1, 1.5]} flat gl={{ alpha: true, antialias: true }} camera={{ fov: 32, position: [0, 1.25, 5.2] }} onCreated={({ camera }) => camera.lookAt(0, 0.9, 0)}>
          <CharacterLights />
          <Platform position={[0, 0, 0]} color={GEM_COLOR[sel.element]} />
          <Suspense fallback={null}>
            <Creature key={sel.id} id={sel.id} position={[0, 0, 0]} dir={1} spin enterKey={sel.id} />
          </Suspense>
        </Canvas>
        <div className="absolute inset-x-0 bottom-1 text-center text-sm font-black text-white [text-shadow:0_2px_3px_#000]">{sel.name}</div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
        {PETS.map((pet) => {
          const el = ELEMENT_INFO[pet.element]
          const on = pet.id === sel.id
          return (
            <button
              key={pet.id}
              onClick={() => setSel(pet)}
              className={`flex items-center gap-3 rounded-xl border-2 p-2 text-left transition active:scale-[.98] ${
                on ? 'border-amber-400 bg-amber-950/60' : 'border-amber-900/60 bg-stone-900/80'
              }`}
            >
              <ElementDot element={pet.element} size={34} />
              <span className="flex-1">
                <span className="flex items-center gap-2 text-sm font-bold">
                  {pet.name}
                  <span className={`rounded bg-gradient-to-br ${el.gradient} px-1.5 text-xs`}>
                    {el.glyph} {el.label}
                  </span>
                  <span className="text-xs font-normal text-red-300">HP {pet.maxHp}</span>
                </span>
                <span className="block text-[11px] text-amber-100/70">{pet.desc}</span>
                <span className="block text-[11px] text-yellow-300">
                  {pet.skill.emoji} {pet.skill.name}: {pet.skill.desc}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <button onClick={() => onPick(sel)} className="shrink-0 rounded-xl bg-gradient-to-b from-amber-400 to-orange-600 py-3 text-lg font-black text-black shadow-lg active:scale-[.98]">
        Chơi với {sel.name}
      </button>
      {help && <HelpPanel onClose={() => setHelp(false)} />}
    </div>
  )
}
