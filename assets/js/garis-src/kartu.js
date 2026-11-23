/**
 * Kartu: a stack of paper invitation cards on a tray. Each card carries the
 * same simple layout: a border, a round frame for the couple, two lines of
 * writing. Moving the pointer across fans the stack and opens it at one card:
 * the cards above rise, and the one uncovered takes the bright edge. At rest
 * the stack is open at the second card. The slider is how far the cards fan.
 *
 * The pattern: scrub. One spring follows the pointer's x.
 */
const {
  Cam, clamp, facing, fit, poly, proj, rings, rrect, seg, prism,
  spring, stepS, disposer, mk, pointer, put, reflect, register, solid,
} = HL;

const N = 5, W = 36, D = 50, TH = 1.7, GAP = 2.3, REST = 0.3;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let fan = value;

  const C = Cam(45, 0.5, 2.3);
  fit(C, [[-10, -8, -3], [W + 52, D + 8, -3], [W + 52, -8, 0], [-10, D + 8, 0], [0, 0, 30], [W + 48, D, 30]], 200, 172);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const [fr, fi] = rings(-10, -8, W + 52, D + 8, 12, 2);
  reflect(svg, g, P, front, fr, -3, 12);
  put(solid(g), prism(P, front, fr, fi, -3, 0));

  const cards = [];
  for (let i = 0; i < N; i++) {
    const grp = mk("g", {}, g);
    cards.push({ body: solid(grp), edge: mk("path", { class: "nf lo" }, grp), frame: mk("path", { class: "nf lo" }, grp), lines: mk("path", { class: "nf lo" }, grp) });
  }
  const o = spring(REST);
  let drawn = NaN, lit = -1;
  function draw(t) {
    if (Math.abs(t - drawn) < 0.0004) return;
    drawn = t;
    const s = t * (N - 1), now = clamp(Math.round(s), 0, N - 1);
    cards.forEach((c, i) => {
      const x0 = i * fan * (0.35 + 0.65 * t), z0 = i * GAP + 9 * clamp(i - s + 0.5, 0, 1), zt = z0 + TH;
      const [r, inn] = rings(x0, 0, x0 + W, D, 3, 0.8);
      put(c.body, prism(P, front, r, inn, z0, zt));
      c.edge.setAttribute("d", poly(rrect(x0 + 3.5, 3.5, x0 + W - 3.5, D - 3.5, 2, 4).map((q) => P(q.u, q.v, zt))));
      const ring = []; for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; ring.push(P(x0 + W / 2 + Math.cos(a) * 7, 17 + Math.sin(a) * 8.5, zt)); }
      c.frame.setAttribute("d", poly(ring));
      c.lines.setAttribute("d", seg(P(x0 + 9, 33, zt), P(x0 + W - 9, 33, zt)) + seg(P(x0 + 12, 39, zt), P(x0 + W - 12, 39, zt)));
    });
    if (now !== lit) { lit = now; cards.forEach((c, i) => { c.body.sil.classList.toggle("hi", i === now); c.frame.setAttribute("class", i === now ? "nf" : "nf lo"); }); }
  }
  let over = false, said = "";
  function say() { const s = over ? "kartu " + (clamp(Math.round(o.t * (N - 1)), 0, N - 1) + 1) : "rest"; if (s !== said) { said = s; read.textContent = s; } }
  draw(REST); say();

  const B = register(stage, (dt) => { const m = stepS(o, dt); draw(o.x); say(); return m; });
  bag.add(B.unregister);
  bag.add(pointer(stage, {
    move: ([x]) => { over = true; o.t = clamp((x - 90) / 220, 0, 1); B.wake(); },
    leave: () => { over = false; o.t = REST; B.wake(); },
  }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { fan = clamp(v, 0, 16); drawn = NaN; draw(o.x); }, destroy: bag.dispose };
}

hairline({
  name: "kartu",
  means: "A stack of paper invitation cards: moving across fans it and opens it at one card, which takes the bright edge.",
  rules: [1, 3, 5, 9],
  range: [3, 7, 11],
  tour: [[110, 180], [200, 170], [300, 180], null],
  mount,
});
