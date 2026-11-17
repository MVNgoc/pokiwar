# Linh Thú Xếp Ngọc

Game web **match-3 kết hợp đấu pet** đồ họa **3D**, viết bằng **React + TypeScript + Tailwind CSS** (Vite) và **three.js** (React Three Fiber).
Xếp ngọc ngũ hành để nạp Nộ, hồi máu, dựng giáp và tung kỹ năng của pet hạ gục kẻ địch.

> Đây là game gốc, lấy cảm hứng từ thể loại xếp ngọc đấu pet. Tên, nhân vật và cách chơi đều tự thiết kế; mọi tài nguyên bên ngoài đều là CC0 (xem mục Tài nguyên).

## Chạy thử

```bash
npm install
npm run dev      # mở http://localhost:5173
npm run build    # kiểm tra kiểu + build production
npm test         # test logic game (board, combat, storage)
npm run sim      # mô phỏng cân bằng: bot chơi hàng trăm ván, in tỉ lệ thắng từng pet
```

Yêu cầu Node.js 18+.

## Cách chơi

- **Hoán đổi ngọc:** kéo một ngọc sang ô bên cạnh, hoặc bấm chọn một ngọc rồi bấm ô liền kề. Nước đi không tạo được chuỗi 3+ sẽ tự trả lại.
- **Combo:** ngọc rơi xuống tự tạo match tiếp thì tính combo. Mỗi bước dây chuyền tăng 25% hiệu quả.
- **Đánh theo lượt:** hai bên thay nhau, mỗi lượt đi **1 nước** trên cùng một bàn cờ. Mỗi lượt có đồng hồ đếm ngược 12 giây (thanh xanh dưới thanh Nộ của bên đang có lượt); **hết giờ mà chưa xếp ngọc thì mất lượt**. Đồng hồ tạm dừng khi bàn cờ đang xử lý combo. Nước đi không tạo được match sẽ được trả lại và bạn đi lại, không mất lượt.
- **Kẻ địch tự xếp ngọc:** tới lượt, AI của kẻ địch tự chọn nước đi trên bàn cờ (bạn thấy nó nhá hai viên định đổi). Sát thương, hồi máu, Nộ và giáp của nó đều đến từ ngọc nó xếp được, theo cùng công thức với pet. Màn đầu AI hay đi sai, về sau ít sai dần; Boss gần như không sai.
- **Kỹ năng:** khi thanh Nộ đầy, bấm nút kỹ năng **trong lượt của mình** (không tốn lượt đi). Kẻ địch đầy Nộ cũng tung kỹ năng riêng ở đầu lượt của nó. Giáp hấp thụ sát thương trước. Boss vô hệ, không bị ảnh hưởng bởi tương khắc.
- **5 màn**, màn cuối là Boss. Hạ Boss để thắng. Điểm cao nhất và số lần thắng được lưu theo từng pet (`localStorage`).

### Ngọc và hiệu ứng

| Ngọc | Hiệu ứng mỗi viên |
|---|---|
| 金 Kim | Gây sát thương |
| 木 Mộc | Hồi máu nhẹ |
| 水 Thủy | Hồi máu |
| 火 Hỏa | Gây sát thương nhẹ |
| 土 Thổ | Tạo giáp (tối đa 40) |

**Nộ:** ngọc cùng hệ với pet nạp +5 Nộ, ngọc hệ khác nạp +1. Ngọc cùng hệ với pet còn có hiệu quả ×1.5.

### Ngọc đặc biệt

- 💣 **Bom:** match 4, hoặc chuỗi ngang và dọc cắt nhau (chữ L, T). Khi bị phá, nổ vùng 3x3.
- ⚡ **Sét:** match 5 trở lên. Khi bị phá, xóa cả hàng và cột.
- Ngọc đặc biệt nổ dây chuyền khi bị ngọc đặc biệt khác quét trúng.

### Pet

| Pet | Hệ | HP | Kỹ năng |
|---|---|---|---|
| 😈 Hỏa Ma | Hỏa | 150 | Hỏa Cầu Thiêu Đốt: 80 sát thương |
| 🐧 Thủy Điểu | Thủy | 150 | Suối Nguồn Sinh Mệnh: 30 sát thương, hồi 40% HP, +15 giáp |
| 🦌 Mộc Lộc | Mộc | 130 | Dây Leo Trói Buộc: 25 sát thương, kẻ địch mất 1 lượt |
| 🐼 Kim Hùng | Kim | 145 | Liên Hoàn Trảo: 3 đòn × 28 sát thương |
| 👁️ Thổ Nhãn | Thổ | 140 | Địa Chấn Thiết Giáp: 30 sát thương và +40 giáp |

Kẻ địch theo thứ tự các màn: 🍄 Nấm Rừng (Mộc), 🦇 Dơi Xám (Kim), 🐙 Quái Biển (Thủy), 💀 Sọ Cổ (Thổ), 🐉 Rồng Hoàng Kim (Hỏa, Boss).

### Tương khắc ngũ hành

**Kim › Mộc › Thổ › Thủy › Hỏa › Kim.** Khắc chế gây ×1.5 sát thương, bị khắc chỉ ×0.7. Áp dụng hai chiều: pet đánh kẻ địch và kẻ địch đánh pet. Mỗi kẻ địch có một hệ riêng.

## Cấu trúc mã nguồn

```
src/
├─ game/              Logic thuần, không phụ thuộc React (có test)
│  ├─ types.ts        Kiểu dữ liệu
│  ├─ constants.ts    Nguyên tố, tương khắc, kẻ địch, thông số cân bằng (BALANCE)
│  ├─ pets.ts         Danh sách pet và kỹ năng (khai báo bằng dữ liệu)
│  ├─ board.ts        Bàn cờ 8x8: tạo bàn, tìm match, swap, ngọc đặc biệt, rơi ngọc
│  ├─ combat.ts       Chiến đấu theo lượt cho cả hai bên: sát thương, hồi máu, Nộ, giáp, kỹ năng, tương khắc, Boss, đổi lượt
│  ├─ ai.ts           AI kẻ địch: chấm điểm các nước đi và chọn nước
│  ├─ storage.ts      Lưu kỷ lục (localStorage)
│  └─ sfx.ts          Âm thanh tổng hợp bằng Web Audio
├─ hooks/useGame.ts   Điều phối trận đấu: lượt, đồng hồ, AI kẻ địch, chuỗi combo, hiệu ứng
├─ three/             Cảnh 3D (three.js / React Three Fiber)
│  ├─ BoardScene.tsx  Bàn cờ 3D + nhận thao tác kéo/bấm bằng tia chiếu
│  ├─ Tile3D.tsx      Ngọc 3D: rơi theo trọng lực, nảy, bóp méo, nổ tia sáng
│  ├─ gems.tsx        Hình khối và vật liệu 5 hệ ngọc (dựng bằng hình học, không cần model)
│  ├─ ArenaScene.tsx  Sàn đấu 3D phía trên
│  ├─ Creature.tsx    Nhân vật: hoạt ảnh xương có sẵn + chuyển động thở/lao tới/giật lùi/ngã
│  ├─ loadCharacter.ts Tải model FBX + texture WebP, chuẩn hóa kích thước
│  ├─ Fx3D.tsx, fxPlans.ts  Hiệu ứng kỹ năng 3D và kịch bản từng nhân vật
│  └─ easing.ts
└─ components/        Giao diện HTML phủ lên cảnh 3D: Board, BattleScreen, StatusBars, PetSelect
```

Quy tắc: logic game nằm trong `src/game` (hàm thuần, dễ test), component chỉ hiển thị, `useGame` điều phối thời gian và hoạt ảnh.

## Cân bằng game

`npm run sim [số ván] [ms nghĩ mỗi nước]` cho bot chơi nhiều ván với từng pet (bot "khá" chọn nước ăn nhiều nhất, bot "ngẫu nhiên" chọn nước hợp lệ bất kỳ). Có thể thử thông số mà không sửa code:

```bash
BAL='{"enemyPower":0.25,"enemyHp":120}' SKILLS=smart npm run sim -- 60
```

Mô phỏng chạy theo lượt: bot đóng vai người chơi, kẻ địch dùng chính AI của game. Có ba mức bot: *thông minh* (chấm điểm theo hiệu ứng như người chơi giỏi), *khá* (chọn nước ăn nhiều ngọc nhất) và *ngẫu nhiên*. Mục tiêu hiện tại: bot thông minh/khá thắng khoảng 55–75%, các pet chênh nhau không quá ~15%; bot ngẫu nhiên gần như không thắng được (đúng kỳ vọng khi đấu với AI biết xếp ngọc). Bot đi ngay nên không mô phỏng giới hạn thời gian lượt; mô phỏng cũng chỉ là ước lượng, số liệu từ người chơi thật vẫn là chuẩn nhất.

## Tùy chỉnh

- **Cân bằng:** sửa `BALANCE` trong `src/game/constants.ts` (sát thương, hồi máu, Nộ, hệ số khắc chế, độ mạnh Boss).
- **Thêm pet:** thêm một mục vào `PETS` trong `src/game/pets.ts`. Kỹ năng gồm `damage`, `hits`, `healPct`, `shield`, `stunMs`, kết hợp tùy ý.
- **Thêm kẻ địch:** sửa `ENEMIES` trong `constants.ts`. Số màn đặt bằng `TOTAL_STAGES`.
- **Nhân vật 3D:** nằm trong `public/models/` (`<id>.fbx` + `<id>.webp`). Thêm nhân vật mới: bỏ file vào đó và thêm mục tương ứng trong `pets.ts` / `ENEMIES`, rồi khai báo kịch bản hiệu ứng trong `src/three/fxPlans.ts`.
- **Âm thanh:** có nút 🔊/🔇 trong trận. Hiệu ứng âm thanh được tổng hợp trực tiếp (sửa ở `src/game/sfx.ts`), nhạc nền là file OGG trong `src/assets/music/` và được điều khiển bởi `src/game/music.ts`.

## Tài nguyên

- **Nhân vật 3D (pet và kẻ địch):** [Cute Animated Monsters](https://opengameart.org/content/textured-cute-monster-pack) của Quaternius, giấy phép CC0. Dùng 10 model, texture thu nhỏ về 512 px (WebP), giữ nguyên file FBX gốc trong `public/models/` (kèm `CREDITS.txt`). Hoạt ảnh xương (Idle, Bite, HitRecieve, Death) lấy từ chính các file này.
- **Ngọc 3D:** dựng bằng hình học three.js (không dùng model ngoài). Biểu tượng ngọc 2D ở phần chú thích và chọn pet: [Puzzle Pack II](https://opengameart.org/node/40563) của Kenney, CC0, trong `src/assets/gems/`.
- **Nhạc nền:** [Chiptune Battle Music](https://opengameart.org/content/chiptune-battle-music) của pmiller (màn thường) và [8 bit battle loop](https://opengameart.org/content/8-bit-battle-loop) của Wolfgang_ (màn Boss), đều CC0, trong `src/assets/music/` (kèm `CREDITS.txt`). Nút 🔊/🔇 tắt cả nhạc lẫn hiệu ứng âm thanh. Nhạc dùng định dạng OGG Vorbis.
- **Hiệu ứng kỹ năng:** dựng bằng hạt và hình học three.js (`src/three/Fx3D.tsx`).

## Hướng phát triển

- Kỹ năng riêng đa dạng hơn cho từng kẻ địch và Boss
- Thêm pet, cấp độ và tiến hóa pet
- Tối ưu cho điện thoại yếu (giảm chất lượng, model GLB nén)
- Gợi ý nước đi
