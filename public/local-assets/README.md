# local-assets

Thư mục này **không được đưa lên git** (xem .gitignore, trừ file README này).

Đặt model 3D cá nhân vào đây, tên file trùng id nhân vật, định dạng `.glb`:

  Pet:        cao-lua.glb  cut-thuy.glb  huou-moc.glb  ho-kim.glb  voi-tho.glb
  Kẻ địch:    sau-xanh.glb  meo-xam.glb  ca-hay.glb  heo-rung.glb  su-tu-lua.glb (Boss)

Game ưu tiên file ở đây; thiếu file nào thì tự dùng model Cube Pets (CC0) trong `public/models`.
Texture rời (nếu có) đặt cạnh file `.glb` theo đúng đường dẫn mà file tham chiếu.

Hình 2D (tùy chọn, thay cho model 3D): đặt cạnh nhau cùng tên id
  <id>.gif  ảnh động (giải mã bằng ImageDecoder của Chrome/Edge; trình duyệt khác tự dùng .png)
  <id>.png  ảnh tĩnh nền trong suốt
Thứ tự ưu tiên: .glb > .gif > .png > model đi kèm.

Icon ngọc theo hệ: gems/<hệ>.png (hoa, thuy, moc, kim, tho).
  <id>.back.gif  (tùy chọn, chỉ pet) ảnh nhìn từ sau lưng, dùng cho pet của người chơi trong trận; thiếu thì dùng <id>.gif
