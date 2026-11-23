/**
 * Hari: one letter and the six stops of a wedding day. Six low pedestals step
 * across the floor, numbered by the dots on their tops; a small winged letter
 * travels over them as the pointer moves across, hopping from one to the next.
 * The pedestal under it rises and takes the bright edge. At rest the letter is
 * on its way to the third. The slider is the height of the hop.
 *
 * The pattern: scrub. One spring follows the pointer's x; the letter's place
 * and every pedestal's lift are read from it.
 */
const {
  Cam, circ, clamp, facing, fillet, fit, poly, proj, rings, seg, prism,
  spring, stepS, disposer, flatDot, mk, place, pointer, put, reflect, register, solid,
} = HL;

const N = 6, R = 10.5, TZ = 5, REST = 0.3;
const STOPS = [[8, 30], [34, 6], [60, 32], [86, 8], [112, 34], [138, 10]];
const at = (ring, cx, cy) => ring.map((q) => ({ u: q.u + cx, v: q.v + cy, nu: q.nu, nv: q.nv }));

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let hop = value;

  const C = Cam(45, 0.5, 1.72);
  fit(C, [[-6, -8, 0], [152, 48, 0], [152, -8, 0], [-6, 48, 0], [8, 30, 60], [138, 10, 60]], 200, 172);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const [fr, fi] = rings(-8, -10, 154, 50, 12, 2);
  reflect(svg, g, P, front, fr, -3, 12);
  put(solid(g), prism(P, front, fr, fi, -3, 0));
  // the way from stop to stop, drawn on the floor
  mk("path", { d: STOPS.slice(1).map((s, i) => seg(P(STOPS[i][0], STOPS[i][1], 0), P(s[0], s[1], 0))).join(""), class: "nf dash" }, g);

  const order = STOPS.map((_, i) => i).sort((a, b) => STOPS[a][0] + STOPS[a][1] - STOPS[b][0] - STOPS[b][1]);
  const peds = [];
  order.forEach((i) => {
    const [cx, cy] = STOPS[i], grp = mk("g", {}, g), body = solid(grp), dots = [];
    for (let k = 0; k <= i; k++) dots.push(flatDot(grp, C, 1.5, "dot off"));
    peds[i] = { cx, cy, body, dots, ring: at(circ(R, 26), cx, cy), inner: at(circ(R - 1.5, 26), cx, cy), drawn: NaN };
  });
  // the letter: a small envelope standing in the air, a wing behind each top corner
  const lg = mk("g", {}, g), wings = mk("path", { class: "sil" }, lg), env = solid(lg), vee = mk("path", { class: "nf lo" }, lg), seal = mk("path", { class: "nf hi" }, lg);

  function drawPed(p, i, z) {
    if (Math.abs(z - p.drawn) < 0.01) return;
    p.drawn = z;
    put(p.body, prism(P, front, p.ring, p.inner, 0, TZ + z));
    p.dots.forEach((el, k) => { const a = (k / (i + 1)) * Math.PI * 2 - Math.PI / 2, r = i ? 4.4 : 0; place(el, P(p.cx + Math.cos(a) * r, p.cy + Math.sin(a) * r, TZ + z)); });
  }
  const o = spring(REST);
  let lit = -2, drawn = NaN;
  function draw(t) {
    if (Math.abs(t - drawn) < 0.0004) return;
    drawn = t;
    const s = t * (N - 1), i0 = clamp(Math.floor(s), 0, N - 2), f = clamp(s - i0, 0, 1), e = f * f * (3 - 2 * f);
    const cx = STOPS[i0][0] + (STOPS[i0 + 1][0] - STOPS[i0][0]) * e, cy = STOPS[i0][1] + (STOPS[i0 + 1][1] - STOPS[i0][1]) * e;
    const now = clamp(Math.round(s), 0, N - 1);
    peds.forEach((p, i) => drawPed(p, i, i === now ? 4 * (1 - Math.min(1, Math.abs(s - i) * 2)) : 0));
    const z0 = TZ + 6 + Math.sin(Math.PI * e) * hop, w = 13, h = 17, y1 = cy + 1.2, y0 = cy - 1.2;
    const [er, ei] = rings(cx - w, y0, cx + w, y1, 1, 0.5);
    put(env, prism(P, front, er, ei, z0, z0 + h));
    const top = z0 + h;
    vee.setAttribute("d", seg(P(cx - w + 1, y1, top - 1), P(cx, y1, top - 8)) + seg(P(cx + w - 1, y1, top - 1), P(cx, y1, top - 8)));
    const ring = []; for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; ring.push(P(cx + Math.cos(a) * 2.2, y1, top - 8.6 + Math.sin(a) * 2.2)); }
    seal.setAttribute("d", poly(ring));
    const wing = (sg, x) => poly(fillet([[x + sg * 3, top - 6], [x - sg * 3, top - 1], [x - sg * 11, top + 7], [x - sg * 12, top + 2], [x - sg * 7, top - 5]], [1, 1.6, 2, 2, 2.4]).map(([u, v]) => P(u, y0, v)));
    wings.setAttribute("d", wing(1, cx - w) + wing(-1, cx + w));
    if (now !== lit) {
      lit = now;
      peds.forEach((p, i) => { p.body.sil.classList.toggle("hi", i === now); p.dots.forEach((el) => el.setAttribute("class", i === now ? "dot" : i < now ? "dot m" : "dot off")); });
      // one highlight: the stop the letter is at; the seal gives its bright up to it
      seal.classList.remove("hi");
    }
  }
  let over = false, said = "";
  function say() { const s = over ? "langkah " + (clamp(Math.round(o.t * (N - 1)), 0, N - 1) + 1) : "rest"; if (s !== said) { said = s; read.textContent = s; } }
  draw(REST); say();

  const B = register(stage, (dt) => { const m = stepS(o, dt); draw(o.x); say(); return m; });
  bag.add(B.unregister);
  bag.add(pointer(stage, {
    move: ([x]) => { over = true; o.t = clamp((x - 80) / 240, 0, 1); B.wake(); },
    leave: () => { over = false; o.t = REST; B.wake(); },
  }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { hop = clamp(v, 0, 30); drawn = NaN; draw(o.x); }, destroy: bag.dispose };
}

hairline({
  name: "hari",
  means: "One winged letter and six stops of the day: moving across carries it from stop to stop, and each lights as it lands.",
  rules: [1, 3, 5, 8],
  range: [4, 12, 22],
  tour: [[90, 190], [170, 160], [250, 170], [318, 160], null],
  mount,
});
