import * as THREE from 'three'

/** Ảnh hiệu ứng cá nhân: public/local-assets/fx/<tên>.png (git bỏ qua). Tải sẵn lúc khởi động; thiếu ảnh thì hiệu ứng tự dùng hình vẽ sẵn. */
const cache = new Map<string, THREE.Texture | null>()
const loading = new Set<string>()

export const FX_NAMES = [
  'fireball', 'flareball', 'bluefireball', 'waterwisp', 'mudwisp', 'energyball', 'leaf1', 'leaf2', 'petal', 'shell',
  'topbite', 'bottombite', 'rock1', 'rock2', 'rock3', 'shine', 'impact', 'feather', 'iceball', 'wisp',
]

export function preloadFx(names: string[] = FX_NAMES) {
  for (const name of names) {
    if (cache.has(name) || loading.has(name)) continue
    loading.add(name)
    void (async () => {
      try {
        const url = `${import.meta.env.BASE_URL}local-assets/fx/${name}.png`
        const r = await fetch(url)
        if (!r.ok || new TextDecoder().decode((await r.arrayBuffer()).slice(1, 4)) !== 'PNG') {
          cache.set(name, null)
          return
        }
        const tex = await new THREE.TextureLoader().loadAsync(url)
        tex.colorSpace = THREE.SRGBColorSpace
        cache.set(name, tex)
      } catch {
        cache.set(name, null)
      }
    })()
  }
}

/** Ảnh đã tải xong (null nếu thiếu hoặc chưa tải kịp) */
export const getFx = (name?: string): THREE.Texture | null => (name ? cache.get(name) ?? null : null)

/** Ảnh phát sáng (cộng màu) hay ảnh đặc (vẽ đè) */
export const isGlow = (name: string) => /wisp|ball|shine/.test(name)
