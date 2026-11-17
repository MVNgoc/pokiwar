import { memo, useEffect, useRef, useState, type CSSProperties } from 'react'
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

/** Rơi tăng tốc rồi nảy nhẹ khi chạm đáy */
const FALL_EASE = 'cubic-bezier(.5, 0, .75, 1.35)'
/** Hoán đổi: bật nhanh, hơi vượt qua rồi vào vị trí (lò xo) */
const SWAP_EASE = 'cubic-bezier(.25, .9, .35, 1.25)'
const SPARKS = [0, 60, 120, 180, 240, 300]

function TileView({ tile, row, col, size, selected, clearing }: Props) {
  const info = ELEMENT_INFO[tile.type]
  // Ngọc mới sinh bắt đầu ở phía trên bàn cờ rồi rơi xuống vị trí thật.
  const [landed, setLanded] = useState(tile.spawnRow === undefined)
  useEffect(() => {
    if (landed) return
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setLanded(true)))
    return () => cancelAnimationFrame(id)
  }, [landed])
  const shownRow = landed ? row : (tile.spawnRow ?? row)

  // Thời gian và kiểu chuyển động phụ thuộc quãng đường: rơi càng xa càng lâu (không còn "trượt đều")
  const prev = useRef({ row: shownRow, col })
  const lastMove = useRef({ falling: false })
  const dr = shownRow - prev.current.row
  const dc = col - prev.current.col
  const dist = Math.abs(dr) + Math.abs(dc)
  const falling = dc === 0 && dr > 0
  const ms = dist <= 1 ? 170 : Math.round(150 + 70 * Math.sqrt(dist))
  const ease = falling ? FALL_EASE : SWAP_EASE
  useEffect(() => {
    if (dist > 0) lastMove.current = { falling }
    prev.current = { row: shownRow, col }
  })

  // Bóp méo khi tiếp đất (squash & stretch)
  const [landKey, setLandKey] = useState(0)

  const inner = clearing ? 'animate-gem-pop' : selected ? 'animate-gem-select' : tile.special ? 'animate-gem-special' : ''

  return (
    <div
      className="absolute"
      style={{
        width: `${100 / size}%`,
        height: `${100 / size}%`,
        top: `${(shownRow * 100) / size}%`,
        left: `${(col * 100) / size}%`,
        transition: `top ${ms}ms ${ease}, left ${ms}ms ${ease}`,
      }}
      onTransitionEnd={(e) => {
        if (e.propertyName === 'top' && lastMove.current.falling) setLandKey((k) => k + 1)
      }}
    >
      <div className={`absolute inset-[7%] select-none drop-shadow-[0_2px_2px_rgba(0,0,0,.55)] ${inner}`}>
        <img
          key={landKey}
          src={GEM_IMAGES[tile.type]}
          alt={info.label}
          draggable={false}
          className={`pointer-events-none h-full w-full origin-bottom object-contain ${landKey ? 'animate-gem-land' : ''}`}
        />
        {tile.special && (
          <span className="absolute right-[2%] top-[0%] text-[clamp(8px,2.6vmin,16px)] leading-none">
            {tile.special === 'bomb' ? '💣' : '⚡'}
          </span>
        )}
      </div>
      {clearing &&
        SPARKS.map((a) => (
          <span
            key={a}
            className="pointer-events-none absolute left-1/2 top-1/2 -ml-[3px] -mt-[3px] h-1.5 w-1.5 rounded-full bg-yellow-200 shadow-[0_0_4px_#fde047]"
            style={{ '--a': `${a}deg`, animation: 'spark-out 280ms ease-out forwards' } as CSSProperties}
          />
        ))}
    </div>
  )
}

export default memo(TileView)
