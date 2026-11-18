import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Element } from '../game/types'

const PARTICLE: Record<Element, string> = { hoa: '#ffb347', thuy: '#bfe6ff', moc: '#a7f070', tho: '#d9c08a', kim: '#ffffff' }

let starTex: THREE.CanvasTexture | null = null
/** Ngôi sao 4 cánh (tia lóe của kim loại) */
function star() {
  if (starTex) return starTex
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')!
  g.translate(32, 32)
  g.fillStyle = '#fff'
  g.beginPath()
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4
    const r = i % 2 === 0 ? 30 : 5
    g.lineTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  g.closePath()
  g.fill()
  starTex = new THREE.CanvasTexture(c)
  return starTex
}

/**
 * Hoạt ảnh nền theo hệ (lặp liên tục, nhẹ):
 * Hỏa: tàn lửa bay lên · Thủy: gợn sóng lan ra + giọt nước · Mộc: lá rơi bay lượn · Kim: tia sao lóe · Thổ: bụi đá rơi.
 */
export default function GemAura({ type }: { type: Element }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const ring = useRef<THREE.Mesh>(null)
  const sparkle = useRef<THREE.Sprite>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const seed = useMemo(() => Math.random() * 20, [])
  const parts = useMemo(() => Array.from({ length: 5 }, (_, i) => ({ o: i / 5 + Math.random() * 0.1, x: (Math.random() - 0.5) * 0.6, sp: 0.7 + Math.random() * 0.5 })), [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed
    const m = mesh.current
    if (m && type !== 'kim') {
      parts.forEach((p, i) => {
        const k = (t * p.sp * 0.55 + p.o) % 1
        let x = p.x
        let y = 0
        let s = 0.05
        if (type === 'hoa') {
          y = -0.1 + k * 0.75
          x = p.x * (1 - k * 0.6) + Math.sin(t * 6 + i) * 0.04
          s = 0.075 * (1 - k)
        } else if (type === 'thuy') {
          y = 0.32 + Math.sin(k * Math.PI) * 0.3 - k * 0.1
          x = p.x * 0.5 + (k - 0.5) * 0.3 * Math.sign(p.x)
          s = 0.055 * Math.sin(k * Math.PI)
        } else if (type === 'moc') {
          x = p.x + Math.sin(t * 2 + i * 2) * 0.12
          y = 0.5 - k * 0.95
          s = 0.065 * Math.sin(k * Math.PI)
        } else {
          y = -0.3 + k * 0.28
          x = p.x * (0.6 + k * 0.5)
          s = 0.06 * (1 - k)
        }
        dummy.position.set(x, y, 0.22)
        dummy.scale.setScalar(Math.max(s, 0.0001))
        dummy.updateMatrix()
        m.setMatrixAt(i, dummy.matrix)
      })
      m.instanceMatrix.needsUpdate = true
    }
    if (ring.current) {
      const k = (t * 0.6) % 1
      ring.current.scale.setScalar(0.85 + k * 0.7)
      ;(ring.current.material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.55
    }
    if (sparkle.current) {
      const k = (t * 0.45) % 1
      const pulse = Math.max(0, Math.sin(k * Math.PI * 2.2)) * (k < 0.45 ? 1 : 0)
      sparkle.current.scale.setScalar(0.5 * pulse + 0.0001)
      sparkle.current.material.rotation = t * 1.5
    }
  })

  return (
    <>
      {type !== 'kim' && (
        <instancedMesh ref={mesh} args={[undefined, undefined, 5]} frustumCulled={false}>
          <sphereGeometry args={[1, 6, 4]} />
          <meshBasicMaterial color={PARTICLE[type]} transparent depthWrite={false} blending={type === 'tho' ? THREE.NormalBlending : THREE.AdditiveBlending} />
        </instancedMesh>
      )}
      {type === 'thuy' && (
        <mesh ref={ring} position={[0, 0, 0.09]}>
          <ringGeometry args={[0.43, 0.47, 40]} />
          <meshBasicMaterial color="#d8f1ff" transparent depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      )}
      {type === 'kim' && (
        <sprite ref={sparkle} position={[0.22, 0.2, 0.25]}>
          <spriteMaterial map={star()} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      )}
    </>
  )
}
