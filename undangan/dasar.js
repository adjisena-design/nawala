/* Nawala Dasar engine: the scroll invitation. No libraries.
   Same couple file as the Premium walk; themes are picked with ?tema=<slug> (see THEMES).
   Reads one couple file (window.NAWALA_INVITE) and brings the skeleton to life:
   the opening with the guest's name, wording sets, events, countdown, calendar, gallery, RSVP by WhatsApp,
   wishes, digital envelope, music, language and the three levels.
   Link options: ?to=Nama+Tamu  ?tema=<slug>  ?lang=en  ?level=1|2|3  ?salam=umum|islam */
(function () {
  'use strict';

  var D = window.NAWALA_INVITE;
  if (!D) return;

  var root = document.documentElement;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var params = {};
  try { new URLSearchParams(location.search).forEach(function (v, k) { params[k] = v; }); } catch (e) {}
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

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

  /* the photographic Dasar themes: slug, name, and whether writing on the picture is dark (light) or light (dark) */
  var THEMES = {
    'putih-klasik': ['Putih Klasik', 'Classic White', 'light'], 'sage': ['Sage', 'Sage', 'light'], 'dusty-rose': ['Dusty Rose', 'Dusty Rose', 'light'],
    'emas-lembut': ['Emas Lembut', 'Soft Gold', 'light'], 'biru-langit': ['Biru Langit', 'Sky Blue', 'light'], 'lavender': ['Lavender', 'Lavender', 'light'],
    'terakota': ['Terakota', 'Terracotta', 'light'], 'daun-tropis': ['Daun Tropis', 'Tropical Leaf', 'light'], 'marun': ['Marun', 'Maroon', 'dark'],
    'melati': ['Melati', 'Jasmine', 'light'], 'senja': ['Senja', 'Sunset', 'light'], 'malam-bintang': ['Malam Bintang', 'Starry Night', 'dark']
  };

  var state = {
    lang: params.lang === 'en' ? 'en' : (params.lang === 'id' ? 'id' : (store('nawala-lang') === 'en' ? 'en' : 'id')),
    theme: THEMES[params.tema] ? params.tema : (THEMES[D.dasarTheme] ? D.dasarTheme : 'putih-klasik'),
    level: Math.min(3, Math.max(1, parseInt(params.level, 10) || D.level || 3)),
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
    $('#music').setAttribute('aria-label', state.lang === 'en' ? 'Music' : 'Musik');
  }
  function t(id, en) { return state.lang === 'en' ? en : id; }
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

  function fill() {
    $$('[data-f]').forEach(function (el) {
      var k = el.getAttribute('data-f');
      if (k === 'guest') return;
      if (k === 'date') return say(el, datePair);
      var v = pick(k);
      if (v) say(el, v);
    });
    setGuest(state.guest);
    document.title = t('Undangan pernikahan ', 'The wedding of ') + D.bride.short + ' & ' + D.groom.short;

    /* story */
    var story = $('#story'); story.textContent = '';
    (D.story || []).forEach(function (s) {
      var li = make('li');
      li.appendChild(make('span', '', s.when));
      li.appendChild(make('b', '', s.title));
      li.appendChild(make('p', '', s.text));
      story.appendChild(li);
    });
    if (!(D.story || []).length) $('#cerita').hidden = true;

    /* dress, stream */
    if (D.dress) {
      say($('#dress-note'), D.dress.note);
      var sw = $('#swatches'); sw.textContent = '';
      D.dress.colours.forEach(function (c) {
        var li = make('li'); var dot = make('i'); dot.style.background = c[0];
        li.appendChild(dot); li.appendChild(make('span', '', [c[1], c[2]])); sw.appendChild(li);
      });
    } else $('#dress').hidden = true;
    if (D.stream) {
      say($('#stream-note'), D.stream.note);
      if (D.stream.url) { $('#stream-link').href = D.stream.url; $('#stream-link').hidden = false; }
    } else $('#stream').hidden = true;

    /* gifts */
    var gifts = $('#gifts'); gifts.textContent = '';
    (D.gifts || []).forEach(function (g) {
      var row = make('div', 'acct'); var info = make('div');
      info.appendChild(make('span', '', g.bank));
      info.appendChild(make('b', '', g.number));
      info.appendChild(make('span', '', [' a.n. ' + g.name, 'in the name of ' + g.name]));
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

  var PIN = 'M12 21s-6.500-5.800-6.500-11a6.500 6.500 0 0 1 13 0c0 5.200-6.500 11-6.500 11zM12 12.500a2.500 2.500 0 1 0 0-5 2.500 2.500 0 0 0 0 5z';
  var CLOCK = 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.500V12l3 2';
  function events() {
    var W = WORDING[state.wording];
    var box = $('#events'); box.textContent = '';
    D.events.forEach(function (ev, i) {
      var el = make('div', 'event');
      el.appendChild(make('h3', '', W[ev.kind] || ev.title));
      var r1 = make('div', 'event__row'); r1.appendChild(icon(CLOCK));
      var p1 = make('p'); p1.appendChild(make('b', '', [clock(ev.start) + ' sampai ' + clock(ev.end) + ' ' + D.zone, clock(ev.start) + ' to ' + clock(ev.end) + ' ' + D.zone]));
      p1.appendChild(make('span', '', datePair)); r1.appendChild(p1); el.appendChild(r1);
      var r2 = make('div', 'event__row'); r2.appendChild(icon(PIN));
      var p2 = make('p'); p2.appendChild(make('b', '', ev.place)); p2.appendChild(make('span', '', ev.address)); r2.appendChild(p2); el.appendChild(r2);
      var next = D.events[i + 1];
      if (ev.map && !(next && next.map === ev.map)) {
        var a = make('a', 'btn btn--line btn--wide', ['Buka peta', 'Open the map']);
        a.href = ev.map; a.target = '_blank'; a.rel = 'noopener'; el.appendChild(a);
      }
      box.appendChild(el);
    });
    var first = D.events[0], last = D.events[D.events.length - 1];
    $('#cal').href = 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      '&text=' + encodeURIComponent(t('Pernikahan ', 'Wedding of ') + D.bride.short + ' & ' + D.groom.short) +
      '&dates=' + stamp(at(first.start)) + '/' + stamp(at(last.end)) +
      '&location=' + encodeURIComponent(first.place + ', ' + first.address);
  }

  /* ---------- Countdown ---------- */
  var target = at(D.events[0].start);
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function tick() {
    var s = Math.max(0, Math.floor((target - Date.now()) / 1000));
    $('#c-d').textContent = Math.floor(s / 86400);
    $('#c-h').textContent = pad(Math.floor(s % 86400 / 3600));
    $('#c-m').textContent = pad(Math.floor(s % 3600 / 60));
    $('#c-s').textContent = pad(s % 60);
  }
  var live = false;
  setInterval(function () { if (live && !document.hidden) tick(); }, 1000);

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
    $('#f-count-wrap').hidden = answer() !== 'ya';
    countOut.textContent = count;
    $('#f-less').disabled = count <= 1; $('#f-more').disabled = count >= 5;
    send.href = 'https://wa.me/' + D.whatsapp + '?text=' + encodeURIComponent(message());
  }
  form.addEventListener('input', function () { $('#f-err').hidden = true; refresh(); });
  form.addEventListener('change', refresh);
  form.addEventListener('submit', function (e) { e.preventDefault(); });
  $('#f-less').addEventListener('click', function () { count = Math.max(1, count - 1); refresh(); });
  $('#f-more').addEventListener('click', function () { count = Math.min(5, count + 1); refresh(); });
  send.addEventListener('click', function (e) {
    var n = nameIn.value.trim();
    if (!n) { e.preventDefault(); $('#f-err').hidden = false; nameIn.focus(); return; }
    refresh();
    var w = state.level >= 2 ? wishIn.value.trim() : '';
    if (w) { store(wishKey, JSON.stringify({ name: n, text: w })); wall(); relabel(); }
    setTimeout(function () {
      form.hidden = true; var d = $('#done'); d.hidden = false;
      requestAnimationFrame(function () { d.classList.add('is-on'); });
    }, 500);
  });
  $('#again').addEventListener('click', function () { var d = $('#done'); d.hidden = true; d.classList.remove('is-on'); form.hidden = false; nameIn.focus(); });

  /* ---------- Gallery ---------- */
  var box = $('#lightbox');
  $('#shots').addEventListener('click', function (e) {
    var s = e.target.closest ? e.target.closest('.shot') : null;
    if (!s || !box.showModal) return;
    var slot = $('#lightbox-slot'); slot.textContent = '';
    var c = document.createElement('div'); c.className = s.className; c.setAttribute('data-plate', s.getAttribute('data-plate'));
    $$('img', s).forEach(function (im) { c.appendChild(im.cloneNode()); });
    slot.appendChild(c); box.showModal();
  });
  $('#lightbox-x').addEventListener('click', function () { box.close(); });
  box.addEventListener('click', function (e) { if (e.target === box) box.close(); });

  /* ---------- Music: starts with the tap that opens the letter ---------- */
  var audio = $('#audio'), musicBtn = $('#music'), triedFallback = false, wanted = false;
  var conn = navigator.connection || {};
  var thrifty = conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '');
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

  /* ---------- The opening ---------- */
  var gate = $('#gate'), opening = false;
  var HEART = 'M12 20.500c-5-3.600-8-6.500-8-10a4.300 4.300 0 0 1 8-2.300 4.300 4.300 0 0 1 8 2.300c0 3.500-3 6.400-8 10z';
  (function hearts() {
    var h = $('#hearts');
    for (var i = 0; i < 9; i++) {
      var el = document.createElement('i'); var a = -Math.PI / 2 + (i - 4) * 0.32, r = 120 + (i % 3) * 46;
      el.style.setProperty('--hx', Math.round(Math.cos(a) * r) + 'px');
      el.style.setProperty('--hy', Math.round(Math.sin(a) * r - 40) + 'px');
      el.style.setProperty('--hs', (0.8 + (i % 4) * 0.25).toFixed(2));
      el.style.setProperty('--hr', ((i % 2 ? 1 : -1) * (8 + i * 3)) + 'deg');
      el.style.setProperty('--hd', (0.15 + i * 0.06).toFixed(2) + 's');
      var svg = icon(HEART); svg.firstChild.setAttribute('fill', 'currentColor'); el.appendChild(svg); h.appendChild(el);
    }
  })();
  function lock(on) { root.classList.toggle('is-locked', on); document.body.classList.toggle('is-locked', on); }
  function inside() {
    lock(false); gate.classList.add('is-gone'); root.classList.add('is-inside');
    setTimeout(function () { gate.hidden = true; }, reduced ? 50 : 1100);
  }
  function open() {
    if (opening) return; opening = true;
    if (!thrifty) play();
    if (reduced) return inside();
    gate.classList.add('is-turn');
    setTimeout(function () { gate.classList.add('is-open'); }, 900);
    setTimeout(inside, 2700);
  }
  function replay() {
    opening = false; stop(); audio.currentTime = 0;
    gate.hidden = false; gate.classList.remove('is-turn', 'is-open', 'is-gone'); root.classList.remove('is-inside');
    window.scrollTo(0, 0); lock(true);
  }
  $('#open').addEventListener('click', open);
  lock(true);

  /* ---------- Language ---------- */
  $('#lang').addEventListener('click', function () {
    state.lang = state.lang === 'en' ? 'id' : 'en'; store('nawala-lang', state.lang);
    relabel(); events(); relabel(); refresh();
    document.title = t('Undangan pernikahan ', 'The wedding of ') + D.bride.short + ' & ' + D.groom.short;
  });

  /* ---------- Levels and the review sheet ---------- */
  function setLevel(n) {
    state.level = n; root.setAttribute('data-lv', n);
    showMusic(); refresh(); press();
  }
  function setTheme(slug) {
    if (!THEMES[slug]) return;
    state.theme = slug;
    root.setAttribute('data-theme', slug); root.setAttribute('data-tone', THEMES[slug][2]);
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', getComputedStyle(root).getPropertyValue('--main').trim() || '#16301F');
    press();
  }
  (function themeButtons() {
    var box = $('#seg-theme');
    Object.keys(THEMES).forEach(function (slug) {
      var b = make('button', '', [THEMES[slug][0], THEMES[slug][1]]); b.type = 'button'; b.setAttribute('data-v', slug);
      box.appendChild(b);
    });
    box.addEventListener('click', function (e) { var v = e.target.getAttribute('data-v'); if (v) setTheme(v); });
  })();
  function press() {
    $$('#seg-theme button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === state.theme)); });
    $$('#seg-level button').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-v') === state.level)); });
    $$('#seg-word button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === state.wording)); });
  }
  var sheet = $('#sheet');
  $('#review').addEventListener('click', function () { $('#sheet-guest').value = state.guest; press(); if (sheet.showModal) sheet.showModal(); });
  $('#seg-level').addEventListener('click', function (e) { var v = e.target.getAttribute('data-v'); if (v) setLevel(+v); });
  $('#seg-word').addEventListener('click', function (e) {
    var v = e.target.getAttribute('data-v'); if (!v) return;
    state.wording = v; wording(); relabel(); press();
  });
  $('#sheet-guest').addEventListener('input', function (e) { setGuest(e.target.value); if (!nameIn.value || nameIn.dataset.auto) { nameIn.value = state.guest; nameIn.dataset.auto = '1'; refresh(); } });
  $('#sheet-x').addEventListener('click', function () { sheet.close(); });
  $('#sheet-replay').addEventListener('click', function () { sheet.close(); replay(); });
  sheet.addEventListener('click', function (e) { if (e.target === sheet) sheet.close(); });

  /* ---------- What is on screen ---------- */
  var links = $$('#bar a');
  if ('IntersectionObserver' in window) {
    var near = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-near'); near.unobserve(e.target); } });
    }, { rootMargin: '120% 0px' });
    var onscreen = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        e.target.classList.toggle('is-live', e.isIntersecting);
        if (e.target.id === 'adegan-acara') { live = e.isIntersecting; if (live) tick(); }
      });
    });
    $$('.scene').forEach(function (s) { onscreen.observe(s); });
    /* the opening comes first: the scenery further down starts loading only once the first screen is complete */
    var later = function () { setTimeout(function () { $$('.scene').forEach(function (s) { near.observe(s); }); }, 600); };
    if (document.readyState === 'complete') later(); else window.addEventListener('load', later);

    var show = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); show.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    $$('.rv').forEach(function (el) { show.observe(el); });

    var here = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('is-here', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    links.forEach(function (a) { var el = $(a.getAttribute('href')); if (el) here.observe(el); });
    var top = $('#sampul');
    new IntersectionObserver(function (es) { if (es[0].isIntersecting) links.forEach(function (a) { a.classList.remove('is-here'); }); }, { threshold: 0.6 }).observe(top);
  } else {
    $$('.scene').forEach(function (s) { s.classList.add('is-near', 'is-live'); });
    $$('.rv').forEach(function (el) { el.classList.add('is-in'); });
    live = true;
  }

  /* ---------- Start ---------- */
  root.setAttribute('data-lv', state.level);
  setTheme(state.theme);
  fill(); wording(); relabel();
  if (state.guest) { nameIn.value = state.guest; nameIn.dataset.auto = '1'; }
  showMusic(); refresh(); press(); tick();
})();
