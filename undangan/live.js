/* Which couple this page shows. Loaded right after the sample couple file, before anything reads it.
   - On nawalainvite.com/<name> the edge worker (cloudflare/worker.js) has already put the couple's data in the page
     and set NAWALA_LIVE: nothing to do.
   - ?u=<name> asks the database for a published invitation (the same data, without the worker). If there is none,
     the page says so instead of showing the sample couple.
   - ?preview=1 shows the draft the console or the couple's room left in this browser (localStorage "nawala-preview").
   A couple whose theme is a Dasar one is sent to dasar.html, and the other way round. */
(function () {
  if (window.NAWALA_LIVE) return;
  var q = location.search, D = null, missing = false;
  var URL = 'https://erwddnobnagpglkpvdfm.supabase.co', KEY = 'sb_publishable_S1QUgptDBKUYn_yn0lPc0A_9hVsKwQe';
  try {
    if (/[?&]preview=1(&|$)/.test(q)) {
      D = JSON.parse(localStorage.getItem('nawala-preview') || 'null');
    } else {
      var m = q.match(/[?&]u=([a-z0-9-]{3,60})(&|$)/);
      if (m) {
        var x = new XMLHttpRequest();
        x.open('POST', URL + '/rest/v1/rpc/guest_invitation', false);
        x.setRequestHeader('apikey', KEY); x.setRequestHeader('Authorization', 'Bearer ' + KEY); x.setRequestHeader('Content-Type', 'application/json');
        x.send(JSON.stringify({ p_slug: m[1] }));
        var r = x.status === 200 ? JSON.parse(x.responseText) : null;
        if (r && r.data) D = r.data; else missing = true;
      }
    }
  } catch (e) { missing = /[?&]u=/.test(q); }
  if (D && D.route) {
    var onDasar = /dasar\.html$/.test(location.pathname);
    if ((D.route === 'dasar') !== onDasar) { location.replace((D.route === 'dasar' ? 'dasar.html' : './') + q); return; }
  }
  if (D) window.NAWALA_INVITE = D;
  if (missing) {
    document.write('<style>body>*:not(#nf){display:none!important}#nf{position:fixed;inset:0;display:grid;place-items:center;padding:24px;background:#16301F;color:#FBF6EA;font:400 18px/1.5 system-ui,sans-serif;text-align:center}#nf a{color:#F6C445;font-weight:600}</style>' +
      '<div id="nf"><div><p style="font-size:24px;margin:0 0 8px">Undangan ini tidak ditemukan atau belum tayang.</p><p style="margin:0 0 16px;opacity:.8">This invitation was not found, or it is not live yet.</p><a href="https://nawalainvite.com/">nawalainvite.com</a></div></div>');
  }
})();
