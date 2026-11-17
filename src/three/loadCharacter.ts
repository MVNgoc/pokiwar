import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

/** Kích thước chuẩn hóa: cao tối đa / dài tối đa (đơn vị thế giới). Thú đứng nghiêng nên chiều dài là kích thước chính. */
const TARGET_HEIGHT = 2.0
const TARGET_LENGTH = 2.2

export interface CharacterModel {
  /** nhóm đã chuẩn hóa kích thước, chân chạm y = 0, tâm ở gốc (nhân bản bằng SkeletonUtils.clone) */
  holder: THREE.Group
  /** các hoạt ảnh đã đổi tên gọn: Idle, Attack, Hit, Death */
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

const cache = new Map<string, Promise<CharacterModel>>()

async function load(id: string): Promise<CharacterModel> {
  const base = import.meta.env.BASE_URL
  const buffer = await fetch(`${base}models/${id}.glb`).then((r) => {
    if (!r.ok) throw new Error(`Không tải được model ${id}`)
    return r.arrayBuffer()
  })
  const gltf = await new GLTFLoader().parseAsync(buffer, '')
  const model = gltf.scene

  model.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh) return
    const old = mesh.material as THREE.MeshStandardMaterial
    // Tô bóng hoạt hình, giữ màu gốc; phát sáng nền = màu x 0.28 để phần tối không bị xỉn
    mesh.material = new THREE.MeshToonMaterial({
      color: old.color,
      map: old.map ?? null,
      gradientMap: TOON_RAMP,
      emissive: old.color.clone().multiplyScalar(0.28),
    })
    mesh.frustumCulled = false // mesh có xương: bounding box bind-pose không đúng khi hoạt ảnh
  })

  const box = new THREE.Box3().setFromObject(model)
  const size = box.getSize(new THREE.Vector3())
  const scale = Math.min(TARGET_HEIGHT / size.y, TARGET_LENGTH / Math.max(size.x, size.z))
  model.scale.multiplyScalar(scale)
  model.position.set(-((box.min.x + box.max.x) / 2) * scale, -box.min.y * scale, -((box.min.z + box.max.z) / 2) * scale)

  const holder = new THREE.Group()
  holder.add(model)
  return { holder, clips: gltf.animations }
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
