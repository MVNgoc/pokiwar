/**
 * Ngọc nguyên tố: Kenney "Puzzle Pack II" (CC0), xem LICENSE-Kenney-PuzzlePackII.txt.
 * Mỗi hệ có màu và hình khác nhau để phân biệt được cả khi mù màu.
 */
import hoa from './hoa.webp'
import kim from './kim.webp'
import moc from './moc.webp'
import thuy from './thuy.webp'
import tho from './tho.webp'
import type { Element } from '../../game/types'

export const GEM_IMAGES: Record<Element, string> = { kim, moc, thuy, hoa, tho }
