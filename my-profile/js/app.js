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
    soundOff: ['.........', '...#.....', '..##.....', '####.#.#.', '####..#..', '####.#.#.', '..##.....', '...#.....', '.........'],
    clock: ['..#####..', '.#.....#.', '#...#...#', '#...#...#', '#...###.#', '#.......#', '#.......#', '.#.....#.', '..#####..'],
    play: ['##.....', '####...', '######.', '#######', '######.', '####...', '##.....'],
    pause: ['##...##', '##...##', '##...##', '##...##', '##...##', '##...##', '##...##'],
    close: ['##...##', '###.###', '.#####.', '..###..', '.#####.', '###.###', '##...##']
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
    // Điện thoại (màn hình cảm ứng): mở bảng chia sẻ của máy. Máy tính: sao chép link cho gọn,
    // tránh bật bảng chia sẻ của hệ điều hành (Windows/macOS) không mấy ai dùng.
    var touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    if (navigator.share && touch) navigator.share({ title: document.title, url: url }).catch(function () {});
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
    // nút ♪ tự xử lý; các nút góc trên & bảng đồng hồ không được bật nhạc bất ngờ
    if (e.target.closest && e.target.closest('.hud, .time-bar')) return;
    if (e.type === 'pointerup' && e.pointerType === 'mouse') return; // chuột: đợi click
    if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
    Chip.start().then(function (ok) {
      syncSound();
      if (ok) { stopAuto(); hint.hidden = true; }                   // chưa được phép → thử lại lần chạm sau
    });
    syncSound();
  }
  var musicCfg = CFG.music || {};
  // Lựa chọn tắt nhạc chỉ nhớ trong lần truy cập này (sessionStorage): lần sau mở trang vẫn tự phát.
  // Xoá cài đặt "đã tắt" vĩnh viễn của phiên bản cũ.
  try { localStorage.removeItem('sakura-music'); } catch (err) { /* chế độ riêng tư */ }
  function mutedThisVisit(v) {
    try {
      if (v === undefined) return sessionStorage.getItem('sakura-muted') === '1';
      sessionStorage.setItem('sakura-muted', v ? '1' : '0');
    } catch (err) { /* chế độ riêng tư */ }
    return false;
  }
  if (canPlay && musicCfg.autoStart !== false && !mutedThisVisit()) {
    AUTO_EVENTS.forEach(function (ev) { window.addEventListener(ev, autoStart, true); });
  }

  soundBtn.addEventListener('click', function () {
    stopAuto();
    Chip.toggle();
    syncSound();
    mutedThisVisit(!Chip.playing);
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
  var gi = 0, worldNow = { phase: 'day' }, catTold = false;
  // Mùa & giờ: đường dẫn (?season=winter&time=night) > config > tự động theo người xem
  var qs = new URLSearchParams(location.search), worldCfg = CFG.world || {};
  function pickWorld(key) { var v = qs.get(key) || worldCfg[key]; return v && v !== 'auto' ? v : null; }
  var themeMeta = $('meta[name="theme-color"]');
  if (window.IslandScene && canvas && canvas.getContext) {
    scene = window.IslandScene.mount(canvas, {
      seed: CFG.seed,
      character: CFG.character,
      reducedMotion: reduce,
      centered: root.classList.contains('capture'),
      season: pickWorld('season'),
      time: pickWorld('time'),
      world: worldCfg,
      onWorld: function (w) {
        worldNow = w;
        root.setAttribute('data-time', w.phase);
        root.style.background = w.theme;
        if (themeMeta) themeMeta.setAttribute('content', w.theme);
        refreshTime();
      },
      onCat: function () {
        sfx('meow');
        if (!catTold && CFG.catLine) { catTold = true; say(CFG.catLine); }
      },
      onBird: function (kind) { sfx(kind === 'owl' ? 'hoot' : 'chirp'); },
      onLayout: function (info) {
        root.setAttribute('data-layout', info.mode);
        root.style.setProperty('--hero-h', info.heroCss + 'px');
      },
      onFrame: function (a) { anchor = a; placeTag(); place(); },
      onAny: function () { interacted = true; },
      onCharacter: function () { sfx('jump'); say(greetings[gi++ % greetings.length]); },
      onTree: function (n, secret) {
        sfx(secret ? 'secret' : 'chime');
        var lines = (CFG.seasonTreeLines || {})[worldNow.season] || CFG.treeLines || [];
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
      var tg = CFG.timeGreetings || {};
      say(tg[worldNow.phase] || greetings[0]);   // câu chào theo giờ (nếu có), không thì câu chào đầu
      gi = 1;
    }, reduce ? 600 : 2200);
    setTimeout(function () { if (!interacted && CFG.hint) say(CFG.hint); }, 12000);
  }

  /* ----- Thanh thời gian: kéo giờ, bấm mốc, chọn mùa để xem cảnh đổi ngay ----- */
  var PHASE_INFO = {
    dawn: { name: 'Bình minh', short: '5h', color: '#f2a6c0' },
    day: { name: 'Ban ngày', short: '7h', color: '#5aa8f5' },
    dusk: { name: 'Hoàng hôn', short: '17h', color: '#ff9a6b' },
    night: { name: 'Ban đêm', short: '19h30', color: '#8b97e6' }
  };
  var SEASON_INFO = {
    spring: { name: 'Xuân', first: 3, color: '#ffa3dc' },
    summer: { name: 'Hạ', first: 6, color: '#a8ea6c' },
    autumn: { name: 'Thu', first: 9, color: '#ffb05a' },
    winter: { name: 'Đông', first: 12, color: '#bfe3ff' }
  };
  var IS = window.IslandScene || {};
  var timeBtn = $('#timeBtn'), tpPanel = null;
  var tp = { hour: null, season: null, play: null, tick: null, dragging: false };

  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function fmtHour(h) { var m = Math.round(h * 60) % 1440; return pad2(Math.floor(m / 60)) + ':' + pad2(m % 60); }
  function realHour() { var d = new Date(); return d.getHours() + d.getMinutes() / 60; }
  // Giờ đang hiển thị: chọn tay > cố định từ đường dẫn (lấy mốc đầu khung giờ) > giờ thật
  function shownHour() {
    if (tp.hour !== null) return tp.hour;
    var w = scene.world();
    if (!w.live) for (var i = 0; i < IS.marks.length; i++) if (IS.marks[i].key === w.phase) return IS.marks[i].h;
    return realHour();
  }

  function buildTimePanel() {
    var pins = '', seasons = '';
    IS.marks.forEach(function (mk) {
      var info = PHASE_INFO[mk.key];
      pins += '<button type="button" class="tb-pin" data-h="' + mk.h + '" style="left:' + (mk.h / 24 * 100) + '%;--c:' + info.color + '"' +
        ' aria-label="' + info.name + ' bắt đầu lúc ' + fmtHour(mk.h) + '"><i></i>' + info.short + '</button>';
    });
    Object.keys(SEASON_INFO).forEach(function (k) {
      var s = SEASON_INFO[k];
      seasons += '<button type="button" class="tb-season" data-s="' + k + '" style="--c:' + s.color + '"' +
        ' aria-label="Mùa ' + s.name + ', bắt đầu từ tháng ' + s.first + '">' + s.name + '<small>T' + s.first + '</small></button>';
    });
    tpPanel = document.createElement('section');
    tpPanel.className = 'time-bar';
    tpPanel.id = 'timePanel';
    tpPanel.hidden = true;
    tpPanel.setAttribute('role', 'region');
    tpPanel.setAttribute('aria-label', 'Đồng hồ thời gian');
    tpPanel.innerHTML =
      '<div class="tb-top">' +
      '<span class="tb-clock" id="tpClock">--:--</span><span class="tb-phase" id="tpPhase"></span>' +
      '<span class="tb-live" id="tpLive"></span>' +
      '<button type="button" class="tb-icon" id="tpPlay" aria-pressed="false" aria-label="Tua nhanh">' + icon('play') + '</button>' +
      '<button type="button" class="tb-text" id="tpNow">Hiện tại</button>' +
      '<button type="button" class="tb-icon tp-close" aria-label="Đóng đồng hồ">' + icon('close') + '</button>' +
      '</div>' +
      '<div class="tb-track"><input type="range" id="tpRange" min="0" max="1440" step="5" aria-label="Giờ trong ngày"></div>' +
      '<div class="tb-pins">' + pins + '</div>' +
      '<div class="tb-seasons">' + seasons + '</div>';
    document.body.appendChild(tpPanel);

    var range = $('#tpRange');
    range.addEventListener('input', function () { tp.dragging = true; ghost(true); stopPlay(); setHour(range.value / 60); });
    var endDrag = function () { if (!tp.dragging) return; tp.dragging = false; ghost(false); refreshTime(); };
    range.addEventListener('change', endDrag);
    range.addEventListener('pointerup', endDrag);
    range.addEventListener('blur', endDrag);
    $$('.tb-pin', tpPanel).forEach(function (b) {
      b.addEventListener('click', function () { stopPlay(); setHour(+b.getAttribute('data-h')); sfx('blip'); });
    });
    $$('.tb-season', tpPanel).forEach(function (b) {
      b.addEventListener('click', function () {
        tp.season = b.getAttribute('data-s');
        scene.setSeason(tp.season);
        refreshTime(); sfx('blip');
      });
    });
    $('#tpPlay').addEventListener('click', function () { if (tp.play) stopPlay(); else startPlay(); sfx('blip'); });
    $('#tpNow').addEventListener('click', function () {
      stopPlay();
      tp.hour = tp.season = null;
      scene.setTime(null); scene.setSeason(null);
      refreshTime(); sfx('chime');
    });
    $('.tp-close', tpPanel).addEventListener('click', closeTime);
  }

  // Khi đang kéo giờ hoặc tua nhanh, thanh mờ đi để nhìn xuyên qua thấy cảnh
  function ghost(on) { if (tpPanel) tpPanel.classList.toggle('ghost', on || !!tp.play); }
  function setHour(h) { tp.hour = h; scene.setTime(h); refreshTime(); }
  // Tua nhanh: mỗi 0,1 giây trôi 5 phút → một ngày trong khoảng 29 giây
  function startPlay() {
    tp.play = setInterval(function () { setHour((shownHour() + 5 / 60) % 24); }, 100);
    var b = $('#tpPlay');
    b.setAttribute('aria-pressed', 'true');
    b.setAttribute('aria-label', 'Dừng tua');
    b.innerHTML = icon('pause');
    ghost(true);
  }
  function stopPlay() {
    if (!tp.play) return;
    clearInterval(tp.play); tp.play = null;
    var b = $('#tpPlay');
    b.setAttribute('aria-pressed', 'false');
    b.setAttribute('aria-label', 'Tua nhanh');
    b.innerHTML = icon('play');
    ghost(tp.dragging);
  }

  function refreshTime() {
    if (!scene || !timeBtn) return;
    var w = scene.world(), live = tp.hour === null && tp.season === null && w.live && w.seasonLive;
    timeBtn.classList.toggle('custom', !live);   // chấm vàng trên nút khi đang xem thử
    if (!tpPanel || tpPanel.hidden) return;
    var h = shownHour(), info = PHASE_INFO[w.phase];
    $('#tpClock').textContent = fmtHour(h);
    var ph = $('#tpPhase');
    ph.textContent = info.name;
    ph.style.setProperty('--c', info.color);
    var lv = $('#tpLive');
    lv.textContent = live ? 'Giờ thật' : 'Xem thử';
    lv.title = live ? 'Đang theo giờ thật' : 'Đang xem thử — bấm "Hiện tại" để quay lại';
    lv.classList.toggle('on', live);
    if (!tp.dragging) $('#tpRange').value = Math.round(h * 12) * 5;
    $$('.tb-pin', tpPanel).forEach(function (b) { b.classList.toggle('active', IS.phaseAtHour(+b.getAttribute('data-h')) === w.phase); });
    var realSeason = IS.seasonOfMonth(new Date().getMonth() + 1);
    $$('.tb-season', tpPanel).forEach(function (b) {
      var k = b.getAttribute('data-s');
      b.classList.toggle('sel', k === w.season);
      b.classList.toggle('now', k === realSeason);
    });
  }

  function openTime() {
    tpPanel.hidden = false;
    document.body.classList.add('tb-open');
    timeBtn.setAttribute('aria-expanded', 'true');
    timeBtn.classList.add('on');
    refreshTime();
    clearInterval(tp.tick);
    tp.tick = setInterval(refreshTime, 15000);   // giờ thật nhảy phút khi đang mở
  }
  function closeTime() {
    stopPlay();
    clearInterval(tp.tick);
    tpPanel.hidden = true;
    document.body.classList.remove('tb-open');
    timeBtn.setAttribute('aria-expanded', 'false');
    timeBtn.classList.remove('on');
    timeBtn.focus({ preventScroll: true });
  }

  if (timeBtn && scene && IS.marks) {
    buildTimePanel();
    timeBtn.addEventListener('click', function () { sfx('blip'); if (tpPanel.hidden) openTime(); else closeTime(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !tpPanel.hidden) closeTime(); });
    refreshTime();
  } else if (timeBtn) {
    timeBtn.hidden = true;
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
