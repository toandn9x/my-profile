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
    'Hôm nay trời đẹp ghê, hoa đang nở rộ rồi đó.',
    'Kéo xuống dưới để xem các liên kết của mình nhé!',
    'Chạm vào bãi cỏ để mình đi dạo một vòng ~',
    'Bạn có thấy cái cây đằng kia giống cây cô đơn không? Chạm vào nó thử xem!',
    'Bật nhạc ở góc trên bên phải nghe thử đi!'
  ],
  hint: 'Thử chạm vào cây anh đào xem!',
  treeLines: [
    'Mưa hoa anh đào kìa!',
    'Gió thổi mát quá...',
    'Đếm thử xem có bao nhiêu cánh hoa?'
  ],
  // Chạm vào cây 7 lần để mở
  secret: 'Bạn tìm ra bí mật rồi! Cảm ơn đã ghé chơi nha ^^',

  // Mùa & giờ trong ngày. 'auto' = theo tháng / giờ trên máy người xem.
  // Xem thử nhanh bằng đường dẫn: index.html?season=winter&time=night
  world: {
    season: 'auto',      // 'auto' | 'spring' | 'summer' | 'autumn' | 'winter'
    time: 'auto',        // 'auto' | 'dawn' | 'day' | 'dusk' | 'night'
    cat: true,           // mèo ngủ cạnh gốc cây
    butterflies: true,   // bướm bay ban ngày
    birds: true          // chim sẻ ban ngày, cú mèo ban đêm
  },
  // Câu chào đầu tiên theo giờ (giờ nào bỏ trống thì dùng câu đầu trong greetings)
  timeGreetings: {
    dawn: 'Chào buổi sớm, lữ khách! Bình minh trên đảo đẹp lắm.',
    dusk: 'Hoàng hôn rồi, ngồi ngắm mặt trời lặn với mình nhé.',
    night: 'Khuya rồi mà vẫn ghé chơi à? Đèn lồng sáng cả rồi đó.'
  },
  // Câu nói khi chạm vào cây theo mùa (mùa nào bỏ trống thì dùng treeLines)
  seasonTreeLines: {
    summer: ['Bóng cây mát ghê...', 'Ve kêu râm ran khắp đảo.'],
    autumn: ['Lá phong rơi đỏ cả đảo rồi!', 'Mùa thu tới rồi đó.'],
    winter: ['Tuyết rơi lạnh quá...', 'Cây cũng khoác áo trắng rồi kìa.']
  },
  catLine: 'Suỵt... mèo đang ngủ đó, nhẹ tay thôi nha!',

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
    autoStart: true,   // tự bật nhạc ở lần chạm đầu tiên vào trang (false = chỉ bật bằng nút ♪)
    volume: 0.6,   // 0 → 1
    bpm: 88        // nhịp độ (chỉ áp dụng cho nhạc 8-bit tự tạo)
  }
};
