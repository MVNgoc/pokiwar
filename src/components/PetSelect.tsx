import { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import Backdrop from './Backdrop'
import ElementDot from './ElementDot'
import HelpPanel, { HelpButton } from './HelpPanel'
import { GENERATIONS, PETS } from '../game/pets'
import type { Pet } from '../game/types'
import Creature from '../three/Creature'
import { CharacterLights, Platform } from '../three/SceneLights'
import { GEM_COLOR } from '../three/gems'
import { loadCharacter } from '../three/loadCharacter'
import { bgUrl, THEMES } from '../three/themes'

export default function PetSelect({ onPick }: { onPick: (pet: Pet) => void }) {
  const [sel, setSel] = useState<Pet>(PETS[0])
  const [help, setHelp] = useState(false)
  const gen = sel.gen
  const inGen = PETS.filter((p) => p.gen === gen)
  useEffect(() => {
    inGen.forEach((p) => void loadCharacter(p.id)) // tải sẵn 3 pet của thế hệ này để đổi pet không bị khựng
  }, [gen]) // eslint-disable-line react-hooks/exhaustive-deps
  // đổi thế hệ: giữ nguyên hệ đang chọn (Mộc / Hỏa / Thủy) nếu có
  const pickGen = (g: number) => setSel(PETS.find((p) => p.gen === g && p.element === sel.element) ?? PETS.find((p) => p.gen === g)!)
  return (
    <div className="relative h-dvh overflow-hidden text-white">
    <Backdrop theme={THEMES[0]} />
    <div className="relative z-10 mx-auto flex h-full max-w-xl flex-col gap-2 p-3 lg:max-w-6xl lg:p-8">
      <div className="relative">
        <h1 className="text-center text-2xl font-black text-amber-300 [text-shadow:0_3px_6px_rgba(0,0,0,.55)] lg:text-4xl">Ngọc Linh Đại Chiến</h1>
        <HelpButton onClick={() => setHelp(true)} className="absolute right-0 top-1/2 -translate-y-1/2" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 lg:flex-row lg:gap-6">
      <div style={{ backgroundImage: `url(${bgUrl(THEMES[0])})` }} className="relative h-[34dvh] min-h-[190px] shrink-0 overflow-hidden rounded-xl border-2 border-amber-900 bg-cover bg-bottom shadow-xl lg:h-auto lg:min-h-0 lg:w-[min(56vw,700px)] lg:flex-none lg:aspect-[5/4] lg:self-center lg:rounded-3xl lg:border-4">
        <Canvas className="!absolute inset-0" dpr={[1, 1.5]} flat gl={{ alpha: true, antialias: true }} camera={{ fov: 32, position: [0, 1.5, 8.6] }} onCreated={({ camera }) => camera.lookAt(0, 0.95, 0)}>
          <CharacterLights />
          <Platform position={[0, 0, 0]} color={GEM_COLOR[sel.element]} />
          <Suspense fallback={null}>
            <Creature key={sel.id} id={sel.id} position={[0, 0, 0]} dir={1} spin enterKey={sel.id} />
          </Suspense>
        </Canvas>
        <div className="absolute inset-x-0 bottom-1 text-center text-sm font-black text-white [text-shadow:0_2px_3px_#000] lg:bottom-3 lg:text-xl">{sel.name}</div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 lg:w-[440px] lg:flex-none">
      <div className="flex shrink-0 justify-center gap-1.5">
        {GENERATIONS.map((g) => (
          <button
            key={g}
            onClick={() => pickGen(g)}
            className={`rounded-full px-3 py-1 text-xs font-black transition active:scale-95 ${g === gen ? 'bg-amber-400 text-black' : 'bg-stone-800 text-amber-100/80'}`}
          >
            Thế hệ {g}
          </button>
        ))}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
        {inGen.map((pet) => {
          const on = pet.id === sel.id
          return (
            <button
              key={pet.id}
              onClick={() => setSel(pet)}
              className={`flex items-center gap-3 rounded-xl border-2 p-2 text-left transition active:scale-[.98] ${
                on ? 'border-amber-400 bg-amber-950/85' : 'border-amber-900/60 bg-stone-900/85'
              }`}
            >
              <ElementDot element={pet.element} size={34} />
              <span className="flex-1">
                <span className="flex items-center gap-2 text-sm font-bold">
                  {pet.name}
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

      <button onClick={() => onPick(sel)} className="shrink-0 rounded-xl bg-gradient-to-b from-amber-400 to-orange-600 py-3 text-lg font-black text-black shadow-lg active:scale-[.98] lg:py-4 lg:text-xl">
        Chơi với {sel.name}
      </button>
      </div>
      </div>
      {help && <HelpPanel onClose={() => setHelp(false)} />}
    </div>
    </div>
  )
}
