import { memo, useEffect, useState } from 'react'
import { GEM_IMAGES } from '../assets/gems'
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
      className="absolute transition-[top,left] duration-300 ease-in"
      style={{ width: `${100 / size}%`, height: `${100 / size}%`, top: `${(shownRow * 100) / size}%`, left: `${(col * 100) / size}%` }}
    >
      <div
        className={`absolute inset-[7%] select-none transition-all duration-200
        ${tile.special ? 'animate-pulse drop-shadow-[0_0_5px_#fff]' : 'drop-shadow-[0_2px_2px_rgba(0,0,0,.55)]'}
        ${clearing ? 'scale-0 rotate-45 opacity-0' : ''} ${selected ? 'scale-110 drop-shadow-[0_0_8px_#fde047]' : ''}`}
      >
        <img src={GEM_IMAGES[tile.type]} alt={info.label} draggable={false} className="pointer-events-none h-full w-full object-contain" />
        {tile.special && (
          <span className="absolute right-[2%] top-[0%] text-[clamp(8px,2.6vmin,16px)] leading-none">
            {tile.special === 'bomb' ? '💣' : '⚡'}
          </span>
        )}
      </div>
    </div>
  )
}

export default memo(TileView)
