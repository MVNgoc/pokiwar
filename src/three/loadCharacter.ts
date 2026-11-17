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

/**
 * Hai con cá đến từ pack cũ ở dạng FBX và KHÔNG lưu màu (mọi vật liệu mặc định xám trắng), nên màu được gán theo ảnh xem trước của tác giả.
 * `palette`: theo tên vật liệu, hoặc theo thứ tự từ vật liệu nhiều mặt nhất tới ít nhất. `lift`: nâng lên khỏi bục (cá bơi lơ lửng).
 */
const FBX_MODELS: Record<string, { palette: Record<string, string> | string[]; length: number; lift: number; flip?: boolean }> = {
  'thuy-kinh': { palette: ['#6a89e0', '#ecd68c'], length: 2.7, lift: 0.45 },
  'ca-piranha': { palette: { Brown: '#c8604f', LightYellow: '#f3e1b2', Black: '#17171c', White: '#ffffff' }, length: 2.0, lift: 0.5 },
}

const cache = new Map<string, Promise<CharacterModel>>()

function toon(color: THREE.Color, map: THREE.Texture | null = null) {
  // Tô bóng hoạt hình, giữ màu gốc; phát sáng nền = màu x 0.28 để phần tối không bị xỉn
  return new THREE.MeshToonMaterial({ color, map, gradientMap: TOON_RAMP, emissive: color.clone().multiplyScalar(0.28) })
}

async function load(id: string): Promise<CharacterModel> {
  const base = import.meta.env.BASE_URL
  const fbx = FBX_MODELS[id]
  const buffer = await fetch(`${base}models/${id}.${fbx ? 'fbx' : 'glb'}`).then((r) => {
    if (!r.ok) throw new Error(`Không tải được model ${id}`)
    return r.arrayBuffer()
  })

  let model: THREE.Object3D
  let clips: THREE.AnimationClip[]
  if (fbx) {
    const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader.js') // chỉ tải khi cần
    model = new FBXLoader().parse(buffer, '')
    // tên clip FBX có dạng "Armature|Swimming": bỏ tiền tố
    clips = (model.animations as THREE.AnimationClip[]).filter((c) => c.duration > 0).map((c) => {
      c.name = c.name.split('|').pop()!
      return c
    })
  } else {
    const gltf = await new GLTFLoader().parseAsync(buffer, '')
    model = gltf.scene
    clips = gltf.animations
  }

  model.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh) return
    const olds = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as THREE.MeshStandardMaterial[]
    let colors: (THREE.Color | null)[] = olds.map((m) => m.color)
    if (fbx) {
      // xếp hạng vật liệu theo số tam giác để gán màu theo thứ tự (thân > bụng)
      const tris = olds.map(() => 0)
      for (const g of mesh.geometry.groups) tris[g.materialIndex ?? 0] += g.count
      const rank = [...tris.keys()].sort((a, b) => tris[b] - tris[a])
      colors = olds.map((m, i) => {
        const hex = Array.isArray(fbx.palette) ? fbx.palette[rank.indexOf(i)] : fbx.palette[m.name]
        return new THREE.Color(hex ?? '#cccccc')
      })
    }
    const mats = olds.map((m, i) => toon(colors[i]!.clone(), m.map ?? null))
    mesh.material = Array.isArray(mesh.material) ? mats : mats[0]
    mesh.frustumCulled = false // mesh có xương: bounding box bind-pose không đúng khi hoạt ảnh
  })

  const box = new THREE.Box3().setFromObject(model)
  const size = box.getSize(new THREE.Vector3())
  const length = fbx?.length ?? TARGET_LENGTH
  const scale = Math.min(TARGET_HEIGHT / size.y, length / Math.max(size.x, size.z))
  model.scale.multiplyScalar(scale)
  model.position.set(-((box.min.x + box.max.x) / 2) * scale, -box.min.y * scale + (fbx?.lift ?? 0), -((box.min.z + box.max.z) / 2) * scale)

  const holder = new THREE.Group()
  holder.add(model)
  if (fbx?.flip) holder.rotation.y = Math.PI
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
