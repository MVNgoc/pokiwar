# Ngọc Linh Đại Chiến

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
| Kim | Gây sát thương |
| Mộc | Hồi máu nhẹ |
| Thủy | Hồi máu |
| Hỏa | Gây sát thương nhẹ |
| Thổ | Tạo giáp (tối đa 40) |

**Nộ:** ngọc cùng hệ với pet nạp +5 Nộ, ngọc hệ khác nạp +1. Ngọc cùng hệ với pet còn có hiệu quả ×1.5.

### Ngọc đặc biệt

- **Bom** (vầng sáng đỏ, vòng sóng cam lan ra): match 4, hoặc chuỗi ngang và dọc cắt nhau (chữ L, T). Khi bị phá, nổ vùng 3x3.
- **Sét** (tia điện vàng quanh viên): match 5 trở lên. Khi bị phá, xóa cả hàng và cột.
- Ngọc đặc biệt nổ dây chuyền khi bị ngọc đặc biệt khác quét trúng.

### Pet

Chỉ có 3 pet khởi đầu mỗi thế hệ (Mộc, Hỏa, Thủy), 5 thế hệ = 15 pet. Chỉ số và kỹ năng theo hệ:

| Hệ | HP | Kỹ năng |
|---|---|---|
| 🌱 Mộc | 130 | Dây Leo Trói Buộc: 25 sát thương, kẻ địch mất 1 lượt |
| 🔥 Hỏa | 150 | Hỏa Cầu Thiêu Đốt: 80 sát thương |
| 💧 Thủy | 150 | Suối Nguồn Sinh Mệnh: 30 sát thương, hồi 40% HP, +15 giáp |

Kim và Thổ chỉ có ở ngọc và kẻ địch. Kẻ địch theo thứ tự các màn: 🌿 Oddish (Mộc), 🧲 Magnemite (Kim), 🐟 Magikarp (Thủy), 🪨 Onix (Thổ), 🐲 Charizard (Hỏa, Boss).

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
│  ├─ gemModels.ts    Nạp model 5 loại ngọc và tô màu theo hệ
│  ├─ gems.tsx        Màu 5 hệ và biểu tượng ngọc đặc biệt
│  ├─ ArenaScene.tsx  Sàn đấu 3D phía trên
│  ├─ Creature.tsx    Nhân vật: hoạt ảnh xương có sẵn + chuyển động thở/lao tới/giật lùi/ngã
│  ├─ loadCharacter.ts Tải model GLB, đổi sang tô bóng hoạt hình, chuẩn hóa kích thước
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
- **Nhân vật 3D:** nằm trong `public/models/` (`<id>.glb`). Thêm nhân vật mới: bỏ file `.glb` vào đó (tùy chỉnh độ cao, hướng trong `MODEL_OPTIONS` ở `loadCharacter.ts`) và thêm mục tương ứng trong `pets.ts` / `ENEMIES`, rồi khai báo kịch bản hiệu ứng trong `src/three/fxPlans.ts`.
- **Âm thanh:** có nút 🔊/🔇 trong trận. Hiệu ứng âm thanh được tổng hợp trực tiếp (sửa ở `src/game/sfx.ts`), nhạc nền là file OGG trong `src/assets/music/` và được điều khiển bởi `src/game/music.ts`.

## Tài nguyên

- **Nhân vật và ngọc 3D:** model của Quaternius (CC0) lấy từ [Poly Pizza](https://poly.pizza): nhân vật từ pack [Ultimate Monsters](https://quaternius.com/packs/ultimatemonsters.html) (có xương và hoạt ảnh), ngọc từ [Ultimate RPG Items Pack](https://quaternius.com/packs/ultimaterpg.html). File `.glb` nằm trong `public/models/` (ngọc ở `public/models/gems/`), tải trực tiếp không qua chuyển đổi. Màu ngọc được tô lại theo hệ trong code. Xem `public/models/CREDITS.txt`.
- **Nhạc nền:** [Chiptune Battle Music](https://opengameart.org/content/chiptune-battle-music) của pmiller (màn thường) và [8 bit battle loop](https://opengameart.org/content/8-bit-battle-loop) của Wolfgang_ (màn Boss), đều CC0, trong `src/assets/music/` (kèm `CREDITS.txt`). Nút 🔊/🔇 tắt cả nhạc lẫn hiệu ứng âm thanh. Nhạc dùng định dạng OGG Vorbis.
- **Hiệu ứng kỹ năng:** dựng bằng hạt và hình học three.js (`src/three/Fx3D.tsx`).

## Hướng phát triển

- Kỹ năng riêng đa dạng hơn cho từng kẻ địch và Boss
- Thêm pet, cấp độ và tiến hóa pet
- Tối ưu cho điện thoại yếu (giảm chất lượng, model GLB nén)
- Gợi ý nước đi

## Model cá nhân (tùy chọn)
Đặt file `.glb` vào `public/local-assets/<id>.glb` (xem `public/local-assets/README.md` để biết danh sách id). Game dùng file đó nếu có, không thì dùng model CC0 trong `public/models`. Thư mục này nằm trong `.gitignore`, không đưa lên git.
