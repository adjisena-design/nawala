/**
 * Album: the couple's open album, four pockets on its two pages, and a guest's
 * phone standing beside it. Moving the pointer across sends four photos, one
 * after another, out of the phone, over in an arc and down into their pockets;
 * the one in flight carries the bright edge and the read-out counts the photos
 * in the album. At rest two are in and the third is on its way. The prints
 * carry real photographs: the one place this figure leaves pure line. The
 * slider is the height of the arc.
 *
 * The pattern: scrub. One spring follows the pointer's x; every print's place
 * is read from it.
 */
const {
  Cam, clamp, facing, fit, poly, proj, ringAt, rings, rrect, seg, prism,
  spring, stepS, disposer, mk, pointer, put, reflect, register, solid,
} = HL;

const W = 132, D = 88, GUT = 5, CZ = 3, PZ = 5.5, REST = 0.62, N = 4;
const PH = { x0: -44, x1: -24, y0: 66, y1: 70, h: 42 };   // the guest's phone
const SHOTS = ["tamu-pelaminan", "tamu-kue", "tamu-lengkung", "tamu-meja"];
const POCKETS = [];
for (let page = 0; page < 2; page++) for (let k = 0; k < 2; k++) {
  const x0 = page === 0 ? 9 : W / 2 + GUT / 2 + 6, x1 = page === 0 ? W / 2 - GUT / 2 - 6 : W - 9;
  POCKETS.push([x0, k === 0 ? 8 : 47, x1, k === 0 ? 41 : 80]);
}
// the order they land in: far to near, so a landed print is never painted over one still in flight behind it
const ORDER = POCKETS.map((_, i) => i).sort((a, b) => POCKETS[a][0] + POCKETS[a][1] - POCKETS[b][0] - POCKETS[b][1]);

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let arc = value;

  const C = Cam(45, 0.5, 1.5);
  fit(C, [[PH.x0, 0, 0], [W, D, 0], [W, 0, 0], [PH.x0, D, 0], [PH.x0, PH.y0, PH.h + 4], [40, 30, PZ + 60], [W - 8, 8, PZ + 30]], 200, 176);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  const [cr, ci] = rings(0, 0, W, D, 7, 1.6);
  reflect(svg, g, P, front, cr, 0, 12);
  put(solid(g), prism(P, front, cr, ci, 0, CZ));
  [[3, W / 2 - GUT / 2], [W / 2 + GUT / 2, W - 3]].forEach(([a, b]) => { const [r, i] = rings(a, 3, b, D - 3, 4, 1.2); put(solid(g), prism(P, front, r, i, CZ, PZ)); });
  mk("path", { d: [14, 30, 46, 62, 78].map((y) => seg(P(W / 2, y - 4, CZ), P(W / 2, y + 4, CZ))).join(""), class: "nf lo" }, g);
  mk("path", { d: POCKETS.map(([x0, y0, x1, y1]) => poly(ringAt(P, rrect(x0, y0, x1, y1, 2, 3), PZ))).join(""), class: "nf lo" }, g);

  // the prints, in landing order. Each is a plate, its photograph laid on it, and the plate's edge again on top
  const sx = (PH.x0 + PH.x1) / 2, sy = (PH.y0 + PH.y1) / 2, sz = PH.h + 6;
  const prints = ORDER.map((p, k) => {
    const [x0, y0, x1, y1] = POCKETS[p], w = x1 - x0 - 2.4, h = y1 - y0 - 2.4, grp = mk("g", {}, g);
    const plate = mk("path", {}, grp);
    const img = mk("image", { href: "assets/img/" + SHOTS[k] + ".webp", width: w - 5, height: h - 5, preserveAspectRatio: "xMidYMid slice" }, grp);
    const edge = mk("path", { class: "nf sil" }, grp);
    return { plate, img, edge, w, h, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, ring: rrect(-w / 2, -h / 2, w / 2, h / 2, 1.6, 3), drawn: NaN };
  });

  // the guest's phone, nearest the viewer, painted last
  const pg = mk("g", {}, g), body = solid(pg);
  const [pr, pi] = rings(PH.x0, PH.y0, PH.x1, PH.y1, 2.4, 0.9);
  put(body, prism(P, front, pr, pi, 0, PH.h));
  mk("path", { d: poly(rrect(PH.x0 + 2.2, 3, PH.x1 - 2.2, PH.h - 3, 1.5, 4).map((q) => P(q.u, PH.y1, q.v))), class: "nf lo" }, pg);
  mk("path", { d: poly(rrect(sx - 3.2, PH.h - 7.2, sx + 3.2, PH.h - 5.4, 0.9, 4).map((q) => P(q.u, PH.y1, q.v))), class: "nf" }, pg);

  const o = spring(REST);
  let lit = -2, said = "";
  function draw(t) {
    const at = t * N;
    prints.forEach((pr2, k) => {
      // print k flies while the scrub passes from k to k + 1; before its turn it waits inside the phone, unseen
      const f = clamp(at - k, 0, 1), e = f * f * (3 - 2 * f);
      if (Math.abs(e - pr2.drawn) < 0.0008) return;
      pr2.drawn = e;
      const show = f > 0.02;
      [pr2.plate, pr2.img, pr2.edge].forEach((el) => { if (show) el.removeAttribute("display"); else el.setAttribute("display", "none"); });
      if (!show) return;
      const cx = sx + (pr2.cx - sx) * e, cy = sy + (pr2.cy - sy) * e;
      const z = sz + (PZ + 0.7 - sz) * e + Math.sin(Math.PI * e) * arc, s = 0.35 + 0.65 * e;
      const pts = pr2.ring.map((q) => P(cx + q.u * s, cy + q.v * s, z));
      const d = poly(pts);
      pr2.plate.setAttribute("d", d); pr2.edge.setAttribute("d", d);
      // the photograph: an affine map of its rectangle onto the print's own plane
      const iw = (pr2.w - 5) * s, ih = (pr2.h - 5) * s;
      const A = P(cx - iw / 2, cy - ih / 2, z), B = P(cx + iw / 2, cy - ih / 2, z), Cc = P(cx - iw / 2, cy + ih / 2, z);
      const m = [(B[0] - A[0]) / (pr2.w - 5), (B[1] - A[1]) / (pr2.w - 5), (Cc[0] - A[0]) / (pr2.h - 5), (Cc[1] - A[1]) / (pr2.h - 5), A[0], A[1]];
      pr2.img.setAttribute("transform", "matrix(" + m.map((n) => n.toFixed(3)).join(" ") + ")");
    });
    // the bright edge rides on the print in flight; once all are in, on the last one landed
    const now = clamp(Math.floor(at), 0, N - 1);
    if (now !== lit) { lit = now; prints.forEach((pr2, k) => pr2.edge.classList.toggle("hi", k === now)); }
  }
  function say(t, on) {
    const s = on ? "foto " + String(clamp(Math.round(t * N), 0, N)).padStart(2, "0") : "rest";
    if (s !== said) { said = s; read.textContent = s; }
  }
  draw(REST); say(REST, false);

  let over = false;
  const B2 = register(stage, (dt) => { const m = stepS(o, dt); draw(o.x); say(o.t, over); return m; });
  bag.add(B2.unregister);

  // the pointer's x across the stage is the scrub: nothing drawn is tested, so nothing can flicker
  bag.add(pointer(stage, {
    move: ([x]) => { over = true; o.t = clamp((x - 90) / 220, 0, 1); B2.wake(); },
    leave: () => { over = false; o.t = REST; B2.wake(); },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { arc = clamp(v, 4, 40); prints.forEach((pr2) => { pr2.drawn = NaN; }); draw(o.x); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "album",
  means: "A guest's phone beside the couple's album: moving across sends four photos over, one by one, into their pockets.",
  rules: [1, 3, 5, 8],
  range: [8, 18, 30],
  tour: [[96, 190], [170, 150], [250, 160], [312, 170], null],
  mount,
});
