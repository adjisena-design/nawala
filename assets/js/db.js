/* The Nawala database as the pages see it. Loaded by the two consoles (tim/, ruang/) and by the invitations.
   Only the publishable key lives here: on its own it can do nothing but call the functions in
   supabase/migrations/20261121_consoles.sql, and each of those checks a team token, an access code or an invitation. */
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
  return { rpc: rpc, wa: wa, site: 'https://nawalainvite.com/' };
})();
