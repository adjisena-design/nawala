/**
 * Keranjang: a low woven basket holding what a guest takes home from the day,
 * an album, an addressed envelope and a phone. The one nearest the pointer
 * rises out of the basket and takes the bright edge; the others settle a
 * little, staggered outwards from it. The slider is how far it rises.
 *
 * The pattern: discrete items in one row. Tweens, a stagger by distance, and a
 * hit test on each item's rest centre, so a rising item cannot flip the choice.
 */
const {
  Cam, clamp, facing, fillet, fit, hull, open, poly, proj, ringAt, rings, rrect, run, seg, prism,
  tdone, tset, tval, tween, disposer, mk, pointer, put, reflect, register, solid,
} = HL;

const X0 = -8, X1 = 112, Y0 = -13, Y1 = 15, WH = 17, WR = 9, WT = 2.4, FLOOR = 3;
// each item: its name, footprint x0..x1 and y0..y1, height, corner radius, and its rest height above the floor
const ITEMS = [
  { name: "album", x0: 2, x1: 34, y0: -11, y1: -2, h: 42, r: 2.2, rest: 2 },
  { name: "amplop", x0: 39, x1: 79, y0: 0, y1: 3.4, h: 28, r: 1.4, rest: 7 },
  { name: "ponsel", x0: 84, x1: 104, y0: -3, y1: 0.8, h: 47, r: 2.6, rest: 0 },
];
const SINK = -2.5;

const LR = (pts) => (pts[0][0] <= pts[pts.length - 1][0] ? pts : pts.slice().reverse());

/** The basket, which never moves: `far` is painted before the items, `near` after them. */
function basket(P, front, outer, inner) {
  const far = [
    [poly(hull(ringAt(P, outer, 0).concat(ringAt(P, outer, WH)))), "sil"],
    [poly(ringAt(P, inner, WH)), "nf"],
    [open(ringAt(P, run(inner, (q) => !front(q)), FLOOR)), "nf lo"],
  ];
  const iF = LR(ringAt(P, run(inner, front), WH)), oT = LR(ringAt(P, run(outer, front), WH)), oB = LR(ringAt(P, run(outer, front), 0));
  const band = (z) => open(LR(ringAt(P, run(outer, front), z)));
  const near = [
    [poly([...iF, oT[oT.length - 1], ...oB.slice().reverse(), oT[0]]), "fo"],
    [open(oT), "nf lo"],
    [open(iF), "nf"],
    [open([oT[0], ...oB, oT[oT.length - 1]]), "nf sil"],
    // the weave: two bands round the wall
    [band(5.5), "nf lo"],
    [band(11), "nf lo"],
  ];
  return { far, near };
}

/** An outline on an item's front face (the plane y = y1), from a ring in face coordinates. */
const onFace = (P, y, ring, dz) => ring.map((q) => P(q.u, y, q.v + dz));

/** What makes each item itself, drawn on its front face at height z0. */
function marks(P, it, z0) {
  const y = it.y1, cx = (it.x0 + it.x1) / 2, top = z0 + it.h;
  if (it.name === "album") {
    return {
      lo: seg(P(it.x0 + 5.5, y, z0 + 2), P(it.x0 + 5.5, y, top - 2)) + poly(onFace(P, y, rrect(it.x0 + 11, 14, it.x1 - 5, 32, 1.6, 4), z0)),
      mark: poly(onFace(P, y, rrect(it.x0 + 14, 18, it.x1 - 8, 28, 1, 3), z0)),
    };
  }
  if (it.name === "amplop") {
    const tip = [cx, top - 14], ring = [];
    for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; ring.push({ u: tip[0] + Math.cos(a) * 3.4, v: tip[1] - 1 + Math.sin(a) * 3.4 }); }
    return {
      lo: seg(P(it.x0 + 1.6, y, top - 1.6), P(tip[0], y, tip[1])) + seg(P(it.x1 - 1.6, y, top - 1.6), P(tip[0], y, tip[1])),
      mark: poly(onFace(P, y, ring, 0)),
    };
  }
  return {
    lo: poly(onFace(P, y, rrect(it.x0 + 2.2, 3, it.x1 - 2.2, it.h - 3, 1.6, 4), z0)),
    mark: poly(onFace(P, y, rrect(cx - 3.4, it.h - 7.4, cx + 3.4, it.h - 5.4, 1, 4), z0)),
  };
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let lift = value;

  const C = Cam(45, 0.5, 2.1);
  fit(C, [[X0, Y0, 0], [X1, Y1, 0], [X1, Y0, 0], [X0, Y1, 0], [2, -11, FLOOR + 42 + 34], [104, -3, FLOOR + 47 + 34]], 200, 164);
  const P = proj(C), front = facing(C);
  const outer = rrect(X0, Y0, X1, Y1, WR, 6), inner = rrect(X0 + WT, Y0 + WT, X1 - WT, Y1 - WT, WR - WT, 6);
  const paths = basket(P, front, outer, inner);

  const g = mk("g", {}, svg);
  reflect(svg, g, P, front, outer, 0, 14);
  for (const [d, cls] of paths.far) mk("path", { d, class: cls }, g);

  const items = ITEMS.map((it, i) => {
    const grp = mk("g", {}, g), body = solid(grp);
    // the envelope is Nawala's letter: a wing behind each top corner, painted before the body so the body covers their roots
    const wings = it.name === "amplop" ? mk("path", { class: "sil" }, grp) : null;
    if (wings) grp.insertBefore(wings, body.g);
    const lo = mk("path", { class: "nf lo" }, grp), mark = mk("path", { class: "nf" }, grp);
    const [ring, inner2] = rings(it.x0, it.y0, it.x1, it.y1, it.r, 0.9);
    return { it, body, lo, mark, wings, ring, inner: inner2, z: tween(it.rest), drawn: NaN, i };
  });
  for (const [d, cls] of paths.near) mk("path", { d, class: cls }, g);

  function draw(o, z) {
    if (Math.abs(z - o.drawn) < 0.01) return;
    o.drawn = z;
    const z0 = FLOOR + z;
    put(o.body, prism(P, front, o.ring, o.inner, z0, z0 + o.it.h));
    const m = marks(P, o.it, z0);
    o.lo.setAttribute("d", m.lo); o.mark.setAttribute("d", m.mark);
    if (o.wings) {
      const { x0, x1, y0, h } = o.it, t = z0 + h;
      const wing = (s, x) => poly(fillet([[x + s * 5, t - 9], [x - s * 4, t - 2], [x - s * 15, t + 9], [x - s * 17, t + 2], [x - s * 10, t - 8]], [1, 2, 2.4, 2.4, 3]).map(([u, v]) => P(u, y0, v)));
      o.wings.setAttribute("d", wing(1, x0) + wing(-1, x1));
    }
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    items.forEach((o) => { draw(o, tval(o.z, now)); if (!tdone(o.z, now)) moving = true; });
    return moving;
  });
  bag.add(B.unregister);

  // hit test: the item whose REST centre is nearest the pointer on screen, inside the basket's reach
  const centres = items.map((o) => P((o.it.x0 + o.it.x1) / 2, o.it.y1, FLOOR + o.it.rest + o.it.h * 0.55));
  function hit([x, y]) {
    let best = -1, bd = 46;
    centres.forEach((c, i) => { const d = Math.hypot(x - c[0], (y - c[1]) * 0.55); if (d < bd) { bd = d; best = i; } });
    return best;
  }

  let act = -2;
  function setActive(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : Math.max(act, 0);
    act = a;
    items.forEach((o, i) => {
      tset(o.z, a < 0 ? o.it.rest : i === a ? o.it.rest + lift : o.it.rest + SINK, now, Math.abs(i - from) * 55);
      o.body.sil.classList.toggle("hi", i === a);
      // at rest the envelope's seal is the one bright mark; it gives the bright up to whatever is chosen
      o.mark.classList.toggle("hi", a < 0 && o.it.name === "amplop");
    });
    read.textContent = a < 0 ? "rest" : ITEMS[a].name;
    B.wake();
  }
  setActive(-1);

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { lift = clamp(v, 0, 40); if (act >= 0) { const a = act; act = -2; setActive(a); } },
    destroy: bag.dispose,
  };
}

hairline({
  name: "keranjang",
  means: "A basket holding an album, an envelope and a phone: the one nearest the pointer rises out and takes the bright edge.",
  rules: [1, 2, 4, 5],
  range: [10, 22, 34],
  tour: [[140, 150], [205, 165], [262, 190], null],
  mount,
});
