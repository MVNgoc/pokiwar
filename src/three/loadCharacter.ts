import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

/** Kích thước chuẩn hóa: cao tối đa / dài tối đa (đơn vị thế giới). Thú đứng nghiêng nên chiều dài là kích thước chính. */
const TARGET_HEIGHT = 2.0
const TARGET_LENGTH = 2.2
/** chiều cao nhân vật 2D (ảnh có viền trống nên hơi lớn hơn 3D) */
const SPRITE_HEIGHT = 2.3

export interface CharacterModel {
  /** nhóm đã chuẩn hóa kích thước, chân chạm y = 0, tâm ở gốc (nhân bản bằng SkeletonUtils.clone) */
  holder: THREE.Group
  /** các hoạt ảnh (Cube Pets: idle, walk, run, eat, dance, gesture-positive, gesture-negative) */
  clips: THREE.AnimationClip[]
  /** ảnh 2D (tấm phẳng): luôn quay mặt về camera, không xoay */
  sprite?: boolean
  /** hoạt ảnh 2D: gọi mỗi khung hình với thời gian (giây) */
  update?: (t: number) => void
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

/** Tùy chỉnh theo từng model: `lift` nâng lên khỏi bục, `length` giới hạn chiều dài, `scale` phóng to thêm (Boss), `flip` quay 180°. */
const MODEL_OPTIONS: Record<string, { lift?: number; length?: number; scale?: number; flip?: boolean }> = {
  'su-tu-lua': { scale: 1.15 },
}

const cache = new Map<string, Promise<CharacterModel>>()

function toon(color: THREE.Color, map: THREE.Texture | null = null) {
  // Tô bóng hoạt hình, giữ màu gốc; phát sáng nền = màu x 0.28 để phần tối không bị xỉn
  // Có texture: phát sáng theo chính texture (emissiveMap) để màu không bị nhạt đi
  if (map) return new THREE.MeshToonMaterial({ color, map, gradientMap: TOON_RAMP, emissive: new THREE.Color(0.3, 0.3, 0.3), emissiveMap: map })
  return new THREE.MeshToonMaterial({ color, map, gradientMap: TOON_RAMP, emissive: color.clone().multiplyScalar(0.28) })
}

/** Tải file .glb; trả null nếu thiếu (dev server trả index.html cho file không có nên kiểm tra chữ ký "glTF"). */
async function fetchGlb(url: string): Promise<ArrayBuffer | null> {
  try {
    const r = await fetch(url)
    if (!r.ok) return null
    const buf = await r.arrayBuffer()
    return new TextDecoder().decode(buf.slice(0, 4)) === 'glTF' ? buf : null
  } catch {
    return null
  }
}

async function isPng(url: string): Promise<boolean> {
  try {
    const r = await fetch(url)
    if (!r.ok) return false
    return new TextDecoder().decode((await r.arrayBuffer()).slice(1, 4)) === 'PNG'
  } catch {
    return false
  }
}

type SpriteOpt = { lift?: number; scale?: number; flip?: boolean }

/** Dựng tấm phẳng đứng từ texture (chân chạm y = 0). `h` là chiều cao thế giới, `aspect` = rộng / cao của ảnh. */
function spriteModel(tex: THREE.Texture, h: number, aspect: number, opt: SpriteOpt, update?: (t: number) => void): CharacterModel {
  const mat = new THREE.MeshToonMaterial({
    map: tex,
    gradientMap: TOON_RAMP,
    emissive: new THREE.Color(0.55, 0.55, 0.55), // ảnh vẽ sẵn bóng: gần như không cần ánh sáng cảnh
    emissiveMap: tex,
    transparent: true,
    alphaTest: 0.05,
    side: THREE.DoubleSide,
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(h * aspect, h), mat)
  mesh.position.y = h / 2 + (opt.lift ?? 0)
  mesh.userData.noOutline = true
  mesh.frustumCulled = false
  const holder = new THREE.Group()
  holder.add(mesh)
  if (opt.flip) holder.rotation.y = Math.PI
  return { holder, clips: [], sprite: true, update }
}

/** Nhân vật 2D tĩnh (PNG nền trong suốt). */
async function loadSprite(url: string, opt: SpriteOpt): Promise<CharacterModel> {
  const tex = await new THREE.TextureLoader().loadAsync(url)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  const img = tex.image as { width: number; height: number }
  return spriteModel(tex, SPRITE_HEIGHT * (opt.scale ?? 1), img.width / img.height, opt)
}

interface DecodedFrame {
  close(): void
  duration: number | null
}
interface GifDecoder {
  tracks: { ready: Promise<void>; selectedTrack: { frameCount: number } }
  decode(o: { frameIndex: number }): Promise<{ image: DecodedFrame }>
}

/** Nhân vật 2D động: giải mã GIF bằng ImageDecoder của trình duyệt rồi vẽ từng khung lên canvas. Null nếu trình duyệt không hỗ trợ. */
async function loadGifSprite(buffer: ArrayBuffer, opt: SpriteOpt): Promise<CharacterModel | null> {
  const Decoder = (globalThis as unknown as { ImageDecoder?: new (o: { data: ArrayBuffer; type: string }) => GifDecoder }).ImageDecoder
  if (!Decoder) return null
  try {
    const dec = new Decoder({ data: buffer, type: 'image/gif' })
    await dec.tracks.ready
    const n = dec.tracks.selectedTrack.frameCount
    const frames: { bmp: ImageBitmap; dur: number }[] = []
    for (let i = 0; i < n; i++) {
      const { image } = await dec.decode({ frameIndex: i })
      frames.push({ bmp: await createImageBitmap(image as unknown as ImageBitmapSource), dur: Math.max(40, (image.duration ?? 100000) / 1000) })
      image.close()
    }
    if (!frames.length) return null
    const { width: w, height: h } = frames[0].bmp
    const total = frames.reduce((a, f) => a + f.dur, 0)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(frames[0].bmp, 0, 0)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.magFilter = tex.minFilter = THREE.NearestFilter // pixel art: giữ nét vuông
    tex.generateMipmaps = false
    let shown = 0
    const update = (t: number) => {
      let ms = (t * 1000) % total
      let idx = 0
      while (idx < frames.length - 1 && ms >= frames[idx].dur) ms -= frames[idx++].dur
      if (idx === shown) return
      shown = idx
      ctx.clearRect(0, 0, w, h)
      ctx.drawImage(frames[idx].bmp, 0, 0)
      tex.needsUpdate = true
    }
    // kích thước tỉ lệ với ảnh gốc (con to thì ảnh to), giới hạn để không quá nhỏ / quá lớn
    const worldH = Math.min(2.3, Math.max(1.5, h * 0.03)) * (opt.scale ?? 1)
    return spriteModel(tex, worldH, w / h, opt, update)
  } catch {
    return null
  }
}

async function isGif(url: string): Promise<ArrayBuffer | null> {
  try {
    const r = await fetch(url)
    if (!r.ok) return null
    const buf = await r.arrayBuffer()
    return new TextDecoder().decode(buf.slice(0, 3)) === 'GIF' ? buf : null
  } catch {
    return null
  }
}

async function load(id: string): Promise<CharacterModel> {
  const base = import.meta.env.BASE_URL
  const opt = MODEL_OPTIONS[id] ?? {}
  // ưu tiên model cá nhân trong public/local-assets (không lên git): .glb (3D), rồi .png (2D); thiếu thì dùng model CC0 đi kèm
  let dir = `${base}local-assets/`
  let buffer = await fetchGlb(`${dir}${id}.glb`)
  if (!buffer) {
    const gif = await isGif(`${dir}${id}.gif`)
    const animated = gif ? await loadGifSprite(gif, opt) : null
    if (animated) return animated
  }
  if (!buffer && (await isPng(`${dir}${id}.png`))) return loadSprite(`${dir}${id}.png`, opt)
  if (!buffer) {
    dir = `${base}models/`
    buffer = await fetchGlb(`${dir}${id}.glb`)
    if (!buffer) throw new Error(`Không tải được model ${id}`)
  }
  const gltf = await new GLTFLoader().parseAsync(buffer, dir)
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
  const scale = Math.min(TARGET_HEIGHT / size.y, (opt.length ?? TARGET_LENGTH) / Math.max(size.x, size.z)) * (opt.scale ?? 1)
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
