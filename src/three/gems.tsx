import * as THREE from 'three'
import type { Element } from '../game/types'

/** Màu từng hệ (khớp biểu tượng chú thích dưới bàn cờ). */
export const GEM_COLOR: Record<Element, string> = {
  kim: '#cdd3dd',
  moc: '#35c24a',
  thuy: '#2a8cf0',
  hoa: '#ea3a2e',
  tho: '#f5c22a',
}

const emojiCache = new Map<string, THREE.CanvasTexture>()
/** Biểu tượng emoji vẽ lên texture (dấu hiệu ngọc đặc biệt). */
export function emojiTexture(emoji: string): THREE.CanvasTexture {
  let tex = emojiCache.get(emoji)
  if (!tex) {
    const c = document.createElement('canvas')
    c.width = c.height = 96
    const ctx = c.getContext('2d')!
    ctx.font = '72px serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(emoji, 48, 54)
    tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    emojiCache.set(emoji, tex)
  }
  return tex
}
