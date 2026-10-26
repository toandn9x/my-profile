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
    far: ['#4193f1', '#4ba3f5'],
    mid: ['#4da6f7', '#5cc4f9']
  };
  var R = {};
  Object.keys(HEX).forEach(function (k) { R[k] = ramp(HEX[k]); });

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
        buf.set(x, y, PX.pick(R.grass, gv, x, y), 2);
      }
      var s2 = Math.floor(x / 2);
      if (!(s2 in drip)) drip[s2] = r.pick(o.drip || [1, 1, 2, 2, 2, 3, 3, 4]);
      var len = Math.min(drip[s2], D[x] - 1);
      for (k = 1; k <= len; k++) {
        buf.set(x, F[x] + k, PX.pick(R.grass, 0.58 - k * 0.1 - (k === len ? 0.14 : 0), x, F[x] + k), 5);
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
        if (buf.kind(x, y) === 2) buf.set(x, y, PX.pick(R.grass, 0.28 + k * 0.09, x, y), 2);
      }
    });

    // Cỏ lún phún, hoa dại, cánh hoa rơi
    function onTop(x, y) { return buf.kind(x, y) === 2 && buf.kind(x, y - 1) === 2 && buf.kind(x, y + 1) === 2 && buf.kind(x, y + 2) === 2; }
    var flowers = ['#fff6e0', '#ffe27a', '#ffb8e4', '#c9f4ff'];
    for (var i = 0; i < 120; i++) {
      var x = r.int(M.x0 + 3, M.x1 - 3), y = r.int(main.cy - main.ry - 6, main.cy + main.ry);
      if (!onTop(x, y)) continue;
      var t = r();
      if (t < 0.5) { buf.set(x, y, R.grass[6], 3); buf.set(x, y + 1, R.grass[3], 3); }
      else if (t < 0.7) buf.set(x, y, R.grass[2], 3);
      else if (t < 0.84) { buf.set(x, y, PX.hex(r.pick(flowers)), 3); buf.set(x, y + 1, R.grass[2], 3); }
      else buf.set(x, y, R.bloom[r.int(4, 5)], 3);
    }
    for (i = 0; i < 26; i++) {
      var a = r() * Math.PI * 2, d = r.range(4, 26);
      var px = Math.round(platG.cx + Math.cos(a) * d * 1.3), py = Math.round(platG.cy - raise + Math.sin(a) * d * 0.35);
      if (buf.kind(px, py) === 2) buf.set(px, py, R.bloom[r.int(3, 5)], 3);
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
        buf.set(xx, yy, PX.pick(R.bloom, v, xx, yy), back ? 3 : 2);
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
        if (!dn) buf.d[id] = R.bloom[kd === 3 ? 0 : 1];
        else if (!up) buf.d[id] = R.bloom[kd === 3 ? 3 : 5];
        if (!up && yy > 0 && r() < 0.16) buf.set(xx, yy - 1, R.bloom[5], 2);
        if (r() < 0.3) spawn.push([xx, yy]);
      }
    }
    for (i = 0; i < buf.k.length; i++) if (buf.k[i]) { top = Math.floor(i / W); break; }

    return { canvas: buf.canvas(), W: W, H: H, bx: bx, by: by, top: top, mask: buf.k, spawn: spawn };
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

  // Mây giữa trời: thân phồng nhỏ kéo theo đuôi dài uốn lượn có móc cuộn,
  // tô hai tông như ảnh gốc: nửa trên sáng, nửa dưới đậm
  function buildSkyCloud(r, w, h, cols) {
    var shape = new PX.Buf(w, h), ON = 1;
    var left = r() < 0.5, bodyW = w * r.range(0.3, 0.45);
    var bx0 = left ? r.range(1, 4) : w - bodyW - r.range(1, 4), baseY = h - 2, x, xx, y;
    x = bx0 + bodyW * 0.18;
    while (x < bx0 + bodyW * 0.85) {
      var bw = r.range(h * 0.7, h * 1.2), bh = r.range(h * 0.4, h * 0.85);
      for (xx = Math.floor(x - bw / 2); xx <= Math.ceil(x + bw / 2); xx++) {
        var u = (xx + 0.5 - x) / (bw / 2);
        if (Math.abs(u) >= 1) continue;
        for (y = Math.round(baseY - bh * Math.sqrt(1 - u * u)); y <= baseY; y++) shape.set(xx, y, ON, 1);
      }
      x += bw * r.range(0.45, 0.7);
    }
    var dir = left ? 1 : -1, sx = left ? bx0 + bodyW * 0.75 : bx0 + bodyW * 0.25;
    var tail = Math.max(4, h * r.range(0.36, 0.46));
    ribbon(shape, ON, {
      x: sx, y: baseY - tail / 2 - r.range(0, h * 0.15), len: w - bodyW - 8, dir: dir, amp: r.range(1, h * 0.14),
      waves: r.range(1, 1.8), phase: r.range(0, 1), thick: tail,
      shape: 'out', curl: Math.max(3, tail * 0.75), up: -1
    });
    if (r() < 0.6) {
      var tail2 = Math.max(3, h * 0.26);
      ribbon(shape, ON, {
        x: sx - dir * bodyW * 0.3, y: baseY - tail2 / 2, len: (w - bodyW) * r.range(0.4, 0.65), dir: dir, amp: r.range(1, 2),
        waves: r.range(0.8, 1.4), phase: r.range(1, 2.5), thick: tail2, shape: 'out', curl: Math.max(2.5, tail2 * 0.8), up: 1
      });
    }

    // Tô màu: mỗi cột, phần trên của mỗi đoạn mây là màu sáng
    var out = new PX.Buf(w, h), base = PX.hex(cols[0]), light = PX.hex(cols[1]);
    for (xx = 0; xx < w; xx++) {
      y = 0;
      while (y < h) {
        if (!shape.kind(xx, y)) { y++; continue; }
        var y0 = y;
        while (y < h && shape.kind(xx, y)) y++;
        var lit = Math.max(1, Math.round((y - y0) * 0.45));
        for (var yy = y0; yy < y; yy++) out.set(xx, yy, yy < y0 + lit ? light : base, 1);
      }
    }
    // Nét xoáy đậm bên trong thân mây
    var swirl = new PX.Buf(w, h);
    ribbon(swirl, ON, {
      x: bx0 + bodyW * (left ? 0.25 : 0.75), y: baseY - h * 0.35, len: bodyW * 0.35, dir: dir, amp: 0.8,
      waves: 1, phase: 0, thick: 1, shape: 'out', curl: Math.max(1.8, h * 0.13), up: 1
    });
    for (var i = 0; i < swirl.k.length; i++) if (swirl.k[i] && out.k[i]) out.d[i] = base;
    return out.canvas();
  }

  function buildSky(W, H) {
    var b = new PX.Buf(W, H);
    for (var y = 0; y < H; y++) {
      var v = y / Math.max(1, H - 1);
      for (var x = 0; x < W; x++) b.d[y * W + x] = PX.pick(R.sky, v, x, y, 'bayer');
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
     GẮN CẢNH VÀO CANVAS
     --------------------------------------------------------- */
  function mount(canvas, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var seed = (opts.seed | 0) || 2026;
    var reduce = !!opts.reducedMotion;
    var rnd = PX.rng(seed * 7 + 1);

    var island = buildIsland(seed);
    var tree = buildTree(seed + 101);
    var hero = makeCharacter(opts.character);
    var cr = PX.rng(seed + 55), i;
    var farImgs = [], midImgs = [];
    for (i = 0; i < 4; i++) farImgs.push(buildSkyCloud(cr, cr.int(80, 130), cr.int(16, 24), HEX.far));
    for (i = 0; i < 3; i++) midImgs.push(buildSkyCloud(cr, cr.int(56, 92), cr.int(13, 19), HEX.mid));
    // Biển mây: lớp càng gần càng sáng và ngả xanh ngọc (màu lấy từ ảnh gốc)
    var bankBack = buildBank(cr, 256, 56, [
      { col: '#4597f0', wisp: '#4fa7f3', top: 16, bw: [28, 48], bh: [8, 14], every: 90 },
      { col: '#53b2f4', wisp: '#5dc3f6', top: 34, bw: [24, 42], bh: [7, 12], every: 80 }
    ]);
    var bankFront = buildBank(cr, 224, 72, [
      { col: '#5cc5f4', wisp: '#68d3f7', top: 14, bw: [26, 44], bh: [7, 13], every: 70 },
      { col: '#68d3f7', wisp: '#78e0fa', top: 30, bw: [24, 40], bh: [6, 12], every: 64 },
      { col: '#76dffa', wisp: '#8beefd', top: 46, bw: [22, 36], bh: [6, 11], every: 60 },
      { col: '#84e7fb', wisp: '#9cf3fe', top: 60, bw: [20, 34], bh: [5, 10], every: 56 }
    ]);

    var main = island.main, plat = island.plat, raise = island.raise, tb = island.treeBase;
    var treeDX = tb.x - tree.bx, treeDY = tb.y - tree.by;
    var SCENE_TOP = Math.min(0, treeDY + tree.top) - 3;
    var SCENE_BOTTOM = island.bottom + 2;

    var W = 0, H = 0, scale = 1, dpr = 1, mode = 'tall', baseX = 0, baseY = 0, lastW = 0;
    var sky = null, far = [], mid = [], stars = [], seaTop = 0;
    var t = 0, last = 0, scrollV = 0, parX = 0, parT = 0;
    var petals = [], fx = [], marker = null, spawnAcc = 0;
    var shake = 0, gust = 0, nextGust = 9, birds = null, nextBirds = 5 + rnd() * 8;
    var treeTaps = 0, lastInteract = -99;
    var view = { ix: 0, iy: 0, tx: 0, ty: 0, cx: 0, cy: 0 };

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
      var skyBottom = mode === 'tall' ? baseY + SCENE_BOTTOM - 40 : H * 0.62;
      // Mây thưa, rải đều theo các tầng cao độ để không chồng lên nhau
      function spread(imgs, n, y0, y1, sp) {
        var list = [];
        for (var j = 0; j < n; j++) {
          list.push({
            img: imgs[j % imgs.length],
            x: (j / n) * (W + 160) + lr.range(0, 40),
            y: Math.round(y0 + (j + lr.range(0.1, 0.8)) / n * (y1 - y0)),
            sp: lr.range(sp[0], sp[1])
          });
        }
        return list;
      }
      far = spread(farImgs, 2 + Math.ceil(W / 220), 4, skyBottom, [0.9, 1.6]);
      mid = spread(midImgs, W > 300 ? 3 : 2, baseY + 6, baseY + SCENE_BOTTOM - 40, [2.2, 3.2]);
      seaTop = mode === 'wide' ? Math.round(H * 0.63) : baseY + SCENE_BOTTOM - 60;
      stars = [];
      for (var j = 0; j < Math.round(W / 30) + 3; j++) {
        stars.push({ x: Math.round(lr() * W), y: Math.round(lr.range(3, mode === 'tall' ? baseY + 70 : H * 0.55)), per: lr.range(2.4, 4.8), ph: lr() });
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
      spawnAcc += ((reduce ? 0.5 : 1.7) + gust * 7) * dt;
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

    function burst(x, y, n, cols) {
      for (var j = 0; j < n; j++) {
        var a = rnd() * Math.PI * 2, sp = 14 + rnd() * 26;
        fx.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 6, age: 0, life: 0.45 + rnd() * 0.4, c: cols[j % cols.length] });
      }
    }

    function shakeTree() {
      shake = 1; gust = Math.max(gust, 0.5);
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
        var c = list[j], span = W + c.img.width + 60;
        var x = ((c.x + t * c.sp * (reduce ? 0.4 : 1) + shiftX) % span + span) % span - c.img.width - 30;
        ctx.drawImage(c.img, Math.round(x), Math.round(c.y - scrollV * par));
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

    function update(dt) {
      t += dt;
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
      drawStars();
      var pxo = Math.round(parX * 3);
      drawLayer(far, 0.12, pxo);
      drawBirds(dt);
      drawLayer(mid, 0.22, pxo * 2);
      // Biển mây nằm sau đảo (giống ảnh gốc: các mảnh đá nổi phía trước mây)
      drawBank(bankBack, seaTop - 14 - scrollV * 0.5, t * 2 + pxo * 2);
      drawBank(bankFront, seaTop + 14 - scrollV * 0.6, t * 3.5 + pxo * 3);

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
        if (p.land >= 0 && (p.land > 0.6 || Math.floor(p.land * 8) % 2)) px(ix + p.lx, iy + p.ly, 1, 1, HEX.bloom[4]);
      }
      if (marker && Math.floor(marker.age * 8) % 2 === 0) {
        var mx = Math.round(ix + marker.x), my = Math.round(iy + marker.y - (onPlat(marker.x, marker.y) ? raise : 0));
        ctx.fillStyle = '#fff0fa';
        ctx.fillRect(mx - 2, my, 1, 1); ctx.fillRect(mx + 2, my, 1, 1); ctx.fillRect(mx, my - 1, 1, 1); ctx.fillRect(mx, my + 1, 1, 1);
      }

      if (ch.gy < plat.cy) { drawChar(ix, iy); drawTree(view.tx, view.ty); }
      else { drawTree(view.tx, view.ty); drawChar(ix, iy); }

      for (j = 0; j < petals.length; j++) {
        p = petals[j];
        if (p.land >= 0) continue;
        var fl = Math.sin(t * 5 + p.ph);
        px(p.x, p.y, Math.abs(fl) > 0.8 ? 2 : 1, 1, HEX.bloom[fl > 0.3 ? 5 : fl > -0.3 ? 4 : 3]);
      }

      for (j = 0; j < fx.length; j++) {
        var f = fx[j];
        px(f.x, f.y, 1, 1, f.c);
        if (f.age < 0.15) px(f.x - 1, f.y, 3, 1, f.c);
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

    return {
      jump: jump,
      shakeTree: shakeTree,
      drawAvatar: hero.drawAvatar,
      wave: function () { jump(); burst(view.cx, view.cy - 16, 8, ['#ffccef', '#fff0fa', '#ffe27a']); }
    };
  }

  window.IslandScene = { mount: mount };
})();
