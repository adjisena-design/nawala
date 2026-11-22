/* The arch's real opening film and the guests' album (owner, approved 22 Nov 2026). */
(function () {
  'use strict';
  var d = document;
  function ready(fn) { if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', fn); else fn(); }
  ready(function () {
    var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var c = navigator.connection, thrifty = !!(c && (c.saveData || /2g|3g/.test(c.effectiveType || '')));

    /* 4. the real opening plays from its beginning every time its message arrives, and stops when it leaves */
    var say = d.querySelector('.say[data-step="1"]'), film = d.getElementById('open-film');
    if (say && film && !calm && !thrifty) {
      var sync = function () {
        if (say.classList.contains('is-on')) {
          if (!film.src) film.src = film.getAttribute('data-src');
          try { film.currentTime = 0; } catch (e) {}
          var p = film.play(); if (p && p.catch) p.catch(function () {});
        } else { try { film.pause(); } catch (e) {} }
      };
      new MutationObserver(sync).observe(say, { attributes: true, attributeFilter: ['class'] });
      sync();
    }

    /* 3. each photo starts on its guest's phone and lands on its own place in the album: measure both */
    var scr = d.querySelector('.scr--photo');
    if (!scr) return;
    function measure() {
      var shots = scr.querySelectorAll('.ga__shot'), tiles = scr.querySelectorAll('.ga__t--new');
      for (var i = 0; i < tiles.length; i++) {
        var a = shots[i].getBoundingClientRect(), b = tiles[i].getBoundingClientRect();
        if (!b.width) continue;
        var f = tiles[i].querySelector('.ga__fly');
        f.style.setProperty('--dx', Math.round(a.left + a.width / 2 - (b.left + b.width / 2)) + 'px');
        f.style.setProperty('--dy', Math.round(a.top + a.height / 2 - (b.top + b.height / 2)) + 'px');
        f.style.setProperty('--s0', (a.width / b.width).toFixed(3));
      }
    }
    new MutationObserver(function () { if (scr.classList.contains('play')) measure(); }).observe(scr, { attributes: true, attributeFilter: ['class'] });
    new MutationObserver(function () { if (scr.classList.contains('play')) setTimeout(measure, 850); }).observe(scr, { attributes: true, attributeFilter: ['class'] });
    addEventListener('resize', measure);
    setTimeout(measure, 600);
  });
})();
