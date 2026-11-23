/**
 * Dunia: a phone that opens into a world. Behind the standing phone wait three
 * sheets of scenery: leaves, an arch, a sun. Moving the pointer across draws
 * them out one behind the other, and the one last drawn out takes the bright
 * line. At rest the first sheet is out. The slider is the distance between
 * the sheets.
 *
 * The pattern: scrub. One spring follows the pointer's x.
 */
const {
  Cam, clamp, facing, fit, open, poly, proj, rings, rrect, prism,
  spring, stepS, disposer, mk, pointer, put, reflect, register, solid,
} = HL;

const W = 15, H = 50, REST = 0.36;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let gap = value;

  const C = Cam(45, 0.5, 2.3);
  fit(C, [[-24, -74, -3], [24, 14, -3], [24, -74, 0], [-24, 14, 0], [-W, -70, H + 6], [W, 4, H]], 200, 172);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const [fr, fi] = rings(-24, -74, 24, 14, 12, 2);
  reflect(svg, g, P, front, fr, -3, 12);
  put(solid(g), prism(P, front, fr, fi, -3, 0));

  // far to near: sun, arch, leaves, then the phone
  const sheets = [2, 1, 0].map((k) => { const grp = mk("g", {}, g); return { k, grp, body: solid(grp), art: mk("path", { class: "nf lo" }, grp) }; });
  const ph = solid(g);
  { const [r, i] = rings(-W, 0, W, 3.6, 2.4, 0.8); put(ph, prism(P, front, r, i, 0, H)); }
  mk("path", { d: poly(rrect(-W + 2.2, 3, W - 2.2, H - 3, 1.6, 4).map((q) => P(q.u, 3.6, q.v))), class: "nf lo" }, g);
  const mark = mk("path", { class: "nf hi" }, g);
  { const pts = [[-5, 14]]; for (let k = 0; k <= 10; k++) { const a = Math.PI - (k / 10) * Math.PI; pts.push([Math.cos(a) * 5, 26 + Math.sin(a) * 5]); } pts.push([5, 14]); mark.setAttribute("d", open(pts.map(([u, v]) => P(u, 3.6, v)))); }

  const art = (k, y) => {
    if (k === 0) { const pts = []; for (let i = 0; i <= 12; i++) pts.push([-W + 2 + (i / 12) * (2 * W - 4), 16 + (i % 2 ? 7 : 0) + (i % 4 === 1 ? 5 : 0)]); return open(pts.map(([u, v]) => P(u, y, v))); }
    if (k === 1) { const pts = [[-8, 4]]; for (let i = 0; i <= 12; i++) { const a = Math.PI - (i / 12) * Math.PI; pts.push([Math.cos(a) * 8, 28 + Math.sin(a) * 8]); } pts.push([8, 4]); return open(pts.map(([u, v]) => P(u, y, v))); }
    const ring = []; for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; ring.push(P(Math.cos(a) * 8, y, 34 + Math.sin(a) * 8)); } return poly(ring);
  };
  const o = spring(REST);
  let drawn = NaN, lit = -2;
  function draw(t) {
    if (Math.abs(t - drawn) < 0.0004) return;
    drawn = t;
    sheets.forEach((s) => {
      const e = clamp(t * 3 - s.k * 0.85, 0, 1), y1 = -1.5 - (s.k + 1) * gap * e, hh = H - 4 + s.k * 3 * e;
      const [r, i] = rings(-W + 1, y1 - 1.6, W - 1, y1, 1.6, 0.6);
      put(s.body, prism(P, front, r, i, 0, hh));
      s.art.setAttribute("d", art(s.k, y1));
      if (e < 0.06) s.grp.setAttribute("display", "none"); else s.grp.removeAttribute("display");
    });
    const now = t < 0.12 ? -1 : clamp(Math.floor(t * 3 + 0.15), 0, 2);
    if (now !== lit) { lit = now; mark.setAttribute("class", now < 0 ? "nf hi" : "nf lo"); sheets.forEach((s) => s.art.setAttribute("class", s.k === now ? "nf hi" : "nf lo")); }
  }
  let over = false, said = "";
  function say() { const s = over ? "lapis " + clamp(Math.floor(o.t * 3 + 0.15), 0, 3) : "rest"; if (s !== said) { said = s; read.textContent = s; } }
  draw(REST); say();

  const B = register(stage, (dt) => { const m = stepS(o, dt); draw(o.x); say(); return m; });
  bag.add(B.unregister);
  bag.add(pointer(stage, {
    move: ([x]) => { over = true; o.t = clamp((x - 90) / 220, 0, 1); B.wake(); },
    leave: () => { over = false; o.t = REST; B.wake(); },
  }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { gap = clamp(v, 6, 26); drawn = NaN; draw(o.x); }, destroy: bag.dispose };
}

hairline({
  name: "dunia",
  means: "A phone that opens into a world: moving across draws out sheets of scenery behind it, leaves, an arch, a sun.",
  rules: [1, 3, 5, 9],
  range: [12, 18, 23],
  tour: [[110, 190], [200, 170], [310, 150], null],
  mount,
});
