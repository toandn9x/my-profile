/* ==========================================================
   Cảnh pixel art: hòn đảo bay, cây anh đào, mây và nhân vật.
   Mọi hình đều được vẽ thủ tục bằng code — không cần file ảnh.
   ========================================================== */
(function () {
  'use strict';
  var PX = window.PX;

  function ramp(list) { return list.map(function (c) { return PX.hex(c); }); }

  // Bảng màu (tối -> sáng)
  var HEX = {
    rock: ['#1b1424', '#291f34', '#382d45', '#4a3e57', '#5f526c', '#776984', '#91859d'],
    grass: ['#163a29', '#1e5431', '#297336', '#3c923a', '#5ab043', '#86cd52', '#b6eb75'],
    bark: ['#150d14', '#22161e', '#332229', '#473030', '#5d423b'],
    bloom: ['#66235d', '#8e3680', '#b955a8', '#dc7ec8', '#f2a4de', '#ffccef', '#fff0fa'],
    // trời gần như phẳng như ảnh gốc, chỉ đậm nhẹ ở trên
    sky: ['#2e6fe3', '#3175e7', '#347aea', '#377fed', '#3a84ef', '#3e8af0', '#4290f1'],
    // mây giữa trời: [tông đậm, tông sáng]
    // mây trên trời: 5 sắc độ tối → sáng, bóng ngả lam, sáng ngả xanh ngọc như biển mây
    far: ['#4f9ff2', '#66b4f5', '#86c8f7', '#a8dbf9', '#c9ecfc'],   // xa: tương phản thấp, hoà vào trời
    mid: ['#5aaaf3', '#7fc4f6', '#a9def9', '#d4f2fd', '#f6fdff']    // gần: sáng rõ, đỉnh gần trắng
  };
  var R = {};
  Object.keys(HEX).forEach(function (k) { R[k] = ramp(HEX[k]); });

  /* ---------------------------------------------------------
     THỜI GIAN TRONG NGÀY: bầu trời, mây, biển mây, ánh sáng phủ lên đảo
     bank: [màu lớp, màu dải lụa] cho 2 lớp sau + 4 lớp trước
     --------------------------------------------------------- */
  var PHASES = {
    dawn: {
      sky: ['#4a5bb5', '#5f66bc', '#7974c3', '#9682c7', '#b690c6', '#d69fc0', '#eeb0b6', '#ffc4a8'],
      far: ['#8a83c6', '#a391cb', '#c1a2cf', '#ddb5d3', '#f4ccd9'],
      mid: ['#9a8acb', '#bf9bce', '#e4b1cc', '#fdcfcf', '#fff0ea'],
      bank: [['#8d86cf', '#9a92d3'], ['#a493d3', '#b29fd6'], ['#bea1d4', '#cdaed8'], ['#d6b0d5', '#e4bfd9'], ['#ebc0d4', '#f6cfd9'], ['#f9d2d2', '#ffe0dc']],
      tint: 'rgba(255,170,160,0.12)', sun: ['#ffb27a', '#ffd49a', '#fff1cf'], theme: '#5f66bc'
    },
    day: {
      sky: HEX.sky, far: HEX.far, mid: HEX.mid,
      bank: [['#4597f0', '#4fa7f3'], ['#53b2f4', '#5dc3f6'], ['#5cc5f4', '#68d3f7'], ['#68d3f7', '#78e0fa'], ['#76dffa', '#8beefd'], ['#84e7fb', '#9cf3fe']],
      tint: null, theme: '#2e6fe3'
    },
    dusk: {
      sky: ['#2c2f7a', '#3d3485', '#543b8d', '#703f8f', '#8e448c', '#b04d86', '#d25e7e', '#ee7a72'],
      far: ['#6a4a92', '#895496', '#ae6396', '#d27992', '#f19992'],
      mid: ['#7a4f96', '#a65e98', '#d57696', '#f99b95', '#ffcaa6'],
      bank: [['#5d4796', '#684f9c'], ['#764f9c', '#8158a2'], ['#9157a0', '#9e60a5'], ['#ad629f', '#ba6ca4'], ['#c86d9c', '#d478a2'], ['#e07b98', '#ea889f']],
      tint: 'rgba(255,105,85,0.16)', sun: ['#ff8a5c', '#ffb070', '#ffe0a3'], flies: 4, theme: '#3d3485'
    },
    night: {
      sky: ['#070b24', '#0b112f', '#0f1739', '#141e45', '#1a2651', '#202e5d', '#273769'],
      far: ['#1d2858', '#253263', '#2f3d70', '#3b4a7e', '#4a5a8f'],
      mid: ['#222e60', '#2c396c', '#3a4879', '#4c5b8c', '#64749f'],
      bank: [['#141c48', '#19224f'], ['#18224f', '#1d2856'], ['#1d2858', '#232f60'], ['#232f61', '#293669'], ['#29376b', '#303f73'], ['#304075', '#37487d']],
      tint: 'rgba(12,16,60,0.46)', moon: true, lanterns: true, flies: 12, theme: '#0b112f'
    }
  };

  /* ---------------------------------------------------------
     BỐN MÙA: màu tán cây, mặt cỏ, thứ rơi xuống, đồ trang trí trên cỏ
     --------------------------------------------------------- */
  var SEASONS = {
    spring: {
      leaf: HEX.bloom, grass: HEX.grass, fall: ['#dc7ec8', '#f2a4de', '#ffccef'], rate: 1.7,
      flowers: ['#fff6e0', '#ffe27a', '#ffb8e4', '#c9f4ff'], litter: ['#dc7ec8', '#f2a4de', '#ffccef'], flies: 1
    },
    summer: {
      leaf: ['#10342c', '#164d38', '#1f6a40', '#2b8946', '#40a650', '#64c25c', '#97dd78'], grass: HEX.grass,
      fall: ['#2b8946', '#40a650', '#64c25c'], rate: 0.35,
      flowers: ['#fff6e0', '#ffe27a', '#ffffff', '#c9f4ff', '#ffb8e4'], litter: null, flies: 1.6
    },
    autumn: {
      leaf: ['#4e1616', '#7e2418', '#ad3c1c', '#d45e26', '#ec8a35', '#f7b454', '#ffd88a'],
      grass: ['#2b3518', '#435020', '#5f6a27', '#7f8530', '#a2a03e', '#c4bb56', '#e3d685'],
      fall: ['#ad3c1c', '#d45e26', '#ec8a35'], rate: 2.2,
      flowers: ['#ffe27a', '#fff6e0'], litter: ['#ad3c1c', '#d45e26', '#ec8a35', '#f7b454'], flies: 0.8
    },
    winter: {
      leaf: ['#4d5b84', '#6f80aa', '#97a8cc', '#bccbe5', '#dbe5f4', '#eef3fb', '#ffffff'],
      grass: ['#5d6b93', '#7e8fb7', '#a3b3d5', '#c4d1ea', '#dde6f5', '#eef3fb', '#ffffff'],
      fall: ['#dbe5f4', '#eef3fb', '#ffffff'], rate: 0.2, flowers: [], litter: null, snow: true, flies: 0
    }
  };

  // Mốc đổi cảnh trong ngày (giờ bắt đầu) và tháng bắt đầu mỗi mùa — dùng chung với đồng hồ thời gian
  var PHASE_MARKS = [{ h: 5, key: 'dawn' }, { h: 7, key: 'day' }, { h: 17, key: 'dusk' }, { h: 19.5, key: 'night' }];
  var SEASON_STARTS = [{ m: 3, key: 'spring' }, { m: 6, key: 'summer' }, { m: 9, key: 'autumn' }, { m: 12, key: 'winter' }];
  function phaseAtHour(h) {
    var key = 'night';
    PHASE_MARKS.forEach(function (mk) { if (h >= mk.h) key = mk.key; });
    return key;
  }
  function phaseAt(d) { return phaseAtHour(d.getHours() + d.getMinutes() / 60); }
  function seasonOfMonth(m) {   // m: 1–12
    return m >= 3 && m <= 5 ? 'spring' : m >= 6 && m <= 8 ? 'summer' : m >= 9 && m <= 11 ? 'autumn' : 'winter';
  }
  function seasonAt(d) { return seasonOfMonth(d.getMonth() + 1); }

  // Bảng màu đang dùng cho các hàm dựng hình (đổi theo mùa/giờ trước khi dựng)
  var T = { grass: R.grass, leaf: R.bloom, sky: R.sky, flowers: SEASONS.spring.flowers, litter: SEASONS.spring.litter };

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  // Hình siêu elip (mặt trên của đảo, nhìn phối cảnh)
  function inSE(x, y, o, shrink) {
    var rx = o.rx - shrink, ry = o.ry - shrink * 0.45;
    if (rx <= 0 || ry <= 0) return false;
    return Math.pow(Math.abs((x - o.cx) / rx), o.p) + Math.pow(Math.abs((y - o.cy) / ry), o.p) <= 1;
  }

  /* ---------------------------------------------------------
     ĐẢO: mặt cỏ + vách đá dạng cột + chóp đá rủ xuống
     kind: 1 = đá, 2 = mặt cỏ, 3 = trang trí, 5 = mép cỏ rủ
     --------------------------------------------------------- */
  function landmass(buf, o, r) {
    var x0 = Math.floor(o.cx - o.rx), x1 = Math.ceil(o.cx + o.rx);
    var F = {}, B = {}, D = {}, segF = {}, segB = {}, seg = o.seg || 3;
    var x, y, k;

    for (x = x0; x <= x1; x++) {
      var u = Math.abs((x + 0.5 - o.cx) / o.rx);
      if (u >= 1) continue;
      var h = o.ry * Math.pow(1 - Math.pow(u, o.p), 1 / o.p);
      var s = Math.floor((x - x0) / seg);
      if (!(s in segF)) { segF[s] = r.pick(o.edgeF || [0, 0, 1, 1, 2]); segB[s] = r.pick([0, 0, 1]); }
      F[x] = Math.round(o.cy + h) + segF[s];
      B[x] = Math.round(o.cy - h) - segB[s];
    }

    // Chia vách thành các cột đá, mỗi cột có độ sâu + chóp riêng
    var cols = [], c0 = x0;
    while (c0 <= x1) {
      var w = r.int(o.colW[0], o.colW[1]);
      cols.push({ a: c0, b: Math.min(x1, c0 + w - 1) });
      c0 += w;
    }
    cols.forEach(function (c) {
      var mid = (c.a + c.b + 1) / 2, u = (mid - o.cx) / o.rx, body = Math.max(0, 1 - u * u);
      var base = o.minD + (o.maxD - o.minD) * Math.pow(body, o.taper || 0.9);
      c.depth = Math.max(o.minD, Math.round(base + o.spike * r.range(-0.25, 1) * (0.3 + 0.7 * body)));
      c.tone = r.range(-0.05, 0.05);
      c.pointy = r() < 0.55;
      c.ledges = [];
      for (var n = r.int(1, 3); n > 0; n--) c.ledges.push(r.int(3, Math.max(4, c.depth - 3)));
      var half = (c.b - c.a + 1) / 2;
      for (var xx = c.a; xx <= c.b; xx++) {
        if (!(xx in F)) continue;
        var kk = Math.abs(xx + 0.5 - (c.a + half)) / half, d = c.depth;
        if (c.pointy) d -= Math.round(kk * kk * Math.min(6, c.depth * 0.4));
        else if (kk > 0.7) d -= 1;
        D[xx] = Math.max(o.minD, d);
      }
    });

    // Vách đá: sáng bên trái, tối dần xuống dưới, khe tối giữa các cột
    var shadeD = o.shadeD || (o.maxD + o.spike);
    cols.forEach(function (c) {
      for (var xx = c.a; xx <= c.b; xx++) {
        if (!(xx in F)) continue;
        var top = F[xx] + 1, bot = F[xx] + D[xx];
        for (var yy = top; yy <= bot; yy++) {
          var kk = yy - top;
          var v = o.light - (kk / shadeD) * 0.6 - ((xx - o.cx) / o.rx) * 0.13 + c.tone;
          if (xx === c.a) v += 0.15; else if (xx === c.b) v -= 0.28; else if (xx === c.a + 1) v += 0.04;
          for (var l = 0; l < c.ledges.length; l++) {
            if (kk === c.ledges[l]) v -= 0.24; else if (kk === c.ledges[l] + 1) v += 0.08;
          }
          if (kk < 3) v -= (3 - kk) * 0.07;
          if (bot - yy < 2) v -= 0.1;
          buf.set(xx, yy, PX.pick(R.rock, v, xx, yy), 1);
        }
      }
    });

    // Mặt cỏ + mép cỏ rủ xuống vách
    var drip = {};
    for (x = x0; x <= x1; x++) {
      if (!(x in F)) continue;
      for (y = B[x]; y <= F[x]; y++) {
        var nz = PX.vnoise(x * 0.17, y * 0.33, o.seed || 1);
        var gv = o.grass + (nz - 0.5) * 0.4 - ((x - o.cx) / o.rx) * 0.07 + ((y - o.cy) / Math.max(1, o.ry)) * 0.05;
        if (y === B[x]) gv -= 0.2;
        if (y === F[x]) gv = 0.95; else if (y === F[x] - 1) gv += 0.1;
        buf.set(x, y, PX.pick(T.grass, gv, x, y), 2);
      }
      var s2 = Math.floor(x / 2);
      if (!(s2 in drip)) drip[s2] = r.pick(o.drip || [1, 1, 2, 2, 2, 3, 3, 4]);
      var len = Math.min(drip[s2], D[x] - 1);
      for (k = 1; k <= len; k++) {
        buf.set(x, F[x] + k, PX.pick(T.grass, 0.58 - k * 0.1 - (k === len ? 0.14 : 0), x, F[x] + k), 5);
      }
    }
    return { F: F, B: B, D: D, x0: x0, x1: x1 };
  }

  // Viền tối cho đá ở mép ngoài (đọc rõ hình khối)
  function outlineRock(buf) {
    var W = buf.w, H = buf.h, k0 = buf.k.slice();
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var i = y * W + x;
      if (k0[i] !== 1) continue;
      var dn = y < H - 1 ? k0[i + W] : 0, lf = x > 0 ? k0[i - 1] : 0, rt = x < W - 1 ? k0[i + 1] : 0;
      if (!dn) buf.d[i] = R.rock[0];
      else if (!rt) buf.d[i] = R.rock[1];
      else if (!lf) buf.d[i] = R.rock[3];
    }
  }

  function buildIsland(seed) {
    var r = PX.rng(seed);
    var W = 172, H = 112, buf = new PX.Buf(W, H);
    var main = { cx: 86, cy: 26, rx: 64, ry: 18, p: 2.4, minD: 9, maxD: 44, spike: 13, colW: [4, 8], light: 0.8, grass: 0.58, seed: seed };
    var M = landmass(buf, main, r);

    // Hai gờ đá nhô ra hai bên
    landmass(buf, { cx: 27, cy: 46, rx: 13, ry: 4, p: 2, minD: 6, maxD: 15, spike: 6, colW: [3, 5], light: 0.86, grass: 0.62, drip: [1, 1, 2, 2], seed: seed + 1 }, r);
    landmass(buf, { cx: 149, cy: 40, rx: 9, ry: 3, p: 2, minD: 5, maxD: 11, spike: 5, colW: [3, 4], light: 0.62, grass: 0.55, drip: [1, 1, 2], seed: seed + 2 }, r);

    // Bậc cao nơi cây anh đào mọc
    var raise = 5;
    var platG = { cx: 74, cy: 24, rx: 30, ry: 8, p: 2.2 };
    var P = landmass(buf, { cx: platG.cx, cy: platG.cy - raise, rx: platG.rx, ry: platG.ry, p: platG.p, minD: raise, maxD: raise, spike: 0, colW: [3, 6], light: 0.74, grass: 0.66, shadeD: 30, drip: [1, 1, 2], edgeF: [0, 0, 1], seed: seed + 3 }, r);
    Object.keys(P.F).forEach(function (key) {
      var x = +key;
      for (var k = 1; k <= 2; k++) {
        var y = P.F[x] + raise + k;
        if (buf.kind(x, y) === 2) buf.set(x, y, PX.pick(T.grass, 0.28 + k * 0.09, x, y), 2);
      }
    });

    // Cỏ lún phún, hoa dại, cánh hoa / lá rụng theo mùa.
    // Số lần gọi r() giống nhau ở mọi mùa để hình các mảnh đá phía sau không đổi khi đổi mùa.
    function onTop(x, y) { return buf.kind(x, y) === 2 && buf.kind(x, y - 1) === 2 && buf.kind(x, y + 1) === 2 && buf.kind(x, y + 2) === 2; }
    function tuft(x, y) { buf.set(x, y, T.grass[6], 3); buf.set(x, y + 1, T.grass[3], 3); }
    for (var i = 0; i < 120; i++) {
      var x = r.int(M.x0 + 3, M.x1 - 3), y = r.int(main.cy - main.ry - 6, main.cy + main.ry);
      var t = r(), pf = r(), pl = r();
      if (!onTop(x, y)) continue;
      if (t < 0.5) tuft(x, y);
      else if (t < 0.7) buf.set(x, y, T.grass[2], 3);
      else if (t < 0.84 && T.flowers.length) { buf.set(x, y, PX.hex(T.flowers[Math.floor(pf * T.flowers.length)]), 3); buf.set(x, y + 1, T.grass[2], 3); }
      else if (t >= 0.84 && T.litter) buf.set(x, y, PX.hex(T.litter[Math.floor(pl * T.litter.length)]), 3);
      else tuft(x, y);
    }
    for (i = 0; i < 26; i++) {
      var a = r() * Math.PI * 2, d = r.range(4, 26), pc = r();
      var px = Math.round(platG.cx + Math.cos(a) * d * 1.3), py = Math.round(platG.cy - raise + Math.sin(a) * d * 0.35);
      if (T.litter && buf.kind(px, py) === 2) buf.set(px, py, PX.hex(T.litter[Math.floor(pc * T.litter.length)]), 3);
    }
    outlineRock(buf);

    // Các mảnh đá nhỏ lơ lửng bên dưới
    function chunk(rx, ry, minD, maxD, off) {
      var w = rx * 2 + 4, h = Math.ceil(ry * 2 + maxD + 9), b = new PX.Buf(w, h);
      landmass(b, { cx: w / 2, cy: ry + 2, rx: rx, ry: ry, p: 2, minD: minD, maxD: maxD, spike: 5, colW: [3, 4], light: 0.82, grass: 0.6, drip: [1, 1, 2], seed: seed + off }, r);
      outlineRock(b);
      return b.canvas();
    }
    var chunks = [
      { img: chunk(9, 3, 9, 17, 11), cx: 48, y: 94, amp: 2, sp: 0.8, ph: 0 },
      { img: chunk(7, 2.5, 8, 15, 12), cx: 92, y: 110, amp: 2.5, sp: 0.65, ph: 2 },
      { img: chunk(8, 3, 8, 14, 13), cx: 128, y: 88, amp: 1.8, sp: 0.95, ph: 4 }
    ];
    var bottom = 0;
    chunks.forEach(function (c) { c.x = Math.round(c.cx - c.img.width / 2); bottom = Math.max(bottom, c.y + c.img.height); });

    return {
      canvas: buf.canvas(), W: W, H: H, main: main, plat: platG, raise: raise,
      treeBase: { x: 72, y: platG.cy - raise + 1 }, chunks: chunks, bottom: bottom
    };
  }

  /* ---------------------------------------------------------
     CÂY ANH ĐÀO: khung cành đệ quy + tán hoa từ các khối tròn
     kind: 1 = vỏ cây, 2 = hoa phía trước, 3 = hoa phía sau
     --------------------------------------------------------- */
  function buildTree(seed) {
    var r = PX.rng(seed);
    var W = 112, H = 82, bx = 40, by = 78;
    var stamps = [], paths = [], tips = [];

    function stamp(x, y, w) { stamps.push([x, y, Math.max(0.55, w / 2)]); }
    function grow(x, y, a, len, th, depth, curl) {
      var path = [];
      for (var i = 0; i < len; i++) {
        var w = th * (1 - (i / len) * 0.45);
        stamp(x, y, w); path.push([x, y]);
        a += curl + r.range(-0.06, 0.06);
        x += Math.cos(a); y += Math.sin(a);
        if (depth > 0 && i > len * 0.45 && r() < 0.05) {
          grow(x, y, a + (r() < 0.5 ? -1 : 1) * r.range(0.6, 1), len * 0.35, Math.max(1, w * 0.45), 0, curl);
        }
      }
      paths.push({ pts: path, thin: th < 2 });
      if (depth > 0) {
        var s = r.range(0.32, 0.55);
        grow(x, y, a - s, len * r.range(0.5, 0.7), Math.max(1, th * 0.55), depth - 1, curl);
        grow(x, y, a + s, len * r.range(0.5, 0.7), Math.max(1, th * 0.55), depth - 1, curl);
      } else {
        tips.push([x, y]);
      }
    }

    // Thân: nghiêng trái rồi uốn sang phải
    var x = bx, y = by, a = -Math.PI / 2 - 0.22, mid = null;
    for (var i = 0; i < 24; i++) {
      stamp(x, y, 6.4 - (i / 24) * 2.6 + Math.max(0, 3 - i) * 1.3);
      a += 0.019;
      x += Math.cos(a); y += Math.sin(a);
      if (i === 12) mid = [x, y];
    }
    grow(mid[0], mid[1], -2.75, 11, 2.2, 1, 0.03);   // cành trái thấp
    grow(x, y, -0.42, 28, 3.6, 2, 0.014);            // cành phải dài
    grow(x, y, -2.2, 17, 3.2, 2, -0.012);            // cành trái trên
    grow(x, y, -1.4, 15, 3, 2, 0.01);                // cành giữa
    for (var s = -1; s <= 1; s += 2) {               // rễ
      for (var k = 0; k < 6; k++) stamp(bx + s * (2.5 + k), by + 0.6 + k * 0.08, 2.4 - k * 0.35);
    }

    var blobs = [];
    tips.forEach(function (t) {
      for (var n = r.int(2, 3); n > 0; n--) {
        blobs.push({ x: t[0] + r.range(-4, 4), y: t[1] + r.range(-5, 1.5), r: r.range(3.8, 7), back: r() < 0.35 });
      }
    });
    paths.forEach(function (p) {
      if (p.thin && p.pts.length > 4 && r() < 0.5) {
        var q = p.pts[(p.pts.length / 2) | 0];
        blobs.push({ x: q[0], y: q[1] - 2, r: r.range(4, 6), back: r() < 0.6 });
      }
    });

    var buf = new PX.Buf(W, H);
    function canopy(back) {
      for (var yy = 0; yy < H; yy++) for (var xx = 0; xx < W; xx++) {
        var best = -9, nx = 0, ny = 0;
        for (var j = 0; j < blobs.length; j++) {
          var b = blobs[j];
          if (b.back !== back) continue;
          var dx = xx + 0.5 - b.x, dy = yy + 0.5 - b.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d > b.r + (PX.hash2(xx, yy, seed) - 0.5) * 1.6) continue;
          var kk = 1 - d / b.r;
          if (kk > best) { best = kk; nx = dx / b.r; ny = dy / b.r; }
        }
        if (best === -9) continue;
        if (!back && best > 0.35 && PX.hash2(xx * 3, yy * 7, seed) < 0.05) continue; // lỗ nhỏ lộ cành
        var lam = -nx * 0.55 - ny * 0.83;
        var v = 0.5 + lam * 0.36 + (PX.vnoise(xx * 0.4, yy * 0.4, seed) - 0.5) * 0.22 + (back ? -0.2 : 0.04);
        if (best < 0.16 && ny > 0.3) v -= 0.12;
        buf.set(xx, yy, PX.pick(T.leaf, v, xx, yy), back ? 3 : 2);
      }
    }

    canopy(true);
    stamps.forEach(function (st) {
      var sx = st[0], sy = st[1], rad = st[2];
      for (var yy = Math.floor(sy - rad); yy <= Math.ceil(sy + rad); yy++) {
        for (var xx = Math.floor(sx - rad); xx <= Math.ceil(sx + rad); xx++) {
          var dx = xx + 0.5 - sx, dy = yy + 0.5 - sy;
          if (dx * dx + dy * dy > rad * rad + 0.3) continue;
          buf.set(xx, yy, PX.pick(R.bark, 0.62 - (dx / (rad + 0.5)) * 0.5, xx, yy), 1);
        }
      }
    });
    canopy(false);
    // Cành mảnh xuyên qua tán hoa
    paths.forEach(function (p) {
      if (!p.thin || r() < 0.4) return;
      var n = p.pts.length;
      for (var j = Math.floor(n * 0.15); j < n * 0.75; j++) {
        var qx = Math.floor(p.pts[j][0]), qy = Math.floor(p.pts[j][1]);
        if (buf.kind(qx, qy) === 2 && PX.hash2(qx, qy, seed + 9) < 0.75) buf.set(qx, qy, R.bark[1], 1);
      }
    });

    // Viền + lông tơ mép tán
    var k0 = buf.k.slice(), top = H, spawn = [];
    for (var yy = 0; yy < H; yy++) for (var xx = 0; xx < W; xx++) {
      var id = yy * W + xx, kd = k0[id];
      if (!kd) continue;
      var up = yy > 0 ? k0[id - W] : 0, dn = yy < H - 1 ? k0[id + W] : 0;
      var lf = xx > 0 ? k0[id - 1] : 0, rt = xx < W - 1 ? k0[id + 1] : 0;
      if (kd === 1) {
        if (!dn || !rt || !lf) buf.d[id] = R.bark[0];
      } else {
        if (!dn) buf.d[id] = T.leaf[kd === 3 ? 0 : 1];
        else if (!up) buf.d[id] = T.leaf[kd === 3 ? 3 : 5];
        if (!up && yy > 0 && r() < 0.16) buf.set(xx, yy - 1, T.leaf[5], 2);
        if (r() < 0.3) spawn.push([xx, yy]);
      }
    }
    for (i = 0; i < buf.k.length; i++) if (buf.k[i]) { top = Math.floor(i / W); break; }

    // Chỗ chim đậu (đỉnh tán phía trên ngọn cành) và chỗ treo đèn lồng (mép dưới tán)
    var perches = [], hangs = [];
    tips.forEach(function (tp) {
      var x = Math.round(tp[0]);
      if (x < 3 || x >= W - 3) return;
      for (var yy = 0; yy < H && !buf.k[yy * W + x]; yy++);
      if (yy > 1 && yy < by - 30) perches.push([x, yy]);
      yy = Math.round(tp[1]);
      while (yy < H && buf.k[yy * W + x]) yy++;
      if (yy < by - 20 && yy - tp[1] < 16) hangs.push([x, yy]);
    });

    return { canvas: buf.canvas(), W: W, H: H, bx: bx, by: by, top: top, mask: buf.k, spawn: spawn, perches: perches, hangs: hangs };
  }

  /* ---------------------------------------------------------
     MÂY (theo ảnh gốc): mảng màu phẳng không dither, mép trên là
     các vòm rộng, dải lụa uốn sóng cuộn đuôi kiểu tường vân
     --------------------------------------------------------- */
  function disc(buf, x, y, rad, c) {
    var r2 = rad * rad + 0.25;
    for (var yy = Math.floor(y - rad); yy <= Math.ceil(y + rad); yy++) {
      for (var xx = Math.floor(x - rad); xx <= Math.ceil(x + rad); xx++) {
        var dx = xx + 0.5 - x, dy = yy + 0.5 - y;
        if (dx * dx + dy * dy <= r2) buf.set(xx, yy, c, 1);
      }
    }
  }

  // Dải lụa: nét thuôn uốn sóng, cuối cuộn tròn vào trong (hình "~@")
  // shape 'in' = mảnh → dày (cuộn to ở cuối), 'out' = dày → mảnh (đuôi móc nhỏ)
  // up = -1 cuộn lên, 1 cuộn xuống; wrapW: vẽ lặp hai bên để lát liền mạch
  function ribbon(buf, c, o, wrapW) {
    var pts = [], n = Math.max(2, Math.round(o.len * 2)), ex = o.x, ey = o.y, et = o.thick;
    for (var s = 0; s <= n; s++) {
      var u = s / n;
      et = o.shape === 'out' ? o.thick * (1 - u * 0.7)
        : o.shape === 'in' ? o.thick * Math.min(1, 0.25 + u * 1.5)
        : o.thick * (0.3 + 0.7 * Math.sin(Math.PI * u));   // 'mid': thuôn hai đầu
      ex = o.x + o.dir * u * o.len;
      ey = o.y + Math.sin(u * Math.PI * o.waves + o.phase) * o.amp;
      pts.push([ex, ey, et]);
    }
    if (o.curl) {
      var cx = ex, cy = ey + o.up * o.curl, th0 = Math.atan2(ey - cy, ex - cx), sign = o.dir * o.up;
      var sweep = Math.PI * 1.6;
      for (var a = 0; a <= sweep; a += 0.1) {
        var k = a / sweep, rad = o.curl * (1 - 0.55 * k);
        pts.push([cx + Math.cos(th0 + sign * a) * rad, cy + Math.sin(th0 + sign * a) * rad, Math.max(1, et * (1 - 0.55 * k))]);
      }
    }
    pts.forEach(function (p) {
      disc(buf, p[0], p[1], p[2] / 2, c);
      if (wrapW) { disc(buf, p[0] - wrapW, p[1], p[2] / 2, c); disc(buf, p[0] + wrapW, p[1], p[2] / 2, c); }
    });
  }

  // Biển mây: nhiều lớp màu phẳng chồng nhau (sau → trước), lát ngang liền mạch
  function buildBank(r, w, h, layers) {
    var buf = new PX.Buf(w, h);
    layers.forEach(function (L) {
      var c = PX.hex(L.col), prof = new Float32Array(w), x = r.range(0, 12), xx;
      while (x < w) {
        var bw = r.range(L.bw[0], L.bw[1]), bh = r.range(L.bh[0], L.bh[1]);
        for (var k = -1; k <= 1; k++) {
          var cx = x + k * w;
          for (xx = Math.max(0, Math.floor(cx - bw / 2)); xx <= Math.min(w - 1, Math.ceil(cx + bw / 2)); xx++) {
            var u = (xx + 0.5 - cx) / (bw / 2);
            if (Math.abs(u) < 1) prof[xx] = Math.max(prof[xx], bh * Math.sqrt(1 - u * u));
          }
        }
        x += bw * r.range(0.55, 0.85);
      }
      for (xx = 0; xx < w; xx++) {
        for (var y = Math.max(0, Math.round(L.top - prof[xx])); y < h; y++) buf.set(xx, y, c, 1);
      }
      // dải lụa sáng hơn lượn trên mặt lớp mây: thưa, to nhỏ khác nhau, có dải cuộn có dải không
      var wc = PX.hex(L.wisp), n = Math.max(1, Math.round(w / (L.every * 1.5)));
      for (var i = 0; i < n; i++) {
        var curly = r() < 0.7;
        ribbon(buf, wc, {
          x: (i + r.range(0.1, 0.7)) * (w / n), y: L.top + r.range(2, 8), len: r.range(22, 46),
          dir: r() < 0.5 ? 1 : -1, amp: r.range(1.5, 3.5), waves: r.range(0.8, 1.5), phase: r.range(0, Math.PI),
          thick: r.range(4, 7), shape: curly ? 'in' : 'mid', curl: curly ? r.range(3.5, 5.5) : 0, up: r() < 0.75 ? -1 : 1
        }, w);
      }
    });
    return { img: buf.canvas(), fill: layers[layers.length - 1].col };
  }

  // Đổi bản đồ sắc độ (-1 = trong suốt) thành ảnh theo bảng màu
  function toneCanvas(idx, w, h, pal) {
    var b = new PX.Buf(w, h), cols = pal.map(function (c) { return PX.hex(c); });
    for (var i = 0; i < idx.length; i++) if (idx[i] >= 0) { b.d[i] = cols[idx[i]]; b.k[i] = 1; }
    return b.canvas();
  }

  // Dọn mép kiểu vẽ tay: bỏ pixel thò ra lẻ loi, lấp lỗ đơn, xoá chấm màu lạc giữa mảng
  function tidy(idx, w, h) {
    function at(a, x, y) { return x < 0 || y < 0 || x >= w || y >= h ? -1 : a[y * w + x]; }
    for (var pass = 0; pass < 2; pass++) {
      var c = idx.slice();
      for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
        var n = [at(c, x - 1, y), at(c, x + 1, y), at(c, x, y - 1), at(c, x, y + 1)];
        var solid = n.filter(function (v) { return v >= 0; });
        var k = y * w + x;
        if (c[k] >= 0 && solid.length <= 1) idx[k] = -1;
        else if (c[k] < 0 && solid.length >= 3) idx[k] = Math.max.apply(null, solid);
        else if (c[k] >= 0 && solid.length === 4 && n[0] === n[1] && n[1] === n[2] && n[2] === n[3] && n[0] !== c[k]) idx[k] = n[0];
      }
    }
  }

  // Mây tích (cumulus) pixel art, theo các nguyên tắc vẽ mây pixel:
  //  - ghép từ nhiều cụm tròn: hàng dưới nhiều cụm nhỏ, hàng giữa cụm lớn, đỉnh 1–2 cụm, đáy phẳng
  //  - cụm thấp nằm trước cụm cao; tô sáng RIÊNG từng cụm như một quả cầu, nắng từ trên-trái
  //    (viền trên-trái gần trắng, dưới-phải tối) → không bị "pillow shading"
  //  - khe ngay sau mép cụm phía trước và phần đáy chìm trong bóng (bóng ngả lam, không xám)
  // pal: 5 sắc độ từ tối đến sáng
  function buildCumulus(r, w, h, pal) {
    var baseY = h - 2, puffs = [], i, x, y, t, rad;
    function bell(u) { return Math.max(0, 1 - Math.pow((u - 0.5) * 2, 2)); }
    var n0 = Math.max(3, Math.round(w / (h * 0.68)));
    for (i = 0; i < n0; i++) {
      t = (i + 0.5) / n0; rad = h * (0.2 + 0.14 * bell(t)) * r.range(0.85, 1.15);
      puffs.push({ x: w * (0.06 + 0.88 * t) + r.range(-1.5, 1.5), y: baseY - rad * 0.5, r: rad });
    }
    var n1 = Math.max(2, Math.round(n0 * 0.5));
    for (i = 0; i < n1; i++) {
      t = (i + 0.5) / n1; rad = h * (0.27 + 0.12 * bell(t)) * r.range(0.9, 1.1);
      puffs.push({ x: w * (0.2 + 0.6 * t) + r.range(-2, 2), y: baseY - h * 0.36, r: rad });
    }
    var n2 = r() < 0.5 ? 1 : 2;
    for (i = 0; i < n2; i++) {
      puffs.push({ x: w * (n2 === 1 ? r.range(0.4, 0.6) : 0.37 + i * 0.26) + r.range(-2, 2), y: baseY - h * 0.58 + r.range(-1, 1), r: h * r.range(0.25, 0.3) });
    }
    // đế mây phẳng liền mạch từ cụm dưới cùng bên trái tới bên phải (không bị lõm răng cưa)
    var slabL = puffs[0].x, slabR = puffs[n0 - 1].x, slabTop = baseY - h * 0.16;
    puffs.sort(function (a, b) { return a.y - b.y; });   // cụm cao ở sau, cụm thấp ở trước
    var L = [-0.45, -0.72, 0.53];
    var idx = new Int8Array(w * h).fill(-1);
    for (y = 0; y <= baseY; y++) for (x = 0; x < w; x++) {
      var px = x + 0.5, py = y + 0.5, own = -1, j;
      for (j = puffs.length - 1; j >= 0; j--) {
        var dx = px - puffs[j].x, dy = py - puffs[j].y;
        if (dx * dx + dy * dy <= puffs[j].r * puffs[j].r) { own = j; break; }
      }
      if (own < 0) {
        if (py >= slabTop && px >= slabL && px <= slabR) idx[y * w + x] = baseY - y < Math.max(1, h * 0.1) ? 1 : 2;
        continue;
      }
      var p = puffs[own], nx = (px - p.x) / p.r, ny = (py - p.y) / p.r;
      var nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      // sáng theo từng cụm + chuyển sắc theo chiều cao để cả đám mây liền một khối
      var lam = (nx * L[0] + ny * L[1] + nz * L[2]) * 0.75 + (0.5 - py / h) * 0.7 + 0.08;
      var lv = lam > 0.72 ? 4 : lam > 0.42 ? 3 : lam > 0.08 ? 2 : lam > -0.3 ? 1 : 0;
      for (j = own + 1; j < puffs.length; j++) {          // đường tách mảnh phía trên cụm phía trước
        var d = Math.hypot(px - puffs[j].x, py - puffs[j].y) - puffs[j].r;
        if (d > 0 && d < 1.2 && py < puffs[j].y) { lv = Math.max(0, lv - 1); break; }
      }
      var fromBase = baseY - y;
      if (fromBase < Math.max(1, h * 0.1)) lv = Math.min(lv, 1);
      else if (fromBase < h * 0.2) lv = Math.min(lv, 2);
      idx[y * w + x] = lv;
    }
    tidy(idx, w, h);
    return toneCanvas(idx, w, h, pal);
  }

  function buildSky(W, H) {
    var b = new PX.Buf(W, H);
    for (var y = 0; y < H; y++) {
      var v = y / Math.max(1, H - 1);
      for (var x = 0; x < W; x++) b.d[y * W + x] = PX.pick(T.sky, v, x, y, 'bayer');
    }
    return b.canvas();
  }

  /* ---------------------------------------------------------
     NHÂN VẬT: sprite 9x12 (thêm viền = 11x14), quay mặt sang phải
     --------------------------------------------------------- */
  function makeCharacter(cfg) {
    cfg = cfg || {};
    var pal = {
      h: cfg.hair || '#5b3328', H: cfg.hairLight || '#8c5236', s: cfg.skin || '#f6d2ab', S: cfg.skinShade || '#d9a17f', e: '#22182f',
      r: cfg.scarf || '#e84f5c', R: cfg.scarfDark || '#a8304b',
      b: cfg.cloth || '#3f60da', B: cfg.clothDark || '#2a3d9e', c: cfg.clothLight || '#82a3ff',
      p: cfg.pants || '#2c2648', k: cfg.boots || '#5c3a2d'
    };
    var OUT = PX.hex('#1a1226');
    var HEAD = ['....hhhh.', '...hhHHhh', '..hhhhhhh', '..hhhsses', '..hhhsses', '...hSsss.'];
    var SCARF = '..rrrrrr.';
    var BODY = ['...bcbbb.', '...bcbbb.', '...BbbbB.'];
    var TAILS = [['.rR', 'r..'], ['rrR', '...'], ['.rR', '.r.']];
    var LEGS = { s: ['...pp.pp.', '...kk.kk.'], a: ['...pp.pp.', '..kk...kk'], b: ['....ppp..', '....kkk..'] };
    var CW = 11, CH = 14, cache = {};

    function rows(legs, tail, blink, breath) {
      var head = HEAD.map(function (s) { return blink ? s.replace(/e/g, 'S') : s; });
      var body = [TAILS[tail][0] + BODY[0].slice(3), TAILS[tail][1] + BODY[1].slice(3)];
      if (!breath) body.push(BODY[2]);
      var out = head.concat([SCARF], body, LEGS[legs]);
      if (breath) out.unshift('.........');
      return out;
    }
    function build(list) {
      var b = new PX.Buf(CW, CH);
      list.forEach(function (row, y) {
        for (var x = 0; x < row.length; x++) if (row[x] !== '.') b.set(x + 1, y + 1, PX.hex(pal[row[x]]), 1);
      });
      var k0 = b.k.slice();
      for (var y = 0; y < CH; y++) for (var x = 0; x < CW; x++) {
        var i = y * CW + x;
        if (k0[i]) continue;
        if ((x > 0 && k0[i - 1]) || (x < CW - 1 && k0[i + 1]) || (y > 0 && k0[i - CW]) || (y < CH - 1 && k0[i + CW])) b.set(x, y, OUT, 2);
      }
      return b.canvas();
    }
    function flip(cv) {
      var c = PX.canvas(cv.width, cv.height), g = c.getContext('2d');
      g.translate(cv.width, 0); g.scale(-1, 1); g.drawImage(cv, 0, 0);
      return c;
    }
    function frame(legs, tail, blink, breath, face) {
      var key = legs + tail + (blink ? 'b' : '') + (breath ? 'r' : '');
      if (!cache[key]) { var cv = build(rows(legs, tail, blink, breath)); cache[key] = [cv, flip(cv)]; }
      return cache[key][face < 0 ? 1 : 0];
    }
    // Ảnh đại diện: chân dung nhân vật trên nền trời + hoa
    function drawAvatar(cv) {
      var g = cv.getContext('2d'), S = cv.width;
      g.imageSmoothingEnabled = false;
      for (var y = 0; y < S; y++) {
        g.fillStyle = HEX.sky[Math.min(HEX.sky.length - 1, 3 + Math.floor(y / S * 5))];
        g.fillRect(0, y, S, 1);
      }
      var pet = [[1, 1, 5], [2, 1, 4], [1, 2, 4], [3, 3, 5], [13, 2, 4], [14, 3, 5], [12, 5, 5], [2, 7, 4]];
      pet.forEach(function (p) { g.fillStyle = HEX.bloom[p[2]]; g.fillRect(p[0], p[1], 1, 1); });
      g.drawImage(frame('s', 0, false, false, 1), 0, 0, CW, CH - 3, Math.round(S / 2 - 6), S - CH + 4, CW, CH - 3);
    }
    return { frame: frame, w: CW, h: CH, drawAvatar: drawAvatar };
  }

  /* ---------------------------------------------------------
     SINH VẬT & VẬT TRANG TRÍ: sprite từ chuỗi ký tự (mỗi ký tự là một màu)
     --------------------------------------------------------- */
  function spriteFrom(rows, pal, outline) {
    var w = rows[0].length + 2, h = rows.length + 2, b = new PX.Buf(w, h), x, y;
    rows.forEach(function (row, yy) {
      for (var xx = 0; xx < row.length; xx++) if (row[xx] !== '.') b.set(xx + 1, yy + 1, PX.hex(pal[row[xx]]), 1);
    });
    if (outline) {
      var k0 = b.k.slice(), oc = PX.hex(outline);
      for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
        var i = y * w + x;
        if (k0[i]) continue;
        if ((x > 0 && k0[i - 1]) || (x < w - 1 && k0[i + 1]) || (y > 0 && k0[i - w]) || (y < h - 1 && k0[i + w])) b.set(x, y, oc, 2);
      }
    }
    return b.canvas();
  }
  function flipped(cv) {
    var c = PX.canvas(cv.width, cv.height), g = c.getContext('2d');
    g.translate(cv.width, 0); g.scale(-1, 1); g.drawImage(cv, 0, 0);
    return c;
  }
  var INK = '#1a1226';

  // Mèo cam cuộn tròn ngủ (quay mặt sang trái)
  function buildCat() {
    var pal = { o: '#f2a54e', s: '#c8702f', w: '#ffe7bd', e: '#4a2a1a', y: '#c8f26a', n: '#ff8fa3' };
    var body = ['noooosooso', '.wooososoo', '.ww.wwoooo'];
    return {
      sleep: spriteFrom(['.o..o.....', '.oooo.....', 'oeoeooooo.'].concat(body), pal, INK),
      breathe: spriteFrom(['.o..o.....', '.oooooo...', 'oeoeoooooo'].concat(body), pal, INK),
      awake: spriteFrom(['.o..o....o', '.oooo....o', 'oyoyoooooo', 'noooosooso', '.wooososoo', '.ww.ww.ww.'], pal, INK)
    };
  }

  // Chim sẻ (quay sang phải) + cú mèo cho ban đêm
  function buildBirds() {
    var sp = { b: '#8a5a3a', w: '#f0d9b0', e: '#1a1226', k: '#ffb347', t: '#5e3b26', f: '#3a2a20' };
    var sit = spriteFrom(['..bb..', '.bbbek', 'tbwbb.', 't.ww..', '..ff..'], sp, INK);
    var peck = spriteFrom(['......', '..bb..', 'tbbbek', 't.wwb.', '..ff..'], sp, INK);
    var up = spriteFrom(['b...b.', '.bbbek', '..ww..'], sp, INK);
    var down = spriteFrom(['.bbbek', 'b.ww.b'], sp, INK);
    var op = { b: '#6e5236', l: '#c9a77a', y: '#ffe066', k: '#ffb347' };
    var owlRows = ['b...b', 'bbbbb', 'bybyb', 'bbkbb', 'blllb', '.bbb.'];
    return {
      sit: [sit, flipped(sit)], peck: [peck, flipped(peck)], up: [up, flipped(up)], down: [down, flipped(down)],
      owl: spriteFrom(owlRows, op, INK),
      owlBlink: spriteFrom(owlRows.map(function (r) { return r.replace(/y/g, 'b'); }), op, INK)
    };
  }

  // Đèn lồng giấy: móc, nắp, thân đỏ có lõi sáng, nắp dưới, tua
  function buildLantern() {
    return spriteFrom(['.k.', 'kkk', 'rLr', 'rLr', 'kkk', '.r.'], { k: '#3a1e1e', r: '#e8553a', L: '#ffd27a' }, null);
  }

  // Trăng khuyết = hình tròn trừ đi một hình tròn lệch
  function buildMoon() {
    var S = 15, b = new PX.Buf(S, S), c = PX.hex('#fff4c8'), e = PX.hex('#e7d495'), d = PX.hex('#efdfa8');
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      var ax = x + 0.5 - 7.5, ay = y + 0.5 - 7.5, bx = x + 0.5 - 10.5, by = y + 0.5 - 5;
      var inA = ax * ax + ay * ay <= 42, inB = bx * bx + by * by <= 30;
      if (inA && !inB) b.set(x, y, (ax * ax + ay * ay > 30) ? e : c, 1);
    }
    [[4, 8], [5, 11], [3, 6]].forEach(function (p) { if (b.kind(p[0], p[1])) b.set(p[0], p[1], d, 1); });
    return b.canvas();
  }

  // Mặt trời lúc bình minh / hoàng hôn: 3 vòng màu
  function buildSun(cols) {
    var S = 29, b = new PX.Buf(S, S), cc = cols.map(function (c) { return PX.hex(c); });
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      var d = Math.hypot(x + 0.5 - S / 2, y + 0.5 - S / 2);
      if (d <= 14) b.set(x, y, d <= 9 ? cc[2] : d <= 12 ? cc[1] : cc[0], 1);
    }
    return b.canvas();
  }

  // Quầng sáng pixel: 3 vòng độ trong suốt giảm dần
  function glowCanvas(R, rgb, a) {
    var S = R * 2 + 1, c = PX.canvas(S, S), g = c.getContext('2d');
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      var d = Math.hypot(x - R, y - R) / R;
      if (d > 1) continue;
      g.fillStyle = 'rgba(' + rgb + ',' + (a * (d < 0.35 ? 1 : d < 0.65 ? 0.55 : 0.25)).toFixed(3) + ')';
      g.fillRect(x, y, 1, 1);
    }
    return c;
  }

  /* ---------------------------------------------------------
     GẮN CẢNH VÀO CANVAS
     --------------------------------------------------------- */
  function mount(canvas, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    // Lớp "thế giới" (đảo, cây, sinh vật) vẽ riêng để phủ ánh sáng theo giờ mà không phủ bầu trời
    var world = PX.canvas(1, 1), wctx = world.getContext('2d');
    var seed = (opts.seed | 0) || 2026;
    var reduce = !!opts.reducedMotion;
    var rnd = PX.rng(seed * 7 + 1);

    var i;

    // ----- Mùa & giờ: theo tháng/giờ của người xem, hoặc cố định qua opts -----
    var now0 = new Date();
    // timeMode: 'live' theo đồng hồ thật | 'fixed' cố định từ đường dẫn/config | 'hour' chọn trên đồng hồ thời gian
    var seasonFixed = !!SEASONS[opts.season];
    var seasonKey = seasonFixed ? opts.season : seasonAt(now0);
    var timeMode = PHASES[opts.time] ? 'fixed' : 'live', manualHour = null;
    var phaseKey = timeMode === 'fixed' ? opts.time : phaseAt(now0);
    var S = SEASONS[seasonKey], P = PHASES[phaseKey];
    T.grass = ramp(S.grass); T.leaf = ramp(S.leaf); T.sky = ramp(P.sky);
    T.flowers = S.flowers; T.litter = S.litter;

    var island = buildIsland(seed);
    var tree = buildTree(seed + 101);
    var hero = makeCharacter(opts.character);

    // Mây & biển mây theo giờ. Luôn dùng cùng một seed nên đổi giờ chỉ đổi màu, không đổi hình.
    // Biển mây: lớp càng gần càng sáng (ban ngày ngả xanh ngọc như ảnh gốc)
    var BANK_BACK = [{ top: 16, bw: [28, 48], bh: [8, 14], every: 90 }, { top: 34, bw: [24, 42], bh: [7, 12], every: 80 }];
    var BANK_FRONT = [
      { top: 14, bw: [26, 44], bh: [7, 13], every: 70 }, { top: 30, bw: [24, 40], bh: [6, 12], every: 64 },
      { top: 46, bw: [22, 36], bh: [6, 11], every: 60 }, { top: 60, bw: [20, 34], bh: [5, 10], every: 56 }
    ];
    var farImgs = [], midImgs = [], bankBack, bankFront, sunImg = null, moonImg = null;
    function withCols(shapes, cols) {
      return shapes.map(function (s, k) { return { col: cols[k][0], wisp: cols[k][1], top: s.top, bw: s.bw, bh: s.bh, every: s.every }; });
    }
    function buildWeather() {
      var cr = PX.rng(seed + 55), j;
      farImgs = []; midImgs = [];
      // tầng xa: mây tích nhỏ nhạt màu; tầng giữa (sau đảo): mây tích lớn sáng hơn
      for (j = 0; j < 4; j++) farImgs.push(buildCumulus(cr, cr.int(34, 60), cr.int(14, 22), P.far));
      for (j = 0; j < 3; j++) midImgs.push(buildCumulus(cr, cr.int(58, 86), cr.int(24, 32), P.mid));
      bankBack = buildBank(cr, 256, 56, withCols(BANK_BACK, P.bank.slice(0, 2)));
      bankFront = buildBank(cr, 224, 72, withCols(BANK_FRONT, P.bank.slice(2)));
      sunImg = P.sun ? buildSun(P.sun) : null;
      moonImg = P.moon ? buildMoon() : null;
    }
    buildWeather();

    // ----- Sinh vật & đồ trang trí -----
    var W_CFG = opts.world || {};
    var catImg = buildCat(), birdImg = buildBirds(), lanternImg = buildLantern();
    var moonGlow = glowCanvas(20, '255,244,200', 0.16), sunGlow = glowCanvas(30, '255,190,120', 0.22);
    var lanternGlow = glowCanvas(9, '255,165,80', 0.45), flyGlow = glowCanvas(3, '215,255,106', 0.55);
    var cat = { on: W_CFG.cat !== false, x: 58, y: 21, awake: 0, zs: [], nextZ: 1.5, heart: 0 };
    // chọn tối đa 4 chỗ treo đèn lồng cách nhau ≥ 10px
    var lanterns = [];
    tree.hangs.slice().sort(function (a, b) { return a[0] - b[0]; }).forEach(function (hg) {
      if (lanterns.length < 4 && (!lanterns.length || hg[0] - lanterns[lanterns.length - 1][0] >= 10)) lanterns.push(hg);
    });
    var perches = tree.perches.slice().sort(function (a, b) { return a[1] - b[1]; });
    var owlPerch = perches.length ? perches[Math.floor(perches.length / 2)] : null;
    var bird = { st: 'away', next: 6 + rnd() * 8, x: 0, y: 0, face: 1, t0: 0, perch: null, until: 0, fromX: 0, fromY: 0, side: 1, peck: 0 };
    var owl = { blink: 3, flash: 0, look: 0 };
    var butterflies = [], flies = [], snow = [], nightStars = [];
    function setupLife() {
      var lr = PX.rng(seed + 909), j;
      butterflies = [];
      var nb = (W_CFG.butterflies === false || S.snow || phaseKey === 'night') ? 0 : seasonKey === 'autumn' ? 2 : 3;
      var bcols = ['#ffffff', '#ffe066', '#ff9fd9', '#9fe6ff'];
      for (j = 0; j < nb; j++) {
        butterflies.push({ ax: main.cx + lr.range(-48, 40), ay: lr.range(4, 26), ph: lr() * 6.28, sp: lr.range(0.7, 1.2), col: bcols[j % bcols.length] });
      }
      flies = [];
      var nf = Math.round((P.flies || 0) * (S.flies || 0) * (reduce ? 0.5 : 1));
      for (j = 0; j < nf; j++) {
        flies.push({ ax: main.cx + lr.range(-75, 75), ay: lr.range(-34, 46), ph: lr() * 6.28, sp: lr.range(0.6, 1.3) });
      }
    }

    var main = island.main, plat = island.plat, raise = island.raise, tb = island.treeBase;
    var treeDX = tb.x - tree.bx, treeDY = tb.y - tree.by;
    setupLife();
    var SCENE_TOP = Math.min(0, treeDY + tree.top) - 3;
    var SCENE_BOTTOM = island.bottom + 2;

    var W = 0, H = 0, scale = 1, dpr = 1, mode = 'tall', baseX = 0, baseY = 0, lastW = 0;
    var sky = null, far = [], mid = [], stars = [], seaTop = 0;
    var t = 0, last = 0, scrollV = 0, parX = 0, parT = 0;
    var petals = [], fx = [], marker = null, spawnAcc = 0;
    var shake = 0, gust = 0, nextGust = 9, birds = null, nextBirds = 5 + rnd() * 8;
    var treeTaps = 0, lastInteract = -99;
    var view = { ix: 0, iy: 0, tx: 0, ty: 0, cx: 0, cy: 0, catX: -99, catY: -99, birdOn: false, birdX: 0, birdY: 0 };

    var ch = { gx: 110, gy: 31, tx: 0, ty: 0, elev: 0, walking: false, face: -1, idle: 0, nextWander: 7, jump: -1, blinkAt: 2, plat: false };

    /* ----- Bố cục ----- */
    function resize() {
      dpr = window.devicePixelRatio || 1;
      var cw = window.innerWidth, chh = window.innerHeight;
      var devW = Math.round(cw * dpr), devH = Math.round(chh * dpr);
      var wide = cw >= 700 && cw > chh * 1.2;
      scale = Math.max(2, Math.min(Math.floor(devW / (wide ? 300 : 170)), Math.floor(devH / (opts.centered ? 175 : wide ? 215 : 330))));
      var nW = Math.ceil(devW / scale), nH = Math.ceil(devH / scale);
      // Thanh địa chỉ trên di động ẩn/hiện: chỉ đổi kích thước, không dựng lại bố cục
      var minor = nW === lastW && (wide ? 'wide' : 'tall') === mode && Math.abs(nH - H) * scale / dpr < 160 && sky;
      W = nW; H = nH; lastW = nW;
      canvas.width = W; canvas.height = H;
      canvas.style.width = (W * scale / dpr) + 'px';
      canvas.style.height = (H * scale / dpr) + 'px';
      ctx.imageSmoothingEnabled = false;
      world.width = W; world.height = H;
      wctx.imageSmoothingEnabled = false;
      sky = buildSky(W, H);
      if (minor) return;
      mode = wide ? 'wide' : 'tall';
      layout();
    }

    function layout() {
      var sceneH = SCENE_BOTTOM - SCENE_TOP;
      if (mode === 'wide') {
        baseX = Math.round(W * (opts.centered ? 0.5 : 0.3) - main.cx);
        baseY = Math.round(Math.max(4, (H - sceneH) * 0.42) - SCENE_TOP);
      } else {
        // chừa khoảng trống cho các nút ở góc trên (~64px CSS)
        baseX = Math.round(W / 2 - main.cx + 2);
        baseY = Math.round(Math.max(6, 64 * dpr / scale) - SCENE_TOP);
      }
      var k = scale / dpr;
      var heroCss = Math.min((baseY + SCENE_BOTTOM + 2) * k, window.innerHeight * 0.7);
      if (opts.onLayout) opts.onLayout({ mode: mode, heroCss: Math.round(heroCss) });

      var lr = PX.rng(seed + W);
      var skyBottom = mode === 'tall' ? baseY + SCENE_BOTTOM - 40 : H * 0.55;
      // Mây thưa, rải đều theo các tầng cao độ để không chồng lên nhau
      function spread(src, n, y0, y1, sp) {
        var list = [], len = (src === 'far' ? farImgs : midImgs).length;
        for (var j = 0; j < n; j++) {
          list.push({
            src: src, k: j % len,   // tra ảnh lúc vẽ → đổi giờ dựng lại mây không cần xếp lại
            x: (j / n) * (W + 160) + lr.range(0, 40),
            y: Math.round(y0 + (j + lr.range(0.1, 0.8)) / n * (y1 - y0)),
            sp: lr.range(sp[0], sp[1])
          });
        }
        return list;
      }
      far = spread('far', mode === 'wide' ? 3 + Math.ceil(W / 150) : 2 + Math.ceil(W / 220), 4, skyBottom, [0.9, 1.6]);
      mid = spread('mid', W > 300 ? 3 : 2, baseY + 6, baseY + SCENE_BOTTOM - 40, [2.2, 3.2]);
      seaTop = mode === 'wide' ? Math.round(H * 0.63) : baseY + SCENE_BOTTOM - 60;
      stars = [];
      for (var j = 0; j < Math.round(W / 30) + 3; j++) {
        stars.push({ x: Math.round(lr() * W), y: Math.round(lr.range(3, mode === 'tall' ? baseY + 70 : H * 0.55)), per: lr.range(2.4, 4.8), ph: lr() });
      }
      // bầu trời sao cho ban đêm (bình minh/hoàng hôn chỉ hiện vài ngôi mờ ở trên cao)
      nightStars = [];
      for (j = Math.round(W * H / 420); j > 0; j--) {
        nightStars.push({ x: Math.floor(lr() * W), y: Math.floor(lr() * Math.max(10, seaTop - 4)), b: lr() < 0.12 ? 2 : lr() < 0.55 ? 1 : 0, ph: lr() * 6.28, sp: lr.range(0.5, 2) });
      }
    }

    /* ----- Mặt đất, đi lại ----- */
    function onPlat(gx, gy) { return inSE(gx, gy, plat, 0); }
    // Kéo điểm vào trong vùng đi được (chạm sát mép cỏ vẫn đi tới được)
    function pullIn(p, o, shrink) {
      for (var n = 0; n < 16 && !inSE(p.x, p.y, o, shrink); n++) {
        p.x = o.cx + (p.x - o.cx) * 0.92;
        p.y = o.cy + (p.y - o.cy) * 0.92;
      }
      return p;
    }
    function groundTarget(ix, iy) {
      if (inSE(ix, iy + raise, plat, 0)) return pullIn({ x: ix, y: iy + raise }, plat, 2);
      if (!inSE(ix, iy, main, 0)) return null;
      // chạm vào vách bậc cao hoặc phần cỏ phía sau nó → trèo lên bậc
      if (inSE(ix, iy, plat, -3) || (iy < plat.cy && Math.abs(ix - plat.cx) < plat.rx + 2)) {
        return pullIn({ x: ix, y: iy }, plat, 2);
      }
      return pullIn({ x: ix, y: iy }, main, 3);
    }
    function walkTo(p) {
      ch.tx = p.x; ch.ty = p.y; ch.walking = true; ch.idle = 0;
    }
    function wander() {
      for (var n = 0; n < 30; n++) {
        var p = groundTarget(main.cx + (rnd() - 0.5) * main.rx * 1.7, main.cy + (rnd() - 0.4) * main.ry * 1.6);
        if (p && Math.hypot(p.x - ch.gx, p.y - ch.gy) > 12) { walkTo(p); break; }
      }
      ch.nextWander = 6 + rnd() * 7;
    }
    function jump() { if (ch.jump < 0) ch.jump = 0; }

    function updateChar(dt) {
      if (ch.walking) {
        var dx = ch.tx - ch.gx, dy = ch.ty - ch.gy, d = Math.hypot(dx, dy), sp = 20 * dt;
        if (Math.abs(dx) > 0.4) ch.face = dx > 0 ? 1 : -1;
        if (d <= sp) { ch.gx = ch.tx; ch.gy = ch.ty; ch.walking = false; ch.idle = 0; }
        else { ch.gx += dx / d * sp; ch.gy += dy / d * sp; }
      } else {
        ch.idle += dt;
        if (ch.idle > ch.nextWander && t - lastInteract > 8) wander();
      }
      var up = onPlat(ch.gx, ch.gy);
      if (up !== ch.plat) { ch.plat = up; jump(); }
      ch.elev += ((up ? raise : 0) - ch.elev) * Math.min(1, dt * 12);
      if (ch.jump >= 0) { ch.jump += dt; if (ch.jump > 0.42) ch.jump = -1; }
      if (t > ch.blinkAt + 0.14) ch.blinkAt = t + 2.5 + rnd() * 3;
    }

    /* ----- Cánh hoa ----- */
    function spawnPetal(burst) {
      if (petals.length > 110 || !tree.spawn.length) return;
      var s = tree.spawn[(rnd() * tree.spawn.length) | 0];
      petals.push({
        x: view.tx + s[0], y: view.ty + s[1],
        vx: burst ? (rnd() - 0.3) * 34 : 0, vy: burst ? -rnd() * 16 : 0,
        fall: 5 + rnd() * 5, w: 0.6 + rnd() * 0.7, ph: rnd() * 6.28, age: 0, land: -1
      });
    }
    function updatePetals(dt) {
      // cánh hoa (xuân), lá xanh (hạ), lá phong (thu), cục tuyết (đông) rơi từ cây
      spawnAcc += (S.rate * (reduce ? 0.3 : 1) + gust * S.rate * 4) * dt;
      while (spawnAcc >= 1) { spawnAcc -= 1; spawnPetal(false); }
      var wind = 6 + Math.sin(t * 0.23) * 3 + gust * 16;
      for (var j = petals.length - 1; j >= 0; j--) {
        var p = petals[j];
        p.age += dt;
        if (p.land >= 0) { p.land -= dt; if (p.land <= 0) petals.splice(j, 1); continue; }
        p.vx += (wind * p.w - p.vx) * Math.min(1, dt * 1.5);
        p.vy += (p.fall - p.vy) * Math.min(1, dt * 2);
        p.x += (p.vx + Math.sin(t * 2.6 + p.ph) * 5) * dt;
        p.y += (p.vy + Math.cos(t * 3.1 + p.ph) * 2.5) * dt;
        if (p.age > 0.5 && rnd() < dt * 0.9) {
          var lx = p.x - view.ix, ly = p.y - view.iy;
          if (inSE(lx, ly, main, 3)) { p.land = 2 + rnd() * 3; p.lx = lx; p.ly = ly; }
        }
        if (p.x > W + 4 || p.y > H + 4 || p.age > 16) petals.splice(j, 1);
      }
    }

    // Tuyết rơi khắp trời (mùa đông), đậu lại trên đảo một lúc rồi tan
    function updateSnow(dt) {
      if (!S.snow) return;
      var target = reduce ? 25 : 70;
      while (snow.length < target) {
        snow.push({ x: rnd() * (W + 40) - 20, y: -2 - rnd() * (snow.length ? 4 : H), vy: 6 + rnd() * 6, big: rnd() < 0.2, ph: rnd() * 6.28, land: -1 });
      }
      var wind = 3 + Math.sin(t * 0.2) * 2 + gust * 8;
      for (var j = snow.length - 1; j >= 0; j--) {
        var s = snow[j];
        if (s.land >= 0) { s.land -= dt; if (s.land <= 0) snow.splice(j, 1); continue; }
        s.x += (wind * (s.big ? 1.2 : 0.8) + Math.sin(t * 1.7 + s.ph) * 3) * dt;
        s.y += s.vy * (s.big ? 1.2 : 1) * dt;
        if (rnd() < dt * 0.8) {
          var lx = s.x - view.ix, ly = s.y - view.iy;
          if (inSE(lx, ly, main, 3)) { s.land = 3 + rnd() * 3; s.lx = lx; s.ly = ly; }
        }
        if (s.y > H + 3 || s.x > W + 25) snow.splice(j, 1);
      }
    }

    // Mèo, chim sẻ / cú, bướm, đom đóm
    function updateLife(dt) {
      if (cat.on) {
        if (cat.awake > 0) cat.awake -= dt;
        else if (t > cat.nextZ) { cat.zs.push({ x: cat.x - 2, y: cat.y - 8, age: 0 }); cat.nextZ = t + 1.6; }
        for (var j = cat.zs.length - 1; j >= 0; j--) { cat.zs[j].age += dt; if (cat.zs[j].age > 2.4) cat.zs.splice(j, 1); }
        if (cat.heart > 0) cat.heart -= dt;
      }
      if (W_CFG.birds === false) return;
      if (phaseKey === 'night') {
        owl.blink -= dt;
        if (owl.blink < -0.15) owl.blink = 2.5 + rnd() * 3;
        if (owl.flash > 0) owl.flash -= dt;
        if (owl.look > 0) owl.look -= dt;
        return;
      }
      // chim sẻ: bay tới → đậu trên ngọn cây → bay đi
      if (bird.st === 'away') {
        if (!reduce && perches.length && t > bird.next) {
          bird.perch = perches[Math.floor(rnd() * Math.min(perches.length, 4))];
          bird.side = rnd() < 0.5 ? -1 : 1;
          bird.fromX = bird.perch[0] + bird.side * (W * 0.6); bird.fromY = bird.perch[1] - 40;
          bird.st = 'in'; bird.t0 = t; bird.face = -bird.side;
        }
      } else if (bird.st === 'in' && t - bird.t0 > 2.6) {
        bird.st = 'sit'; bird.until = t + 7 + rnd() * 8; bird.peck = t + 1 + rnd() * 2;
      } else if (bird.st === 'sit') {
        if (t > bird.until) leaveBird();
      } else if (bird.st === 'out' && t - bird.t0 > 2.2) {
        bird.st = 'away'; bird.next = t + 15 + rnd() * 20;
      }
    }
    function leaveBird() {
      if (bird.st !== 'sit' && bird.st !== 'in') return false;
      bird.st = 'out'; bird.t0 = t; bird.side = rnd() < 0.5 ? -1 : 1; bird.face = bird.side;
      return true;
    }

    function burst(x, y, n, cols) {
      for (var j = 0; j < n; j++) {
        var a = rnd() * Math.PI * 2, sp = 14 + rnd() * 26;
        fx.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 6, age: 0, life: 0.45 + rnd() * 0.4, c: cols[j % cols.length] });
      }
    }

    function shakeTree() {
      shake = 1; gust = Math.max(gust, 0.5);
      if (leaveBird() && opts.onBird) opts.onBird('sparrow');   // rung cây làm chim bay mất
      treeTaps++;
      var secret = treeTaps % 7 === 0;
      for (var j = 0; j < (secret ? 70 : 22); j++) spawnPetal(true);
      if (secret) { gust = 1.3; jump(); burst(view.cx, view.cy - 16, 18, ['#fff0fa', '#ffe27a', '#8cf1ff']); }
      if (opts.onTree) opts.onTree(treeTaps, secret);
    }

    /* ----- Tương tác chạm ----- */
    function treeHit(lx, ly) {
      for (var dx = -2; dx <= 2; dx++) {
        var x = lx + dx;
        if (x >= 0 && ly >= 0 && x < tree.W && ly < tree.H && tree.mask[ly * tree.W + x]) return true;
      }
      return false;
    }
    function onClick(e) {
      var rect = canvas.getBoundingClientRect();
      var vx = (e.clientX - rect.left) / rect.width * W, vy = (e.clientY - rect.top) / rect.height * H;
      lastInteract = t;
      if (opts.onAny) opts.onAny();
      if (Math.abs(vx - view.cx) <= 7 && vy >= view.cy - 17 && vy <= view.cy + 3) {
        jump();
        burst(view.cx, view.cy - 15, 6, ['#ffccef', '#fff0fa']);
        if (opts.onCharacter) opts.onCharacter();
        return;
      }
      if (cat.on && Math.abs(vx - view.catX) <= 7 && vy >= view.catY - 9 && vy <= view.catY + 2) {
        cat.awake = 3.2; cat.heart = 1.4; cat.zs = [];
        if (opts.onCat) opts.onCat();
        return;
      }
      if (view.birdOn && Math.abs(vx - view.birdX) <= 5 && vy >= view.birdY - 9 && vy <= view.birdY + 2) {
        if (phaseKey === 'night') { owl.flash = 0.7; owl.look = 1.6; if (opts.onBird) opts.onBird('owl'); }
        else if (leaveBird() && opts.onBird) opts.onBird('sparrow');
        return;
      }
      if (treeHit(Math.floor(vx - view.tx), Math.floor(vy - view.ty))) { shakeTree(); return; }
      var p = groundTarget(vx - view.ix, vy - view.iy);
      if (p) {
        walkTo(p);
        marker = { x: p.x, y: p.y, age: 0 };
        if (opts.onWalk) opts.onWalk();
        return;
      }
      burst(vx, vy, 10, ['#ffffff', '#c9f6ff', '#7fe3ff', '#ffccef']);
      if (opts.onSky) opts.onSky();
    }

    /* ----- Vẽ ----- */
    function px(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); }

    function drawLayer(list, par, shiftX) {
      for (var j = 0; j < list.length; j++) {
        var c = list[j], img = (c.src === 'far' ? farImgs : midImgs)[c.k], span = W + img.width + 60;
        var x = ((c.x + t * c.sp * (reduce ? 0.4 : 1) + shiftX) % span + span) % span - img.width - 30;
        ctx.drawImage(img, Math.round(x), Math.round(c.y - scrollV * par));
      }
    }
    function drawBank(bank, y, off) {
      var w = bank.img.width, x = -(((off % w) + w) % w);
      y = Math.round(y);
      for (; x < W; x += w) ctx.drawImage(bank.img, Math.round(x), y);
      var bottom = y + bank.img.height;
      if (bottom < H) { ctx.fillStyle = bank.fill; ctx.fillRect(0, bottom, W, H - bottom); }
    }
    function drawStars() {
      for (var j = 0; j < stars.length; j++) {
        var s = stars[j], f = ((t / s.per + s.ph) % 1), st = f < 0.5 ? Math.round(Math.sin(f / 0.5 * Math.PI) * 3) : 0;
        if (!st) continue;
        if (st === 1) { px(s.x, s.y, 1, 1, '#c9f6ff'); continue; }
        var arm = st - 1;
        ctx.fillStyle = '#9ee7ff';
        ctx.fillRect(s.x - arm, s.y, arm * 2 + 1, 1);
        ctx.fillRect(s.x, s.y - arm, 1, arm * 2 + 1);
        px(s.x, s.y, 1, 1, '#ffffff');
      }
    }
    function drawBirds(dt) {
      if (phaseKey === 'night') return;
      if (!birds) {
        if (!reduce && t > nextBirds) birds = { x: -10, y: 8 + rnd() * Math.max(20, baseY * 0.6), vx: 11 + rnd() * 5, n: 2 + (rnd() * 2 | 0) };
        return;
      }
      birds.x += birds.vx * dt;
      if (birds.x > W + 30) { birds = null; nextBirds = t + 16 + rnd() * 22; return; }
      ctx.fillStyle = '#1a4a9c';
      for (var j = 0; j < birds.n; j++) {
        var bx = Math.round(birds.x - j * 8), by = Math.round(birds.y + j * 3 + Math.sin(t * 2 + j) * 1.2);
        if (Math.floor(t * 6 + j) % 2) { ctx.fillRect(bx - 2, by - 1, 1, 1); ctx.fillRect(bx + 2, by - 1, 1, 1); ctx.fillRect(bx - 1, by, 3, 1); }
        else { ctx.fillRect(bx - 1, by - 1, 3, 1); ctx.fillRect(bx - 2, by, 1, 1); ctx.fillRect(bx + 2, by, 1, 1); }
      }
    }
    function swayAt(row) {
      var hf = (tree.by - row) / (tree.by - tree.top);
      if (hf <= 0) return 0;
      var base = (reduce ? 0.5 : 1.5) * (Math.sin(t * 1.05) * 0.7 + Math.sin(t * 2.3 + 0.7) * 0.3) + gust * 1.4;
      return Math.round((base + shake * 2.6 * Math.sin(t * 26)) * Math.pow(hf, 1.6));
    }
    function drawTree(x, y) {
      var start = 0, prev = swayAt(0);
      for (var row = 1; row <= tree.H; row++) {
        var o = row < tree.H ? swayAt(row) : NaN;
        if (o !== prev) {
          ctx.drawImage(tree.canvas, 0, start, tree.W, row - start, x + prev, y + start, tree.W, row - start);
          start = row; prev = o;
        }
      }
    }
    function drawChar(ix, iy) {
      var gx = Math.round(ix + ch.gx), gy = Math.round(iy + ch.gy - ch.elev);
      var hop = ch.jump >= 0 ? Math.round(Math.sin(ch.jump / 0.42 * Math.PI) * 6) : 0;
      ctx.fillStyle = 'rgba(12,40,22,0.45)';
      ctx.fillRect(gx - 3, gy, 7, 1);
      var legs = 's', tail = Math.floor(t * (ch.walking ? 8 : 3.5)) % 3, breath = false;
      if (hop) legs = 'b';
      else if (ch.walking) legs = ['a', 's', 'b', 's'][Math.floor(t * 8) % 4];
      else breath = !reduce && Math.floor(t * 1.4) % 2 === 1;
      var img = hero.frame(legs, tail, t > ch.blinkAt && t < ch.blinkAt + 0.14, breath, ch.face);
      var ax = ch.face > 0 ? 6 : 4;
      var sy = gy - hop - (ch.walking && legs === 'b' ? 1 : 0);
      ctx.drawImage(img, gx - ax, sy - 13);
      view.cx = gx; view.cy = sy;
    }

    /* ----- Vẽ: bầu trời theo giờ ----- */
    function drawNightSky() {
      if (phaseKey === 'day') return;
      var night = phaseKey === 'night', cols = ['#34437f', '#8191d2', '#e8eeff'];
      for (var j = 0; j < nightStars.length; j++) {
        var s = nightStars[j];
        if (!night && (s.b === 0 || s.y > seaTop * 0.35)) continue;   // bình minh/hoàng hôn: vài ngôi trên cao
        var b = Math.min(2, s.b + (Math.sin(t * s.sp + s.ph) > 0.75 ? 1 : 0));
        px(s.x, s.y - scrollV * 0.05, 1, 1, cols[night ? b : Math.min(1, b)]);
      }
      if (moonImg) {
        var mx = Math.round(mode === 'wide' ? W * 0.1 : W * 0.16);
        var my = Math.round((mode === 'wide' ? H * 0.12 : Math.max(8, 64 * dpr / scale) + 8) - scrollV * 0.08);
        ctx.drawImage(moonGlow, mx - 20, my - 20);
        ctx.drawImage(moonImg, mx - 7, my - 7);
      }
    }
    function drawSun() {
      if (!sunImg) return;
      var x = Math.round(W * (mode === 'wide' ? 0.12 : 0.8)), y = Math.round(seaTop - 4 - scrollV * 0.45);
      ctx.drawImage(sunGlow, x - 30, y - 30);
      ctx.drawImage(sunImg, x - 14, y - 14);
    }

    /* ----- Vẽ: sinh vật (trên lớp thế giới) ----- */
    function drawCat(ix, iy) {
      if (!cat.on) return;
      var cx = ix + cat.x, cy = iy + cat.y;
      var img = cat.awake > 0 ? catImg.awake : (!reduce && Math.floor(t * 0.8) % 2 ? catImg.breathe : catImg.sleep);
      ctx.fillStyle = 'rgba(12,40,22,0.35)';
      ctx.fillRect(cx - 5, cy, 10, 1);
      ctx.drawImage(img, cx - 6, cy - img.height + 1);
      view.catX = cx; view.catY = cy;
    }
    function drawBird() {
      view.birdOn = false;
      if (W_CFG.birds === false) return;
      var img, x, y;
      if (phaseKey === 'night') {               // cú mèo đậu suốt đêm
        if (!owlPerch) return;
        x = view.tx + owlPerch[0] + swayAt(owlPerch[1]); y = view.ty + owlPerch[1];
        img = owl.blink < 0 ? birdImg.owlBlink : birdImg.owl;
        ctx.drawImage(img, x - 3, y - img.height + 1);
        view.birdOn = true; view.birdX = x; view.birdY = y;
        return;
      }
      if (bird.st === 'away' || !bird.perch) return;
      var f = bird.face > 0 ? 0 : 1, prx = bird.perch[0], pry = bird.perch[1];
      var sx = view.tx + prx + swayAt(pry), sy = view.ty + pry;
      if (bird.st === 'sit') {
        if (t > bird.peck + 0.35) bird.peck = t + 0.8 + rnd() * 2.5;
        img = (t > bird.peck ? birdImg.peck : birdImg.sit)[f];
        x = sx; y = sy;
        view.birdOn = true;
      } else {
        var u = Math.min(1, (t - bird.t0) / (bird.st === 'in' ? 2.6 : 2.2));
        if (bird.st === 'in') {
          var e = 1 - Math.pow(1 - u, 2), fx0 = view.tx + bird.fromX, fy0 = view.ty + bird.fromY;
          x = fx0 + (sx - fx0) * e; y = fy0 + (sy - fy0) * e - Math.sin(u * Math.PI) * 8;
          view.birdOn = true;
        } else {
          x = sx + bird.side * u * W * 0.7; y = sy - u * 50 - Math.sin(u * Math.PI) * 6;
        }
        img = (Math.floor(t * 10) % 2 ? birdImg.up : birdImg.down)[f];
      }
      ctx.drawImage(img, Math.round(x) - 4, Math.round(y) - img.height + 1);
      view.birdX = x; view.birdY = y;
    }
    function drawButterflies(ix, iy) {
      for (var j = 0; j < butterflies.length; j++) {
        var b = butterflies[j];
        var x = Math.round(ix + b.ax + Math.sin(t * 0.5 * b.sp + b.ph) * 22 + Math.sin(t * 1.3 * b.sp + b.ph * 2) * 4);
        var y = Math.round(iy + b.ay + Math.sin(t * 0.9 * b.sp + b.ph * 3) * 6 - Math.abs(Math.sin(t * 3 * b.sp + b.ph)) * 2);
        ctx.fillStyle = b.col;
        if (Math.floor(t * 9 * b.sp + b.ph) % 2 === 0) {   // cánh mở
          ctx.fillRect(x - 2, y - 1, 2, 1); ctx.fillRect(x + 1, y - 1, 2, 1);
          ctx.fillRect(x - 1, y, 1, 1); ctx.fillRect(x + 1, y, 1, 1);
        } else {                                           // cánh khép
          ctx.fillRect(x - 1, y - 2, 1, 2); ctx.fillRect(x + 1, y - 2, 1, 2);
        }
        ctx.fillStyle = INK;
        ctx.fillRect(x, y - 1, 1, 2);
      }
    }

    /* ----- Vẽ: ánh sáng (sau khi phủ màu theo giờ, nên luôn sáng rõ) ----- */
    function lanternAt(hg, j) {
      return { x: view.tx + hg[0] + swayAt(hg[1]) + Math.round(Math.sin(t * 1.6 + j * 1.3) * 0.6), y: view.ty + hg[1] };
    }
    function drawLanterns() {
      if (!P.lanterns || !lanterns.length) return;
      ctx.globalCompositeOperation = 'lighter';
      lanterns.forEach(function (hg, j) {
        var p = lanternAt(hg, j);
        ctx.globalAlpha = 0.85 + Math.sin(t * 7 + j * 2) * 0.08 + Math.sin(t * 13 + j) * 0.05;   // lửa bập bùng
        ctx.drawImage(lanternGlow, p.x - 9, p.y - 5);
      });
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      lanterns.forEach(function (hg, j) {
        var p = lanternAt(hg, j);
        px(p.x, p.y, 1, 2, '#2a1a1a');
        ctx.drawImage(lanternImg, p.x - 2, p.y + 1);
      });
    }
    function drawFireflies() {
      if (!flies.length) return;
      ctx.globalCompositeOperation = 'lighter';
      for (var j = 0; j < flies.length; j++) {
        var f = flies[j], g = 0.5 + 0.5 * Math.sin(t * 1.8 * f.sp + f.ph * 5);
        if (g < 0.2) continue;
        var x = Math.round(view.ix + f.ax + Math.sin(t * 0.6 * f.sp + f.ph) * 10 + Math.sin(t * 0.23 + f.ph * 3) * 6);
        var y = Math.round(view.iy + f.ay + Math.cos(t * 0.5 * f.sp + f.ph * 1.7) * 6);
        ctx.globalAlpha = g;
        ctx.drawImage(flyGlow, x - 3, y - 3);
        px(x, y, 1, 1, '#f6ffb0');
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
    function drawOwlEyes() {
      if (phaseKey !== 'night' || !view.birdOn || owl.blink < 0) return;
      var x = Math.round(view.birdX), y = Math.round(view.birdY), c = owl.flash > 0 ? '#ffffff' : '#ffe066';
      px(x - 1, y - 4, 1, 1, c);
      px(x + 1, y - 4, 1, 1, c);
    }
    function drawCatFx() {
      if (!cat.on) return;
      ctx.fillStyle = '#eaf4ff';
      cat.zs.forEach(function (z) {
        var u = z.age / 2.4, x = Math.round(view.ix + z.x - u * 3), y = Math.round(view.iy + z.y - u * 9);
        ctx.globalAlpha = u > 0.75 ? (1 - u) / 0.25 : 1;
        if (u > 0.35) {   // chữ Z lớn dần khi bay lên
          ctx.fillRect(x, y, 4, 1); ctx.fillRect(x + 2, y + 1, 1, 1); ctx.fillRect(x + 1, y + 2, 1, 1); ctx.fillRect(x, y + 3, 4, 1);
        } else {
          ctx.fillRect(x, y, 3, 1); ctx.fillRect(x + 1, y + 1, 1, 1); ctx.fillRect(x, y + 2, 3, 1);
        }
      });
      ctx.globalAlpha = 1;
      if (cat.heart > 0) {
        var hx = view.catX - 4, hy = view.catY - 14 - Math.round((1.4 - cat.heart) * 4);
        ctx.fillStyle = '#ff6f9a';
        ctx.fillRect(hx + 1, hy, 1, 1); ctx.fillRect(hx + 3, hy, 1, 1);
        ctx.fillRect(hx, hy + 1, 5, 1); ctx.fillRect(hx + 1, hy + 2, 3, 1); ctx.fillRect(hx + 2, hy + 3, 1, 1);
      }
    }

    // Chuyển cảnh mờ dần: chụp khung hình hiện tại rồi phủ lên cảnh mới, nhạt dần
    var fadeCv = PX.canvas(1, 1), fadeT = 0;
    function snapshot() {
      if (reduce || !W) return;
      fadeCv.width = W; fadeCv.height = H;
      fadeCv.getContext('2d').drawImage(canvas, 0, 0);
      fadeT = 1;
    }
    function notifyWorld() { if (opts.onWorld) opts.onWorld({ phase: phaseKey, season: seasonKey, theme: P.theme }); }
    function applyPhase(ph) {
      if (ph === phaseKey) return;
      snapshot();
      phaseKey = ph; P = PHASES[ph];
      T.sky = ramp(P.sky);
      buildWeather();
      sky = buildSky(W, H);
      setupLife();
      notifyWorld();
    }
    function applySeason(key) {
      if (key === seasonKey) return;
      snapshot();
      seasonKey = key; S = SEASONS[key];
      T.grass = ramp(S.grass); T.leaf = ramp(S.leaf); T.flowers = S.flowers; T.litter = S.litter;
      // cùng seed nên đảo/cây giữ nguyên hình dáng, chỉ đổi màu theo mùa
      island = buildIsland(seed);
      tree = buildTree(seed + 101);
      petals = []; snow = [];
      setupLife();
      notifyWorld();
    }
    // Theo đồng hồ thật: tự đổi khung giờ khi qua mốc (vd. 17:00 → hoàng hôn) và đổi mùa khi sang tháng
    var nextPhaseCheck = 15;
    function checkPhase() {
      if (timeMode !== 'live' || t < nextPhaseCheck) return;
      nextPhaseCheck = t + 15;
      var d = new Date();
      applyPhase(phaseAt(d));
      if (!seasonFixed) applySeason(seasonAt(d));
    }

    function update(dt) {
      t += dt;
      if (fadeT > 0) fadeT = Math.max(0, fadeT - dt / 0.9);
      checkPhase();
      updateLife(dt);
      updateSnow(dt);
      scrollV = mode === 'tall' ? (window.scrollY || 0) * dpr / scale : 0;
      parX += (parT - parX) * Math.min(1, dt * 3);
      shake *= Math.exp(-dt * 3);
      gust *= Math.exp(-dt * 0.8);
      if (!reduce && t > nextGust) { gust = Math.max(gust, 0.6 + rnd() * 0.5); nextGust = t + 10 + rnd() * 12; }
      updateChar(dt);
      updatePetals(dt);
      for (var j = fx.length - 1; j >= 0; j--) {
        var f = fx[j]; f.age += dt;
        if (f.age > f.life) { fx.splice(j, 1); continue; }
        f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 30 * dt; f.vx *= 0.96;
      }
      if (marker) { marker.age += dt; if (marker.age > 0.8 || !ch.walking) marker = null; }
    }

    function render(dt) {
      ctx.drawImage(sky, 0, 0);
      drawNightSky();
      drawStars();
      drawSun();
      var pxo = Math.round(parX * 3);
      drawLayer(far, 0.12, pxo);
      drawBirds(dt);
      drawLayer(mid, 0.22, pxo * 2);
      // Biển mây nằm sau đảo (giống ảnh gốc: các mảnh đá nổi phía trước mây)
      drawBank(bankBack, seaTop - 14 - scrollV * 0.5, t * 2 + pxo * 2);
      drawBank(bankFront, seaTop + 14 - scrollV * 0.6, t * 3.5 + pxo * 3);

      // Lớp thế giới: vẽ riêng rồi phủ ánh sáng theo giờ (hoàng hôn ấm, đêm xanh thẫm)
      var mainCtx = ctx;
      if (P.tint) { wctx.clearRect(0, 0, W, H); ctx = wctx; }

      var rise = reduce ? 0 : Math.round(Math.pow(1 - Math.min(1, t / 1.8), 3) * 80);
      var bob = reduce ? 0 : Math.round(Math.sin(t * 0.9) * 1.4);
      var ix = baseX - Math.round(parX * 2), iy = baseY + bob + rise - Math.round(scrollV * 0.35);
      view.ix = ix; view.iy = iy;
      view.tx = ix + treeDX; view.ty = iy + treeDY;

      var crise = reduce ? 0 : Math.round(Math.pow(1 - Math.min(1, Math.max(0, t - 0.25) / 1.8), 3) * 100);
      island.chunks.forEach(function (c) {
        var cb = reduce ? 0 : Math.round(Math.sin(t * c.sp + c.ph) * c.amp);
        ctx.drawImage(c.img, ix + c.x, iy - bob + cb + crise + c.y);
      });
      ctx.drawImage(island.canvas, ix, iy);

      for (var j = 0; j < petals.length; j++) {
        var p = petals[j];
        if (p.land >= 0 && (p.land > 0.6 || Math.floor(p.land * 8) % 2)) px(ix + p.lx, iy + p.ly, 1, 1, S.fall[1]);
      }
      for (j = 0; j < snow.length; j++) {
        if (snow[j].land >= 0) px(ix + snow[j].lx, iy + snow[j].ly, 1, 1, '#ffffff');
      }
      if (marker && Math.floor(marker.age * 8) % 2 === 0) {
        var mx = Math.round(ix + marker.x), my = Math.round(iy + marker.y - (onPlat(marker.x, marker.y) ? raise : 0));
        ctx.fillStyle = '#fff0fa';
        ctx.fillRect(mx - 2, my, 1, 1); ctx.fillRect(mx + 2, my, 1, 1); ctx.fillRect(mx, my - 1, 1, 1); ctx.fillRect(mx, my + 1, 1, 1);
      }

      drawCat(ix, iy);
      if (ch.gy < plat.cy) { drawChar(ix, iy); drawTree(view.tx, view.ty); }
      else { drawTree(view.tx, view.ty); drawChar(ix, iy); }
      drawBird();
      drawButterflies(ix, iy);

      for (j = 0; j < petals.length; j++) {
        p = petals[j];
        if (p.land >= 0) continue;
        var fl = Math.sin(t * 5 + p.ph);
        px(p.x, p.y, Math.abs(fl) > 0.8 ? 2 : 1, 1, S.fall[fl > 0.3 ? 2 : fl > -0.3 ? 1 : 0]);
      }
      for (j = 0; j < snow.length; j++) {
        var sn = snow[j];
        if (sn.land < 0) px(sn.x, sn.y, sn.big ? 2 : 1, sn.big ? 2 : 1, sn.big ? '#ffffff' : '#e6eeff');
      }

      if (P.tint) {
        ctx.globalCompositeOperation = 'source-atop';   // chỉ phủ lên những gì đã vẽ
        ctx.fillStyle = P.tint;
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'source-over';
        ctx = mainCtx;
        ctx.drawImage(world, 0, 0);
      }
      drawLanterns();
      drawFireflies();
      drawOwlEyes();
      drawCatFx();

      for (j = 0; j < fx.length; j++) {
        var f = fx[j];
        px(f.x, f.y, 1, 1, f.c);
        if (f.age < 0.15) px(f.x - 1, f.y, 3, 1, f.c);
      }

      if (fadeT > 0) {   // cảnh cũ nhạt dần sau khi đổi giờ/mùa
        ctx.globalAlpha = fadeT;
        ctx.drawImage(fadeCv, 0, 0);
        ctx.globalAlpha = 1;
      }

      if (opts.onFrame) {
        var k = scale / dpr;
        opts.onFrame({ x: view.cx * k, y: (view.cy - 15) * k, head: (view.cy - 13) * k });
      }
    }

    function loop(now) {
      requestAnimationFrame(loop);
      if (!last) last = now;
      if (now - last < 1000 / 31) return;   // ~30 khung hình/giây: đủ mượt cho pixel art, tiết kiệm pin
      var dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      update(dt);
      render(dt);
    }

    canvas.addEventListener('click', onClick);
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'mouse' && mode === 'wide' && !reduce) parT = (e.clientX / window.innerWidth - 0.5) * 2;
    }, { passive: true });
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(resize, 120); });
    resize();
    requestAnimationFrame(loop);
    if (opts.onWorld) opts.onWorld({ phase: phaseKey, season: seasonKey, theme: P.theme });

    return {
      world: function () {
        return { phase: phaseKey, season: seasonKey, live: timeMode === 'live', seasonLive: !seasonFixed, hour: manualHour };
      },
      // Đồng hồ thời gian: h = giờ (0–24, có phần lẻ) hoặc null để quay về giờ thật
      setTime: function (h) {
        if (h === null || h === undefined) {
          timeMode = 'live'; manualHour = null; nextPhaseCheck = 0;
          applyPhase(phaseAt(new Date()));
          return;
        }
        timeMode = 'hour'; manualHour = ((h % 24) + 24) % 24;
        applyPhase(phaseAtHour(manualHour));
      },
      // key: 'spring' | 'summer' | 'autumn' | 'winter', hoặc null để theo tháng thật
      setSeason: function (key) {
        if (!key) { seasonFixed = false; applySeason(seasonAt(new Date())); return; }
        if (SEASONS[key]) { seasonFixed = true; applySeason(key); }
      },
      jump: jump,
      shakeTree: shakeTree,
      drawAvatar: hero.drawAvatar,
      wave: function () { jump(); burst(view.cx, view.cy - 16, 8, ['#ffccef', '#fff0fa', '#ffe27a']); }
    };
  }

  window.IslandScene = {
    mount: mount,
    marks: PHASE_MARKS, seasonStarts: SEASON_STARTS,
    phaseAtHour: phaseAtHour, seasonOfMonth: seasonOfMonth
  };
})();
