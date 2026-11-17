import { ELEMENT_INFO } from '../game/constants'
import { PETS } from '../game/pets'
import type { Pet } from '../game/types'

export default function PetSelect({ onPick }: { onPick: (pet: Pet) => void }) {
  return (
    <div className="mx-auto flex h-dvh max-w-xl flex-col gap-3 overflow-y-auto bg-gradient-to-b from-emerald-950 to-stone-950 p-4 text-white">
      <h1 className="text-center text-2xl font-black text-amber-300">Linh Thú Xếp Ngọc</h1>
      <p className="text-center text-sm text-amber-100/80">Chọn pet đồng hành của bạn</p>
      {PETS.map((pet) => {
        const el = ELEMENT_INFO[pet.element]
        return (
          <button
            key={pet.id}
            onClick={() => onPick(pet)}
            className="flex items-center gap-3 rounded-xl border-2 border-amber-900 bg-stone-900/80 p-3 text-left transition hover:border-amber-400 active:scale-[.98]"
          >
            <span className="text-5xl">{pet.emoji}</span>
            <span className="flex-1">
              <span className="flex items-center gap-2 font-bold">
                {pet.name}
                <span className={`rounded bg-gradient-to-br ${el.gradient} px-1.5 text-xs`}>{el.glyph} {el.label}</span>
                <span className="text-xs font-normal text-red-300">HP {pet.maxHp}</span>
              </span>
              <span className="block text-xs text-amber-100/70">{pet.desc}</span>
              <span className="block text-xs text-yellow-300">
                {pet.skill.emoji} {pet.skill.name}: {pet.skill.desc}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
