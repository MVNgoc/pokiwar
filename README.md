# PokéGem

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
- **Chuyến đi ngẫu nhiên:** mỗi ván là **8-10 điểm dừng** do game sinh ra: ⚔️ trận thường, 💀 Tinh anh (mạnh hơn, được chọn 2 phần thưởng), 🏕️ điểm nghỉ (hồi 50% máu hoặc nhận 60 XP), cuối chuyến là 👑 Boss (chọn ngẫu nhiên trong 4 con). Hạ Boss để thắng. Điểm cao nhất và số lần thắng được lưu theo từng pet (`localStorage`).
- **Phần thưởng:** thắng trận được chọn 1 trong 3 **vật phẩm** ngẫu nhiên (hoặc nghỉ ngơi hồi 25% máu). Có 13 vật phẩm (Hỏa Tâm, Thủy Tinh, Nộ Tâm, Hút Máu, Đồng Hồ Cát, Bùa Hộ Mệnh…), cộng dồn tối đa 3 lần mỗi loại. Xem `src/game/relics.ts`.
- **Luật riêng của màn:** một số trận có luật: ⏱️ *Giới hạn lượt* (quá hạn kẻ địch cuồng nộ), 🌀 *Cộng hưởng* (một hệ ngọc mạnh x1.5, hệ khác yếu đi), ⚡ *Chớp nhoáng* (đồng hồ lượt rút còn 7 giây).
- **Kẻ địch có chiêu trò riêng:** 15 loài thường chia 3 tầng (xuất hiện sớm đến muộn) và 4 Boss. Mỗi con có đặc tính 🛡️ Giáp / 🌱 Hồi phục / 🔥 Cuồng nộ (ở nửa máu) và chiêu có thể gây ☠️ Độc / 🔒 Phong ấn / 📉 Suy yếu.
- **Mega:** pet ở dạng cuối có thêm nút **MEGA** cạnh nút kỹ năng. Bấm khi đầy Nộ (tốn hết Nộ, không tốn lượt đi) để mạnh hẳn lên **4 lượt**: ngọc x1.35, nạp Nộ x1.25, kỹ năng x1.5, kèm hồi 20% máu và +15 giáp; mỗi trận dùng một lần. Pet toả sáng hồng tím và phình to khi Mega. Thông số trong `BALANCE` (`mega*`).
- **Chướng ngại bàn cờ:** kẻ địch như Onix, Grotle, Torterra, Swampert thả **đá** (khối nặng, không đổi chỗ, không match; vỡ sau 2 lần có match liền kề, bom/tia điện phá ngay), còn Empoleon, Marshtomp, Croconaw, Feraligatr **đóng băng** ngọc (không đổi chỗ được cho đến khi match với nó làm tan băng). Luật màn 🪨 *Đống đổ nát* / ❄️ *Băng giá* đặt sẵn chướng ngại lúc vào trận. Sang màn mới bàn cờ được dọn sạch. Logic ở `src/game/board.ts` (`placeObstacles`, `resolveMatches`), chiêu gắn qua trường `hazard` của kẻ địch trong `constants.ts`.
- **Báo trước đòn:** kẻ địch đầy Nộ không tung chiêu ngay mà **tụ lực** 1-2 lượt (hiện cảnh báo ⚠️). Gây ≥ 20% máu tối đa của nó trong lúc tụ lực, hoặc làm nó choáng, để **ngắt chiêu**.

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
| 🔥 Hỏa | 150 | Hỏa Cầu Thiêu Đốt: 85 sát thương |
| 💧 Thủy | 150 | Suối Nguồn Sinh Mệnh: 30 sát thương, hồi 35% HP, +15 giáp |

Kim và Thổ chỉ có ở ngọc và kẻ địch. Danh sách kẻ địch (tầng, đặc tính, chiêu) nằm trong `ENEMIES` và `BOSSES` ở `src/game/constants.ts`; chuyến đi do `buildRun` trong `src/game/run.ts` sinh ra.

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
- **Thêm kẻ địch / vật phẩm / luật màn:** thêm vào `ENEMIES`, `BOSSES` (`constants.ts`), `RELICS` (`relics.ts`), hoặc `makeRule` (`run.ts`). Độ dài chuyến đi đặt bằng `RUN_LENGTH`.
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

## Tiến hóa
Pet có thanh XP (xanh dương, dưới thanh Nộ). XP nhận từ ngọc xếp được (ngọc cùng hệ nhiều hơn, combo nhân thêm) và từ việc kết liễu kẻ địch. Đủ XP thì tiến hóa dạng 2 rồi dạng 3: đổi hình và tên, tăng máu tối đa, sức mạnh ngọc, tốc độ nạp Nộ, chiêu mạnh hơn với tên mới, hồi 40% máu. Mốc XP và hệ số ở `BALANCE` (constants.ts) và `FORM_MUL` (pets.ts). Tiến hóa chỉ tính trong một ván.
