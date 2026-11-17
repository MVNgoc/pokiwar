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

export function makeGemMaterial(type: Element) {
  const color = new THREE.Color(GEM_COLOR[type])
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color.clone().multiplyScalar(0.1),
    roughness: type === 'thuy' ? 0.15 : 0.35,
    metalness: type === 'kim' ? 0.45 : 0.08,
    flatShading: type !== 'thuy', // mặt cắt rõ cho ngọc, tròn mịn cho Thủy
  })
}

/** Mỗi hệ một hình khối khác nhau (phân biệt được cả khi mù màu): Kim bát giác, Mộc ngọc cắt, Thủy cầu, Hỏa chóp, Thổ khối vuông. */
export function GemShape({ type, material }: { type: Element; material: THREE.Material }) {
  switch (type) {
    case 'kim':
      return (
        <mesh material={material} rotation={[Math.PI / 2, Math.PI / 8, 0]}>
          <cylinderGeometry args={[0.43, 0.43, 0.34, 8]} />
        </mesh>
      )
    case 'moc':
      return (
        <mesh material={material} scale={[0.92, 1.18, 0.92]}>
          <octahedronGeometry args={[0.5, 0]} />
        </mesh>
      )
    case 'thuy':
      return (
        <mesh material={material}>
          <sphereGeometry args={[0.43, 28, 20]} />
        </mesh>
      )
    case 'hoa':
      return (
        <mesh material={material} position={[0, 0.02, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[0.5, 0.88, 4]} />
        </mesh>
      )
    case 'tho':
      return (
        <mesh material={material} rotation={[0.35, 0.5, 0]}>
          <boxGeometry args={[0.66, 0.66, 0.66]} />
        </mesh>
      )
  }
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
