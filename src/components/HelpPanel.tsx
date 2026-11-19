import Icon, { type IconName } from './Icon'
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

const I = ({ n }: { n: IconName }) => <Icon name={n} size={13} className="mx-0.5 text-yellow-300" />

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

        <Section title="Chuyến đi">
          <li>Mỗi ván là một chuyến 8-10 điểm dừng, mỗi ván một khác. Thanh ô tròn phía trên cho biết bạn đang ở đâu.</li>
          <li><I n="sword" /> trận thường · <I n="skull" /> Tinh anh (mạnh hơn, được chọn 2 phần thưởng) · <I n="camp" /> điểm nghỉ (hồi máu hoặc nhận XP) · <I n="crown" /> Boss cuối.</li>
          <li>Thắng trận được chọn 1 trong 3 vật phẩm (hoặc nghỉ ngơi). Vật phẩm cộng dồn, mỗi loại tối đa 3 lần.</li>
          <li>Một số trận có luật riêng: <I n="timer" /> giới hạn lượt (quá hạn kẻ địch cuồng nộ), <I n="swirl" /> một hệ ngọc mạnh lên, <I n="bolt" /> đồng hồ lượt rút ngắn.</li>
        </Section>

        <Section title="Kẻ địch">
          <li><I n="warn" /> Tụ lực: kẻ địch đầy Nộ sẽ báo trước đòn và tung sau vài lượt. Gây đủ 20% máu tối đa của nó trong lúc tụ lực, hoặc làm nó choáng, để ngắt chiêu.</li>
          <li>Đặc tính: <I n="shield" /> Giáp (tự dựng giáp), <I n="regen" /> Hồi phục (tự hồi máu), <I n="flame" /> Cuồng nộ (mạnh hẳn lên khi còn nửa máu).</li>
          <li>Chiêu có thể gây: <I n="skull" /> Độc (mất máu mỗi lượt), <I n="lock" /> Phong ấn (không dùng được kỹ năng), <I n="down" /> Suy yếu (ngọc yếu đi).</li>
        </Section>

        <Section title="Ngũ hành tương khắc">
          <li>Kim › Mộc › Thổ › Thủy › Hỏa › Kim</li>
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

        <Section title="Mega">
          <li>Khi pet đạt dạng cuối, nút MEGA xuất hiện cạnh nút kỹ năng. Bấm khi đầy Nộ (tốn hết Nộ, không tốn lượt đi).</li>
          <li>Trong {BALANCE.megaTurns} lượt: ngọc mạnh x{BALANCE.megaPower}, nạp Nộ x{BALANCE.megaRage}, kỹ năng mạnh x{BALANCE.megaSkill}. Hồi {Math.round(BALANCE.megaHeal * 100)}% máu và +{BALANCE.megaShield} giáp ngay khi kích hoạt.</li>
          <li>Mỗi trận chỉ Mega được một lần. Cân nhắc dùng Nộ cho Mega hay cho kỹ năng.</li>
        </Section>

        <Section title="Ngọc đặc biệt">
          <li>Xếp 4 ngọc hoặc hình chữ L/T: ra ngọc có vòng sóng cam lan ra quanh viên. Khi nổ phá vùng 3x3.</li>
          <li>Xếp 5 ngọc: ra ngọc có tia điện vàng quanh viên. Khi nổ quét cả hàng và cột.</li>
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
