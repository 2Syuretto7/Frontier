"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const N = 48;
const Q = 0.1;
const ZS = Array.from({ length: 120 }, (_, i) => -6 + (i + 0.5) * 0.1);
const WS = ZS.map((z) => (Math.exp(-z * z / 2) * 0.1) / Math.sqrt(2 * Math.PI));
const sech2 = (z: number) => 1 / Math.cosh(z) ** 2;
const TM1 = ZS.reduce((s, z, i) => s + WS[i] * sech2(Math.sqrt(Q) * z) ** 2, 0);
const TM2 = ZS.reduce((s, z, i) => s + WS[i] * sech2(Math.sqrt(Q) * z) ** 4, 0);

type Act = "linear" | "relu" | "tanh";

/** Eigenvalues of a symmetric matrix by cyclic Jacobi rotations. */
export function symEigs(A0: number[][]) {
  const n = A0.length, A = A0.map((r) => r.slice());
  for (let sweep = 0; sweep < 30; sweep++) {
    let off = 0, diag = 0;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) (i === j ? (diag += A[i][j] ** 2) : (off += A[i][j] ** 2));
    if (off <= 1e-24 * diag) break;
    for (let p = 0; p < n - 1; p++) for (let q = p + 1; q < n; q++) {
      if (Math.abs(A[p][q]) < 1e-300) continue;
      const th = (A[q][q] - A[p][p]) / (2 * A[p][q]);
      const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1));
      const c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) {
        const akp = A[k][p], akq = A[k][q];
        A[k][p] = c * akp - s * akq;
        A[k][q] = s * akp + c * akq;
      }
      for (let k = 0; k < n; k++) {
        const apk = A[p][k], aqk = A[q][k];
        A[p][k] = c * apk - s * aqk;
        A[q][k] = s * apk + c * aqk;
      }
    }
  }
  return A.map((r, i) => r[i]);
}

/** Squared singular values of the input-output Jacobian of a random deep network at criticality. */
export function jacobianSpectrum(act: Act, orthogonal: boolean, depth: number, seed: number) {
  const r = rand(seed);
  const normal = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  let J: number[][] = Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => (i === j ? 1 : 0)));
  for (let l = 0; l < depth; l++) {
    const W = Array.from({ length: N }, () => Array.from({ length: N }, () => normal() / Math.sqrt(N)));
    if (orthogonal) {
      for (let j = 0; j < N; j++) {
        for (let k = 0; k < j; k++) {
          let d = 0;
          for (let i = 0; i < N; i++) d += W[i][j] * W[i][k];
          for (let i = 0; i < N; i++) W[i][j] -= d * W[i][k];
        }
        let nn = 0;
        for (let i = 0; i < N; i++) nn += W[i][j] ** 2;
        nn = Math.sqrt(nn);
        for (let i = 0; i < N; i++) W[i][j] /= nn;
      }
    }
    const d = Array.from({ length: N }, () =>
      act === "linear" ? 1 : act === "relu" ? (r() < 0.5 ? Math.SQRT2 : 0) : sech2(Math.sqrt(Q) * normal()) / Math.sqrt(TM1),
    );
    const next = Array.from({ length: N }, () => new Array<number>(N).fill(0));
    for (let i = 0; i < N; i++) for (let k = 0; k < N; k++) {
      const a = d[i] * W[i][k];
      if (a === 0) continue;
      const row = J[k], out = next[i];
      for (let j = 0; j < N; j++) out[j] += a * row[j];
    }
    J = next;
  }
  const G = Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => {
    let s = 0;
    for (let k = 0; k < N; k++) s += J[i][k] * J[j][k];
    return s;
  }));
  return symEigs(G);
}

export function predictedVariance(act: Act, orthogonal: boolean, depth: number) {
  const ratio = act === "linear" ? 1 : act === "relu" ? 2 : TM2 / TM1 ** 2;
  return depth * (ratio - 1 + (orthogonal ? 0 : 1));
}

const DEPTHS = [1, 4, 16, 64];
const LO = -4, HI = 3, BINS = 28;

export function IsometryViz() {
  const [act, setAct] = useState<Act>("linear");
  const [orth, setOrth] = useState(false);
  const [depth, setDepth] = useState(16);
  const [seed, setSeed] = useState(1);
  const lams = useMemo(() => jacobianSpectrum(act, orth, depth, seed), [act, orth, depth, seed]);
  const mean = lams.reduce((s, x) => s + x, 0) / N;
  const variance = lams.reduce((s, x) => s + (x - mean) ** 2, 0) / N;
  const tiny = lams.filter((x) => x < 10 ** LO).length;
  const counts = new Array<number>(BINS).fill(0);
  for (const x of lams) {
    if (x < 10 ** LO) continue;
    const b = Math.min(BINS - 1, Math.floor(((Math.log10(x) - LO) / (HI - LO)) * BINS));
    counts[b]++;
  }
  const W = 330, H = 150, X0 = 34, PW = 286, Y0 = 120, PH = 104;
  const cmax = Math.max(4, tiny, ...counts);
  const bw = PW / (BINS + 2);
  const bx = (b: number) => X0 + (b + 2) * bw;
  const by = (c: number) => Y0 - (c / cmax) * PH;
  const oneX = bx(((0 - LO) / (HI - LO)) * BINS);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Activation">
          {(["linear", "relu", "tanh"] as Act[]).map((a) => (
            <button key={a} className="seg" aria-pressed={act === a} onClick={() => setAct(a)}>
              {a === "linear" ? "linear" : a === "relu" ? "ReLU" : "tanh"}
            </button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Weights">
          <button className="seg" aria-pressed={!orth} onClick={() => setOrth(false)}>Gaussian</button>
          <button className="seg" aria-pressed={orth} onClick={() => setOrth(true)}>orthogonal</button>
        </div>
        <div className="segmented" role="group" aria-label="Depth">
          {DEPTHS.map((L) => (
            <button key={L} className="seg" aria-pressed={depth === L} onClick={() => setDepth(L)}>L = {L}</button>
          ))}
        </div>
        <button className="btn" onClick={() => setSeed((s) => s + 1)}>Resample</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Histogram of the squared singular values of the network Jacobian on a logarithmic scale">
        <line x1={X0} x2={X0 + PW} y1={Y0} y2={Y0} stroke="var(--border)" />
        <rect x={X0} y={by(tiny)} width={bw - 1} height={Y0 - by(tiny)} fill="var(--text-muted)" opacity={0.6} />
        {counts.map((c, b) => (c ? <rect key={b} x={bx(b)} y={by(c)} width={bw - 1} height={Y0 - by(c)} fill={orth ? "var(--accent)" : "var(--code-function)"} opacity={0.85} /> : null))}
        <line x1={oneX} x2={oneX} y1={Y0 - PH - 4} y2={Y0} stroke="var(--text)" strokeDasharray="3 3" />
        <text x={oneX + 3} y={Y0 - PH + 4} className="viz-label">λ = 1</text>
        <text x={X0 + bw / 2} y={Y0 + 12} textAnchor="middle" className="viz-label">≈0</text>
        {[-2, 0, 2].map((e) => (
          <text key={e} x={bx(((e - LO) / (HI - LO)) * BINS)} y={Y0 + 12} textAnchor="middle" className="viz-label">10{e < 0 ? "⁻" : ""}{["⁰", "¹", "²", "³", "⁴"][Math.abs(e)]}</text>
        ))}
        <text x={X0 + PW} y={H - 4} textAnchor="end" className="viz-label">squared singular value λ (log scale)</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        width {N}: mean λ = {mean.toFixed(3)}, variance of λ = {variance.toFixed(2)} (wide limit {predictedVariance(act, orth, depth).toFixed(2)}), {tiny} of {N} below 10⁻⁴
      </div>
      <figcaption className="viz-caption">
        The 48 squared singular values of the input-output Jacobian of a random network of width 48, every layer
        initialised at criticality so that the mean of λ is about 1. Gaussian weights spread the spectrum further with
        every layer, and ReLU kills half the directions in each layer whatever the weights. Only orthogonal weights with a
        nearly linear activation, here tanh at small pre-activation variance, keep every λ near 1 at depth 64. At this
        small width, and especially at large depth, one sample&apos;s variance is dominated by a few huge λ and can land far
        from the wide-limit value; the number of λ near zero is the steadier sign of how badly conditioned the Jacobian is.
      </figcaption>
    </figure>
  );
}
