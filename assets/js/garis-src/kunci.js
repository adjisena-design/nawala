/**
 * Kunci: one sealed letter and its one key. The letter stands shut on its
 * plinth; a single key waits in front of it. Moving the pointer across brings
 * the key to the seal, and when it arrives the flap lifts and the card inside
 * rises. Until then the key is the bright thing; after, the card. At rest the
 * key is on its way. The slider is how far the card rises.
 *
 * The pattern: scrub. One spring follows the pointer's x.
 */
const {
  Cam, clamp, facing, fit, poly, proj, rings, rrect, seg, prism,
  spring, stepS, disposer, mk, pointer, put, reflect, register, solid,
} = HL;

const W = 24, H = 32, SZ = 17, REST = 0.3;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let rise = value;

  const C = Cam(45, 0.5, 2.45);
  fit(C, [[-32, -14, -3], [32, 52, -3], [32, -14, 0], [-32, 52, 0], [-W, 0, H + 22], [W, 0, H + 22]], 200, 172);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const [fr, fi] = rings(-32, -14, 32, 52, 12, 2);
  reflect(svg, g, P, front, fr, -3, 12);
  put(solid(g), prism(P, front, fr, fi, -3, 0));

  const back = mk("path", { class: "nf lo" }, g);
  const card = solid(g), cline = mk("path", { class: "nf lo" }, g);
  const env = solid(g);
  { const [r, i] = rings(-W, -2.2, W, 2.2, 1.4, 0.6); put(env, prism(P, front, r, i, 0, H)); }
  const flap = mk("path", { class: "nf lo" }, g), seal = mk("path", { class: "nf" }, g);
  const key = mk("g", {}, g), bow = mk("path", {}, key), eye = mk("path", { class: "nf lo" }, key), shaft = mk("path", {}, key);

  const o = spring(REST);
  let drawn = NaN, state = "";
  function draw(t) {
    if (Math.abs(t - drawn) < 0.0004) return;
    drawn = t;
    const a = clamp(t / 0.78, 0, 1), e = clamp((t - 0.8) / 0.2, 0, 1), ee = e * e * (3 - 2 * e);
    // the card inside
    const cz = 3 + rise * ee, [cr, ci] = rings(-W + 3, -0.8, W - 3, 0.8, 1, 0.4);
    put(card, prism(P, front, cr, ci, cz, cz + H - 4));
    cline.setAttribute("d", seg(P(-W + 9, 0.8, cz + H - 10), P(W - 9, 0.8, cz + H - 10)) + seg(P(-W + 12, 0.8, cz + H - 15), P(W - 12, 0.8, cz + H - 15)));
    if (ee < 0.2) cline.setAttribute("display", "none"); else cline.removeAttribute("display");
    // the flap: shut it points down to the seal, open it stands up behind the top edge
    const fl = (z, y) => seg(P(-W + 1, y, H - 1), P(0, y, z)) + seg(P(W - 1, y, H - 1), P(0, y, z));
    if (ee < 0.5) { flap.setAttribute("d", fl(SZ + 1 + (H - 2 - SZ) * ee * 2, 2.2)); flap.removeAttribute("display"); back.setAttribute("display", "none"); }
    else { back.setAttribute("d", fl(H - 1 + 14 * (ee * 2 - 1), -2.2)); back.removeAttribute("display"); flap.setAttribute("display", "none"); }
    const ring = []; for (let k = 0; k < 14; k++) { const q = (k / 14) * Math.PI * 2; ring.push(P(Math.cos(q) * 3.2, 2.2, SZ + Math.sin(q) * 3.2)); }
    seal.setAttribute("d", poly(ring));
    // the key, in the plane x = 0, its bit toward the seal
    const ky = 2.6 + (1 - a) * 32, kz = SZ, bq = [];
    for (let k = 0; k < 16; k++) { const q = (k / 16) * Math.PI * 2; bq.push(P(0, ky + 19 + Math.cos(q) * 5.2, kz + Math.sin(q) * 5.2)); }
    bow.setAttribute("d", poly(bq));
    const eq = []; for (let k = 0; k < 10; k++) { const q = (k / 10) * Math.PI * 2; eq.push(P(0, ky + 19.6 + Math.cos(q) * 2, kz + Math.sin(q) * 2)); }
    eye.setAttribute("d", poly(eq));
    shaft.setAttribute("d", poly([[ky, kz + 0.9], [ky + 14, kz + 0.9], [ky + 14, kz - 0.9], [ky + 5.4, kz - 0.9], [ky + 5.4, kz - 3.6], [ky + 3.8, kz - 3.6], [ky + 3.8, kz - 0.9], [ky + 2.4, kz - 0.9], [ky + 2.4, kz - 4.6], [ky, kz - 4.6]].map(([y, z]) => P(0, y, z))));
    const s = e > 0.5 ? "open" : "shut";
    if (s !== state) { state = s; bow.setAttribute("class", s === "shut" ? "hi" : ""); card.sil.classList.toggle("hi", s === "open"); }
  }
  let over = false, said = "";
  function say() { const s = !over ? "rest" : o.t > 0.9 ? "terbuka" : "satu kunci"; if (s !== said) { said = s; read.textContent = s; } }
  draw(REST); say();

  const B = register(stage, (dt) => { const m = stepS(o, dt); draw(o.x); say(); return m; });
  bag.add(B.unregister);
  bag.add(pointer(stage, {
    move: ([x]) => { over = true; o.t = clamp((x - 90) / 210, 0, 1); B.wake(); },
    leave: () => { over = false; o.t = REST; B.wake(); },
  }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { rise = clamp(v, 4, 24); drawn = NaN; draw(o.x); }, destroy: bag.dispose };
}

hairline({
  name: "kunci",
  means: "One sealed letter and its one key: moving across brings the key to the seal, the flap lifts and the card rises.",
  rules: [1, 3, 5, 8],
  range: [8, 14, 20],
  tour: [[110, 190], [210, 180], [310, 170], null],
  mount,
});
