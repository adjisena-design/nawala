/* Nawala invitation engine. No libraries.
   Reads one couple file (window.NAWALA_INVITE) and brings the skeleton to life:
   the opening with the guest's name and its film, then a guided walk of steps (one swipe, one step) with a
   travelling Nawala and a band of light between scenes; wording sets, events, countdown, calendar, gallery,
   RSVP by WhatsApp, wishes, digital envelope, music, language and the three levels.
   Link options: ?to=Nama+Tamu  ?lang=en  ?level=1|2|3  ?salam=umum|islam  ?step=<id>  ?film=1 (owner's review of the film) */
(function () {
  'use strict';

  var D = window.NAWALA_INVITE;
  if (!D) return;

  var root = document.documentElement;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conn = navigator.connection || {};
  var thrifty = !!conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '');

  var params = {};
  try { new URLSearchParams(location.search).forEach(function (v, k) { params[k] = v; }); } catch (e) {}
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function clamp(n, a, b) { return Math.min(b, Math.max(a, n)); }

  /* ---------- Wording sets: chosen per couple ---------- */
  var WORDING = {
    umum: {
      hello: ['Salam bahagia', 'With joy'],
      intro: ['Dengan penuh syukur, kami mengundang Bapak, Ibu, dan Saudara sekalian untuk hadir dan memberi restu pada hari pernikahan kami.',
              'With grateful hearts, we invite you to be with us and to give your blessing on our wedding day.'],
      verse: null, verseRef: null,
      ceremony: ['Upacara pernikahan', 'Wedding ceremony'],
      reception: ['Resepsi', 'Reception'],
      bye: ['Kehadiran dan doa restu Bapak, Ibu, dan Saudara adalah hadiah terindah bagi kami.',
            'Your presence and your blessing are the finest gift we could receive.'],
      sign: ['Dengan hormat, kami yang berbahagia', 'With love and respect']
    },
    islam: {
      hello: ["Assalamu'alaikum Warahmatullahi Wabarakatuh", "Assalamu'alaikum Warahmatullahi Wabarakatuh"],
      intro: ['Dengan memohon rahmat dan rida Allah Subhanahu wa Ta\'ala, kami mengundang Bapak, Ibu, dan Saudara sekalian untuk hadir pada pernikahan kami.',
              'Seeking the mercy and blessing of Allah, we invite you to be with us at our wedding.'],
      verse: ['Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.',
              'And among His signs is that He created for you spouses from among yourselves, that you may find rest in them, and He placed between you love and mercy.'],
      verseRef: ['QS. Ar-Rum: 21', 'Qur\'an, Ar-Rum 30:21'],
      ceremony: ['Akad nikah', 'Akad nikah'],
      reception: ['Resepsi', 'Reception'],
      bye: ['Merupakan kehormatan dan kebahagiaan bagi kami apabila Bapak, Ibu, dan Saudara berkenan hadir dan memberikan doa restu.',
            'It would be an honour and a joy for us if you could come and give your blessing.'],
      sign: ["Wassalamu'alaikum Warahmatullahi Wabarakatuh", "Wassalamu'alaikum Warahmatullahi Wabarakatuh"]
    }
  };

  var state = {
    lang: params.lang === 'en' ? 'en' : (params.lang === 'id' ? 'id' : (store('nawala-lang') === 'en' ? 'en' : 'id')),
    level: clamp(parseInt(params.level, 10) || D.level || 3, 1, 3),
    wording: WORDING[params.salam] ? params.salam : (WORDING[D.wording] ? D.wording : 'umum'),
    guest: (params.to || params.kepada || (D.sample && D.sampleGuest) || '').replace(/\s+/g, ' ').trim().slice(0, 60)
  };

  /* ---------- Two languages: every element keeps both texts ---------- */
  function say(el, pair) {
    if (!el) return;
    if (typeof pair === 'string') pair = [pair, pair];
    el.setAttribute('data-id', pair[0]);
    el.setAttribute('data-en', pair[1]);
    el.textContent = pair[state.lang === 'en' ? 1 : 0];
  }
  function t(id, en) { return state.lang === 'en' ? en : id; }
  function relabel() {
    $$('[data-en]').forEach(function (el) {
      if (el.children.length) return;
      if (!el.hasAttribute('data-id')) el.setAttribute('data-id', el.textContent);
      el.textContent = state.lang === 'en' ? el.getAttribute('data-en') : el.getAttribute('data-id');
    });
    root.lang = state.lang;
    var b = $('#lang');
    b.textContent = state.lang === 'en' ? 'ID' : 'EN';
    b.setAttribute('aria-label', state.lang === 'en' ? 'Ganti ke bahasa Indonesia' : 'Switch to English');
    $('#music').setAttribute('aria-label', t('Musik', 'Music'));
    $('#next').setAttribute('aria-label', t('Berikutnya', 'Next'));
    document.title = t('Undangan pernikahan ', 'The wedding of ') + D.bride.short + ' & ' + D.groom.short;
  }
  function make(tag, cls, pair) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (pair !== undefined) say(el, pair);
    return el;
  }
  function icon(d) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true');
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', d); svg.appendChild(p);
    return svg;
  }

  /* ---------- Dates ---------- */
  var DAY = [['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'], ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']];
  var MON = [['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
             ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']];
  var ymd = D.date.split('-').map(Number);
  var weekday = new Date(Date.UTC(ymd[0], ymd[1] - 1, ymd[2])).getUTCDay();
  var datePair = [0, 1].map(function (i) { return DAY[i][weekday] + ', ' + ymd[2] + ' ' + MON[i][ymd[1] - 1] + ' ' + ymd[0]; });
  function at(hm) { var p = hm.split(':').map(Number); return Date.UTC(ymd[0], ymd[1] - 1, ymd[2], p[0] - (D.utcOffset || 0), p[1]); }
  function clock(hm) { return hm.replace(':', '.'); }
  function stamp(ms) { return new Date(ms).toISOString().replace(/[-:]|\.\d{3}/g, ''); }

  /* ---------- Fill the page ---------- */
  function pick(path) { return path.split('.').reduce(function (o, k) { return o && o[k]; }, D); }
  function guestPair() { return state.guest ? [state.guest, state.guest] : ['Tamu undangan', 'Our guest']; }
  function setGuest(name) {
    state.guest = (name || '').replace(/\s+/g, ' ').trim().slice(0, 60);
    $$('[data-f="guest"]').forEach(function (el) {
      say(el, guestPair());
      el.classList.toggle('is-long', state.guest.length > 16);
    });
  }

  /* one step per event, placed after the countdown */
  var eventSteps = [];
  (function buildEvents() {
    var tpl = $('#event-step'), after = $('#acara');
    D.events.forEach(function (ev, i) {
      var node = (tpl.content ? tpl.content.firstElementChild : tpl.firstElementChild).cloneNode(true);
      node.id = 'acara-' + (i + 1);
      node.setAttribute('data-nw', i % 2 ? 'perch:.2' : 'perch:.82');
      after.parentNode.insertBefore(node, after.nextSibling); after = node;
      eventSteps.push(node);
    });
  })();

  function fill() {
    $$('[data-f]').forEach(function (el) {
      var k = el.getAttribute('data-f');
      if (k === 'guest') return;
      if (k === 'date') return say(el, datePair);
      var v = pick(k);
      if (v) say(el, v);
    });
    setGuest(state.guest);

    var story = $('#story'); story.textContent = '';
    (D.story || []).forEach(function (s) {
      var li = make('li');
      li.appendChild(make('span', '', s.when));
      li.appendChild(make('b', '', s.title));
      li.appendChild(make('p', '', s.text));
      story.appendChild(li);
    });
    if (!(D.story || []).length) $('#cerita').hidden = true;

    if (D.dress) {
      say($('#dress-note'), D.dress.note);
      var sw = $('#swatches'); sw.textContent = '';
      D.dress.colours.forEach(function (c) {
        var li = make('li'); var dot = make('i'); dot.style.background = c[0];
        li.appendChild(dot); li.appendChild(make('span', '', [c[1], c[2]])); sw.appendChild(li);
      });
    }
    if (D.stream) {
      say($('#stream-note'), D.stream.note);
      if (D.stream.url) { $('#stream-link').href = D.stream.url; $('#stream-link').hidden = false; }
    } else ['#stream-rule', '#stream-h', '#stream-p', '#stream-note'].forEach(function (s) { $(s).hidden = true; });
    if (!D.dress && !D.stream) $('#busana').hidden = true;

    var gifts = $('#gifts'); gifts.textContent = '';
    (D.gifts || []).forEach(function (g) {
      var row = make('div', 'acct'); var info = make('div');
      info.appendChild(make('span', '', g.bank));
      info.appendChild(make('b', '', g.number));
      info.appendChild(make('span', '', ['a.n. ' + g.name, 'in the name of ' + g.name]));
      var btn = make('button', 'copy', ['Salin', 'Copy']); btn.type = 'button';
      btn.addEventListener('click', function () { copy(g.number.replace(/\s/g, ''), btn); });
      row.appendChild(info); row.appendChild(btn); gifts.appendChild(row);
    });
    if (D.giftAddress) { say($('#gift-addr'), D.giftAddress); $('#gift-addr-wrap').hidden = false; }
    if (!(D.gifts || []).length && !D.giftAddress) $('#hadiah').hidden = true;

    wall();
    $('#sample-note').hidden = !D.sample;
    $('#review').hidden = !D.sample;
  }

  function wording() {
    var W = WORDING[state.wording];
    $$('[data-w]').forEach(function (el) {
      var v = W[el.getAttribute('data-w')];
      el.hidden = !v;
      if (v) say(el, v);
    });
    events();
  }

  function events() {
    var W = WORDING[state.wording];
    D.events.forEach(function (ev, i) {
      var el = eventSteps[i];
      say($('h2', el), W[ev.kind] || ev.title);
      say($('[data-k="time"]', el), [clock(ev.start) + ' sampai ' + clock(ev.end) + ' ' + D.zone, clock(ev.start) + ' to ' + clock(ev.end) + ' ' + D.zone]);
      say($('[data-k="date"]', el), datePair);
      say($('[data-k="place"]', el), ev.place);
      say($('[data-k="address"]', el), ev.address);
      var map = $('[data-k="map"]', el);
      if (ev.map) map.href = ev.map; else map.hidden = true;
    });
    var first = D.events[0], last = D.events[D.events.length - 1];
    $('#cal').href = 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      '&text=' + encodeURIComponent(t('Pernikahan ', 'Wedding of ') + D.bride.short + ' & ' + D.groom.short) +
      '&dates=' + stamp(at(first.start)) + '/' + stamp(at(last.end)) +
      '&location=' + encodeURIComponent(first.place + ', ' + first.address);
  }

  /* ---------- Countdown (ticks only while its step is showing) ---------- */
  var target = at(D.events[0].start);
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function tick() {
    var s = Math.max(0, Math.floor((target - Date.now()) / 1000));
    $('#c-d').textContent = Math.floor(s / 86400);
    $('#c-h').textContent = pad(Math.floor(s % 86400 / 3600));
    $('#c-m').textContent = pad(Math.floor(s % 3600 / 60));
    $('#c-s').textContent = pad(s % 60);
  }
  setInterval(function () { if (!document.hidden && $('#acara').classList.contains('is-on')) tick(); }, 1000);

  /* ---------- Copy ---------- */
  function copy(text, btn) {
    function ok() {
      btn.classList.add('is-ok'); say(btn, ['Tersalin', 'Copied']);
      setTimeout(function () { btn.classList.remove('is-ok'); say(btn, ['Salin', 'Copy']); }, 1800);
    }
    function old() {
      var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta); ta.select();
      try { if (document.execCommand('copy')) ok(); } catch (e) {}
      ta.remove();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, old); else old();
  }

  /* ---------- Wishes ---------- */
  var wishKey = 'nawala-wish-' + (D.bride.short + '-' + D.groom.short).toLowerCase();
  function mine() { try { return JSON.parse(store(wishKey) || 'null'); } catch (e) { return null; } }
  function wall() {
    var ul = $('#wishes'); ul.textContent = '';
    var m = mine();
    if (m && m.text) {
      var li = make('li', 'wish is-mine'); var b = make('b'); b.textContent = m.name + ' ';
      b.appendChild(make('span', 'tag', ['dari Anda', 'from you']));
      li.appendChild(b); var p = make('p'); p.textContent = m.text; li.appendChild(p); ul.appendChild(li);
    }
    (D.wishes || []).forEach(function (w) {
      var li = make('li', 'wish'); var b = make('b'); b.textContent = w.name + ' ';
      if (D.sample) b.appendChild(make('span', 'tag', ['contoh', 'sample']));
      li.appendChild(b); li.appendChild(make('p', '', w.text)); ul.appendChild(li);
    });
    $('#ucapan').hidden = !ul.children.length;
  }

  /* ---------- RSVP: written out for WhatsApp until the database exists ---------- */
  var form = $('#form'), nameIn = $('#f-name'), wishIn = $('#f-wish'), countOut = $('#f-count'), send = $('#send');
  var count = 1;
  function answer() { var r = $('input[name="hadir"]:checked', form); return r ? r.value : 'ya'; }
  function message() {
    var a = answer(), n = nameIn.value.trim();
    var lines = [t('Halo ', 'Hello ') + D.bride.short + ' & ' + D.groom.short + ',',
      t('Nama: ', 'Name: ') + n,
      t('Kehadiran: ', 'Attendance: ') + (a === 'ya' ? t('Hadir, ' + count + ' orang', 'Coming, ' + count + (count > 1 ? ' people' : ' person')) : a === 'tidak' ? t('Tidak dapat hadir', 'Cannot come') : t('Belum pasti', 'Not sure yet'))];
    var w = state.level >= 2 ? wishIn.value.trim() : '';
    if (w) lines.push(t('Ucapan: ', 'Wish: ') + w);
    return lines.join('\n');
  }
  function refresh() {
    var was = $('#f-count-wrap').hidden;
    $('#f-count-wrap').hidden = answer() !== 'ya';
    countOut.textContent = count;
    $('#f-less').disabled = count <= 1; $('#f-more').disabled = count >= 5;
    send.href = 'https://wa.me/' + D.whatsapp + '?text=' + encodeURIComponent(message());
    if (was !== $('#f-count-wrap').hidden) settle();
  }
  form.addEventListener('input', function () { if (!$('#f-err').hidden) { $('#f-err').hidden = true; settle(); } refresh(); });
  form.addEventListener('change', refresh);
  form.addEventListener('submit', function (e) { e.preventDefault(); });
  $('#f-less').addEventListener('click', function () { count = Math.max(1, count - 1); refresh(); });
  $('#f-more').addEventListener('click', function () { count = Math.min(5, count + 1); refresh(); });
  send.addEventListener('click', function (e) {
    var n = nameIn.value.trim();
    if (!n) { e.preventDefault(); $('#f-err').hidden = false; settle(); nameIn.focus(); return; }
    refresh();
    var w = state.level >= 2 ? wishIn.value.trim() : '';
    if (w) { store(wishKey, JSON.stringify({ name: n, text: w })); wall(); relabel(); }
    setTimeout(function () {
      form.hidden = true; var d = $('#done'); d.hidden = false;
      requestAnimationFrame(function () { d.classList.add('is-on'); });
      settle(); love();
    }, 500);
  });
  $('#again').addEventListener('click', function () { var d = $('#done'); d.hidden = true; d.classList.remove('is-on'); form.hidden = false; settle(); });

  /* ---------- Gallery: one large frame, six to choose from ---------- */
  var big = $('#big'), thumbs = $$('#thumbs .shot');
  function showShot(s) {
    big.textContent = ''; big.setAttribute('data-plate', s.getAttribute('data-plate'));
    $$('img', s).forEach(function (im) { big.appendChild(im.cloneNode()); });
    thumbs.forEach(function (x) { x.setAttribute('aria-pressed', String(x === s)); });
  }
  thumbs.forEach(function (s) { s.addEventListener('click', function () { showShot(s); }); });
  showShot(thumbs[0]);

  /* ---------- Music: starts with the tap that opens the letter ---------- */
  var audio = $('#audio'), musicBtn = $('#music'), triedFallback = false, wanted = false;
  function musicOn() { return D.music && state.level >= 2; }
  function showMusic() { musicBtn.hidden = !musicOn(); if (!musicOn()) stop(); }
  function play() {
    if (!musicOn()) return;
    wanted = true;
    if (!audio.getAttribute('src')) audio.src = D.music.src;
    audio.volume = 0.6;
    var p = audio.play();
    if (p && p.catch) p.catch(function () {});
  }
  function stop() { wanted = false; audio.pause(); }
  audio.addEventListener('error', function () {
    if (!triedFallback && D.music && D.music.fallback) { triedFallback = true; audio.src = D.music.fallback; if (wanted) play(); }
    else { musicBtn.hidden = true; wanted = false; }
  });
  audio.addEventListener('playing', function () { musicBtn.setAttribute('aria-pressed', 'true'); });
  audio.addEventListener('pause', function () { musicBtn.setAttribute('aria-pressed', 'false'); });
  musicBtn.addEventListener('click', function () { if (audio.paused) play(); else stop(); });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) audio.pause(); else if (wanted) play();
  });

  /* =====================================================================
     The walk: one swipe, one step
     ===================================================================== */
  var stage = $('#stage'), stepsBox = $('#steps'), nw = $('#nw'), sweepEl = $('#sweep'), nextBtn = $('#next');
  var worlds = {}, fronts = {};
  $$('.world').forEach(function (w) { worlds[w.getAttribute('data-scene')] = w; });
  $$('.front').forEach(function (f) { fronts[f.getAttribute('data-scene')] = f; });
  var cur = 0, busy = false, inside = false, baseH = 0;
  var SWEEP = 1600;

  function seq() {
    return $$('.step', stepsBox).filter(function (s) {
      return !s.hidden && +(s.getAttribute('data-level') || 1) <= state.level;
    });
  }
  function sceneOf(s) { return s.getAttribute('data-scene'); }

  /* the stage keeps the height it had when the page opened, so the on-screen keyboard cannot squeeze the scenery */
  function pinHeight(force) {
    var a = document.activeElement, typing = a && /^(INPUT|TEXTAREA)$/.test(a.tagName);
    if (!force && typing && window.innerHeight < baseH) return;
    baseH = window.innerHeight;
    root.style.setProperty('--sh', baseH + 'px');
  }

  /* keep a panel's writing above the moss in front of it */
  function sinks() {
    var H = stage.clientHeight, W = stage.clientWidth;
    var worldH = Math.max(H, W / 0.5581);
    $$('.step', stepsBox).forEach(function (s) {
      var world = worlds[sceneOf(s)];
      var line = parseFloat(getComputedStyle(world).getPropertyValue('--fg-line')) || 0.85;
      var padB = parseFloat(getComputedStyle(s).paddingBottom) || 0;
      var fgY = H - worldH * (1 - line);
      s.style.setProperty('--sink', Math.round(clamp(H - padB - fgY + 6, 46, Math.max(46, Math.min(96, H * 0.1)))) + 'px');   /* never under 46: the next button lives there */
    });
  }

  function setScene(name) {
    Object.keys(worlds).forEach(function (k) {
      worlds[k].classList.toggle('is-on', k === name);
      fronts[k].classList.toggle('is-on', k === name);
    });
    near(name);
  }
  /* load the pictures of this scene and of the scenes one step away */
  function near(name) {
    var list = seq(), names = {}; names[name] = 1;
    [cur - 1, cur + 1, cur + 2].forEach(function (i) { if (list[i]) { names[sceneOf(list[i])] = 1; list[i].classList.add('is-near'); } });
    if (list[cur]) list[cur].classList.add('is-near');
    Object.keys(names).forEach(function (k) { worlds[k].classList.add('is-near'); fronts[k].classList.add('is-near'); });
  }

  /* a small push of the camera at every step inside a scene */
  function camera(step) {
    var list = seq(), i = list.indexOf(step), k = 0;
    while (i - k - 1 >= 0 && sceneOf(list[i - k - 1]) === sceneOf(step)) k++;
    stage.style.setProperty('--cam', (1 + 0.035 * k).toFixed(3));
    stage.style.setProperty('--camf', (1 + 0.06 * k).toFixed(3));
  }

  /* where Nawala goes for a step */
  var sitTimer;
  function offset(el, upTo) { var x = 0, y = 0; while (el && el !== upTo) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; } return { x: x, y: y }; }
  function fly(step, instant) {
    var spec = (step.getAttribute('data-nw') || 'hide').split(':'), kind = spec[0], v = (spec[1] || '').split(',').map(Number);
    var H = stage.clientHeight, W = stage.clientWidth;
    clearTimeout(sitTimer);
    nw.classList.remove('is-love');
    if (kind === 'hide') { nw.classList.add('is-hidden'); return; }
    nw.classList.remove('is-hidden');
    var x, y, s = 1, sit = false;
    if (kind === 'fly') { x = W * v[0]; y = H * v[1]; s = v[2] || 1; }
    else {
      var pane = $('.pane', step), o = offset(pane, step);
      x = o.x + pane.offsetWidth * (v[0] || 0.8);
      if (kind === 'perch') { y = o.y + 10; sit = true; } else { y = o.y - 16; s = 0.8; }
    }
    var moved = Math.abs((parseFloat(nw.style.getPropertyValue('--x')) || 0) - x) + Math.abs((parseFloat(nw.style.getPropertyValue('--y')) || 0) - y) > 6;
    nw.style.setProperty('--x', Math.round(x) + 'px');
    nw.style.setProperty('--y', Math.round(y) + 'px');
    nw.style.setProperty('--s', s);
    if (!sit) { nw.classList.remove('is-sat'); return; }
    if (instant || reduced || !moved) { nw.classList.add('is-sat'); return; }
    nw.classList.remove('is-sat');
    sitTimer = setTimeout(function () { nw.classList.add('is-sat'); }, 1000);
  }
  /* after an answer is written out: Nawala opens and lets its love out */
  function love() {
    if (reduced || nw.classList.contains('is-hidden')) return;
    nw.classList.add('is-love');
    setTimeout(function () { nw.classList.remove('is-love'); }, 2600);
  }

  function runSweep(dir, scene) {
    sweepEl.setAttribute('data-scene', scene);
    sweepEl.classList.remove('is-run', 'is-down');
    void sweepEl.offsetWidth;
    if (dir < 0) sweepEl.classList.add('is-down');
    sweepEl.classList.add('is-run');
    clearTimeout(runSweep.t);
    runSweep.t = setTimeout(function () { sweepEl.classList.remove('is-run', 'is-down'); }, SWEEP + 80);
  }

  function chrome() {
    var list = seq();
    stage.style.setProperty('--at', list.length > 1 ? (cur / (list.length - 1)).toFixed(4) : 1);
    nextBtn.classList.toggle('is-last', cur >= list.length - 1 || cur === 0);
    var here = null;
    $$('#bar a').forEach(function (a) {
      var i = list.indexOf($(a.getAttribute('href')));
      if (i > -1 && i <= cur) here = a;
    });
    $$('#bar a').forEach(function (a) { a.classList.toggle('is-here', a === here); });
    list.forEach(function (s, i) { if (i === cur) s.removeAttribute('inert'); else s.setAttribute('inert', ''); });
    if (list[cur] && list[cur].id === 'acara') tick();
  }

  /* put a step on screen at once (start, level change, resize) */
  function jump(i) {
    var list = seq(); cur = clamp(i, 0, list.length - 1);
    $$('.step', stepsBox).forEach(function (s) { s.classList.remove('is-on', 'is-out'); });
    var s = list[cur];
    setScene(sceneOf(s)); camera(s); s.classList.add('is-on'); fly(s, true); chrome();
  }

  /* move to another step: always the whole way, never half */
  function go(to) {
    var list = seq();
    if (!inside || busy || to < 0 || to >= list.length || to === cur) return;
    var from = list[cur], next = list[to], dir = to > cur ? 1 : -1, change = sceneOf(from) !== sceneOf(next);
    busy = true; cur = to;
    stage.style.setProperty('--dir', dir);
    next.style.transition = 'none'; void next.offsetWidth; next.style.transition = '';
    from.classList.remove('is-on'); from.classList.add('is-out');
    setTimeout(function () { from.classList.remove('is-out'); }, 620);
    chrome(); near(sceneOf(next));
    function arrive(wait) {
      setTimeout(function () { next.classList.add('is-on'); }, wait);
      setTimeout(function () { busy = false; }, wait + (reduced ? 60 : 640));
    }
    if (change && !reduced) {
      runSweep(dir, sceneOf(next));
      fly(next);
      setTimeout(function () { setScene(sceneOf(next)); camera(next); }, SWEEP * 0.5);
      arrive(SWEEP * 0.56);
    } else {
      if (change) setScene(sceneOf(next));
      camera(next); fly(next); arrive(reduced ? 0 : 150);
    }
  }

  /* ----- touch: any swipe, short or hard, is exactly one step ----- */
  function scroller(el) {
    while (el && el !== stage) {
      if (el.classList && (el.classList.contains('pane') || el.classList.contains('scrolls')) && el.scrollHeight > el.clientHeight + 2) return el;
      el = el.parentNode;
    }
    return null;
  }
  var touch = null;
  stage.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) { touch = null; return; }
    var p = e.touches[0], sc = scroller(e.target);
    touch = { x: p.clientX, y: p.clientY, sc: sc, top: sc ? sc.scrollTop : 0, max: sc ? sc.scrollHeight - sc.clientHeight : 0 };
  }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    if (!touch) return;
    var p = e.changedTouches[0], dy = touch.y - p.clientY, dx = touch.x - p.clientX, s = touch; touch = null;
    if (Math.abs(dy) < 40 || Math.abs(dy) < Math.abs(dx) * 1.3) return;
    var a = document.activeElement;
    if (a && /^(INPUT|TEXTAREA)$/.test(a.tagName) && stage.contains(a)) { a.blur(); return; }   /* the first swipe puts the keyboard away */
    if (s.sc) { if (dy > 0 && s.top < s.max - 2) return; if (dy < 0 && s.top > 2) return; }   /* the panel itself still has more to show */
    go(cur + (dy > 0 ? 1 : -1));
  }, { passive: true });
  stage.addEventListener('touchcancel', function () { touch = null; }, { passive: true });

  /* ----- wheel, keys, buttons ----- */
  var wheelLock = false;
  stage.addEventListener('wheel', function (e) {
    var sc = scroller(e.target);
    if (sc && ((e.deltaY > 0 && sc.scrollTop < sc.scrollHeight - sc.clientHeight - 2) || (e.deltaY < 0 && sc.scrollTop > 2))) return;
    e.preventDefault();
    if (wheelLock || Math.abs(e.deltaY) < 10) return;
    wheelLock = true; setTimeout(function () { wheelLock = false; }, 950);
    go(cur + (e.deltaY > 0 ? 1 : -1));
  }, { passive: false });
  document.addEventListener('keydown', function (e) {
    var tag = (e.target && e.target.tagName) || '';
    if (!inside || /^(INPUT|TEXTAREA)$/.test(tag) || document.querySelector('dialog[open]')) return;
    if (e.key === ' ' && /^(BUTTON|A)$/.test(tag)) return;
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); go(cur + 1); }
    else if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); go(cur - 1); }
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(seq().length - 1);
  });
  nextBtn.addEventListener('click', function () { go(cur + 1); });
  $$('#bar a').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var i = seq().indexOf($(a.getAttribute('href')));
      if (i > -1) go(i);
    });
  });

  /* ----- the on-screen keyboard: lift the walk so the field being typed in stays in view ----- */
  var vv = window.visualViewport, lifted = 0;
  function lift() {
    var a = document.activeElement;
    if (!vv || !a || !/^(INPUT|TEXTAREA)$/.test(a.tagName) || !stage.contains(a) || baseH - vv.height < 120) { lifted = 0; stepsBox.style.transform = ''; return; }
    var r = a.getBoundingClientRect();
    var over = (r.bottom + lifted) + 20 - (vv.height + vv.offsetTop);
    lifted = over > 0 ? Math.round(over) : 0;
    stepsBox.style.transform = lifted ? 'translate3d(0,' + (-lifted) + 'px,0)' : '';
  }
  if (vv) vv.addEventListener('resize', lift);
  document.addEventListener('focusin', function () { setTimeout(lift, 350); });
  document.addEventListener('focusout', function () { setTimeout(lift, 120); });

  /* after anything changes size: writing, language, level, the window */
  function settle() {
    sinks();
    if (!inside) return;
    var s = seq()[cur]; if (s) fly(s, true);
  }
  var resizeT;
  window.addEventListener('resize', function () {
    clearTimeout(resizeT);
    resizeT = setTimeout(function () { pinHeight(false); settle(); }, 120);
  });
  window.addEventListener('orientationchange', function () { setTimeout(function () { pinHeight(true); settle(); }, 300); });

  /* =====================================================================
     The opening
     ===================================================================== */
  var gate = $('#gate'), film = $('#film'), opening = false, entered = false, filmDead = !D.film, filmTried = false;
  var HEART = 'M12 20.500c-5-3.600-8-6.500-8-10a4.300 4.300 0 0 1 8-2.300 4.300 4.300 0 0 1 8 2.300c0 3.500-3 6.400-8 10z';
  function hearts(box) {
    for (var i = 0; i < 9; i++) {
      var el = document.createElement('i'); var a = -Math.PI / 2 + (i - 4) * 0.32, r = 120 + (i % 3) * 46;
      el.style.setProperty('--hx', Math.round(Math.cos(a) * r) + 'px');
      el.style.setProperty('--hy', Math.round(Math.sin(a) * r - 40) + 'px');
      el.style.setProperty('--hs', (0.8 + (i % 4) * 0.25).toFixed(2));
      el.style.setProperty('--hr', ((i % 2 ? 1 : -1) * (8 + i * 3)) + 'deg');
      el.style.setProperty('--hd', (0.15 + i * 0.06).toFixed(2) + 's');
      var svg = icon(HEART); svg.firstChild.setAttribute('fill', 'currentColor'); el.appendChild(svg); box.appendChild(el);
    }
  }
  hearts($('#hearts')); hearts($('#nw-hearts'));

  /* the film is fetched quietly once the first screen is complete; it is only played if it is ready at the tap */
  function primeFilm() {
    if (filmDead || thrifty || reduced) return;
    film.preload = 'auto'; film.src = D.film.src; film.load();
  }
  film.addEventListener('error', function () {
    /* the stand-in address is the 10.8 MB original: only for the owner's review (?film=1), never for guests */
    if (!filmTried && D.film && D.film.fallback && params.film === '1') { filmTried = true; film.src = D.film.fallback; film.load(); }
    else filmDead = true;
  });

  function startAt() {
    var el = params.step ? document.getElementById(params.step.replace(/[^\w-]/g, '')) : null;
    var i = el ? seq().indexOf(el) : -1;
    return i > -1 ? i : 0;
  }
  function enter() {
    if (entered) return; entered = true;
    inside = true; root.classList.add('is-inside');
    jump(startAt());
    gate.classList.add('is-gone');
    setTimeout(function () { gate.hidden = true; try { film.pause(); } catch (e) {} }, reduced ? 50 : 900);
  }
  function open() {
    if (opening) return; opening = true;
    if (!thrifty) play();
    if (reduced) return enter();
    gate.classList.add('is-turn');
    setTimeout(function () { gate.classList.add('is-open'); }, 900);
    setTimeout(function () {
      var rate = (D.film && D.film.rate) || 1.2;
      if (!filmDead && film.readyState >= 3) {
        gate.classList.add('is-film');
        film.playbackRate = rate;
        var p = film.play();
        if (p && p.catch) p.catch(enter);
        film.addEventListener('ended', enter, { once: true });
        setTimeout(enter, ((film.duration || 5) / rate) * 1000 + 1200);
      } else { gate.classList.add('is-zoom'); enter(); }
    }, 2300);
  }
  function replay() {
    opening = false; entered = false; inside = false; stop(); audio.currentTime = 0;
    try { film.pause(); film.currentTime = 0; } catch (e) {}
    gate.hidden = false; gate.classList.remove('is-turn', 'is-open', 'is-gone', 'is-film', 'is-zoom'); root.classList.remove('is-inside');
  }
  $('#open').addEventListener('click', open);
  $('#skip').addEventListener('click', enter);

  /* ---------- Language ---------- */
  $('#lang').addEventListener('click', function () {
    state.lang = state.lang === 'en' ? 'id' : 'en'; store('nawala-lang', state.lang);
    relabel(); events(); relabel(); refresh(); settle();
  });

  /* ---------- Levels and the review sheet ---------- */
  function setLevel(n) {
    var here = seq()[cur];
    state.level = n; root.setAttribute('data-lv', n);
    showMusic(); refresh(); press(); sinks();
    if (inside) { var i = seq().indexOf(here); jump(i > -1 ? i : 0); }
  }
  function press() {
    $$('#seg-level button').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-v') === state.level)); });
    $$('#seg-word button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === state.wording)); });
  }
  var sheet = $('#sheet');
  $('#review').addEventListener('click', function () { $('#sheet-guest').value = state.guest; press(); if (sheet.showModal) sheet.showModal(); });
  $('#seg-level').addEventListener('click', function (e) { var v = e.target.getAttribute('data-v'); if (v) setLevel(+v); });
  $('#seg-word').addEventListener('click', function (e) {
    var v = e.target.getAttribute('data-v'); if (!v) return;
    state.wording = v; wording(); relabel(); press(); settle();
  });
  $('#sheet-guest').addEventListener('input', function (e) { setGuest(e.target.value); if (!nameIn.value || nameIn.dataset.auto) { nameIn.value = state.guest; nameIn.dataset.auto = '1'; refresh(); } });
  $('#sheet-x').addEventListener('click', function () { sheet.close(); });
  $('#sheet-replay').addEventListener('click', function () { sheet.close(); replay(); });
  sheet.addEventListener('click', function (e) { if (e.target === sheet) sheet.close(); });

  /* ---------- Start ---------- */
  root.setAttribute('data-lv', state.level);
  pinHeight(true);
  fill(); wording(); relabel();
  if (state.guest) { nameIn.value = state.guest; nameIn.dataset.auto = '1'; }
  showMusic(); refresh(); press(); tick(); sinks();
  worlds.sky.classList.add('is-near'); fronts.sky.classList.add('is-near');
  var later = function () { setTimeout(function () { primeFilm(); sinks(); }, 400); };
  if (document.readyState === 'complete') later(); else window.addEventListener('load', later);
})();
