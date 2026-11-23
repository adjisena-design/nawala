/**
 * Susun: the couple's own planner. A floor with two round tables already set,
 * a third coming down to its place, and beside the floor a slip with three
 * guests waiting. Moving the pointer across lowers the table; once it has
 * landed its chairs appear and one guest crosses from the slip to a chair.
 * What is being placed carries the bright. At rest the table is half-way down.
 * The slider is the height the table comes from.
 *
 * The pattern: scrub. One spring follows the pointer's x.
 */
const {
  Cam, circ, clamp, facing, fit, proj, rings, seg, prism,
  spring, stepS, disposer, flatDot, mk, place, pointer, put, reflect, register, solid,
} = HL;

const S = 112, R = 12, CH = 17, TZ = 4, REST = 0.3;
const SET = [[32, 30], [82, 34]], NEW = [56, 80], SLIP = [-22, 58];
const at = (ring, cx, cy) => ring.map((q) => ({ u: q.u + cx, v: q.v + cy, nu: q.nu, nv: q.nv }));

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let high = value;

  const C = Cam(45, 0.5, 1.72);
  fit(C, [[-34, 0, -3], [S, S, -3], [S, 0, 0], [-34, S, 0], [56, 80, 58], [32, 30, 10]], 200, 172);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const [fr, fi] = rings(0, 0, S, S, 12, 2);
  reflect(svg, g, P, front, fr, -3, 12);
  put(solid(g), prism(P, front, fr, fi, -3, 0));
  // drafting lines on the floor
  mk("path", { d: [28, 56, 84].map((v) => seg(P(v, 6, 0), P(v, S - 6, 0)) + seg(P(6, v, 0), P(S - 6, v, 0))).join(""), class: "nf lo" }, g);
  const chairsOf = (grp, cx, cy) => { const out = []; for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + Math.PI / 8, el = flatDot(grp, C, 2, "dot off"); place(el, P(cx + Math.cos(a) * CH, cy + Math.sin(a) * CH, 0)); out.push(el); } return out; };
  SET.forEach(([cx, cy]) => { const grp = mk("g", {}, g); chairsOf(grp, cx, cy); put(solid(grp), prism(P, front, at(circ(R, 26), cx, cy), at(circ(R - 1.6, 26), cx, cy), 0, TZ)); });
  // where the new table will stand, marked on the floor
  mk("path", { d: at(circ(R, 26), NEW[0], NEW[1]).map((q, i) => (i ? "L" : "M") + P(q.u, q.v, 0).map((n) => n.toFixed(1)).join(" ")).join("") + "Z", class: "nf dash" }, g);
  const ng = mk("g", {}, g), chairs = chairsOf(ng, NEW[0], NEW[1]), table = solid(ng);
  // the slip of guests still to seat, beside the floor
  const sg = mk("g", {}, g);
  { const [r, i] = rings(SLIP[0] - 9, SLIP[1] - 26, SLIP[0] + 9, SLIP[1] + 26, 4, 1); put(solid(sg), prism(P, front, r, i, 0, 2.5)); }
  [-16, 0].forEach((dy) => place(flatDot(sg, C, 2.3, "dot m"), P(SLIP[0], SLIP[1] + dy, 2.5)));
  const guest = flatDot(g, C, 2.5, "dot m");
  const seat = [NEW[0] + Math.cos(Math.PI * 9 / 8) * CH, NEW[1] + Math.sin(Math.PI * 9 / 8) * CH];

  const o = spring(REST);
  let drawn = NaN, phase = "";
  function draw(t) {
    if (Math.abs(t - drawn) < 0.0004) return;
    drawn = t;
    const a = clamp(t / 0.55, 0, 1), ea = a * a * (3 - 2 * a), z = (1 - ea) * high;
    put(table, prism(P, front, at(circ(R, 26), NEW[0], NEW[1]), at(circ(R - 1.6, 26), NEW[0], NEW[1]), z, z + TZ));
    const b = clamp((t - 0.6) / 0.4, 0, 1), eb = b * b * (3 - 2 * b);
    place(guest, P(SLIP[0] + (seat[0] - SLIP[0]) * eb, SLIP[1] + 16 + (seat[1] - SLIP[1] - 16) * eb, 2.5 * (1 - eb) + Math.sin(Math.PI * eb) * 16));
    const ph = t < 0.58 ? "meja" : "tamu";
    if (ph !== phase) {
      phase = ph;
      table.sil.classList.toggle("hi", ph === "meja");
      guest.setAttribute("class", ph === "tamu" ? "dot" : "dot m");
      chairs.forEach((el) => el.setAttribute("class", ph === "tamu" ? "dot m" : "dot off"));
    }
  }
  let over = false, said = "";
  function say() { const s = !over ? "rest" : o.t < 0.58 ? "meja 3" : "dinda"; if (s !== said) { said = s; read.textContent = s; } }
  draw(REST); say();

  const B = register(stage, (dt) => { const m = stepS(o, dt); draw(o.x); say(); return m; });
  bag.add(B.unregister);
  bag.add(pointer(stage, {
    move: ([x]) => { over = true; o.t = clamp((x - 90) / 220, 0, 1); B.wake(); },
    leave: () => { over = false; o.t = REST; B.wake(); },
  }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { high = clamp(v, 6, 50); drawn = NaN; draw(o.x); }, destroy: bag.dispose };
}

hairline({
  name: "susun",
  means: "The couple's planner: moving across sets a third table down on the floor, then seats a guest from the waiting slip.",
  rules: [1, 3, 5, 8],
  range: [16, 30, 44],
  tour: [[110, 180], [210, 170], [300, 180], null],
  mount,
});
