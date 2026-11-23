/**
 * Terbang: Nawala, the winged letter, on its way to a landing pad. How far it
 * has come is the slider: each answer in the contact box moves it on, and at
 * the end it lands and the pad takes the bright edge. The pointer makes it
 * rise and beat its wings higher where it is. At rest it hovers with its seal
 * lit, the way still to go dashed on the floor.
 *
 * The pattern: proximity. One spring for the way, one for the lift.
 */
const {
  Cam, circ, clamp, facing, fillet, fit, poly, proj, rings, seg, prism,
  spring, stepS, disposer, flatDot, mk, place, pointer, put, reflect, register, solid,
} = HL;

const L = 150, PX = 124, R = 15, X0 = 16;
const at = (ring, cx, cy) => ring.map((q) => ({ u: q.u + cx, v: q.v + cy, nu: q.nu, nv: q.nv }));

function mount({ stage, svg, read }, value) {
  const bag = disposer();

  const C = Cam(45, 0.5, 1.9);
  fit(C, [[0, -24, -3], [L, 24, -3], [L, -24, 0], [0, 24, 0], [X0, 0, 52], [PX, 0, 52]], 200, 176);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const [fr, fi] = rings(0, -24, L, 24, 12, 2);
  reflect(svg, g, P, front, fr, -3, 12);
  put(solid(g), prism(P, front, fr, fi, -3, 0));
  const way = mk("path", { class: "nf dash" }, g);
  const pad = solid(g);
  put(pad, prism(P, front, at(circ(R, 30), PX, 0), at(circ(R - 1.6, 30), PX, 0), 0, 4));
  const marks = [0, 1, 2].map(() => flatDot(g, C, 1.5, "dot off"));
  marks.forEach((el, k) => place(el, P(PX + Math.cos((k / 3) * Math.PI * 2) * 8, Math.sin((k / 3) * Math.PI * 2) * 8, 4)));
  const lg = mk("g", {}, g), wings = mk("path", { class: "sil" }, lg), env = solid(lg), vee = mk("path", { class: "nf lo" }, lg), seal = mk("path", { class: "nf hi" }, lg);

  const o = spring(value, { k: 60, c: 14 }), h = spring(0);
  let drawnA = NaN, drawnB = NaN, landed = null;
  function draw(v, lift) {
    if (Math.abs(v - drawnA) < 0.01 && Math.abs(lift - drawnB) < 0.002) return;
    drawnA = v; drawnB = lift;
    const p = clamp(v / 100, 0, 1), cx = X0 + (PX - X0) * p, down = clamp((p - 0.86) / 0.14, 0, 1);
    const z0 = 4.6 + (1 - down) * (15 + Math.sin(p * Math.PI * 3) * 3) + lift * 9 * (1 - down), w = 14, hh = 18, y1 = 1.3, y0 = -1.3, top = z0 + hh;
    way.setAttribute("d", p < 0.9 ? seg(P(cx + 6, 0, 0), P(PX - R - 2, 0, 0)) : "");
    const [er, ei] = rings(cx - w, y0, cx + w, y1, 1, 0.5);
    put(env, prism(P, front, er, ei, z0, top));
    vee.setAttribute("d", seg(P(cx - w + 1, y1, top - 1), P(cx, y1, top - 8.5)) + seg(P(cx + w - 1, y1, top - 1), P(cx, y1, top - 8.5)));
    const ring = []; for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; ring.push(P(cx + Math.cos(a) * 2.4, y1, top - 9.2 + Math.sin(a) * 2.4)); }
    seal.setAttribute("d", poly(ring));
    // wings: up while it flies, higher under the pointer, folded low once it has landed
    const up = (1 - down) * (7 + lift * 7) - down * 5;
    const wing = (sg, x) => poly(fillet([[x + sg * 3, top - 6], [x - sg * 3, top - 1], [x - sg * 12, top + up], [x - sg * 13, top + up - 5], [x - sg * 7, top - 6]], [1, 1.6, 2, 2, 2.4]).map(([u, q]) => P(u, y0, q)));
    wings.setAttribute("d", wing(1, cx - w) + wing(-1, cx + w));
    const L2 = down > 0.6;
    if (L2 !== landed) { landed = L2; pad.sil.classList.toggle("hi", L2); seal.setAttribute("class", L2 ? "nf" : "nf hi"); marks.forEach((el) => el.setAttribute("class", L2 ? "dot m" : "dot off")); }
  }
  let over = false, said = "";
  function say() { const s = !over ? "rest" : o.t >= 96 ? "tiba" : "mendekat"; if (s !== said) { said = s; read.textContent = s; } }
  draw(value, 0); say();

  const B = register(stage, (dt) => { const a = stepS(o, dt), b = stepS(h, dt); draw(o.x, h.x); say(); return a || b; });
  bag.add(B.unregister);
  bag.add(pointer(stage, {
    move: ([x, y]) => { over = true; const p = clamp(o.t / 100, 0, 1), c = P(X0 + (PX - X0) * p, 0, 24); h.t = clamp(1 - Math.hypot(x - c[0], y - c[1]) / 150, 0, 1); B.wake(); say(); },
    leave: () => { over = false; h.t = 0; B.wake(); say(); },
  }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { o.t = clamp(v, 0, 100); B.wake(); }, destroy: bag.dispose };
}

hairline({
  name: "terbang",
  means: "Nawala, the winged letter, flying to its landing pad: the slider is how far it has come, and the pointer lifts its wings.",
  rules: [1, 3, 5, 7],
  range: [6, 48, 100],
  tour: [[150, 150], [220, 140], [150, 190], null],
  mount,
});
