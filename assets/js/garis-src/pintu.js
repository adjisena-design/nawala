/**
 * Pintu: the door of the reception. A gate of two posts and a beam stands over
 * a strip of floor, and a guest's phone comes up to it with a code of nine dots
 * on its screen. Moving the pointer across brings the phone to the gate; as it
 * passes under, the beam takes the bright edge and the code goes quiet: read,
 * recorded. At rest the phone is on its way and the heart of its code is lit.
 * The slider is how high the phone is carried.
 *
 * The pattern: scrub. One spring follows the pointer's x.
 */
const {
  Cam, clamp, facing, fit, poly, proj, rings, rrect, seg, prism,
  spring, stepS, disposer, mk, place, pointer, put, reflect, register, solid,
} = HL;

const L = 150, GX = 104, REST = 0.3;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let carry = value;

  const C = Cam(45, 0.5, 1.95);
  fit(C, [[0, -24, -3], [L, 24, -3], [L, -24, 0], [0, 24, 0], [GX, -22, 60], [GX, 22, 60], [10, 4, 52]], 200, 172);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const [fr, fi] = rings(0, -24, L, 24, 10, 2);
  reflect(svg, g, P, front, fr, -3, 12);
  put(solid(g), prism(P, front, fr, fi, -3, 0));
  // the carpet to the door
  mk("path", { d: seg(P(6, -8, 0), P(L - 6, -8, 0)) + seg(P(6, 8, 0), P(L - 6, 8, 0)), class: "nf lo" }, g);
  const post = (y) => { const s = solid(g); const [r, i] = rings(GX - 3.5, y - 3.5, GX + 3.5, y + 3.5, 2, 0.8); put(s, prism(P, front, r, i, 0, 50)); return s; };
  post(-19);
  // the phone, between the far post and the near one
  const pg = mk("g", {}, g), body = solid(pg), scr = mk("path", { class: "nf lo" }, pg), code = [];
  for (let k = 0; k < 9; k++) code.push(mk("circle", { r: 1.35, class: "dot off" }, pg));
  post(19);
  const beam = solid(g);
  { const [r, i] = rings(GX - 5, -24, GX + 5, 24, 3, 1); put(beam, prism(P, front, r, i, 50, 58)); }
  // the reader's eye, under the beam's near end
  const eye = mk("path", { d: poly(rrect(-4, 51.5, 4, 54.5, 1.4, 4).map((q) => P(GX + 5, q.u, q.v))), class: "nf lo" }, g);

  const o = spring(REST);
  let drawn = NaN, state = "";
  function draw(t) {
    if (Math.abs(t - drawn) < 0.0004) return;
    drawn = t;
    const x = 14 + t * (L - 34), z0 = carry, w = 9, h = 32;
    const [r, i] = rings(x - w, 1.4, x + w, 4.8, 2, 0.7);
    put(body, prism(P, front, r, i, z0, z0 + h));
    scr.setAttribute("d", poly(rrect(x - w + 1.8, z0 + 2.4, x + w - 1.8, z0 + h - 2.4, 1.2, 4).map((q) => P(q.u, 4.8, q.v))));
    code.forEach((el, k) => place(el, P(x + ((k % 3) - 1) * 4.2, 4.8, z0 + h / 2 + (1 - Math.floor(k / 3)) * 4.2 + 2)));
    const s = t > 0.62 ? "in" : "way";
    if (s !== state) {
      state = s;
      beam.sil.classList.toggle("hi", s === "in"); eye.classList.toggle("lo", s !== "in");
      // on the way the heart of the code is the one bright mark; at the gate it gives the bright to the beam
      code.forEach((el, k) => el.setAttribute("class", s === "in" ? "dot m" : k === 4 ? "dot" : (k * 7) % 3 ? "dot m" : "dot off"));
    }
  }
  let over = false, said = "";
  function say() { const s = !over ? "rest" : o.t > 0.62 ? "tercatat" : "memindai"; if (s !== said) { said = s; read.textContent = s; } }
  draw(REST); say();

  const B = register(stage, (dt) => { const m = stepS(o, dt); draw(o.x); say(); return m; });
  bag.add(B.unregister);
  bag.add(pointer(stage, {
    move: ([x]) => { over = true; o.t = clamp((x - 90) / 220, 0, 1); B.wake(); },
    leave: () => { over = false; o.t = REST; B.wake(); },
  }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { carry = clamp(v, 2, 16); drawn = NaN; draw(o.x); }, destroy: bag.dispose };
}

hairline({
  name: "pintu",
  means: "A guest's phone and the door's gate: moving across brings the code to the reader, and the beam lights as it is read.",
  rules: [1, 3, 5, 8],
  range: [4, 8, 14],
  tour: [[110, 170], [200, 190], [300, 200], null],
  mount,
});
