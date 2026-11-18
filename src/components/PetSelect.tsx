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

/** Ảnh nhỏ của pokemon (ảnh tĩnh cá nhân); thiếu ảnh thì hiện emoji */
function PetThumb({ pet }: { pet: Pet }) {
  const [ok, setOk] = useState(true)
  if (!ok) return <span className="flex h-full w-full items-center justify-center text-4xl">{pet.emoji}</span>
  return <img src={`${import.meta.env.BASE_URL}local-assets/${pet.id}.png`} alt={pet.name} onError={() => setOk(false)} className="h-full w-full object-contain" draggable={false} />
}

interface Stat {
  label: string
  /** 0..1 */
  pct: number
  text: string
  color: string
}

/** Các chỉ số hiển thị (suy ra từ máu và kỹ năng); thang đo chung để so sánh được giữa các hệ. */
function statsOf(pet: Pet): Stat[] {
  const sk = pet.skill
  const dmg = (sk.damage ?? 0) * (sk.hits ?? 1)
  return [
    { label: 'Máu', pct: pet.maxHp / 170, text: `${pet.maxHp}`, color: 'bg-red-500' },
    { label: 'Sức mạnh ngọc', pct: (pet.power - 0.7) / 0.5, text: `x${pet.power.toFixed(2)}`, color: 'bg-amber-400' },
    { label: 'Tốc độ nạp Nộ', pct: (pet.rageMul - 0.7) / 0.6, text: `x${pet.rageMul.toFixed(2)}`, color: 'bg-yellow-300' },
    { label: 'Sát thương chiêu', pct: dmg / 85, text: `${dmg}`, color: 'bg-orange-500' },
    { label: 'Hồi máu', pct: (sk.healPct ?? 0) / 0.5, text: sk.healPct ? `${Math.round(sk.healPct * 100)}%` : '–', color: 'bg-emerald-500' },
    { label: 'Giáp', pct: (sk.shield ?? 0) / 40, text: sk.shield ? `+${sk.shield}` : '–', color: 'bg-sky-500' },
    { label: 'Khống chế', pct: sk.stun ? 1 : 0, text: sk.stun ? '1 lượt' : '–', color: 'bg-fuchsia-500' },
  ]
}

function StatBar({ label, pct, text, color }: Stat) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-28 shrink-0 text-amber-100/80">{label}</span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-black/50">
        <div className={`h-full rounded-full ${color} [transition:width_300ms_ease-out]`} style={{ width: `${Math.min(100, Math.max(0, pct * 100))}%` }} />
      </div>
      <span className="w-20 shrink-0 text-right font-bold">{text}</span>
    </div>
  )
}

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
    <div className="relative z-10 mx-auto flex h-full max-w-xl flex-col gap-2 p-3 lg:max-w-6xl lg:gap-10 lg:p-8">
      <div className="relative">
        <h1 className="text-center text-2xl font-black text-amber-300 [text-shadow:0_3px_6px_rgba(0,0,0,.55)] lg:text-4xl">PokéGem</h1>
        <HelpButton onClick={() => setHelp(true)} className="absolute right-0 top-1/2 -translate-y-1/2" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 lg:h-[min(72dvh,640px)] lg:flex-none lg:flex-row lg:gap-6">
      <div style={{ backgroundImage: `url(${bgUrl(THEMES[0])})` }} className="relative h-[34dvh] min-h-[190px] shrink-0 overflow-hidden rounded-xl border-2 border-amber-900 bg-cover bg-bottom shadow-xl lg:h-auto lg:min-h-0 lg:flex-1 lg:rounded-3xl lg:border-4">
        <Canvas className="!absolute inset-0" dpr={[1, 1.5]} flat gl={{ alpha: true, antialias: true }} camera={{ fov: 32, position: [0, 1.5, 8.6] }} onCreated={({ camera }) => camera.lookAt(0, 0.95, 0)}>
          <CharacterLights />
          <Suspense fallback={null}>
            <Platform position={[0, 0, 0]} color={GEM_COLOR[sel.element]} element={sel.element} />
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

      {/* chọn pokemon: ảnh nhỏ làm nút */}
      <div className="flex shrink-0 justify-center gap-3">
        {inGen.map((pet) => (
          <button
            key={pet.id}
            onClick={() => setSel(pet)}
            aria-label={pet.name}
            title={pet.name}
            className={`relative h-24 w-24 overflow-hidden rounded-2xl border-4 bg-stone-900/80 p-1 transition active:scale-95 ${pet.id === sel.id ? 'border-amber-400 shadow-[0_0_18px_#fbbf24aa]' : 'border-stone-700 opacity-80 hover:opacity-100'}`}
          >
            <PetThumb pet={pet} />
            <span className="absolute bottom-1 right-1"><ElementDot element={pet.element} size={20} /></span>
          </button>
        ))}
      </div>

      {/* thông tin và chỉ số của pokemon đang chọn */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-2xl border-2 border-amber-900/60 bg-stone-900/85 p-4">
        <div className="flex items-center gap-2 text-xl font-black">
          <ElementDot element={sel.element} size={28} />
          {sel.name}
        </div>
        <div className="text-xs text-amber-100/70">{sel.desc}</div>
        <div className="space-y-2">
          {statsOf(sel).map((st) => (
            <StatBar key={st.label} {...st} />
          ))}
        </div>
        <div className="mt-auto rounded-xl bg-black/30 p-2 text-xs text-yellow-300">
          <div className="flex items-center gap-1.5 font-bold">
            <ElementDot element={sel.element} size={16} /> {sel.skill.name}
          </div>
          <div className="text-yellow-100/80">{sel.skill.desc}</div>
        </div>
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
