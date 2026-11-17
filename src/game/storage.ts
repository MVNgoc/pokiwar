/** Lưu kỷ lục theo từng pet vào localStorage. Mọi thao tác đều an toàn khi storage bị chặn. */
export interface PetRecord {
  bestScore: number
  wins: number
}

const KEY = 'linh-thu-xep-ngoc:records'
const EMPTY: PetRecord = { bestScore: 0, wins: 0 }

type Store = Pick<Storage, 'getItem' | 'setItem'>

const defaultStore = (): Store | null => {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

function readAll(store: Store | null): { [petId: string]: PetRecord } {
  try {
    return JSON.parse(store?.getItem(KEY) ?? '{}') ?? {}
  } catch {
    return {}
  }
}

export function loadRecord(petId: string, store: Store | null = defaultStore()): PetRecord {
  return { ...EMPTY, ...readAll(store)[petId] }
}

/** Ghi kết quả ván vừa kết thúc. Trả về kỷ lục mới và cờ `isNewBest`. */
export function saveResult(petId: string, score: number, won: boolean, store: Store | null = defaultStore()) {
  const all = readAll(store)
  const prev = { ...EMPTY, ...all[petId] }
  const isNewBest = score > prev.bestScore
  const record: PetRecord = { bestScore: Math.max(prev.bestScore, score), wins: prev.wins + (won ? 1 : 0) }
  try {
    store?.setItem(KEY, JSON.stringify({ ...all, [petId]: record }))
  } catch {
    /* bỏ qua: chế độ riêng tư hoặc hết dung lượng */
  }
  return { record, isNewBest }
}
