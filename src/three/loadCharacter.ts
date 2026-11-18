import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

/** Kích thước chuẩn hóa: cao tối đa / dài tối đa (đơn vị thế giới). Thú đứng nghiêng nên chiều dài là kích thước chính. */
const TARGET_HEIGHT = 2.0
const TARGET_LENGTH = 2.2

export interface CharacterModel {
  /** nhóm đã chuẩn hóa kích thước, chân chạm y = 0, tâm ở gốc (nhân bản bằng SkeletonUtils.clone) */
  holder: THREE.Group
  /** các hoạt ảnh (glTF đã đổi tên gọn: Idle, Attack, Hit, Death; FBX giữ tên gốc) */
  clips: THREE.AnimationClip[]
}

/** Dải 4 mức sáng cho tô bóng kiểu hoạt hình: mảng màu rõ thay vì chuyển sắc lem. */
const TOON_RAMP = (() => {
  const data = new Uint8Array([120, 120, 120, 255, 175, 175, 175, 255, 225, 225, 225, 255, 255, 255, 255, 255])
  const tex = new THREE.DataTexture(data, 4, 1, THREE.RGBAFormat)
  tex.minFilter = tex.magFilter = THREE.NearestFilter
  tex.generateMipmaps = false
  tex.needsUpdate = true
  return tex
})()

/** Tùy chỉnh theo từng model: `lift` nâng lên khỏi bục (bay/bơi), `length` giới hạn chiều dài, `flip` quay 180° (model nhìn sang phải). */
const MODEL_OPTIONS: Record<string, { lift?: number; length?: number; flip?: boolean }> = {
  'rong-lua': { lift: 0.55 },
  'ca-nho': { lift: 0.6, length: 2.6, flip: true },
}

const cache = new Map<string, Promise<CharacterModel>>()

function toon(color: THREE.Color, map: THREE.Texture | null = null) {
  // Tô bóng hoạt hình, giữ màu gốc; phát sáng nền = màu x 0.28 để phần tối không bị xỉn
  return new THREE.MeshToonMaterial({ color, map, gradientMap: TOON_RAMP, emissive: color.clone().multiplyScalar(0.28) })
}

async function load(id: string): Promise<CharacterModel> {
  const base = import.meta.env.BASE_URL
  const opt = MODEL_OPTIONS[id] ?? {}
  const buffer = await fetch(`${base}models/${id}.glb`).then((r) => {
    if (!r.ok) throw new Error(`Không tải được model ${id}`)
    return r.arrayBuffer()
  })
  const gltf = await new GLTFLoader().parseAsync(buffer, '')
  const model = gltf.scene
  // tên clip dạng "CharacterArmature|Idle": bỏ tiền tố
  const clips = gltf.animations.map((c) => {
    c.name = c.name.split('|').pop()!
    return c
  })

  model.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh) return
    const olds = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as THREE.MeshStandardMaterial[]
    const mats = olds.map((m) => toon(m.color.clone(), m.map ?? null))
    mesh.material = Array.isArray(mesh.material) ? mats : mats[0]
    mesh.frustumCulled = false // mesh có xương: bounding box bind-pose không đúng khi hoạt ảnh
  })

  const box = new THREE.Box3().setFromObject(model)
  const size = box.getSize(new THREE.Vector3())
  const scale = Math.min(TARGET_HEIGHT / size.y, (opt.length ?? TARGET_LENGTH) / Math.max(size.x, size.z))
  model.scale.multiplyScalar(scale)
  model.position.set(-((box.min.x + box.max.x) / 2) * scale, -box.min.y * scale + (opt.lift ?? 0), -((box.min.z + box.max.z) / 2) * scale)

  const holder = new THREE.Group()
  holder.add(model)
  if (opt.flip) holder.rotation.y = Math.PI
  return { holder, clips }
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
