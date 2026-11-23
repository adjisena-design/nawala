/**
 * Denah: the floor of a wedding reception. A stage with its backdrop at the far
 * end, an aisle running to it, six round tables each ringed by eight chairs.
 * The table nearest the pointer rises and its chairs light; at rest one chair
 * is lit: the guest's own seat. The slider is how far the table rises.
 *
 * The pattern: discrete items on a ground plane. Tweens, a stagger by distance
 * between tables, and a hit test on the floor, which never moves.
 */
const {
  Cam, circ, clamp, facing, fit, proj, rings, seg, prism, unproj,
  tdone, tset, tval, tween, disposer, flatDot, mk, place, pointer, put, reflect, register, solid,
} = HL;

const W = 124, L = 156, R = 11.5, CH = 16.5, TZ = 4;
const TABLES = [[30, 54], [94, 54], [30, 92], [94, 92], [30, 130], [94, 130]];
const SEAT = [3, 6];   // at rest: table 4, the chair facing the aisle

/** A ring moved to stand at (cx, cy). */
const at = (ring, cx, cy) => ring.map((q) => ({ u: q.u + cx, v: q.v + cy, nu: q.nu, nv: q.nv }));

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let lift = value;

  const C = Cam(45, 0.5, 1.5);
  fit(C, [[0, 0, -4], [W, L, -4], [W, 0, 0], [0, L, 0], [36, 4, 30], [88, 4, 30], [94, 130, TZ + 24], [30, 54, TZ + 24]], 200, 170);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  // the floor: one low plate
  const [fr, fi] = rings(0, 0, W, L, 12, 2);
  reflect(svg, g, P, front, fr, -4, 12);
  put(solid(g), prism(P, front, fr, fi, -4, 0));
  // the aisle, from the door to the stage
  mk("path", { d: seg(P(56, 30, 0), P(56, L - 6, 0)) + seg(P(68, 30, 0), P(68, L - 6, 0)), class: "nf lo" }, g);
  // the stage and its backdrop at the far end
  const [br, bi] = rings(40, 5, 84, 9, 2, 0.8);
  put(solid(g), prism(P, front, br, bi, 0, 30));
  const [sr, si] = rings(34, 8, 90, 26, 4, 1.4);
  put(solid(g), prism(P, front, sr, si, 0, 6));
  // the couple's two seats on the stage
  [[55, 17], [69, 17]].forEach(([x, y]) => place(flatDot(g, C, 2.4, "dot m"), P(x, y, 6)));
  // the door: two posts at the near end
  [[50, L - 3], [74, L - 3]].forEach(([x, y]) => { const [r, i] = rings(x - 2.5, y - 2.5, x + 2.5, y + 2.5, 2, 0.7); put(solid(g), prism(P, front, r, i, 0, 9)); });

  // tables, far to near
  const order = TABLES.map((_, i) => i).sort((a, b) => TABLES[a][0] + TABLES[a][1] - TABLES[b][0] - TABLES[b][1]);
  const tables = [];
  order.forEach((i) => {
    const [cx, cy] = TABLES[i], grp = mk("g", {}, g);
    const chairs = [];
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
      const el = flatDot(grp, C, 2.1, "dot off");
      place(el, P(cx + Math.cos(a) * CH, cy + Math.sin(a) * CH, 0));
      chairs.push(el);
    }
    const body = solid(grp);
    tables[i] = { cx, cy, body, chairs, ring: at(circ(R, 28), cx, cy), inner: at(circ(R - 1.6, 28), cx, cy), z: tween(0), drawn: NaN };
  });

  function draw(t, z) {
    if (Math.abs(z - t.drawn) < 0.01) return;
    t.drawn = z;
    put(t.body, prism(P, front, t.ring, t.inner, z, z + TZ));
    // the chairs draw back from a rising table, as when its guests stand
    const out = CH + z * 0.42;
    t.chairs.forEach((el, k) => { const a = (k / 8) * Math.PI * 2 + Math.PI / 8; place(el, P(t.cx + Math.cos(a) * out, t.cy + Math.sin(a) * out, 0)); });
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    tables.forEach((t) => { draw(t, tval(t.z, now)); if (!tdone(t.z, now)) moving = true; });
    return moving;
  });
  bag.add(B.unregister);

  // hit test on the floor, which never moves: the table whose centre is nearest, within reach
  function hit([sx, sy]) {
    const [x, y] = unproj(C, sx, sy, 0);
    let best = -1, bd = 24;
    TABLES.forEach(([cx, cy], i) => { const d = Math.hypot(x - cx, y - cy); if (d < bd) { bd = d; best = i; } });
    return best;
  }

  let act = -2;
  function setActive(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : Math.max(act, 0);
    act = a;
    tables.forEach((t, i) => {
      const far = Math.hypot(t.cx - TABLES[from][0], t.cy - TABLES[from][1]) / 38;
      // the answer falls off with distance: the chosen table rises fully, its neighbours a little, the rest barely
      const fall = a < 0 ? 0 : i === a ? 1 : far < 1.1 ? 0.32 : 0.1;
      tset(t.z, lift * fall, now, far * 50);
      t.body.sil.classList.toggle("hi", i === a);
      t.chairs.forEach((el, k) => { el.setAttribute("class", i === a ? "dot" : a < 0 && i === SEAT[0] && k === SEAT[1] ? "dot" : "dot off"); });
    });
    read.textContent = a < 0 ? "rest" : "meja " + (a + 1);
    B.wake();
  }
  setActive(-1);

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { lift = clamp(v, 0, 26); if (act >= 0) { const a = act; act = -2; setActive(a); } },
    destroy: bag.dispose,
  };
}

hairline({
  name: "denah",
  means: "A reception floor: stage, aisle and six round tables. The table nearest the pointer rises and its chairs light.",
  rules: [1, 2, 4, 5],
  range: [8, 15, 22],
  tour: [[150, 150], [245, 185], [205, 235], null],
  mount,
});
