import { memo, useEffect, useState } from 'react'
import { ELEMENT_INFO } from '../game/constants'
import type { Tile as TileData } from '../game/types'

interface Props {
  tile: TileData
  row: number
  col: number
  size: number
  selected: boolean
  clearing: boolean
}

function TileView({ tile, row, col, size, selected, clearing }: Props) {
  const info = ELEMENT_INFO[tile.type]
  // Ngọc mới sinh bắt đầu ở phía trên bàn cờ rồi rơi xuống vị trí thật (CSS transition).
  const [landed, setLanded] = useState(tile.spawnRow === undefined)
  useEffect(() => {
    if (landed) return
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setLanded(true)))
    return () => cancelAnimationFrame(id)
  }, [landed])
  const shownRow = landed ? row : (tile.spawnRow ?? row)

  return (
    <div
      className="absolute p-[3%] transition-[top,left] duration-300 ease-in"
      style={{ width: `${100 / size}%`, height: `${100 / size}%`, top: `${(shownRow * 100) / size}%`, left: `${(col * 100) / size}%` }}
    >
      <div
        className={`relative flex h-full w-full select-none items-center justify-center rounded-xl bg-gradient-to-br ${info.gradient}
        text-[clamp(14px,4.5vmin,30px)] font-black text-white shadow-[inset_0_-3px_0_rgba(0,0,0,.3),0_2px_3px_rgba(0,0,0,.5)]
        transition-all duration-200 ${tile.special ? 'animate-pulse ring-2 ring-white/90' : ''} ${clearing ? 'scale-0 opacity-0 rotate-45' : ''} ${selected ? 'scale-110 ring-4 ring-yellow-300' : ''}`}
        style={{ textShadow: '0 1px 2px rgba(0,0,0,.6)' }}
      >
        {info.glyph}
        {tile.special && (
          <span className="absolute right-[6%] top-[2%] text-[clamp(8px,2.6vmin,16px)] leading-none">
            {tile.special === 'bomb' ? '💣' : '⚡'}
          </span>
        )}
      </div>
    </div>
  )
}

export default memo(TileView)
