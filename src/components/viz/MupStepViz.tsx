"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const WIDTHS = [16, 32, 64, 128, 256, 512];
const SEEDS = 4;
const D = 4;
const X = [1, -0.5, 0.8, 0.3];
const ETA = 0.1;
type Param = "sp" | "ntk" | "mup";
type Qty = "dz" | "df" | "f0";
const PARAMS: [Param, string, string][] = [
  ["sp", "SP", "var(--code-string)"],
  ["ntk", "NTK", "var(--code-function)"],
  ["mup", "μP", "var(--accent)"],
];

/** Per-layer (initial variance, SGD learning rate) for input, hidden and output weights of an MLP of width n. */
function scales(p: Param, n: number): [number, number][] {
  if (p === "sp") return [[1 / D, ETA], [1 / n, ETA], [1 / n, ETA]];
  if (p === "ntk") return [[1 / D, ETA / D], [1 / n, ETA / n], [1 / n, ETA / n]];
  return [[1 / D, ETA * n], [1 / n, ETA], [1 / (n * n), ETA / n]];
}

/** One SGD step on (x, y = 1) for f = W3 relu(W2 relu(W1 x)); returns RMS change of the last hidden layer, |Δf| and |f₀|. */
export function oneStep(p: Param, n: number, seed: number) {
  const r = rand(seed);
  const normal = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const [[v1, l1], [v2, l2], [v3, l3]] = scales(p, n);
  const W1 = Array.from({ length: n }, () => Array.from({ length: D }, () => normal() * Math.sqrt(v1)));
  const u2 = Math.sqrt(3 * v2);
  const W2 = Array.from({ length: n }, () => Float64Array.from({ length: n }, () => (2 * r() - 1) * u2));
  const W3 = Float64Array.from({ length: n }, () => normal() * Math.sqrt(v3));
  const forward = () => {
    const h1 = new Float64Array(n), z1 = new Float64Array(n), h2 = new Float64Array(n), z2 = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      let s = 0;
      for (let k = 0; k < D; k++) s += W1[i][k] * X[k];
      h1[i] = s;
      z1[i] = s > 0 ? s : 0;
    }
    let f = 0;
    for (let i = 0; i < n; i++) {
      const row = W2[i];
      let s = 0;
      for (let k = 0; k < n; k++) s += row[k] * z1[k];
      h2[i] = s;
      z2[i] = s > 0 ? s : 0;
      f += W3[i] * z2[i];
    }
    return { h1, z1, h2, z2, f };
  };
  const a = forward();
  const res = a.f - 1;
  const g2 = new Float64Array(n), g1 = new Float64Array(n);
  for (let i = 0; i < n; i++) g2[i] = a.h2[i] > 0 ? res * W3[i] : 0;
  for (let i = 0; i < n; i++) if (g2[i]) {
    const row = W2[i];
    for (let k = 0; k < n; k++) g1[k] += g2[i] * row[k];
  }
  for (let k = 0; k < n; k++) if (a.h1[k] <= 0) g1[k] = 0;
  for (let i = 0; i < n; i++) W3[i] -= l3 * res * a.z2[i];
  for (let i = 0; i < n; i++) if (g2[i]) for (let k = 0; k < n; k++) W2[i][k] -= l2 * g2[i] * a.z1[k];
  for (let i = 0; i < n; i++) for (let k = 0; k < D; k++) W1[i][k] -= l1 * g1[i] * X[k];
  const b = forward();
  let dz = 0;
  for (let i = 0; i < n; i++) dz += (b.z2[i] - a.z2[i]) ** 2;
  dz = Math.sqrt(dz / n);
  return { dz, df: Math.abs(b.f - a.f), f0: Math.abs(a.f) };
}

function slope(xs: number[], ys: number[]) {
  const mx = xs.reduce((s, x) => s + x, 0) / xs.length, my = ys.reduce((s, y) => s + y, 0) / ys.length;
  let num = 0, den = 0;
  xs.forEach((x, i) => { num += (x - mx) * (ys[i] - my); den += (x - mx) ** 2; });
  return num / den;
}

export function MupStepViz() {
  const [qty, setQty] = useState<Qty>("dz");
  const [seed, setSeed] = useState(1);
  const data = useMemo(
    () =>
      PARAMS.map(([p]) =>
        WIDTHS.map((n) => {
          const runs = Array.from({ length: SEEDS }, (_, k) => oneStep(p, n, seed * 1000 + n + k * 7919));
          const avg = (q: Qty) => runs.reduce((s, x) => s + x[q], 0) / SEEDS;
          return { dz: avg("dz"), df: avg("df"), f0: avg("f0") };
        }),
      ),
    [seed],
  );
  const logs = data.map((row) => row.map((d) => Math.log10(Math.max(1e-12, d[qty]))));
  const lo = Math.floor(Math.min(...logs.flat())), hi = Math.ceil(Math.max(...logs.flat()));
  const W = 330, H = 170, X0 = 40, PW = 256, Y0 = 140, PH = 126;
  const lx = WIDTHS.map((n) => Math.log2(n));
  const px = (l: number) => X0 + ((l - lx[0]) / (lx[lx.length - 1] - lx[0])) * PW;
  const py = (v: number) => Y0 - ((v - lo) / Math.max(1, hi - lo)) * PH;
  const slopes = logs.map((ys) => slope(lx, ys.map((y) => y / Math.log10(2))));
  const label = qty === "dz" ? "RMS change of last hidden layer" : qty === "df" ? "change of output |Δf|" : "output at initialisation |f₀|";
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Quantity">
          <button className="seg" aria-pressed={qty === "dz"} onClick={() => setQty("dz")}>Δ features</button>
          <button className="seg" aria-pressed={qty === "df"} onClick={() => setQty("df")}>Δ output</button>
          <button className="seg" aria-pressed={qty === "f0"} onClick={() => setQty("f0")}>initial output</button>
        </div>
        <button className="btn" onClick={() => setSeed((s) => s + 7)}>Resample</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label={`${label} against width for three parametrisations, log-log`}>
        <line x1={X0} x2={X0 + PW} y1={Y0} y2={Y0} stroke="var(--border)" />
        <line x1={X0} x2={X0} y1={Y0} y2={Y0 - PH} stroke="var(--border)" />
        {Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).map((e) => (
          <text key={e} x={X0 - 4} y={py(e) + 4} textAnchor="end" className="viz-label">10{e < 0 ? "⁻" : ""}{"⁰¹²³⁴⁵⁶⁷⁸⁹"[Math.abs(e)] ?? Math.abs(e)}</text>
        ))}
        {WIDTHS.map((n, i) => (i % 2 === 0 || i === WIDTHS.length - 1 ? <text key={n} x={px(lx[i])} y={Y0 + 12} textAnchor="middle" className="viz-label">{n}</text> : null))}
        {logs.map((ys, k) => (
          <g key={k}>
            <path d={ys.map((y, i) => `${i ? "L" : "M"}${px(lx[i]).toFixed(1)},${py(y).toFixed(1)}`).join(" ")} fill="none" stroke={PARAMS[k][2]} strokeWidth={2} />
            {ys.map((y, i) => <circle key={i} cx={px(lx[i])} cy={py(y)} r={2.5} fill={PARAMS[k][2]} />)}
            <text x={X0 + PW + 2} y={py(ys[ys.length - 1]) + 4} className="viz-label" fill={PARAMS[k][2]}>{PARAMS[k][1]}</text>
          </g>
        ))}
        <text x={X0 + PW / 2} y={H - 2} textAnchor="middle" className="viz-label">width n (log scale)</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        fitted growth exponent of {label}: SP {slopes[0].toFixed(2)}, NTK {slopes[1].toFixed(2)}, μP {slopes[2].toFixed(2)}
      </div>
      <figcaption className="viz-caption">
        A three-layer ReLU network takes one SGD step on a single example, averaged over four random initialisations, at widths 16 to 512, under three ways of scaling
        the initial variances and per-layer learning rates with width. The standard parametrisation (SP), one learning rate for
        everything, makes the step blow up as the network widens. The NTK parametrisation keeps the output stable but its
        features freeze, changing like 1/√n. Only μP keeps the feature change and the output change both of order one. (The
        large hidden matrix is drawn uniformly rather than Gaussian, with the same variance, to keep the page fast; the
        scalings depend only on the variance.)
      </figcaption>
    </figure>
  );
}
