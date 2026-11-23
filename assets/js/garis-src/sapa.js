/**
 * Sapa: a phone and the conversation that comes out of it. As the pointer
 * nears, two message bubbles rise from the phone, one after the other; the
 * last holds three dots, a reply being written, and takes the bright edge. At
 * rest the first bubble is out. The slider is the width of the bubbles.
 *
 * The pattern: proximity. One spring follows how near the pointer is.
 */
const {
  Cam, circ, clamp, facing, fit, poly, proj, rings, rrect, prism,
  spring, stepS, disposer, mk, place, pointer, put, reflect, register, solid,
} = HL;

const W = 13, H = 44, REST = 0.46;
const at = (ring, cx, cy) => ring.map((q) => ({ u: q.u + cx, v: q.v + cy, nu: q.nu, nv: q.nv }));

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let wide = value;

  const C = Cam(45, 0.5, 2.3);
  fit(C, [[-30, -30, -3], [30, 30, -3], [30, -30, 0], [-30, 30, 0], [-W, 0, H + 24], [W + 34, 0, H + 24]], 200, 176);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const fr = at(circ(31, 40), 4, 0), fi = at(circ(29, 40), 4, 0);
  reflect(svg, g, P, front, fr, -3, 12);
  put(solid(g), prism(P, front, fr, fi, -3, 0));
  const ph = solid(g);
  { const [r, i] = rings(-W, -1.8, W, 1.8, 2.4, 0.8); put(ph, prism(P, front, r, i, 0, H)); }
  mk("path", { d: poly(rrect(-W + 2, 3, W - 2, H - 3, 1.6, 4).map((q) => P(q.u, 1.8, q.v))), class: "nf lo" }, g);
  const heart = mk("path", { class: "nf hi" }, g);
  { const ring = []; for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; ring.push(P(Math.cos(a) * 3, 1.8, 26 + Math.sin(a) * 3)); } heart.setAttribute("d", poly(ring)); }
  const bub = [0, 1].map((k) => { const grp = mk("g", {}, g); return { k, grp, body: solid(grp), line: mk("path", { class: "nf lo" }, grp), dots: k ? [0, 1, 2].map(() => mk("circle", { r: 1.5, class: "dot m" }, grp)) : [] }; });

  const o = spring(REST);
  let drawn = NaN, lit = -2;
  function draw(t) {
    if (Math.abs(t - drawn) < 0.0004) return;
    drawn = t;
    bub.forEach((b) => {
      const e = clamp(t * 2.2 - b.k * 0.9, 0, 1), ee = e * e * (3 - 2 * e);
      if (ee < 0.05) { b.grp.setAttribute("display", "none"); return; }
      b.grp.removeAttribute("display");
      const x0 = 4 + 12 * ee, x1 = x0 + (b.k ? wide * 0.72 : wide) * (0.3 + 0.7 * ee), z0 = (b.k ? 40 : 20) + 8 * ee, z1 = z0 + 13 * (0.4 + 0.6 * ee);
      const [r, i] = rings(x0, 3.2, x1, 6.4, 1.6, 0.6);
      put(b.body, prism(P, front, r, i, z0, z1));
      if (b.k) { b.line.setAttribute("d", ""); b.dots.forEach((el, k) => place(el, P(x0 + (x1 - x0) * (0.28 + k * 0.22), 6.4, (z0 + z1) / 2))); }
      else b.line.setAttribute("d", `M${P(x0 + 4, 6.4, z0 + 8.4).join(" ")}L${P(x1 - 4, 6.4, z0 + 8.4).join(" ")}M${P(x0 + 4, 6.4, z0 + 4.6).join(" ")}L${P(x1 - 9, 6.4, z0 + 4.6).join(" ")}`);
    });
    const now = t > 0.86 ? 1 : t > 0.3 ? 0 : -1;
    if (now !== lit) { lit = now; heart.setAttribute("class", now < 0 ? "nf hi" : "nf lo"); bub.forEach((b) => b.body.sil.classList.toggle("hi", b.k === now)); }
  }
  let over = false, said = "";
  function say() { const s = !over ? "rest" : o.t > 0.86 ? "mengetik" : "halo"; if (s !== said) { said = s; read.textContent = s; } }
  draw(REST); say();

  const B = register(stage, (dt) => { const m = stepS(o, dt); draw(o.x); say(); return m; });
  bag.add(B.unregister);
  const c = P(8, 0, 30);
  bag.add(pointer(stage, {
    move: ([x, y]) => { over = true; o.t = clamp(1.25 - Math.hypot(x - c[0], y - c[1]) / 130, 0, 1); B.wake(); },
    leave: () => { over = false; o.t = REST; B.wake(); },
  }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { wide = clamp(v, 14, 40); drawn = NaN; draw(o.x); }, destroy: bag.dispose };
}

hairline({
  name: "sapa",
  means: "A phone and its conversation: as the pointer nears, two message bubbles rise from it, the last one a reply being written.",
  rules: [1, 3, 5, 9],
  range: [22, 28, 34],
  tour: [[110, 220], [170, 170], [215, 140], null],
  mount,
});
