import ElementDot from './ElementDot'
import { BALANCE, ELEMENTS, ELEMENT_INFO } from '../game/constants'

/** Nút "?" nhỏ gọn; bấm mở bảng hướng dẫn. */
export function HelpButton({ onClick, className = '' }: { onClick: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      aria-label="Hướng dẫn"
      className={`flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-sm font-black text-amber-200 ring-1 ring-amber-200/40 active:scale-95 ${className}`}
    >
      ?
    </button>
  )
}

/** Bảng hướng dẫn và lưu ý: gom ở một chỗ để màn chơi gọn. */
export default function HelpPanel({ onClose, inBattle = false }: { onClose: () => void; inBattle?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3" onClick={onClose}>
      <div className="max-h-[88dvh] w-full max-w-sm overflow-y-auto rounded-2xl border-2 border-amber-700 bg-stone-950 p-4 text-sm text-amber-50 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-black text-amber-300">Hướng dẫn</h2>
          <button onClick={onClose} aria-label="Đóng" className="rounded-full bg-stone-800 px-2.5 py-0.5 text-base font-bold">
            ✕
          </button>
        </div>

        <Section title="Cách chơi">
          <li>Đổi chỗ 2 ngọc liền kề để xếp hàng 3 ngọc cùng hệ trở lên.</li>
          <li>
            Mỗi lượt đi 1 nước, có {BALANCE.turnMs / 1000} giây; hết giờ là mất lượt. Còn ít thời gian sẽ có 2 ngọc chớp để gợi ý.
          </li>
          <li>Kẻ địch cũng xếp ngọc ở lượt của nó để tấn công.</li>
          {inBattle && <li>Mở bảng này sẽ tạm dừng đồng hồ lượt của bạn.</li>}
        </Section>

        <Section title="Ngũ hành tương khắc">
          <li>Kim 金 › Mộc 木 › Thổ 土 › Thủy 水 › Hỏa 火 › Kim 金</li>
          <li>
            Khắc chế: sát thương x{BALANCE.advantage}. Bị khắc: x{BALANCE.disadvantage}. Boss không thuộc hệ nào nên không bị ảnh hưởng.
          </li>
        </Section>

        <Section title="Tác dụng của ngọc">
          {ELEMENTS.map((e) => (
            <li key={e} className="flex items-center gap-1.5">
              <ElementDot element={e} size={16} />
              <span className="font-bold">{ELEMENT_INFO[e].label}:</span> {ELEMENT_INFO[e].effect}
            </li>
          ))}
        </Section>

        <Section title="Nộ và kỹ năng">
          <li>
            Ngọc cùng hệ với pet nạp +{BALANCE.ownRage} Nộ, ngọc hệ khác +{BALANCE.otherRage}. Đủ {BALANCE.maxRage} Nộ thì dùng kỹ năng.
          </li>
          <li>Dùng kỹ năng trong lượt của mình và không tốn lượt đi.</li>
          <li>Combo liên tiếp tăng hiệu quả thêm {Math.round(BALANCE.comboStep * 100)}% mỗi bậc.</li>
        </Section>

        <Section title="Ngọc đặc biệt">
          <li>💣 Xếp 4 ngọc hoặc hình chữ L/T: nổ vùng 3x3.</li>
          <li>⚡ Xếp 5 ngọc: quét cả hàng và cột.</li>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <h3 className="mb-1 text-xs font-black uppercase tracking-wide text-yellow-300">{title}</h3>
      <ul className="list-disc space-y-1 pl-4 text-[13px] text-amber-100/90 marker:text-amber-500">{children}</ul>
    </div>
  )
}
