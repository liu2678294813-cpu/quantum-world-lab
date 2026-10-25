'use strict';

// Independent invariant tests against the numerical functions used by the scenes.
// Run from any working directory: node --test tests/physics.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

let drawCalls = 0;
function contextStub() {
  const gradient = { addColorStop() {} };
  return new Proxy({
    canvas: { width: 1280, height: 720 },
    measureText: s => ({ width: String(s).length * 7 }),
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
    getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h })
  }, {
    get(target, key) {
      if (key in target) return target[key];
      return (...args) => {
        drawCalls++;
        for (const a of args) if (typeof a === 'number') assert.ok(Number.isFinite(a), `${String(key)} received ${a}`);
        if (key === 'arc') assert.ok(args[2] >= 0, 'negative circle radius');
      };
    },
    set(target, key, value) { target[key] = value; return true; }
  });
}

const sandbox = {
  window: {}, console,
  document: { createElement: () => ({ width: 1, height: 1, getContext: contextStub }) },
  performance: { now: () => 0 },
  Uint8ClampedArray,
  Math
};
vm.createContext(sandbox);
for (const file of ['scenes-a.js', 'scenes-b.js', 'scenes-c.js', 'scenes-d.js', 'models.js', 'models-more.js', 'lessons.js']) {
  const filename = path.join(root, 'src', file);
  vm.runInContext(fs.readFileSync(filename, 'utf8'), sandbox, { filename });
}
const A = sandbox.window.QSPhysicsA;
const B = sandbox.window.QSPhysicsB;
const C = sandbox.window.QSPhysicsC;
const D = sandbox.window.QSPhysicsD;
const scenes = sandbox.window.QS_SCENES;
function near(actual, expected, tol = 1e-9, label = '') {
  assert.ok(Number.isFinite(actual), `${label}: non-finite result ${actual}`);
  assert.ok(Math.abs(actual - expected) <= tol, `${label}: ${actual} differs from ${expected}, tolerance ${tol}`);
}
function integrate(fn, lo, hi, n = 12000) {
  const dx = (hi - lo) / n;
  let total = 0;
  for (let j = 0; j < n; j++) total += fn(lo + (j + .5) * dx);
  return total * dx;
}
const density = z => typeof z === 'number' ? z : z.density;
const inner = (f, g, lo, hi) => integrate(x => {
  const a = f(x), b = g(x);
  return a.re * b.re + a.im * b.im;
}, lo, hi);

test('all unique scenes map to the seven verified book chapters', () => {
  const coverage = JSON.parse(fs.readFileSync(path.join(root, 'source-notes', 'coverage.json'), 'utf8'));
  assert.equal(scenes.length, 52);
  assert.equal(new Set(scenes.map(s => s.id)).size, 52);
  assert.deepEqual([...new Set(scenes.map(s => s.chapter))].sort(), [1, 2, 3, 4, 5, 6, 7]);
  for (const s of scenes) {
    assert.ok(coverage.scenes.some(c => c.id === s.id && c.chapter === s.chapter), `unmapped ${s.id}`);
    for (const k of ['title', 'description', 'formula', 'explanation', 'observe', 'experiment', 'caution']) assert.ok(s[k]?.length > 0, `${s.id} missing ${k}`);
    assert.ok(s.source?.printed && s.source?.pdf && s.source?.topic, `${s.id} missing source`);
  }
  for (const s of coverage.scenes) for (let j = 0; j < s.printed.length; j++) near(s.pdf[j] - s.printed[j], 6, 0, `page mapping ${s.id}`);
  for (const id of ['sudden-force', 'momentum-kick', 'phase-space', 'atomic-drive', 'landau-zener', 'stern-gerlach', 'two-site']) {
    const s = scenes.find(s => s.id === id);
    for (const k of ['operation', 'implementation', 'response']) assert.ok(s[k]?.length > 0, `${id} missing physical-operation explanation ${k}`);
  }
});

test('box eigenstates: normalization, orthogonality, boundaries, time-independent density', () => {
  for (let n = 1; n <= 6; n++) {
    near(integrate(x => A.box(n, x, .7).density, 0, 1), 1, 1e-10, `box norm n=${n}`);
    near(A.box(n, 0, .7).density, 0, 1e-20);
    near(A.box(n, 1, .7).density, 0, 1e-20);
    for (const x of [.07, .21, .49, .83]) near(A.box(n, x, 0).density, A.box(n, x, 2.91).density, 1e-12);
  }
  near(inner(x => A.box(1, x), x => A.box(2, x), 0, 1), 0, 1e-10, 'box orthogonality');
});

test('superposition: unitary normalization and phase-controlled position probabilities', () => {
  for (const a of [0, .2, .5, .97, 1]) for (const t of [0, .37, 1.93]) for (const phase of [0, 1.1, Math.PI]) {
    near(integrate(x => A.superposition(x, t, a, phase).density, 0, 1), 1, 1e-10);
  }
  const left0 = integrate(x => A.superposition(x, 0, .5, 0).density, 0, .5);
  const leftPi = integrate(x => A.superposition(x, 0, .5, Math.PI).density, 0, .5);
  near(left0 + leftPi, 1, 1e-9, 'reversed relative phase mirrors probability');
  assert.ok(Math.abs(left0 - leftPi) > .5, 'relative phase has visible interference effect');
});

test('free Gaussian: normalization, classical centre motion, spreading variance', () => {
  for (const sigma of [.45, 1, 1.8]) for (const t of [0, 1.7, 6]) {
    const k = 1.2, mean = -5 + k * t;
    const variance = sigma * sigma + t * t / (4 * sigma * sigma);
    const lo = mean - 10 * Math.sqrt(variance), hi = mean + 10 * Math.sqrt(variance);
    const rho = x => A.packet(x, t, sigma, k).density;
    near(integrate(rho, lo, hi), 1, 1e-10, 'packet norm');
    near(integrate(x => x * rho(x), lo, hi), mean, 1e-9, 'packet mean');
    near(integrate(x => (x - mean) ** 2 * rho(x), lo, hi), variance, 1e-8, 'packet variance');
  }
});

test('barrier scattering: probability current conservation and continuous matching', () => {
  const cases = [[.8, 1.8, 1.1], [2, 1, 1], [1, 1, 1.3], [.2, 3, 3], [1, 0, 1.7]];
  const current = (x, E, V, a) => {
    const e = 1e-5, psi = A.barrierWave(x, .7, E, V, a), left = A.barrierWave(x - e, .7, E, V, a), right = A.barrierWave(x + e, .7, E, V, a);
    return psi.re * (right.im - left.im) / (2 * e) - psi.im * (right.re - left.re) / (2 * e);
  };
  for (const [E, V, a] of cases) {
    const T = A.transmission(E, V, a);
    assert.ok(T >= 0 && T <= 1 + 1e-12, `T outside [0,1]: ${T}`);
    const j = Math.sqrt(2 * E) * T;
    for (const x of [-1, a / 2, a + 1]) near(current(x, E, V, a), j, 2e-8, `constant current E=${E}, V=${V}, x=${x}`);
    for (const edge of [0, a]) {
      const left = A.barrierWave(edge - 1e-7, 0, E, V, a), right = A.barrierWave(edge + 1e-7, 0, E, V, a);
      near(left.re, right.re, 2e-6, 'barrier continuous real part');
      near(left.im, right.im, 2e-6, 'barrier continuous imaginary part');
    }
  }
  near(A.transmission(1, 0, 2), 1, 1e-12, 'zero barrier transmits fully');
  near(A.transmission(1, 2, 0), 1, 1e-12, 'zero width transmits fully');
  assert.ok(A.transmission(.8, 1.8, 2) < A.transmission(.8, 1.8, 1), 'wider sub-barrier obstacle suppresses T');
  near(A.transmission(1 - 1e-6, 1, 1), A.transmission(1 + 1e-6, 1, 1), 2e-6, 'threshold limit continuous');
});

test('oscillator and coherent states: norms, orthogonality, parity and Ehrenfest motion', () => {
  for (let n = 0; n <= 5; n++) {
    near(integrate(x => A.oscillator(n, x, 1.2).density, -12, 12), 1, 1e-10, `oscillator norm ${n}`);
    for (const x of [.2, .8, 1.7]) near(A.oscillator(n, x).re, (-1) ** n * A.oscillator(n, -x).re, 1e-12, 'oscillator parity');
  }
  near(inner(x => A.oscillator(0, x), x => A.oscillator(1, x), -12, 12), 0, 1e-10);
  for (const t of [0, .4, 1.7, 3]) {
    const alpha = 1.5, rho = x => A.coherent(x, t, alpha).density, mean = Math.SQRT2 * alpha * Math.cos(t);
    near(integrate(rho, -12, 12), 1, 1e-10);
    near(integrate(x => x * rho(x), -12, 12), mean, 1e-10);
    near(integrate(x => (x - mean) ** 2 * rho(x), -12, 12), .5, 1e-10, 'coherent variance remains fixed');
  }
});

test('animated complex wavefunctions satisfy their stated Schrödinger equations', () => {
  // A wrong global time phase can pass every density test; differential residuals catch it.
  function residual(fn, x, t, kinetic, potential, tol = 3e-6) {
    const dx = 1e-4, dt = 1e-5;
    const z = fn(x, t), xp = fn(x + dx, t), xm = fn(x - dx, t), tp = fn(x, t + dt), tm = fn(x, t - dt);
    const lhs = { re: -(tp.im - tm.im) / (2 * dt), im: (tp.re - tm.re) / (2 * dt) };
    const rhs = { re: -kinetic * (xp.re - 2 * z.re + xm.re) / (dx * dx) + potential(x) * z.re, im: -kinetic * (xp.im - 2 * z.im + xm.im) / (dx * dx) + potential(x) * z.im };
    near(lhs.re, rhs.re, tol, 'real Schrödinger residual');
    near(lhs.im, rhs.im, tol, 'imaginary Schrödinger residual');
  }
  for (const t of [0, .4, 1.3]) for (const x of [-1.2, .3, 1.8]) {
    residual((x, t) => A.packet(x, t, .8, 1.2, 0), x, t, .5, () => 0);
    residual((x, t) => A.oscillator(2, x, t), x, t, .5, x => x * x / 2);
    residual((x, t) => A.coherent(x, t, 1.3), x, t, .5, x => x * x / 2);
  }
  for (const x of [.12, .42, .76]) residual((x, t) => A.box(3, x, t), x, .7, 1 / Math.PI ** 2, () => 0);
  for (const [E, V, a] of [[.8, 1.8, 1.1], [2, 1, 1], [1, 1, 1.3]]) {
    for (const x of [-1, a / 2, a + 1]) residual((x, t) => A.barrierWave(x, t, E, V, a), x, .6, .5, x => x > 0 && x < a ? V : 0);
  }
});

test('Gaussian uncertainty and basis rotations preserve the relevant bounds', () => {
  for (const sigma of [.2, .7, 1.8]) {
    near(A.uncertainty(sigma, 0).product, .5, 1e-12);
    assert.ok(A.uncertainty(sigma, .7).product > .5, 'chirp exceeds minimal product');
  }
  for (const theta of [0, .31, 1.8, Math.PI]) for (const phi of [0, 1, 3]) for (const beta of [0, .8, Math.PI]) {
    const b = A.basis(theta, phi, beta);
    near(b.old.reduce((a, v) => a + v), 1, 1e-12);
    near(b.rotated.reduce((a, v) => a + v), 1, 1e-12);
    for (const p of [...b.old, ...b.rotated]) assert.ok(p >= 0 && p <= 1 + 1e-12);
  }
  near(A.basis(Math.PI / 2, 0, Math.PI / 2).rotated[0], 1, 1e-12);
  near(A.basis(Math.PI / 2, Math.PI, Math.PI / 2).rotated[0], 0, 1e-12);
});

test('hydrogen: radial norms, angular integration, nodes and ground-state radius', () => {
  for (const state of ['1s', '2s', '2pz', '3dz2']) {
    near(integrate(r => A.hydrogenRadial(state, r), 0, 120), 1, 2e-9, `radial norm ${state}`);
    // Angular integral at fixed r independently checks |Y_lm|² normalization.
    for (const r of [.5, 3, 8]) {
      const radialFromSpatial = 2 * Math.PI * r * r * integrate(c => A.hydrogenSpatial(state, r * Math.sqrt(1 - c * c), 0, r * c), -1, 1, 10000);
      near(radialFromSpatial, A.hydrogenRadial(state, r), 2e-8, `spatial/radial consistency ${state}`);
    }
  }
  near(A.hydrogenRadial('2s', 2), 0, 1e-20, '2s radial node');
  near(A.hydrogenSpatial('2pz', 1, 1, 0), 0, 1e-20, '2p angular node');
  near(A.hydrogenSpatial('3dz2', Math.SQRT2, 0, 1), 0, 1e-20, '3d cone node');
  assert.ok(A.hydrogenRadial('1s', 1) > A.hydrogenRadial('1s', .95));
  assert.ok(A.hydrogenRadial('1s', 1) > A.hydrogenRadial('1s', 1.05));
  near(integrate(r => r * A.hydrogenRadial('1s', r), 0, 50), 1.5, 1e-9, 'ground-state mean radius');
});

test('perturbation converges at weak coupling and variational energy is an upper bound', () => {
  near(B.perturbGround(0, 1), 0, 0);
  const errSmall = Math.abs(B.perturbGround(.05, 1) - B.perturb2(.05, 1));
  const errLarge = Math.abs(B.perturbGround(.1, 1) - B.perturb2(.1, 1));
  assert.ok(errSmall < errLarge / 10, 'halving coupling reduces second-order error by approximately fourth order');
  near(B.perturbGround(.5, 2), B.perturbGround(-.5, 2), 1e-12, 'spectrum independent of coupling sign');
  for (const alpha of [.2, .3, .8, 1, 1.7, 4, 10]) {
    assert.ok(B.variational(alpha) >= .5 - 1e-12);
    near(B.variational(alpha), B.variational(1 / alpha), 1e-12, 'dual widths cost same total energy');
  }
  near(B.variational(1), .5, 1e-12);
});

test('exact transition is bounded while first-order theory agrees at short time', () => {
  for (const v of [0, .1, .5]) for (const gap of [0, .2, 1, 2]) for (let t = 0; t <= 24; t += .37) {
    const p = B.transitionExact(t, v, gap);
    assert.ok(p >= 0 && p <= 1 + 1e-12);
  }
  near(B.transitionExact(1e-4, .3, .4), B.transitionFirst(1e-4, .3, .4), 1e-15, 'short-time limit');
  near(B.transitionExact(3, 0, 0), 0, 0, 'zero Hamiltonian produces no transition');
  assert.ok(B.transitionFirst(10, .5, 0) > 1, 'first-order invalidity is exposed rather than silently clamped');
});

test('Bloch and Rabi: positive density states, norm preservation and correct π pulse', () => {
  for (const purity of [0, .4, 1]) for (const theta of [0, 1, Math.PI]) for (const phi of [0, 2, 5]) {
    const r = B.blochVector(theta, phi, purity);
    near(Math.hypot(...r), purity, 1e-12);
    for (const c of r) assert.ok((1 + c) / 2 >= -1e-12 && (1 + c) / 2 <= 1 + 1e-12);
  }
  for (const delta of [-3, -.5, 0, 1, 3]) for (const omega of [0, .2, 1, 2]) for (const t of [0, .3, 1, 7, 24]) {
    const r = B.rabiVector(t, omega, delta), p = B.rabi(t, omega, delta);
    near(Math.hypot(...r), 1, 1e-12, 'Rabi pure-state norm');
    near((1 - r[2]) / 2, p, 1e-12, 'Rabi sphere and graph agree');
    assert.ok(p >= 0 && p <= 1 + 1e-12);
  }
  near(B.rabi(Math.PI, 1, 0), 1, 1e-12, 'resonant π pulse flips completely');
  near(B.rabi(Math.PI / Math.SQRT2, 1, 1), .5, 1e-12, 'detuning equal to drive limits amplitude to half');
  near(B.rabi(3.1, 0, 2), 0, 0, 'no drive means no flip');
});

test('singlet: normalized nonnegative joint probabilities with fixed unbiased marginals', () => {
  for (const angle of [0, .3, Math.PI / 2, 2.1, Math.PI, 4]) {
    let total = 0, correlation = 0;
    for (const a of [-1, 1]) for (const b of [-1, 1]) {
      const p = B.singletJoint(angle, a, b);
      assert.ok(p >= 0 && p <= .5 + 1e-12);
      total += p; correlation += a * b * p;
    }
    near(total, 1, 1e-12);
    for (const a of [-1, 1]) near(B.singletJoint(angle, a, -1) + B.singletJoint(angle, a, 1), .5, 1e-12);
    for (const b of [-1, 1]) near(B.singletJoint(angle, -1, b) + B.singletJoint(angle, 1, b), .5, 1e-12);
    near(correlation, -Math.cos(angle), 1e-12);
  }
  near(B.singletJoint(0, 1, 1), 0, 0, 'equal-axis same signs forbidden for singlet');
});

test('exchange symmetry, two-body normalization, Pauli filling and ladder algebra', () => {
  for (const sign of [-1, 1]) {
    for (const [x, y] of [[-.4, 1], [.7, -.9], [1.2, 1.2]]) near(B.pairAmplitude(x, y, sign), sign * B.pairAmplitude(y, x, sign), 1e-12, 'exchange parity');
    const n = 480, dr = 16 / n; let total = 0;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) total += B.pairAmplitude(-8 + (i + .5) * dr, -8 + (j + .5) * dr, sign) ** 2 * dr * dr;
    near(total, 1, 1e-10, 'two-body state normalization');
  }
  for (const x of [-2, -.4, 0, .8, 2]) near(B.pairAmplitude(x, x, -1), 0, 0, 'antisymmetric same-position node');
  for (let N = 1; N <= 8; N++) {
    const fermions = B.occupancies(N, true), bosons = B.occupancies(N, false);
    near(fermions.reduce((sum, n) => sum + n), N, 0);
    near(bosons.reduce((sum, n) => sum + n), N, 0);
    assert.ok(fermions.every(n => n === 0 || n === 1));
    near(fermions.reduce((sum, n, i) => sum + n * (i + .5), 0), N * N / 2, 1e-12);
    near(bosons.reduce((sum, n, i) => sum + n * (i + .5), 0), N / 2, 1e-12);
  }
  near(B.ladderCoeff(0, false, false), 0, 0, 'bosonic vacuum annihilates to zero');
  near(B.ladderCoeff(1, true, true), 0, 0, 'occupied fermion creation gives zero');
  near(B.ladderCoeff(0, false, true), 0, 0, 'fermionic vacuum annihilates to zero');
  for (let n = 0; n <= 6; n++) near(B.ladderCoeff(n, true, false) ** 2 - B.ladderCoeff(n, false, false) ** 2, 1, 1e-12, '[a,a†]=1 on number states');
});

test('suddenly forced oscillator: continuous preparation, exact wave phase and Ehrenfest response', () => {
  for (const F of [-1.8, 0, 1, 1.8]) for (const t of [0, .4, Math.PI, 2 * Math.PI]) {
    const q = F * (1 - Math.cos(t)), p = F * Math.sin(t), rho = x => C.forced(x, t, F).density;
    near(integrate(rho, q - 12, q + 12), 1, 1e-10);
    near(integrate(x => x * rho(x), q - 12, q + 12), q, 1e-10);
    near(integrate(x => (x - q) ** 2 * rho(x), q - 12, q + 12), .5, 1e-10, 'external force preserves Gaussian width');
    const dx = 1e-4;
    const averageP = integrate(x => {
      const z = C.forced(x, t, F), plus = C.forced(x + dx, t, F), minus = C.forced(x - dx, t, F);
      return z.re * (plus.im - minus.im) / (2 * dx) - z.im * (plus.re - minus.re) / (2 * dx);
    }, q - 12, q + 12);
    near(averageP, p, 1e-7, 'momentum agrees with phase gradient');
    const x = q + .3, dt = 1e-5, z = C.forced(x, t, F), tp = C.forced(x, t + dt, F), tm = C.forced(x, t - dt, F), xp = C.forced(x + dx, t, F), xm = C.forced(x - dx, t, F), V = x * x / 2 - F * x;
    near(-(tp.im - tm.im) / (2 * dt), -.5 * (xp.re - 2 * z.re + xm.re) / dx ** 2 + V * z.re, 3e-6, 'forced real Schrödinger residual');
    near((tp.re - tm.re) / (2 * dt), -.5 * (xp.im - 2 * z.im + xm.im) / dx ** 2 + V * z.im, 3e-6, 'forced imaginary Schrödinger residual');
  }
  for (const x of [-2, -.4, 0, .9, 2]) near(C.forced(x, 0, 1).density, C.forced(x, 0, 0).density, 1e-12, 'switch-on does not jump initial density');
});

test('physical impulse: instant density unchanged, shifted momentum and later centre motion', () => {
  for (const sigma of [.5, .8, 1.5]) for (const k of [-2.4, 0, 1.2, 2.4]) {
    for (const x of [-2, -.7, 0, .6, 1.8]) near(C.impulse(x, 0, sigma, k).density, C.impulse(x, 0, sigma, 0).density, 1e-12);
    const dx = 1e-4, averageP = integrate(x => {
      const z = C.impulse(x, 0, sigma, k), plus = C.impulse(x + dx, 0, sigma, k), minus = C.impulse(x - dx, 0, sigma, k);
      return z.re * (plus.im - minus.im) / (2 * dx) - z.im * (plus.re - minus.re) / (2 * dx);
    }, -15, 15);
    near(averageP, k, 1e-7, 'unitary linear phase imparts intended momentum');
    for (const t of [0, 2, 5]) {
      const center = k * t, variance = sigma * sigma + t * t / (4 * sigma * sigma), span = 10 * Math.sqrt(variance), rho = x => C.impulse(x, t, sigma, k).density;
      near(integrate(rho, center - span, center + span), 1, 1e-10);
      near(integrate(x => x * rho(x), center - span, center + span), center, 1e-9);
    }
  }
});

test('squeezed-state dynamics: Wigner marginals, covariance invariant and quarter-period exchange', () => {
  for (const sigma of [.35, Math.SQRT1_2, 1.5]) for (const q0 of [-2, 0, 2]) for (const t of [0, .4, Math.PI / 2, Math.PI]) {
    const r = C.squeezed(t, sigma, q0);
    near(r.vx * r.vp - r.cov ** 2, .25, 1e-12, 'actual covariance determinant');
    assert.ok(r.vx > 0 && r.vp > 0);
    const span = 12;
    for (const x of [-1, 0, 1]) {
      const rhoX = integrate(p => C.wigner(x, p, t, sigma, q0), -span, span, 16000);
      const rhoP = integrate(y => C.wigner(y, x, t, sigma, q0), -span, span, 16000);
      near(rhoX, Math.exp(-((x - r.q) ** 2) / (2 * r.vx)) / Math.sqrt(2 * Math.PI * r.vx), 1e-9, 'Wigner x marginal');
      near(rhoP, Math.exp(-((x - r.p) ** 2) / (2 * r.vp)) / Math.sqrt(2 * Math.PI * r.vp), 1e-9, 'Wigner p marginal');
    }
  }
  const initial = C.squeezed(0, .4), quarter = C.squeezed(Math.PI / 2, .4);
  near(initial.vx, quarter.vp, 1e-12); near(initial.vp, quarter.vx, 1e-12);
  near(C.squeezed(.7, Math.SQRT1_2).vx, .5, 1e-12, 'ground-state width does not breathe');
});

test('effective atomic drive: spatial density is normalized and matches populations and lab-frame dipole', () => {
  function atomIntegral(fn, tau, omega) {
    const nr = 700, nc = 360, dr = 55 / nr, dc = 2 / nc; let total = 0;
    for (let i = 0; i < nr; i++) {
      const r = (i + .5) * dr;
      for (let j = 0; j < nc; j++) {
        const cos = -1 + (j + .5) * dc, z = r * cos, x = r * Math.sqrt(1 - cos * cos), rho = C.atomPoint(x, 0, z, tau, omega).density;
        total += fn(rho, z) * r * r * dr * dc * 2 * Math.PI;
      }
    }
    return total;
  }
  for (const [tau, omega] of [[0, .016], [.7, .008], [Math.PI / 2, .016], [Math.PI, .024], [2 * Math.PI, .016]]) {
    const r = C.atom(tau, omega);
    near(r.p1 + r.p2, 1, 1e-12);
    // Quadrature resolution error is dominated by smooth radial midpoint integration.
    near(atomIntegral(rho => rho, tau, omega), 1, 2e-5, '3D driven-state normalization');
    near(atomIntegral((rho, z) => z * rho, tau, omega), r.z, 3e-5, 'spatial state agrees with reported lab-frame dipole');
    near(r.labTime * omega, tau, 1e-12);
  }
  for (const [tau, state] of [[0, '1s'], [Math.PI, '2pz'], [2 * Math.PI, '1s']]) for (const xyz of [[0, 0, 0], [.2, .4, .8], [1, 1, -2]]) {
    near(C.atomPoint(...xyz, tau, .016).density, A.hydrogenSpatial(state, ...xyz), 1e-12, 'pure-population endpoints recover actual orbitals');
  }
});

test('Landau–Zener propagation: unitarity, initial preparation and time-step convergence', () => {
  const input = [Math.SQRT1_2, 0, 0, Math.SQRT1_2];
  const stepped = D.lzStep(input, -1.3, .017, .8, .5);
  const reversed = D.lzStep(stepped, -1.3 + .017, -.017, .8, .5);
  input.forEach((v, i) => near(reversed[i], v, 1e-12, 'exact midpoint-step reversal'));
  for (const [v, g] of [[.25, 1.2], [3, .3], [.65, .8], [3, 1.5]]) {
    near(D.lzState(0, v, g).pGround, 1, 1e-12, 'prepared in finite-window ground state');
    const coarse = D.lzState(48, v, g, 24, 12000), fine = D.lzState(48, v, g, 24, 24000);
    assert.ok(coarse.maxNormError < 1e-11, 'all propagation steps preserve normalization');
    near(coarse.pGround, fine.pGround, 2e-7, 'doubling temporal resolution converges');
    for (const t of [0, 3, 19.7, 24, 31, 48]) {
      const r = D.lzState(t, v, g);
      near(r.p0 + r.p1, 1, 1e-11);
      near(r.pGround + r.pExcited, 1, 1e-11);
      assert.ok(r.pGround >= 0 && r.pExcited >= 0);
    }
  }
  assert.ok(D.lzState(48, .25, 1.2).pGround > .999, 'slow large-gap sweep follows ground state');
  assert.ok(D.lzState(48, 3, .3).pGround < .06, 'fast small-gap sweep stays mostly in original bare state');
});

test('Stern–Gerlach Gaussian splitting: total norm, Born branch weights, acceleration and variance', () => {
  for (const t of [0, 2, 8]) for (const F of [.05, .5]) for (const theta of [0, Math.PI / 2, Math.PI]) {
    const sigma0 = .8, r = D.sgState(t, F, sigma0, theta);
    const max = Math.abs(r.centerUp) + 10 * r.sigma;
    const rho = z => D.sgDensity(z, t, F, sigma0, theta);
    near(integrate(z => rho(z).total, -max, max), 1, 1e-10);
    near(integrate(z => rho(z).up, -max, max), r.weightUp, 1e-10);
    near(integrate(z => rho(z).down, -max, max), r.weightDown, 1e-10);
    near(integrate(z => z * rho(z).total, -max, max), r.meanPosition, 1e-9);
    near(integrate(z => (z - r.meanPosition) ** 2 * rho(z).total, -max, max), r.sigma ** 2 + r.centerUp ** 2 * Math.sin(theta) ** 2, 1e-8);
    near(r.centerUp, F * t * t / 2, 1e-12);
    near(r.pUp, F * t, 1e-12);
    for (const z of [-1, 0, 1]) near(rho(z).total, rho(z).up + rho(z).down, 1e-12, 'orthogonal spin densities add without interference');
  }
  const initial = D.sgDensity(.4, 0, .5, 1, Math.PI / 2);
  near(initial.up, initial.down, 1e-12, 'balanced initial spin branches');
});

test('two-mode dynamics: unitary Schrödinger evolution, number conservation and Pauli blockade', () => {
  for (const J of [.1, .6, 1.5]) {
    for (const t of [0, .3, 1, 7, 16]) {
      const a = D.twoSiteState(t, J, false), b = D.twoSiteState(t, J, true);
      near(a.norm, 1, 1e-12); near(b.norm, 1, 1e-12);
      near(a.totalN, 2, 1e-12); near(b.totalN, 2, 1e-12);
      near(a.meanLeft, 1, 1e-12); near(a.meanRight, 1, 1e-12);
      near(b.probabilities[0], 0, 0); near(b.probabilities[1], 1, 0); near(b.probabilities[2], 0, 0);
      const dt = 1e-5, plus = D.twoSiteState(t + dt, J, false).amplitudes, minus = D.twoSiteState(t - dt, J, false).amplitudes;
      const H = [[0, -Math.SQRT2 * J, 0], [-Math.SQRT2 * J, 0, -Math.SQRT2 * J], [0, -Math.SQRT2 * J, 0]];
      for (let i = 0; i < 3; i++) {
        const reH = H[i].reduce((s, h, j) => s + h * a.amplitudes[j][0], 0);
        const imH = H[i].reduce((s, h, j) => s + h * a.amplitudes[j][1], 0);
        near(-(plus[i][1] - minus[i][1]) / (2 * dt), reH, 2e-8, 'two-mode real Schrödinger residual');
        near((plus[i][0] - minus[i][0]) / (2 * dt), imH, 2e-8, 'two-mode imaginary Schrödinger residual');
      }
    }
    const mixed = D.twoSiteState(Math.PI / (4 * J), J, false);
    near(mixed.probabilities[1], 0, 1e-20);
    near(mixed.probabilities[0], .5, 1e-12); near(mixed.probabilities[2], .5, 1e-12);
  }
});

test('all scene renders and metrics stay finite at defaults and individual control extremes', () => {
  const kit = {
    colors: { blue: '#76a9ff', purple: '#b29aff', gold: '#efc77b', pink: '#ee91b8', text: '#e8ecfa', muted: '#909bb7', grid: '#222b43' },
    text(ctx, s, x, y) { ctx.fillText(s, x, y); },
    line(ctx, x1, y1, x2, y2) { ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); },
    glow(ctx, x, y, r) { ctx.arc(x, y, r, 0, Math.PI * 2); },
    heatmap(ctx, p) { ctx.beginPath(); for (const x of [.1, .3, .5, .7, .9]) for (const y of [.1, .3, .5, .7, .9]) assert.ok(Number.isFinite(p.fn(x, y)), 'nonfinite heatmap'); },
    project: (x, y, z, cx, cy, scale, angle = 0) => [cx + (x * Math.cos(angle) - y * Math.sin(angle)) * scale, cy - z * scale, y],
    plot(ctx, p) { const axis = { X: n => p.x + (n - p.xmin) / (p.xmax - p.xmin) * p.w, Y: n => p.y + p.h - (n - p.ymin) / (p.ymax - p.ymin) * p.h }; ctx.beginPath(); for (const q of p.curves || []) for (let j = 0; j <= 5; j++) { const u = p.xmin + (p.xmax - p.xmin) * j / 5; ctx.lineTo(axis.X(u), axis.Y(q.fn(u))); } return axis; }
  };
  for (const s of scenes) {
    const defaults = Object.fromEntries(s.controls.map(c => [c.key, c.value]));
    const variants = [defaults];
    for (const c of s.controls) for (const v of c.options ? c.options.map(o => o.value) : [c.min, c.max]) variants.push({ ...defaults, [c.key]: v });
    for (const params of variants) for (const [w, h] of [[1280, 640], [390, 640]]) for (const t of [0, s.duration * .37, s.duration]) {
      const before = drawCalls;
      assert.doesNotThrow(() => s.render(contextStub(), w, h, t, params, kit), `${s.id} render ${w}×${h} t=${t} params=${JSON.stringify(params)}`);
      assert.ok(drawCalls > before, `${s.id} must draw actual content`);
      const m = s.metrics(t, params);
      assert.ok(Array.isArray(m) && m.length > 0, `${s.id} metrics missing`);
      for (const row of m) assert.ok(!/NaN|undefined/.test(String(row.value)), `${s.id} invalid metric: ${row.value}`);
    }
  }
});
