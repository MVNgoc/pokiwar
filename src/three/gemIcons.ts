import * as THREE from 'three'
import type { Element } from '../game/types'
import { GEM_COLOR } from './gems'

/** Icon hệ cá nhân: public/local-assets/gems/<hệ>.png (PNG tròn, không lên git). Thiếu thì dùng ngọc 3D đi kèm. */
export const gemIconUrl = (type: Element) => `${import.meta.env.BASE_URL}local-assets/gems/${type}.png`

const cache = new Map<Element, Promise<THREE.Texture | null>>()

export function loadGemIcon(type: Element): Promise<THREE.Texture | null> {
  let p = cache.get(type)
  if (!p) {
    p = (async () => {
      try {
        const url = gemIconUrl(type)
        const r = await fetch(url)
        if (!r.ok || new TextDecoder().decode((await r.arrayBuffer()).slice(1, 4)) !== 'PNG') return null // dev server trả index.html khi thiếu file
        const tex = await new THREE.TextureLoader().loadAsync(url)
        tex.colorSpace = THREE.SRGBColorSpace
        tex.anisotropy = 4
        return tex
      } catch {
        return null
      }
    })()
    cache.set(type, p)
  }
  return p
}

/** Huy hiệu ngọc: đĩa dày có viền kim loại màu hệ, mặt trước là icon. Trả về nhóm + các vật liệu để loé sáng. */
export function buildMedallion(type: Element, tex: THREE.Texture) {
  const color = new THREE.Color(GEM_COLOR[type])
  const root = new THREE.Group()
  const rim = new THREE.MeshStandardMaterial({ color: color.clone().multiplyScalar(0.6), roughness: 0.35, metalness: 0.5, emissive: color.clone().multiplyScalar(0.18) })
  const edge = new THREE.MeshStandardMaterial({ color: color.clone().lerp(new THREE.Color('#fff'), 0.35), roughness: 0.25, metalness: 0.6, emissive: color.clone().multiplyScalar(0.2) })
  const face = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: new THREE.Color(0.55, 0.55, 0.55), roughness: 0.55, alphaTest: 0.1 })

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.2, 40), rim)
  body.rotation.x = Math.PI / 2
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.035, 10, 48), edge)
  ring.position.z = 0.1
  const front = new THREE.Mesh(new THREE.CircleGeometry(0.4, 48), face)
  front.position.z = 0.104
  const shine = new THREE.Mesh(
    new THREE.CircleGeometry(0.13, 20),
    new THREE.MeshBasicMaterial({ color: '#fff', transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }),
  )
  shine.scale.set(1.7, 0.8, 1)
  shine.rotation.z = 0.6
  shine.position.set(-0.15, 0.2, 0.11)
  root.add(body, ring, front, shine)
  return { root, materials: [rim, edge, face] }
}
