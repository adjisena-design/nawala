/**
 * Papan: a drawing board with a sheet pinned to it and a pencil at work. Moving
 * the pointer across draws the design: an arch, the ground it stands on, a sun
 * above. The line being drawn is the bright one and the pencil stays on its
 * end. At rest the arch is half drawn. The slider is the length of the pencil.
 *
 * The pattern: scrub. One spring follows the pointer's x.
 */
const {
  Cam, clamp, facing, fit, open, poly, proj, rings, rrect, prism,
  spring, stepS, disposer, flatDot, mk, place, pointer, put, reflect, register, solid,
} = HL;

const BW = 96, BD = 66, TOP = 4, REST = 0.42;
// the design, as strokes on the sheet
const STROKES = (() => {
  const a = [[24, 52], [24, 32]];
  for (let k = 1; k <= 12; k++) { const q = Math.PI - (k / 12) * Math.PI; a.push([38 + Math.cos(q) * 14, 32 - Math.sin(q) * 14]); }
  a.push([52, 52]);
  const b = [[14, 52], [84, 52]];
  const c = []; for (let k = 0; k <= 16; k++) { const q = (k / 16) * Math.PI * 2 - Math.PI / 2; c.push([72 + Math.cos(q) * 7, 24 + Math.sin(q) * 7]); }
  return [a, b, c];
})();
const LEN = STROKES.map((s) => s.length - 1), ALL = LEN.reduce((x, y) => x + y, 0);

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let pen = value;

  const C = Cam(45, 0.5, 2.25);
  fit(C, [[-6, -6, -3], [BW + 6, BD + 6, -3], [BW + 6, -6, 0], [-6, BD + 6, 0], [40, 20, 44]], 200, 176);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const [fr, fi] = rings(0, 0, BW, BD, 7, 2);
  reflect(svg, g, P, front, fr, 0, 12);
  put(solid(g), prism(P, front, fr, fi, 0, TOP));
  mk("path", { d: poly(rrect(7, 7, BW - 7, BD - 7, 2, 4).map((q) => P(q.u, q.v, TOP))), class: "nf lo" }, g);
  [[10, 10], [BW - 10, 10], [10, BD - 10], [BW - 10, BD - 10]].forEach(([x, y]) => place(flatDot(g, C, 1.3, "dot off"), P(x, y, TOP)));
  const done = mk("path", { class: "nf" }, g), live = mk("path", { class: "nf hi" }, g);
  const pencil = mk("path", {}, g), nib = mk("path", { class: "nf lo" }, g);

  const o = spring(REST);
  let drawn = NaN;
  function draw(t) {
    if (Math.abs(t - drawn) < 0.0004) return;
    drawn = t;
    let left = t * ALL, dDone = "", dLive = "", tip = STROKES[0][0];
    STROKES.forEach((s, k) => {
      if (left <= 0) return;
      const n = Math.min(left, LEN[k]), full = Math.floor(n), f = n - full, pts = s.slice(0, full + 1);
      if (f > 0.001 && full < LEN[k]) pts.push([s[full][0] + (s[full + 1][0] - s[full][0]) * f, s[full][1] + (s[full + 1][1] - s[full][1]) * f]);
      const d = open(pts.map(([x, y]) => P(x, y, TOP)));
      if (left > LEN[k] + 0.001) dDone += d; else { dLive = d; tip = pts[pts.length - 1]; }
      left -= LEN[k];
    });
    if (!dLive) tip = STROKES[2][STROKES[2].length - 1];
    done.setAttribute("d", dDone); live.setAttribute("d", dLive);
    // the pencil leans back from its point
    const a = P(tip[0], tip[1], TOP), b = P(tip[0] - 7, tip[1] - 7, TOP + pen), dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = (-dy / l) * 2.6, ny = (dx / l) * 2.6;
    const at = (f, sgn) => [a[0] + dx * f + nx * sgn, a[1] + dy * f + ny * sgn];
    pencil.setAttribute("d", poly([a, at(0.2, 1), at(1, 1), at(1, -1), at(0.2, -1)]));
    nib.setAttribute("d", open([at(0.2, 1), at(0.2, -1)]) + open([at(0.86, 1), at(0.86, -1)]));
  }
  let over = false, said = "";
  function say() { const s = over ? "sketsa " + Math.round(o.t * 10) * 10 : "rest"; if (s !== said) { said = s; read.textContent = s; } }
  draw(REST); say();

  const B = register(stage, (dt) => { const m = stepS(o, dt); draw(o.x); say(); return m; });
  bag.add(B.unregister);
  bag.add(pointer(stage, {
    move: ([x]) => { over = true; o.t = clamp((x - 90) / 220, 0, 1); B.wake(); },
    leave: () => { over = false; o.t = REST; B.wake(); },
  }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { pen = clamp(v, 14, 48); drawn = NaN; draw(o.x); }, destroy: bag.dispose };
}

hairline({
  name: "papan",
  means: "A drawing board: moving across draws the design on the pinned sheet, arch, ground and sun, the pencil on the line's end.",
  rules: [1, 3, 5, 10],
  range: [26, 34, 42],
  tour: [[110, 180], [200, 190], [310, 180], null],
  mount,
});
