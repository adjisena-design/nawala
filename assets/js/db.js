/* The Nawala database as the pages see it. Loaded by the two consoles (tim/, ruang/) and by the invitations.
   Only the publishable key lives here: on its own it can do nothing but call the functions in
   supabase/migrations/ (consoles, team_door, builder), and each checks a team token, an access code or an invitation. */
window.NAWALA_DB = (function () {
  'use strict';
  var URL = 'https://erwddnobnagpglkpvdfm.supabase.co', KEY = 'sb_publishable_S1QUgptDBKUYn_yn0lPc0A_9hVsKwQe';
  /* keep: true lets a save finish while the page is being closed */
  function rpc(name, body, keep) {
    return fetch(URL + '/rest/v1/rpc/' + name, {
      method: 'POST', keepalive: !!keep,
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {})
    }).then(function (r) {
      if (!r.ok) { var e = new Error('db ' + r.status); e.status = r.status; throw e; }
      return r.json();
    });
  }
  function wa(text, number) { return 'https://wa.me/' + (number || '6281379211628') + (text ? '?text=' + encodeURIComponent(text) : ''); }
  /* Pictures and films go to the public bucket "media". media_ticket() checks the team token or the couple's code and
     hands out a one-off folder name; the storage policy only lets a file in under such a name, and never overwrites.
     put(who, kind, target, files) uploads [{suffix, blob}] under one ticket and answers the public address of the folder
     name (without suffix or extension). */
  var MEDIA = URL + '/storage/v1/object/public/media/';
  function ext(blob) { return blob.type === 'video/mp4' ? 'mp4' : blob.type === 'image/jpeg' ? 'jpg' : 'webp'; }
  function put(who, kind, target, files) {
    return rpc('media_ticket', { p_who: who, p_kind: kind, p_target: target }).then(function (pre) {
      if (!pre) { var e = new Error('no ticket'); e.status = 403; throw e; }
      return files.reduce(function (chain, f) {
        return chain.then(function () {
          return fetch(URL + '/storage/v1/object/media/' + pre + (f.suffix || '') + '.' + ext(f.blob), {
            method: 'POST',
            headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': f.blob.type, 'x-upsert': 'false', 'cache-control': 'max-age=31536000' },
            body: f.blob
          }).then(function (r) { if (!r.ok) { var e = new Error('upload ' + r.status); e.status = r.status; throw e; } });
        });
      }, Promise.resolve()).then(function () { return MEDIA + pre; });
    });
  }
  /* only our own bucket is trusted for pictures shown to guests */
  function isMedia(u) { return typeof u === 'string' && u.indexOf(MEDIA) === 0 && !/["'<>\s]/.test(u); }
  return { rpc: rpc, wa: wa, put: put, isMedia: isMedia, media: MEDIA, url: URL, key: KEY, site: 'https://nawalainvite.com/' };
})();
