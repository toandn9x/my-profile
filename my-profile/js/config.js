/* ==========================================================
   CẤU HÌNH CẢNH & NHÂN VẬT
   (Tên, giới thiệu, liên kết... sửa trực tiếp trong index.html)
   ========================================================== */
window.SITE_CONFIG = {
  // Đổi số này để có một hòn đảo/cây/mây với hình dạng khác
  seed: 2026,

  // Lời nhân vật nói khi được chạm vào (lần lượt)
  greetings: [
    'Xin chào, lữ khách! Chào mừng đến hòn đảo của Toandn.',
    'Hôm nay trời đẹp ghê, hoa anh đào nở rộ rồi đó.',
    'Kéo xuống dưới để xem các liên kết của mình nhé!',
    'Chạm vào bãi cỏ để mình đi dạo một vòng~',
    'Bật nhạc ở góc trên bên phải nghe thử đi!'
  ],
  hint: 'Thử chạm vào cây anh đào xem!',
  treeLines: [
    'Mưa hoa anh đào kìa!',
    'Gió thổi mát quá...',
    'Đếm thử xem có bao nhiêu cánh hoa?'
  ],
  // Chạm vào cây 7 lần để mở
  secret: 'Bạn tìm ra bí mật rồi! Cảm ơn đã ghé chơi nha.',

  // Tên nổi trên đầu nhân vật (giống tên người chơi trong game nhập vai)
  nameTag: {
    show: true,
    name: 'Toandn',             // để '' = lấy tên trong thẻ hồ sơ (index.html)
    title: 'Lữ khách thời gian',    // danh hiệu ở dòng trên, để '' nếu không cần
    color: '#ffe45c',           // màu tên
    titleColor: '#ff9fd9'       // màu danh hiệu
  },

  // Màu nhân vật (mã hex). Xoá dòng nào để dùng màu mặc định.
  character: {
    hair: '#5b3328',
    hairLight: '#8c5236',
    scarf: '#e84f5c',
    scarfDark: '#a8304b',
    cloth: '#3f60da',
    clothDark: '#2a3d9e',
    clothLight: '#82a3ff'
  },

  music: {
    // Nhạc riêng: chép file vào thư mục assets rồi ghi đường dẫn, ví dụ 'assets/music.mp3'
    // Để trống '' = dùng nhạc 8-bit tự tạo
    file: 'assets/music.mp3',
    volume: 0.6,   // 0 → 1
    bpm: 88        // nhịp độ (chỉ áp dụng cho nhạc 8-bit tự tạo)
  }
};
