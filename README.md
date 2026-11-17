# Linh Thú Xếp Ngọc

Game web **match-3 kết hợp đấu pet** mang phong cách hoài cổ, viết bằng **React + TypeScript + Tailwind CSS** (Vite).
Xếp ngọc ngũ hành để nạp Nộ, hồi máu, dựng giáp và tung kỹ năng của pet hạ gục kẻ địch.

> Đây là game gốc, lấy cảm hứng từ thể loại xếp ngọc đấu pet. Tên, nhân vật và đồ họa (emoji, chữ Hán) đều tự làm.

## Chạy thử

```bash
npm install
npm run dev      # mở http://localhost:5173
npm run build    # kiểm tra kiểu + build production
npm test         # test logic game (board, combat, storage)
```

Yêu cầu Node.js 18+.

## Cách chơi

- **Hoán đổi ngọc:** kéo một ngọc sang ô bên cạnh, hoặc bấm chọn một ngọc rồi bấm ô liền kề. Nước đi không tạo được chuỗi 3+ sẽ tự trả lại.
- **Combo:** ngọc rơi xuống tự tạo match tiếp thì tính combo. Mỗi bước dây chuyền tăng 25% hiệu quả.
- **Kỹ năng:** khi thanh Nộ đầy, bấm nút kỹ năng của pet.
- **Kẻ địch** tự tấn công theo đồng hồ đếm ngược (thanh tím). Đồng hồ tạm dừng khi bàn cờ đang xử lý. Giáp hấp thụ sát thương trước.
- **5 màn**, màn cuối là Boss. Hạ Boss để thắng. Điểm cao nhất và số lần thắng được lưu theo từng pet (`localStorage`).

### Ngọc và hiệu ứng

| Ngọc | Hiệu ứng mỗi viên |
|---|---|
| 金 Kim | Gây sát thương |
| 木 Mộc | Hồi máu nhẹ |
| 水 Thủy | Hồi máu |
| 火 Hỏa | Gây sát thương nhẹ |
| 土 Thổ | Tạo giáp |

**Nộ:** ngọc cùng hệ với pet nạp +5 Nộ, ngọc hệ khác nạp +1. Ngọc cùng hệ với pet còn có hiệu quả ×1.5.

### Ngọc đặc biệt

- 💣 **Bom:** match 4, hoặc chuỗi ngang và dọc cắt nhau (chữ L, T). Khi bị phá, nổ vùng 3x3.
- ⚡ **Sét:** match 5 trở lên. Khi bị phá, xóa cả hàng và cột.
- Ngọc đặc biệt nổ dây chuyền khi bị ngọc đặc biệt khác quét trúng.

### Pet

| Pet | Hệ | HP | Kỹ năng |
|---|---|---|---|
| 🦊 Hỏa Hồ | Hỏa | 120 | Hỏa Cầu Thiêu Đốt: 60 sát thương |
| 🐢 Thủy Quy | Thủy | 150 | Suối Nguồn Sinh Mệnh: hồi 40% HP, +15 giáp |
| 🦌 Mộc Lộc | Mộc | 130 | Dây Leo Trói Buộc: 25 sát thương, choáng 5 giây |
| 🐯 Kim Hổ | Kim | 110 | Liên Hoàn Trảo: 3 đòn × 24 sát thương |
| 🦏 Thổ Tê | Thổ | 140 | Địa Chấn Thiết Giáp: 30 sát thương, +40 giáp |

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
│  ├─ combat.ts       Sát thương, hồi máu, Nộ, giáp, kỹ năng, tương khắc, Boss
│  ├─ storage.ts      Lưu kỷ lục (localStorage)
│  └─ sfx.ts          Âm thanh tổng hợp bằng Web Audio
├─ hooks/useGame.ts   Nối logic với UI: chuỗi combo, đồng hồ kẻ địch, hoạt ảnh
└─ components/        Board, Tile, BattleScreen, StatusBars, PetSelect
```

Quy tắc: logic game nằm trong `src/game` (hàm thuần, dễ test), component chỉ hiển thị, `useGame` điều phối thời gian và hoạt ảnh.

## Tùy chỉnh

- **Cân bằng:** sửa `BALANCE` trong `src/game/constants.ts` (sát thương, hồi máu, Nộ, hệ số khắc chế, độ mạnh Boss).
- **Thêm pet:** thêm một mục vào `PETS` trong `src/game/pets.ts`. Kỹ năng gồm `damage`, `hits`, `healPct`, `shield`, `stunMs`, kết hợp tùy ý.
- **Thêm kẻ địch:** sửa `ENEMIES` trong `constants.ts`. Số màn đặt bằng `TOTAL_STAGES`.
- **Âm thanh:** có nút 🔊/🔇 trong trận. Âm thanh được tổng hợp trực tiếp nên không có file âm thanh nào, muốn đổi thì sửa `src/game/sfx.ts`.

## Hướng phát triển

- Kỹ năng riêng cho Boss và kẻ địch
- Nhạc nền
- Thêm pet, cấp độ và tiến hóa pet
- Gợi ý nước đi
