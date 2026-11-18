import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { Element } from '../game/types'
import { GEM_COLOR } from './gems'

/** Mỗi hệ một model (Quaternius, CC0), tô lại màu theo hệ: Kim cụm khoáng, Mộc tinh thể lục giác, Thủy kim cương cắt, Hỏa viên thoi, Thổ thỏi vàng. */
const FILE: Record<Element, string> = { kim: 'kim', moc: 'moc', thuy: 'thuy', hoa: 'hoa', tho: 'tho' }
/** Kích thước lớn nhất của viên ngọc trong 1 ô (ô = 1 đơn vị) */
const FIT = 0.86

const cache = new Map<Element, Promise<THREE.Group>>()

async function load(type: Element): Promise<THREE.Group> {
  const buffer = await fetch(`${import.meta.env.BASE_URL}models/gems/${FILE[type]}.glb`).then((r) => {
    if (!r.ok) throw new Error(`Không tải được ngọc ${type}`)
    return r.arrayBuffer()
  })
  const gltf = await new GLTFLoader().parseAsync(buffer, '')
  const model = gltf.scene
  const tint = new THREE.Color(GEM_COLOR[type])
  model.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh) return
    const old = mesh.material as THREE.MeshStandardMaterial
    // phần tối (đế đá của cụm khoáng) giữ màu gốc, phần sáng tô theo màu hệ
    const hsl = { h: 0, s: 0, l: 0 }
    old.color.getHSL(hsl)
    const color = hsl.l < 0.25 ? old.color.clone() : tint.clone()
    mesh.material = new THREE.MeshStandardMaterial({ color, emissive: color.clone().multiplyScalar(0.12), roughness: 0.28, metalness: type === 'kim' ? 0.35 : 0.1, flatShading: true })
  })
  const box = new THREE.Box3().setFromObject(model)
  const size = box.getSize(new THREE.Vector3())
  const scale = FIT / Math.max(size.x, size.y)
  model.scale.multiplyScalar(scale)
  const c = box.getCenter(new THREE.Vector3())
  model.position.set(-c.x * scale, -c.y * scale, -c.z * scale)
  const holder = new THREE.Group()
  holder.add(model)
  return holder
}

export function loadGem(type: Element) {
  let p = cache.get(type)
  if (!p) {
    p = load(type)
    cache.set(type, p)
  }
  return p
}
