/* ==========================================================
   Nhạc 8-bit hoài niệm, tổng hợp trực tiếp bằng Web Audio API
   (không cần file mp3). Vòng hợp âm "royal road":
   Fmaj7 – G7 – Em7 – Am, 16 ô nhịp, lặp vô hạn.
   ========================================================== */
(function () {
  'use strict';
  var AC = window.AudioContext || window.webkitAudioContext;
  var cfg = (window.SITE_CONFIG && window.SITE_CONFIG.music) || {};
  var BPM = cfg.bpm || 88;
  var VOL = cfg.volume == null ? 0.6 : cfg.volume;
  var STEP = 60 / BPM / 2;          // một nốt móc đơn
  var BAR = 8, STEPS = 16 * BAR;

  var ctx = null, master, music, sfxBus, delay, p12, p25, p50, noise;
  var timer = null, playing = false, step = 0, loopN = 0, nextTime = 0;

  function midi(n) { return 440 * Math.pow(2, (n - 69) / 12); }

  // Sóng xung với độ rộng (duty) như chip âm thanh NES
  function pulse(duty) {
    var n = 40, re = new Float32Array(n), im = new Float32Array(n);
    for (var i = 1; i < n; i++) re[i] = (2 / (i * Math.PI)) * Math.sin(i * Math.PI * duty);
    return ctx.createPeriodicWave(re, im);
  }

  function init() {
    if (ctx) return true;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.0001;
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 3;
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 5200; lp.Q.value = 0.2;
    music = ctx.createGain();
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.9;
    delay = ctx.createDelay(2); delay.delayTime.value = STEP * 1.5;   // tiếng vang nhịp chấm dôi
    var fb = ctx.createGain(); fb.gain.value = 0.3;
    var wet = ctx.createGain(); wet.gain.value = 0.25;
    var dlp = ctx.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 2600;
    music.connect(lp); lp.connect(master);
    delay.connect(dlp); dlp.connect(fb); fb.connect(delay); dlp.connect(wet); wet.connect(master);
    sfxBus.connect(master);
    master.connect(comp); comp.connect(ctx.destination);
    p12 = pulse(0.125); p25 = pulse(0.25); p50 = pulse(0.5);
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    var d = noise.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }

  function tone(dest, wave, freq, t, dur, vol, o) {
    o = o || {};
    var osc = ctx.createOscillator(), g = ctx.createGain();
    if (typeof wave === 'string') osc.type = wave; else osc.setPeriodicWave(wave);
    osc.frequency.setValueAtTime(freq, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(o.slide, t + (o.slideTime || dur));
    var a = 0.006, rel = o.release || 0.06, sus = o.sustain == null ? 0.7 : o.sustain;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + a);
    g.gain.linearRampToValueAtTime(vol * sus, t + a + dur * 0.4);
    g.gain.setValueAtTime(vol * sus, t + dur);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + rel);
    osc.connect(g); g.connect(dest);
    if (o.send) { var s = ctx.createGain(); s.gain.value = o.send; g.connect(s); s.connect(delay); }
    if (o.vib) {
      var l = ctx.createOscillator(), lg = ctx.createGain();
      l.frequency.value = 5.2;
      lg.gain.setValueAtTime(0, t);
      lg.gain.linearRampToValueAtTime(freq * 0.007, t + Math.min(dur, 0.35));
      l.connect(lg); lg.connect(osc.frequency);
      l.start(t); l.stop(t + dur + rel + 0.05);
    }
    osc.start(t); osc.stop(t + dur + rel + 0.05);
  }

  function hit(t, dur, vol, type, freq) {
    var src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noise;
    f.type = type; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(music);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
  }
  function kick(t) { tone(music, 'triangle', 150, t, 0.1, 0.32, { slide: 42, slideTime: 0.1, sustain: 0.5, release: 0.04 }); }

  /* ----- Bản nhạc ----- */
  var PROG = ['F', 'G', 'Em', 'Am'];
  var CHORD = { F: [53, 57, 60, 64], G: [55, 59, 62, 65], Em: [52, 55, 59, 62], Am: [57, 60, 64, 67] };
  var ROOT = { F: 41, G: 43, Em: 40, Am: 45 };
  // [nốt MIDI | 0 = nghỉ, độ dài tính bằng móc đơn] — mỗi ô nhịp = 8
  var MELODY = [
    [[76, 2], [74, 1], [72, 1], [74, 2], [76, 2]],
    [[79, 3], [76, 1], [74, 4]],
    [[76, 2], [74, 1], [72, 1], [71, 2], [72, 2]],
    [[69, 6], [0, 2]],
    [[76, 2], [74, 1], [72, 1], [74, 2], [76, 2]],
    [[79, 3], [81, 1], [79, 2], [74, 2]],
    [[76, 3], [79, 1], [83, 2], [79, 2]],
    [[81, 6], [0, 2]],
    [[84, 2], [83, 1], [81, 1], [79, 2], [76, 2]],
    [[79, 2], [81, 1], [79, 1], [74, 2], [79, 2]],
    [[83, 3], [81, 1], [79, 2], [76, 2]],
    [[76, 2], [79, 2], [81, 4]],
    [[84, 2], [83, 1], [81, 1], [79, 2], [81, 2]],
    [[86, 3], [84, 1], [83, 2], [79, 2]],
    [[79, 2], [76, 1], [74, 1], [76, 2], [71, 2]],
    [[69, 6], [0, 2]]
  ];
  var LEAD = new Array(STEPS);
  MELODY.forEach(function (bar, b) {
    var s = b * BAR;
    bar.forEach(function (n) { if (n[0]) LEAD[s] = n; s += n[1]; });
  });
  var ARP = [0, 1, 2, 3, 1, 2, 3, 2];
  var BASS = [0, 7, 12, 7];

  function schedule(s, t) {
    var bar = Math.floor(s / BAR), pos = s % BAR, chord = PROG[bar % 4];
    var full = bar >= 8, groove = loopN > 0 || bar >= 4;

    var n = LEAD[s];
    if (n) {
      tone(music, p25, midi(n[0]), t, n[1] * STEP * 0.92, 0.085, { vib: n[1] >= 2, send: 0.4, sustain: 0.55 });
      if (full) tone(music, 'triangle', midi(n[0] - 12), t, n[1] * STEP * 0.8, 0.05, { sustain: 0.6 });
    }
    tone(music, p12, midi(CHORD[chord][ARP[pos]] + 12), t, STEP * 0.8, full ? 0.03 : 0.024, { sustain: 0.4, send: 0.2 });
    if (pos % 2 === 0) tone(music, 'triangle', midi(ROOT[chord] + BASS[pos / 2]), t, STEP * 1.7, 0.17, { sustain: 0.8 });

    if (groove) hit(t, 0.03, pos % 2 ? 0.05 : 0.025, 'highpass', 7000);
    if (full) {
      if (pos === 0 || pos === 4 || (pos === 5 && bar % 2)) kick(t);
      if (pos === 2 || pos === 6) { hit(t, 0.12, 0.11, 'bandpass', 1800); }
      if (bar === 15 && pos === 7) hit(t, 0.1, 0.09, 'bandpass', 2400);
    }
  }

  function tick() {
    while (nextTime < ctx.currentTime + 0.15) {
      schedule(step, nextTime);
      nextTime += STEP;
      step++;
      if (step >= STEPS) { step = 0; loopN++; }
    }
  }

  /* ----- Hiệu ứng âm thanh ----- */
  var SFX = {
    blip: function (t) { tone(sfxBus, p50, midi(84), t, 0.04, 0.06, { sustain: 0.5, release: 0.03 }); },
    text: function (t) { tone(sfxBus, p12, midi([79, 81, 84][Math.random() * 3 | 0]), t, 0.022, 0.022, { sustain: 0.5, release: 0.02 }); },
    jump: function (t) { tone(sfxBus, p25, 330, t, 0.13, 0.08, { slide: 880, slideTime: 0.12, sustain: 0.6 }); },
    step: function (t) { tone(sfxBus, p50, midi(72), t, 0.03, 0.04, { sustain: 0.4, release: 0.02 }); tone(sfxBus, p50, midi(79), t + 0.05, 0.03, 0.04, { sustain: 0.4, release: 0.02 }); },
    chime: function (t) { [84, 88, 91, 96].forEach(function (m, i) { tone(sfxBus, 'triangle', midi(m), t + i * 0.06, 0.16, 0.13, { release: 0.25, send: 0.5 }); }); },
    sparkle: function (t) { [91, 96].forEach(function (m, i) { tone(sfxBus, p12, midi(m + [0, 2, 4][Math.random() * 3 | 0]), t + i * 0.07, 0.06, 0.04, { release: 0.12, send: 0.5 }); }); },
    secret: function (t) { [72, 76, 79, 84, 88, 91, 96, 100].forEach(function (m, i) { tone(sfxBus, p25, midi(m), t + i * 0.07, 0.12, 0.07, { release: 0.2, send: 0.6, vib: i === 7 }); }); }
  };

  /* ----- Nhạc riêng từ file (mp3/m4a/ogg): đặt music.file trong config.js ----- */
  // Dùng thẻ <audio> thay vì Web Audio để vẫn chạy khi mở index.html trực tiếp (file://)
  var FILE = cfg.file || '';
  var useSynth = !FILE, track = null, fadeT = null;

  function startSynth() {
    step = 0; loopN = 0; nextTime = ctx.currentTime + 0.08;
    clearInterval(timer);
    timer = setInterval(tick, 25);
    tick();
  }
  function fadeTrack(to, ms, done) {
    clearInterval(fadeT);
    var from = track.volume, t0 = Date.now();
    fadeT = setInterval(function () {
      var k = Math.min(1, (Date.now() - t0) / ms);
      track.volume = from + (to - from) * k;
      if (k >= 1) { clearInterval(fadeT); if (done) done(); }
    }, 30);
  }
  function notify() { if (api.onchange) api.onchange(playing); }

  // Trình duyệt chặn phát (chạm để cuộn trang chưa được tính là tương tác):
  // trả về trạng thái tắt và chờ lần chạm sau, KHÔNG đổi sang nhạc 8-bit
  function blocked() {
    if (!playing) return;
    playing = false;
    clearInterval(timer);
    if (track) track.pause();
    if (ctx) master.gain.setValueAtTime(0.0001, ctx.currentTime);
    notify();
  }
  // Chờ AudioContext chạy thật sự (dùng cho nhạc 8-bit)
  function confirmCtx() {
    return new Promise(function (resolve) {
      var t0 = Date.now();
      (function check() {
        if (!playing) return resolve(false);
        if (ctx.state === 'running') return resolve(true);
        if (Date.now() - t0 > 500) { blocked(); return resolve(false); }
        setTimeout(check, 50);
      })();
    });
  }
  // File lỗi hoặc không tìm thấy → quay về nhạc 8-bit
  function fallback(err) {
    if (!playing || useSynth) return Promise.resolve(false);
    console.warn('Không phát được "' + FILE + '", dùng nhạc 8-bit thay thế.', err || '');
    useSynth = true;
    if (!ctx) { blocked(); return Promise.resolve(false); }
    startSynth();
    notify();
    return confirmCtx();
  }
  var attempt = 0;
  function playTrack() {
    if (!track) {
      track = new Audio(FILE);
      track.loop = true;
      track.preload = 'auto';
    }
    var my = ++attempt;
    if (track.paused) track.volume = 0;
    var p = track.play();
    if (!p || !p.then) { fadeTrack(Math.min(1, VOL), 800); return Promise.resolve(true); }
    return p.then(function () {
      if (my === attempt && playing) fadeTrack(Math.min(1, VOL), 800);
      return true;
    }, function (err) {
      if (my !== attempt) return false;                       // đã có lần thử mới hơn
      if (err && err.name === 'AbortError') return false;     // người xem vừa bấm tắt
      if (err && err.name === 'NotAllowedError') { blocked(); return false; }
      return fallback(err);
    });
  }

  var api = {
    onchange: null,
    get playing() { return playing; },
    get usesFile() { return !useSynth; },
    // Trả về Promise<boolean>: true khi âm thanh đã thực sự phát
    start: function () {
      var hasCtx = init();
      if (hasCtx && ctx.state !== 'running') ctx.resume();
      if (!hasCtx && useSynth) return Promise.resolve(false);
      if (playing) {
        // đang chờ trình duyệt cho phép: thử lại trong lần tương tác này
        if (!useSynth && track && track.paused) return playTrack();
        return useSynth ? confirmCtx() : Promise.resolve(true);
      }
      playing = true;
      if (hasCtx) {
        var now = ctx.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), now);
        master.gain.linearRampToValueAtTime(VOL * 0.7, now + 0.8);
      }
      if (useSynth) { startSynth(); return confirmCtx(); }
      return playTrack();
    },
    stop: function () {
      if (!playing) return;
      playing = false;
      if (ctx) {
        var now = ctx.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(master.gain.value, now);
        master.gain.linearRampToValueAtTime(0.0001, now + 0.35);
        setTimeout(function () { if (!playing) clearInterval(timer); }, 400);
      }
      if (track) fadeTrack(0, 350, function () { if (!playing) track.pause(); });
    },
    toggle: function () { if (playing) api.stop(); else api.start(); return playing; },
    // Hiệu ứng chỉ phát khi người xem đã bật âm thanh
    sfx: function (name) {
      if (!ctx || !playing || !SFX[name]) return;
      if (ctx.state === 'suspended' && !document.hidden) ctx.resume();
      if (ctx.state !== 'running') return;
      SFX[name](ctx.currentTime + 0.01);
    }
  };

  // Tạm dừng khi chuyển tab để tiết kiệm pin, tiếp tục khi quay lại
  document.addEventListener('visibilitychange', function () {
    if (!playing) return;
    var fileOn = track && !useSynth;
    if (document.hidden) {
      if (ctx) ctx.suspend();
      if (fileOn) track.pause();
    } else {
      if (ctx) ctx.resume().then(function () { nextTime = Math.max(nextTime, ctx.currentTime + 0.05); });
      if (fileOn) track.play().catch(function () {});
    }
  });

  window.Chiptune = api;
})();
