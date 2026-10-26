/* ==========================================================
   Tiện ích pixel art: RNG có seed, màu, dithering, bộ đệm điểm ảnh
   ========================================================== */
(function (global) {
  'use strict';

  // Bộ sinh số ngẫu nhiên có seed (mulberry32) — cùng seed = cùng hòn đảo
  function rng(seed) {
    var a = seed >>> 0;
    function r() {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    r.range = function (lo, hi) { return lo + r() * (hi - lo); };
    r.int = function (lo, hi) { return Math.floor(lo + r() * (hi - lo + 1)); };
    r.pick = function (arr) { return arr[Math.floor(r() * arr.length)]; };
    return r;
  }

  // '#rrggbb' -> số 32-bit theo thứ tự byte của ImageData (little-endian)
  function hex(c) {
    var n = parseInt(c.slice(1), 16);
    return ((255 << 24) | ((n & 0xff) << 16) | (n & 0xff00) | (n >> 16)) >>> 0;
  }

  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

  // Chọn bậc màu trong dải (ramp) theo độ sáng v ∈ [0,1], có dithering
  //  - mặc định: dải màu phẳng + vùng chuyển kiểu bàn cờ (giống vẽ tay)
  //  - 'bayer': dithering 4x4 mịn hơn (dùng cho bầu trời)
  function level(n, v, x, y, mode) {
    var f = Math.max(0, Math.min(1, v)) * (n - 1);
    var i = Math.floor(f), fr = f - i;
    if (mode === 'bayer') {
      if (fr > (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16) i++;
    } else if (fr > 0.68 || (fr > 0.32 && ((x + y) & 1))) {
      i++;
    }
    return Math.min(n - 1, i);
  }
  function pick(ramp, v, x, y, mode) { return ramp[level(ramp.length, v, x, y, mode)]; }

  // Bộ đệm điểm ảnh: màu (d) + "loại" điểm ảnh (k) để làm viền/hit-test
  function Buf(w, h) {
    this.w = w; this.h = h;
    this.d = new Uint32Array(w * h);
    this.k = new Uint8Array(w * h);
  }
  Buf.prototype.set = function (x, y, c, k) {
    x = Math.floor(x); y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    var i = y * this.w + x;
    this.d[i] = c; this.k[i] = k || 1;
  };
  Buf.prototype.kind = function (x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.k[y * this.w + x];
  };
  Buf.prototype.canvas = function () {
    var c = canvas(this.w, this.h), g = c.getContext('2d');
    var img = g.createImageData(this.w, this.h);
    new Uint32Array(img.data.buffer).set(this.d);
    g.putImageData(img, 0, 0);
    return c;
  };

  function canvas(w, h) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  function hash2(x, y, s) {
    var h = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453;
    return h - Math.floor(h);
  }
  function vnoise(x, y, s) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    var a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }

  // Bitmap chuỗi ('#' = điểm ảnh) -> SVG sắc nét, tô bằng currentColor
  function bitmapSVG(rows) {
    var d = '';
    rows.forEach(function (row, y) {
      var x = 0;
      while (x < row.length) {
        if (row[x] !== '#') { x++; continue; }
        var s = x;
        while (x < row.length && row[x] === '#') x++;
        d += 'M' + s + ' ' + y + 'h' + (x - s) + 'v1h-' + (x - s) + 'z';
      }
    });
    return '<svg viewBox="0 0 ' + rows[0].length + ' ' + rows.length +
      '" shape-rendering="crispEdges" aria-hidden="true" focusable="false"><path fill="currentColor" d="' + d + '"/></svg>';
  }

  global.PX = {
    rng: rng, hex: hex, level: level, pick: pick, Buf: Buf, canvas: canvas,
    hash2: hash2, vnoise: vnoise, bitmapSVG: bitmapSVG
  };
})(window);
