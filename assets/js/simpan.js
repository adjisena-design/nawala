/* Saved themes, for the home page and for the invitations when they are opened from the theme list.
   A visitor's saves live in this browser only: 10 at most, gone if the browser's data is cleared or the phone is reset.
   With an access code they live in the couple's room (ruang/, 30 at most), and whatever this browser held moves there.
   Needs db.js only when there is a code. */
window.NAWALA_SAVE = (function () {
  'use strict';
  var KEY = 'nawala-simpan', CODE = 'nawala-code', CAP = 10, ROOM_CAP = 30;
  var ok = function (s) { return typeof s === 'string' && /^[a-z0-9-]{2,40}$/.test(s); };
  function uniq(list, max) { var out = []; (Array.isArray(list) ? list : []).forEach(function (s) { if (ok(s) && out.indexOf(s) < 0) out.push(s); }); return max ? out.slice(0, max) : out; }
  function read() {
    var o = {}; try { o = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) {}
    return { saved: uniq(o.saved, CAP), no: uniq(o.no).slice(-80), told: !!o.told };
  }
  function write() { try { localStorage.setItem(KEY, JSON.stringify(local)); } catch (e) {} }
  function code() { try { return sessionStorage.getItem(CODE) || localStorage.getItem(CODE) || ''; } catch (e) { return ''; } }
  function drop(list, s) { var i = list.indexOf(s); if (i > -1) list.splice(i, 1); }

  var local = read(), room = null, watchers = [];
  function changed() { watchers.forEach(function (fn) { try { fn(); } catch (e) {} }); }
  function state() { return room ? room.state : local; }

  /* send the room's state; keep = true lets it finish while the page is being left */
  function push(keep) {
    if (!room || !window.NAWALA_DB) return Promise.resolve(false);
    return window.NAWALA_DB.rpc('room_save', { p_code: room.code, p_state: room.state }, keep).then(function (r) { return r !== false; }, function () { return false; });
  }
  /* open the room when this browser holds a code, and move the browser's own saves into it */
  function open() {
    var c = code();
    if (!c || !window.NAWALA_DB) { room = null; return Promise.resolve(false); }
    return window.NAWALA_DB.rpc('room_open', { p_code: c }).then(function (r) {
      if (!r) { room = null; return false; }
      var s = r.state || {};
      s.saved = uniq(s.saved, ROOM_CAP); s.no = uniq(s.no);
      room = { code: r.code || c, state: s };
      var moved = false;
      local.saved.forEach(function (x) { if (s.saved.indexOf(x) < 0 && s.saved.length < ROOM_CAP) { s.saved.push(x); drop(s.no, x); moved = true; } });
      local.no.forEach(function (x) { if (s.saved.indexOf(x) < 0 && s.no.indexOf(x) < 0) { s.no.push(x); moved = true; } });
      if (local.saved.length || local.no.length) { local.saved = []; local.no = []; write(); }
      if (moved) push(false);
      changed();
      return true;
    }, function () { room = null; return false; });
  }
  var ready = open();

  return {
    ready: function () { return ready; },
    reopen: function () { ready = open(); return ready; },         /* after a code has just been accepted */
    onChange: function (fn) { watchers.push(fn); },
    inRoom: function () { return !!room; },
    cap: function () { return room ? ROOM_CAP : CAP; },
    list: function () { return state().saved.slice(); },
    isSaved: function (s) { return state().saved.indexOf(s) > -1; },
    isPassed: function (s) { return state().no.indexOf(s) > -1; },
    /* returns { ok, full, first }: first = the visitor has not yet been told where saves are kept */
    save: function (s, keep) {
      var st = state();
      if (!ok(s)) return { ok: false };
      if (st.saved.indexOf(s) > -1) return { ok: true, first: false };
      if (st.saved.length >= (room ? ROOM_CAP : CAP)) return { ok: false, full: true };
      st.saved.push(s); drop(st.no, s);
      var first = !room && !local.told;
      if (room) push(keep); else write();
      changed();
      return { ok: true, first: first };
    },
    told: function () { if (!local.told) { local.told = true; write(); } },
    pass: function (s, keep) {
      var st = state(); if (!ok(s)) return;
      drop(st.saved, s); if (room && st.final === s) st.final = '';
      if (st.no.indexOf(s) < 0) st.no.push(s);
      if (room) push(keep); else write();
      changed();
    },
    remove: function (s, keep) {
      var st = state(); drop(st.saved, s); drop(st.no, s);
      if (room) { if (st.final === s) st.final = ''; push(keep); } else write();
      changed();
    }
  };
})();
