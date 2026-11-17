/**
 * Nhạc nền: 'battle' cho màn thường, 'boss' cho màn Boss.
 * Dùng chung công tắc tắt tiếng với sfx. Mọi hàm an toàn khi chạy ngoài trình duyệt hoặc bị chặn autoplay.
 */
import battleSrc from '../assets/music/battle.ogg'
import bossSrc from '../assets/music/boss.ogg'
import { isMuted } from './sfx'

export type Track = 'battle' | 'boss'

/** `loopStart`: điểm quay lại khi hết bài (giây). 0 = lặp từ đầu. */
const TRACKS: Record<Track, { src: string; loopStart: number }> = {
  battle: { src: battleSrc, loopStart: 7.5 },
  boss: { src: bossSrc, loopStart: 0 },
}

const VOLUME = 0.3
const FADE_MS = 500

let el: HTMLAudioElement | null = null
let current: Track | null = null
let loopTimer: ReturnType<typeof setInterval> | undefined

const canPlay = () => typeof Audio !== 'undefined'

function fadeOutAndStop(audio: HTMLAudioElement) {
  const step = audio.volume / (FADE_MS / 50)
  const id = setInterval(() => {
    audio.volume = Math.max(0, audio.volume - step)
    if (audio.volume <= 0.001) {
      clearInterval(id)
      audio.pause()
    }
  }, 50)
}

function start(track: Track) {
  const { src, loopStart } = TRACKS[track]
  const audio = new Audio(src)
  audio.volume = VOLUME
  audio.loop = loopStart === 0
  audio.preload = 'auto'
  el = audio
  current = track
  clearInterval(loopTimer)
  if (loopStart > 0) {
    // bài có đoạn mở đầu: hết bài thì nhảy về điểm lặp thay vì về 0:00
    loopTimer = setInterval(() => {
      if (el === audio && audio.duration && audio.duration - audio.currentTime < 0.12) audio.currentTime = loopStart
    }, 50)
  }
  if (!isMuted() && !document.hidden) void audio.play().catch(() => {})
}

/** Phát bài `track` (không làm gì nếu bài đó đang phát). */
export function playMusic(track: Track) {
  if (!canPlay() || current === track) return
  if (el) fadeOutAndStop(el)
  start(track)
}

export function stopMusic(fade = true) {
  if (!canPlay() || !el) return
  clearInterval(loopTimer)
  if (fade) fadeOutAndStop(el)
  else el.pause()
  el = null
  current = null
}

/** Gọi sau khi bật/tắt tiếng để nhạc nền theo kịp. */
export function syncMusicMute() {
  if (!el) return
  if (isMuted()) el.pause()
  else if (!document.hidden) void el.play().catch(() => {})
}

if (typeof document !== 'undefined') {
  // Tạm dừng khi chuyển tab, tiếp tục khi quay lại
  document.addEventListener('visibilitychange', () => {
    if (!el) return
    if (document.hidden) el.pause()
    else if (!isMuted()) void el.play().catch(() => {})
  })
}
