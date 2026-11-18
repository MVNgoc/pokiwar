import type { StageTheme } from '../three/themes'

/** Nền toàn trang: bầu trời chuyển màu theo màn, mặt trời, mây trôi, đồi nhiều lớp và đốm sáng. Nằm sau mọi thứ. */
export default function Backdrop({ theme }: { theme: StageTheme }) {
  const dark = theme.mood === 'cave' || theme.mood === 'volcano'
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ background: `linear-gradient(to bottom, ${theme.skyTop}, ${theme.skyMid} 55%, ${theme.skyBottom})` }} aria-hidden>
      {theme.sun && <div className="absolute right-[12%] top-[10%] h-40 w-40 rounded-full blur-sm" style={{ background: `radial-gradient(circle, ${theme.sun} 0 32%, ${theme.sun}55 34%, transparent 70%)` }} />}
      {theme.mood === 'volcano' && <div className="absolute inset-x-0 bottom-0 h-1/2" style={{ background: 'radial-gradient(ellipse at 50% 100%, #ff7a1a88, transparent 65%)' }} />}
      {[
        { t: '8%', w: 220, d: 90, o: 0, s: 1 },
        { t: '20%', w: 160, d: 120, o: -40, s: 0.8 },
        { t: '4%', w: 280, d: 150, o: -90, s: 1.2 },
        { t: '30%', w: 190, d: 100, o: -20, s: 0.7 },
      ].map((c, i) => (
        <div key={i} className="cloud absolute" style={{ top: c.t, width: c.w, height: c.w * 0.32, animationDuration: `${c.d}s`, animationDelay: `${c.o}s`, opacity: dark ? 0.18 : 0.85 }} />
      ))}
      <svg className="absolute inset-x-0 bottom-0 h-[42%] w-full" viewBox="0 0 1440 400" preserveAspectRatio="none">
        <path d="M0 220 Q180 120 360 200 T720 170 T1080 210 T1440 150 V400 H0Z" fill={theme.hillFar} />
        <path d="M0 280 Q220 190 440 270 T880 240 T1440 270 V400 H0Z" fill={theme.hillNear} />
        <path d="M0 340 Q300 290 600 335 T1200 320 T1440 345 V400 H0Z" fill={theme.ground} />
      </svg>
    </div>
  )
}
