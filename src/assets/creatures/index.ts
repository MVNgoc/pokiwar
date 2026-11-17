/**
 * Hình pet và kẻ địch: "Tiny Creatures" của Clint Bellanger (CC0), xem LICENSE-TinyCreatures.txt.
 * Ảnh gốc 16x16, phóng 8x theo kiểu nearest-neighbor nên hiển thị bằng `image-rendering: pixelated`.
 */
import hoaHo from './hoa-ho.webp'
import thuyQuy from './thuy-quy.webp'
import mocLoc from './moc-loc.webp'
import kimHo from './kim-ho.webp'
import thoTe from './tho-te.webp'
import namRung from './nam-rung.webp'
import soiXam from './soi-xam.webp'
import boCap from './bo-cap.webp'
import quyDa from './quy-da.webp'
import rongBongToi from './rong-bong-toi.webp'

export const PET_IMAGES: Record<string, string> = {
  'hoa-ho': hoaHo,
  'thuy-quy': thuyQuy,
  'moc-loc': mocLoc,
  'kim-ho': kimHo,
  'tho-te': thoTe,
}

export const ENEMY_IMAGES: Record<string, string> = {
  'nam-rung': namRung,
  'soi-xam': soiXam,
  'bo-cap': boCap,
  'quy-da': quyDa,
  'rong-bong-toi': rongBongToi,
}
