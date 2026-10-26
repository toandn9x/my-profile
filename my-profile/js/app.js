/* ==========================================================
   Giao diện trang: icon pixel, bong bóng thoại, gõ chữ kiểu RPG,
   nút nhạc / chia sẻ / sao chép, kết nối với cảnh.
   ========================================================== */
(function () {
  'use strict';
  var CFG = window.SITE_CONFIG || {};
  var Chip = window.Chiptune;
  var root = document.documentElement;
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  function store(k, v) {
    try {
      if (v === undefined) return localStorage.getItem(k);
      localStorage.setItem(k, v);
    } catch (e) { /* chế độ riêng tư: bỏ qua */ }
    return null;
  }
  function sfx(name) { if (Chip) Chip.sfx(name); }

  // ?capture — ẩn giao diện để chụp ảnh xem trước (og-image)
  if (/[?&]capture\b/.test(location.search)) root.classList.add('capture');

  /* ----- Icon pixel 9x9 ----- */
  var ICONS = {
    github: ['.#.....#.', '.##...##.', '.#######.', '#########', '##.###.##', '##.###.##', '#########', '.#######.', '..#...#..'],
    facebook: ['....####.', '...#####.', '...##....', '...##....', '.######..', '...##....', '...##....', '...##....', '...##....'],
    instagram: ['.#######.', '#.......#', '#.....#.#', '#..###..#', '#..#.#..#', '#..###..#', '#.......#', '#.......#', '.#######.'],
    tiktok: ['....##...', '....###..', '....#.##.', '....#....', '....#....', '.####....', '#####....', '#####....', '.###.....'],
    youtube: ['.........', '.#######.', '###.#####', '###..####', '###...###', '###..####', '###.#####', '.#######.', '.........'],
    linkedin: ['##.......', '##.......', '.........', '##.##.##.', '##.######', '##.###.##', '##.##..##', '##.##..##', '.........'],
    x: ['##.....##', '.##...##.', '..##.##..', '...###...', '....#....', '...###...', '..##.##..', '.##...##.', '##.....##'],
    mail: ['.........', '#########', '##.....##', '#.#...#.#', '#..#.#..#', '#...#...#', '#.......#', '#########', '.........'],
    zalo: ['.#######.', '#.......#', '#.#####.#', '#....#..#', '#...#...#', '#..#....#', '#.#####.#', '#.......#', '.#######.'],
    web: ['..#####..', '.#..#..#.', '#..#.#..#', '#########', '#..#.#..#', '#########', '#..#.#..#', '.#..#..#.', '..#####..'],
    link: ['.....###.', '....#...#', '....#...#', '...#.#.#.', '..#.#.#..', '.#.#.#...', '#...#....', '#...#....', '.###.....'],
    arrow: ['#....', '##...', '###..', '####.', '###..', '##...', '#....'],
    share: ['....#....', '...###...', '..#.#.#..', '....#....', '....#....', '##..#..##', '#.......#', '#.......#', '#########'],
    soundOn: ['.........', '...#...#.', '..##.#..#', '####..#.#', '####..#.#', '####..#.#', '..##.#..#', '...#...#.', '.........'],
    soundOff: ['.........', '...#.....', '..##.....', '####.#.#.', '####..#..', '####.#.#.', '..##.....', '...#.....', '.........']
  };
  function icon(name) { return PX.bitmapSVG(ICONS[name] || ICONS.link); }

  $$('.link').forEach(function (a) {
    var ic = $('.link-icon', a), ar = $('.link-arrow', a);
    if (ic && !ic.firstElementChild) ic.innerHTML = icon(a.getAttribute('data-brand'));
    if (ar) ar.innerHTML = icon('arrow');
    a.addEventListener('pointerdown', function () { sfx('blip'); });
  });
  $$('[data-icon]').forEach(function (el) { el.innerHTML = icon(el.getAttribute('data-icon')); });
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ----- Thông báo nhỏ ----- */
  var toastEl = $('#toast'), toastT;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 2200);
  }

  /* ----- Sao chép ----- */
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', '');
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { /* không hỗ trợ */ }
      ta.remove();
      if (ok) resolve(); else reject();
    });
  }
  $$('[data-copy]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var v = a.getAttribute('data-copy');
      copy(v).then(function () { toast('Đã sao chép: ' + v); sfx('chime'); }, function () { location.href = a.href; });
    });
  });

  /* ----- Chia sẻ ----- */
  var shareBtn = $('#shareBtn');
  shareBtn.addEventListener('click', function () {
    sfx('blip');
    var url = location.href.split('#')[0].split('?')[0];
    if (navigator.share) navigator.share({ title: document.title, url: url }).catch(function () {});
    else copy(url).then(function () { toast('Đã sao chép liên kết trang!'); }, function () { toast(url); });
  });

  /* ----- Nhạc ----- */
  var soundBtn = $('#soundBtn'), hint = $('#musicHint');
  var canPlay = !!(Chip && (window.AudioContext || window.webkitAudioContext));
  function syncSound() {
    var on = !!(Chip && Chip.playing);
    soundBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    soundBtn.setAttribute('aria-label', on ? 'Tắt nhạc' : 'Bật nhạc');
    $('.ico', soundBtn).innerHTML = icon(on ? 'soundOn' : 'soundOff');
    root.classList.toggle('music-on', on);
  }
  if (!canPlay) { soundBtn.hidden = true; hint.hidden = true; }
  if (Chip && Chip.usesFile) hint.textContent = 'Bật nhạc';
  if (store('sakura-hint')) hint.hidden = true;
  if (Chip) Chip.onchange = syncSound;   // ví dụ trình duyệt chặn phát → nút trở lại trạng thái tắt

  // Tự bật nhạc ở lần chạm đầu tiên vào trang (trình duyệt không cho phát trước khi người xem
  // tương tác). Nếu người xem từng bấm nút ♪ để tắt thì giữ nguyên lựa chọn đó.
  // pointerup bắt được cả chạm vào vùng chữ trên iPhone (ở đó "click" không phát ra).
  var AUTO_EVENTS = ['pointerup', 'click', 'keydown'];
  function stopAuto() {
    AUTO_EVENTS.forEach(function (ev) { window.removeEventListener(ev, autoStart, true); });
  }
  function autoStart(e) {
    if (soundBtn.contains(e.target)) return;                       // để nút ♪ tự xử lý
    if (e.type === 'pointerup' && e.pointerType === 'mouse') return; // chuột: đợi click
    if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
    Chip.start().then(function (ok) {
      syncSound();
      if (ok) { stopAuto(); hint.hidden = true; }                   // chưa được phép → thử lại lần chạm sau
    });
    syncSound();
  }
  var musicCfg = CFG.music || {};
  if (canPlay && musicCfg.autoStart !== false && store('sakura-music') !== '0') {
    AUTO_EVENTS.forEach(function (ev) { window.addEventListener(ev, autoStart, true); });
  }

  soundBtn.addEventListener('click', function () {
    stopAuto();
    Chip.toggle();
    syncSound();
    store('sakura-music', Chip.playing ? '1' : '0');
    store('sakura-hint', '1');
    hint.hidden = true;
  });
  syncSound();
  // Ẩn nhãn gợi ý khi cuộn xuống để không đè lên nội dung
  var onScroll = function () { root.classList.toggle('scrolled', window.scrollY > 40); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ----- Tên nổi trên đầu nhân vật (kiểu game nhập vai) ----- */
  var anchor = null, tag = $('#nameTag'), tagH = 0;
  var tagCfg = CFG.nameTag || {};
  var tagName = (tagCfg.name || ($('.name') || {}).textContent || '').trim();
  if (tag && tagCfg.show !== false && tagName) {
    $('.tag-name', tag).textContent = tagName;
    if (tagCfg.title) $('.tag-title', tag).textContent = tagCfg.title;
    else $('.tag-title', tag).remove();
    if (tagCfg.color) tag.style.setProperty('--tag-color', tagCfg.color);
    if (tagCfg.titleColor) tag.style.setProperty('--tag-title-color', tagCfg.titleColor);
    tag.hidden = false;
    var measureTag = function () { tagH = tag.offsetHeight; };
    measureTag();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureTag);
  } else if (tag) {
    tag.remove();
    tag = null;
  }
  function placeTag() {
    if (!tag || !anchor) return;
    // +1px: bù khoảng trống dưới chân chữ để tên nằm sát đỉnh đầu
    tag.style.transform = 'translate(' + Math.round(anchor.x) + 'px,' + Math.round(anchor.head + 1) + 'px) translate(-50%,-100%)';
    tag.style.visibility = anchor.head < 12 ? 'hidden' : '';
  }

  /* ----- Bong bóng thoại của nhân vật ----- */
  var bubble = $('#bubble'), btext = $('#bubbleText'), live = $('#live');
  var bType, bTimer, bShown = false, bW = 0;
  function place() {
    if (!bShown || !anchor) return;
    var vw = window.innerWidth;
    var x = Math.max(bW / 2 + 8, Math.min(vw - bW / 2 - 8, anchor.x));
    var tail = Math.max(-(bW / 2 - 14), Math.min(bW / 2 - 14, anchor.x - x));
    var y = tag ? anchor.head - tagH + 4 : anchor.y;   // bong bóng nằm trên bảng tên
    bubble.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px) translate(-50%,-100%)';
    bubble.style.setProperty('--tail', Math.round(tail) + 'px');
    bubble.style.visibility = anchor.y < 24 ? 'hidden' : '';
  }
  function hideBubble() {
    bubble.classList.add('out');
    bTimer = setTimeout(function () { bubble.hidden = true; bShown = false; }, 260);
  }
  function say(text) {
    if (!text) return;
    clearInterval(bType); clearTimeout(bTimer);
    live.textContent = text;
    bubble.style.width = ''; bubble.style.minHeight = '';
    bubble.hidden = false; bubble.classList.remove('out');
    btext.textContent = text;
    var r = bubble.getBoundingClientRect();
    bW = Math.ceil(r.width);
    bubble.style.width = bW + 'px'; bubble.style.minHeight = Math.ceil(r.height) + 'px';
    bShown = true;
    place();
    if (!reduce) {
      var chars = Array.from(text), i = 0;
      btext.textContent = '';
      bType = setInterval(function () {
        i++;
        btext.textContent = chars.slice(0, i).join('');
        if (i % 2) sfx('text');
        if (i >= chars.length) clearInterval(bType);
      }, 30);
    }
    bTimer = setTimeout(hideBubble, 2800 + text.length * 55);
  }

  /* ----- Cảnh ----- */
  var canvas = $('#scene'), interacted = false, scene = null;
  var greetings = (CFG.greetings && CFG.greetings.length) ? CFG.greetings : ['Xin chào!'];
  var gi = 0;
  if (window.IslandScene && canvas && canvas.getContext) {
    scene = window.IslandScene.mount(canvas, {
      seed: CFG.seed,
      character: CFG.character,
      reducedMotion: reduce,
      centered: root.classList.contains('capture'),
      onLayout: function (info) {
        root.setAttribute('data-layout', info.mode);
        root.style.setProperty('--hero-h', info.heroCss + 'px');
      },
      onFrame: function (a) { anchor = a; placeTag(); place(); },
      onAny: function () { interacted = true; },
      onCharacter: function () { sfx('jump'); say(greetings[gi++ % greetings.length]); },
      onTree: function (n, secret) {
        sfx(secret ? 'secret' : 'chime');
        var lines = CFG.treeLines || [];
        if (secret) say(CFG.secret);
        else if (lines.length && (n === 1 || Math.random() < 0.35)) say(lines[(n - 1) % lines.length]);
      },
      onWalk: function () { sfx('step'); },
      onSky: function () { sfx('sparkle'); }
    });
    var av = $('#avatarCanvas');
    if (av) scene.drawAvatar(av);
    setTimeout(function () {
      if (interacted) return;
      scene.wave();
      say(greetings[0]);
      gi = 1;
    }, reduce ? 600 : 2200);
    setTimeout(function () { if (!interacted && CFG.hint) say(CFG.hint); }, 12000);
  }

  /* ----- Hộp thoại giới thiệu: gõ từng chữ ----- */
  var dlg = $('[data-typewriter]');
  if (dlg && !reduce) {
    var full = dlg.textContent.replace(/\s+/g, ' ').trim();
    var box = dlg.closest('.dialog') || dlg;
    var sr = document.createElement('span'), vis = document.createElement('span');
    sr.className = 'sr-only'; sr.textContent = full;
    vis.setAttribute('aria-hidden', 'true');
    dlg.textContent = '';
    dlg.appendChild(sr); dlg.appendChild(vis);
    box.classList.add('typing');
    var chars = Array.from(full), ti = 0, tw = null;
    var finish = function () {
      clearInterval(tw);
      vis.textContent = full;
      dlg.style.minHeight = '';
      box.classList.remove('typing');
    };
    var begin = function () {
      vis.textContent = full;
      dlg.style.minHeight = dlg.offsetHeight + 'px';
      vis.textContent = '';
      setTimeout(function () {
        tw = setInterval(function () {
          ti++;
          vis.textContent = chars.slice(0, ti).join('');
          if (ti % 3 === 0) sfx('text');
          if (ti >= chars.length) finish();
        }, 26);
      }, 900);
    };
    box.addEventListener('click', finish);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(begin, begin);
    else begin();
  }

  /* ----- Thanh chỉ số chạy khi cuộn tới ----- */
  var stats = $('.stats');
  if (stats) {
    if ('IntersectionObserver' in window && !reduce) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { stats.classList.add('in-view'); io.disconnect(); }
        });
      }, { threshold: 0.35 });
      io.observe(stats);
    } else {
      stats.classList.add('in-view');
    }
  }
})();
