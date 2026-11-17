import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'

/** Chiều cao chuẩn của mọi nhân vật trong cảnh (đơn vị thế giới). */
export const CHARACTER_HEIGHT = 1.9

export interface CharacterModel {
  /** nhóm đã chuẩn hóa kích thước, chân chạm y = 0 (nhân bản bằng SkeletonUtils.clone) */
  holder: THREE.Group
  clips: THREE.AnimationClip[]
}

const BLANK = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='
const cache = new Map<string, Promise<CharacterModel>>()

async function load(id: string): Promise<CharacterModel> {
  const base = import.meta.env.BASE_URL
  const [buffer, texture] = await Promise.all([
    fetch(`${base}models/${id}.fbx`).then((r) => {
      if (!r.ok) throw new Error(`Không tải được model ${id}`)
      return r.arrayBuffer()
    }),
    new THREE.TextureLoader().loadAsync(`${base}models/${id}.webp`),
  ])
  texture.colorSpace = THREE.SRGBColorSpace

  // File FBX trỏ tới texture bằng đường dẫn gốc: chặn lại để dùng bản WebP đã nén của mình.
  const manager = new THREE.LoadingManager()
  manager.setURLModifier(() => BLANK)
  const model = new FBXLoader(manager).parse(buffer, '')

  model.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh) return
    mesh.material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.75, metalness: 0 })
    mesh.frustumCulled = false // mesh có xương: bounding box bind-pose không đúng khi hoạt ảnh
  })

  const box = new THREE.Box3().setFromObject(model)
  const size = box.getSize(new THREE.Vector3())
  const scale = CHARACTER_HEIGHT / size.y
  model.scale.multiplyScalar(scale)
  model.position.y -= box.min.y * scale
  model.position.x -= ((box.min.x + box.max.x) / 2) * scale
  model.position.z -= ((box.min.z + box.max.z) / 2) * scale

  const holder = new THREE.Group()
  holder.add(model)
  return { holder, clips: model.animations }
}

/** Tải (và lưu cache) model nhân vật. Gọi trước để tải sẵn khi biết sắp dùng. */
export function loadCharacter(id: string): Promise<CharacterModel> {
  let p = cache.get(id)
  if (!p) {
    p = load(id)
    cache.set(id, p)
  }
  return p
}
