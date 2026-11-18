import * as THREE from 'three'
import type { Element } from '../game/types'

/** Ảnh bục đứng cá nhân: public/local-assets/platforms/<hệ>.png (PNG nền trong suốt, không lên git). Thiếu thì dùng đế vẽ sẵn trong code. */
const cache = new Map<Element, Promise<THREE.Texture | null>>()

export function loadPlatform(element: Element): Promise<THREE.Texture | null> {
  let p = cache.get(element)
  if (!p) {
    p = (async () => {
      try {
        const url = `${import.meta.env.BASE_URL}local-assets/platforms/${element}.png`
        const r = await fetch(url)
        if (!r.ok || new TextDecoder().decode((await r.arrayBuffer()).slice(1, 4)) !== 'PNG') return null
        const tex = await new THREE.TextureLoader().loadAsync(url)
        tex.colorSpace = THREE.SRGBColorSpace
        tex.magFilter = tex.minFilter = THREE.NearestFilter // giữ nét pixel
        tex.generateMipmaps = false
        return tex
      } catch {
        return null
      }
    })()
    cache.set(element, p)
  }
  return p
}
