/**
 * Album: an open photo album lying flat, six pockets on its two pages, and six
 * prints from the guests hanging above them. Moving the pointer across lets the
 * prints drop into their pockets one after another; the one on its way down
 * carries the bright edge, and the read-out counts the photos in the album.
 * At rest two are in and the third is half-way. The slider is the height
 * the prints fall from.
 *
 * The pattern: scrub. One spring follows the pointer's x; every print's height
 * is read from it.
 */
const {
  Cam, clamp, facing, fit, lerp, poly, proj, ringAt, rings, rrect, seg, prism,
  spring, stepS, disposer, mk, pointer, put, reflect, register, solid,
} = HL;

const W = 132, D = 88, GUT = 5, CZ = 3, PZ = 5.5, REST = 0.62, N = 4;
// pockets: two on each page, one behind the other
const POCKETS = [];
for (let page = 0; page < 2; page++) for (let k = 0; k < 2; k++) {
  const x0 = page === 0 ? 9 : W / 2 + GUT / 2 + 6, x1 = page === 0 ? W / 2 - GUT / 2 - 6 : W - 9;
  POCKETS.push([x0, k === 0 ? 8 : 47, x1, k === 0 ? 41 : 80]);
}
// the order they land in: far to near, so a landed print is never painted over a falling one behind it
const ORDER = POCKETS.map((_, i) => i).sort((a, b) => POCKETS[a][0] + POCKETS[a][1] - POCKETS[b][0] - POCKETS[b][1]);

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let drop = value;

  const C = Cam(45, 0.5, 1.72);
  fit(C, [[0, 0, 0], [W, D, 0], [W, 0, 0], [0, D, 0], [8, 8, PZ + 56], [W - 8, 8, PZ + 56], [W - 8, 80, PZ + 56]], 200, 172);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  // the cover, then the two pages lying on it with the gutter between them
  const [cr, ci] = rings(0, 0, W, D, 7, 1.6);
  reflect(svg, g, P, front, cr, 0, 12);
  put(solid(g), prism(P, front, cr, ci, 0, CZ));
  [[3, W / 2 - GUT / 2], [W / 2 + GUT / 2, W - 3]].forEach(([a, b]) => { const [r, i] = rings(a, 3, b, D - 3, 4, 1.2); put(solid(g), prism(P, front, r, i, CZ, PZ)); });
  // the spine's stitching, down the gutter
  mk("path", { d: [14, 30, 46, 62, 78].map((y) => seg(P(W / 2, y - 4, CZ), P(W / 2, y + 4, CZ))).join(""), class: "nf lo" }, g);
  // the pockets, drawn on the pages
  mk("path", { d: POCKETS.map(([x0, y0, x1, y1]) => poly(ringAt(P, rrect(x0, y0, x1, y1, 2, 3), PZ))).join(""), class: "nf lo" }, g);

  // the prints, in landing order: each a thin plate with a picture's border inside
  const prints = ORDER.map((p) => {
    const [x0, y0, x1, y1] = POCKETS[p], grp = mk("g", {}, g);
    return { plate: mk("path", { class: "sil" }, grp), pic: mk("path", { class: "nf lo" }, grp), ring: rrect(x0 + 1.2, y0 + 1.2, x1 - 1.2, y1 - 1.2, 1.6, 3), in: rrect(x0 + 4.5, y0 + 4.5, x1 - 4.5, y1 - 8, 1, 3), drawn: NaN };
  });

  const o = spring(REST);
  let lit = -2, said = "";
  function draw(t) {
    const at = t * N;
    prints.forEach((pr, k) => {
      // print k falls while the scrub passes from k to k + 1; before that it hangs, higher the later its turn
      const f = clamp(at - k, 0, 1), ease = f * f * (3 - 2 * f);
      const z = PZ + 0.6 + (1 - ease) * (drop + (k - Math.min(at, k)) * 4);
      if (Math.abs(z - pr.drawn) < 0.01) return;
      pr.drawn = z;
      pr.plate.setAttribute("d", poly(ringAt(P, pr.ring, z)));
      pr.pic.setAttribute("d", poly(ringAt(P, pr.in, z)));
    });
    // the bright edge rides on the print that is falling; once all are in, on the last one landed
    const now = clamp(Math.floor(at), 0, N - 1);
    if (now !== lit) { lit = now; prints.forEach((pr, k) => pr.plate.classList.toggle("hi", k === now)); }
  }
  function say(t, on) {
    const s = on ? "foto " + String(clamp(Math.round(t * N), 0, N)).padStart(2, "0") : "rest";
    if (s !== said) { said = s; read.textContent = s; }
  }
  draw(REST); say(REST, false);

  let over = false;
  const B = register(stage, (dt) => { const m = stepS(o, dt); draw(o.x); say(o.t, over); return m; });
  bag.add(B.unregister);

  // the pointer's x across the stage is the scrub: nothing drawn is tested, so nothing can flicker
  bag.add(pointer(stage, {
    move: ([x]) => { over = true; o.t = clamp((x - 96) / 208, 0, 1); B.wake(); },
    leave: () => { over = false; o.t = REST; B.wake(); },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { drop = clamp(v, 6, 60); prints.forEach((pr) => { pr.drawn = NaN; }); draw(o.x); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "album",
  means: "An open album and four prints from the guests: moving across lets them drop into their pockets one by one.",
  rules: [1, 3, 5, 8],
  range: [16, 30, 46],
  tour: [[110, 160], [200, 150], [300, 170], null],
  mount,
});
