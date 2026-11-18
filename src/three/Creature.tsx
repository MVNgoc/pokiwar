import { use, useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { bounceOut, clamp01, keyframes } from './easing'
import { loadCharacter } from './loadCharacter'

export interface CreatureProps {
  /** id model (trùng id pet / kẻ địch) */
  id: string
  position: [number, number, number]
  /** +1: đối thủ ở bên phải, -1: ở bên trái (hướng lao tới khi tấn công) */
  dir: 1 | -1
  hurt?: boolean
  attacking?: boolean
  defeated?: boolean
  /** đổi giá trị này để phát lại hoạt ảnh xuất hiện */
  enterKey?: string
  /** xoay tròn (màn chọn pet) */
  spin?: boolean
  /** vừa tiến hóa: nháy trắng khi hình mới xuất hiện (đổi enterKey để phát lại) */
  evolved?: boolean
  /** nhìn từ sau lưng (pet của người chơi trong trận; chỉ áp dụng cho ảnh 2D có bản sau lưng) */
  back?: boolean
}

/** độ dày đường viền (đơn vị thế giới) */
const OUTLINE_WORLD = 0.02
/** hướng nhìn: quái đứng quay mặt về phía camera, hơi xoay về phía đối thủ */
const FACE = 0.4
const ATTACK_S = 0.55
const HURT_S = 0.45
const ENTER_S = 0.75
const DEFEAT_S = 0.9

/**
 * Nhân vật 3D: hoạt ảnh có sẵn trong file (idle/run/gesture) cộng thêm chuyển động
 * viết tay phủ lên mọi nhân vật: thở, lấy đà rồi lao tới, giật lùi khi bị đánh, ngã khi bị hạ, rơi xuống khi xuất hiện.
 */
export default function Creature({ id, position, dir, hurt, attacking, defeated, enterKey, spin, back, evolved }: CreatureProps) {
  const model = use(loadCharacter(id, back))

  const inst = useMemo(() => {
    const root = clone(model.holder) as THREE.Group
    const materials: { mat: THREE.MeshToonMaterial; base: THREE.Color }[] = []
    root.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (mesh.isMesh) {
        // mỗi bản có vật liệu riêng (màu loé riêng); mesh có thể dùng nhiều vật liệu
        const cloned = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).map((m) => (m as THREE.MeshToonMaterial).clone())
        mesh.material = Array.isArray(mesh.material) ? cloned : cloned[0]
        for (const mat of cloned) materials.push({ mat, base: mat.emissive.clone() })
      }
    })
    // Viền: bản sao mesh có xương, lật mặt và đẩy đỉnh ra theo pháp tuyến → đường viền đậm như tranh vẽ
    const outlineMaterials: THREE.MeshBasicMaterial[] = []
    const skinned: THREE.Mesh[] = []
    root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh && !o.userData.noOutline) skinned.push(o as THREE.Mesh)
    })
    root.updateWorldMatrix(true, true)
    for (const m of skinned) {
      // độ dày viền tính theo đơn vị thế giới → đổi sang đơn vị hình học của riêng mesh này (mesh có thể bị scale)
      const ws = new THREE.Vector3()
      m.getWorldScale(ws)
      const width = OUTLINE_WORLD / ws.x
      const mat = new THREE.MeshBasicMaterial({ color: '#1b1020', side: THREE.BackSide })
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uWidth = { value: width }
        shader.vertexShader = `uniform float uWidth;\n${shader.vertexShader}`.replace('#include <begin_vertex>', '#include <begin_vertex>\n  transformed += normalize(normal) * uWidth;')
      }
      let line: THREE.Mesh
      if ((m as THREE.SkinnedMesh).isSkinnedMesh) {
        const sk = m as THREE.SkinnedMesh
        const skl = new THREE.SkinnedMesh(m.geometry, mat)
        skl.bind(sk.skeleton, sk.bindMatrix)
        skl.position.copy(m.position)
        skl.quaternion.copy(m.quaternion)
        skl.scale.copy(m.scale)
        m.parent?.add(skl)
        line = skl
      } else {
        // mesh thường (chuyển động theo node): viền là con của mesh nên đi theo mọi hoạt ảnh
        line = new THREE.Mesh(m.geometry, mat)
        m.add(line)
      }
      line.frustumCulled = false
      outlineMaterials.push(mat)
    }
    const mixer = new THREE.AnimationMixer(root)
    const find = (re: RegExp) => model.clips.find((c) => re.test(c.name))
    const idleClip = find(/idle|wait|stand|breath/i) ?? model.clips[0]
    const action = (clip?: THREE.AnimationClip) => (clip ? mixer.clipAction(clip) : undefined)
    const actions = {
      idle: action(idleClip),
      attack: action(find(/^run$/i) ?? find(/attack|tackle|bite|strike|punch|kick/i)), // Cube Pets: chạy nước rút; model khác: clip tấn công
      hit: action(find(/^gesture-negative$/i) ?? find(/^(hit|damage|hurt)/i)), // lắc đầu / clip bị đánh
      death: undefined as THREE.AnimationAction | undefined, // không có clip ngã: dùng chuyển động tự tạo
    }
    actions.idle?.play()
    return { root, materials, outlineMaterials, mixer, actions }
  }, [model])

  useEffect(
    () => () => {
      inst.mixer.stopAllAction()
    },
    [inst],
  )

  const rig = useRef<THREE.Group>(null)
  const shadow = useRef<THREE.Mesh>(null)
  const t = useRef({ atk: -1, hurt: -1, enter: 0, evo: -1, def: -1, phase: Math.random() * 6 })

  // Hoạt ảnh xương một lần rồi quay lại Idle
  useEffect(() => {
    const { mixer, actions } = inst
    const back = (e: { action: THREE.AnimationAction }) => {
      if (e.action !== actions.death) actions.idle?.reset().fadeIn(0.15).play()
    }
    mixer.addEventListener('finished', back as never)
    return () => mixer.removeEventListener('finished', back as never)
  }, [inst])

  /** clip của model rất ngắn (0.25s) nên lặp vài lần cho đủ thời gian nhìn thấy */
  const playOnce = (a?: THREE.AnimationAction, reps = 1) => {
    if (!a) return
    inst.actions.idle?.fadeOut(0.08)
    a.reset().setLoop(THREE.LoopRepeat, reps).fadeIn(0.08).play()
  }

  useEffect(() => {
    if (attacking) {
      t.current.atk = 0
      playOnce(inst.actions.attack, 3)
    }
  }, [attacking]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (hurt) {
      t.current.hurt = 0
      playOnce(inst.actions.hit, 2)
    }
  }, [hurt]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (defeated) {
      t.current.def = 0
      const d = inst.actions.death
      if (d) {
        inst.actions.idle?.fadeOut(0.1)
        d.reset().setLoop(THREE.LoopOnce, 1)
        d.clampWhenFinished = true
        d.fadeIn(0.1).play()
      }
    }
  }, [defeated]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    t.current.enter = 0
    if (evolved) t.current.evo = 0
  }, [enterKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 1 / 30)
    inst.mixer.update(dt)
    model.update?.(state.clock.elapsedTime)
    const s = t.current
    const g = rig.current
    if (!g) return
    const time = state.clock.elapsedTime + s.phase

    let ox = 0
    let oy = 0
    let sx = 1
    let sy = 1
    let rz = 0
    let flash = 0
    let alpha = 1

    // thở: phồng nhẹ rồi xẹp, nhún theo nhịp
    sy += Math.sin(time * 2.4) * 0.018
    sx -= Math.sin(time * 2.4) * 0.012
    oy += Math.abs(Math.sin(time * 1.2)) * 0.03

    if (s.enter < ENTER_S) {
      s.enter += dt
      const k = clamp01(s.enter / ENTER_S)
      oy += 3.2 * (1 - bounceOut(k))
      sx *= 0.6 + 0.4 * Math.min(1, k * 2)
      sy *= 0.6 + 0.4 * Math.min(1, k * 2)
      alpha = Math.min(alpha, clamp01(k * 4))
    }
    if (s.atk >= 0) {
      s.atk += dt
      const k = s.atk / ATTACK_S
      // lấy đà (lùi, cúi) → vọt (kéo giãn) → chạm (bẹp) → về, hơi nảy
      ox += dir * keyframes(k, [[0, 0], [0.22, -0.3], [0.45, 1.35], [0.58, 1.4], [0.82, -0.08], [1, 0]])
      sx *= keyframes(k, [[0, 1], [0.22, 1.1], [0.45, 0.9], [0.56, 1.14], [0.82, 0.98], [1, 1]])
      sy *= keyframes(k, [[0, 1], [0.22, 0.88], [0.45, 1.12], [0.56, 0.88], [0.82, 1.03], [1, 1]])
      oy += keyframes(k, [[0, 0], [0.45, 0.25], [0.58, 0], [1, 0]])
      if (k >= 1) s.atk = -1
    }
    if (s.hurt >= 0) {
      s.hurt += dt
      const k = s.hurt / HURT_S
      const decay = 1 - k
      ox += -dir * (0.34 * Math.sin(Math.min(1, k * 2.4) * Math.PI * 0.5) * decay + Math.sin(k * 55) * 0.06 * decay)
      rz += -dir * 0.12 * decay
      flash = Math.max(0, 1 - k * 1.6)
      if (k >= 1) s.hurt = -1
    }
    if (s.evo >= 0) {
      // tiến hóa: trắng xóa rồi hiện dần hình mới, hơi phình ra
      s.evo += dt
      const k = clamp01(s.evo / 1.1)
      flash = Math.max(flash, 1 - k)
      sx *= 1 + Math.sin(k * Math.PI) * 0.18
      sy *= 1 + Math.sin(k * Math.PI) * 0.18
      if (k >= 1) s.evo = -1
    }
    if (s.def >= 0) {
      s.def += dt
      const k = clamp01(s.def / DEFEAT_S)
      const e = k * k
      rz += -dir * e * 1.35
      oy += -e * 0.55 + Math.sin(k * Math.PI) * 0.25
      sx *= 1 - 0.45 * e
      sy *= 1 - 0.45 * e
      alpha = Math.min(alpha, 1 - e)
      flash = Math.max(flash, 1 - k * 3)
    }

    g.position.set(ox, oy, 0)
    g.scale.set(sx, sy, sx)
    g.rotation.z = rz
    if (spin && !model.sprite) g.rotation.y = Math.sin(time * 0.9) * 0.75 // lắc qua lại, luôn thấy mặt
    for (const { mat, base } of inst.materials) {
      mat.emissive.setRGB(base.r + flash, base.g + flash * 0.1, base.b + flash * 0.1)
      mat.transparent = alpha < 1
      mat.opacity = alpha
    }
    for (const m of inst.outlineMaterials) {
      m.transparent = alpha < 1
      m.opacity = alpha
    }
    if (shadow.current) {
      const sh = shadow.current
      sh.scale.setScalar(1 + (sx - 1) * 0.5 + Math.max(0, -oy) * 0.4)
      ;(sh.material as THREE.MeshBasicMaterial).opacity = 0.42 * alpha * Math.max(0.35, 1 - oy * 0.45)
    }
  })

  return (
    <group position={position} rotation={[0, model.sprite ? 0 : dir * FACE, 0]}>
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} renderOrder={-1}>
        <circleGeometry args={[0.85, 24]} />
        <meshBasicMaterial color="#000" transparent opacity={0.42} depthWrite={false} />
      </mesh>
      <group ref={rig}>
        {/* ảnh 2D vốn nhìn về bên trái: bên trái màn hình (dir = 1) lật lại để hai bên quay mặt vào nhau */}
        <group rotation={[0, model.sprite && dir === 1 ? Math.PI : 0, 0]}>
          <primitive object={inst.root} />
        </group>
      </group>
    </group>
  )
}
