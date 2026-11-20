"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

type Phi = "linear" | "relu" | "tanh";
const PHI: Record<Phi, [(z: number) => number, (z: number) => number]> = {
  linear: [(z) => z, () => 1],
  relu: [(z) => Math.max(0, z), (z) => (z > 0 ? 1 : 0)],
  tanh: [Math.tanh, (z) => 1 / Math.cosh(z) ** 2],
};
const ZS = Array.from({ length: 240 }, (_, i) => -6 + (i + 0.5) * 0.05);
const WS = ZS.map((z) => (Math.exp(-z * z / 2) * 0.05) / Math.sqrt(2 * Math.PI));
const E = (f: (z: number) => number) => ZS.reduce((s, z, i) => s + WS[i] * f(z), 0);

/** Predicted slope of u = Wᵀφ(Wx) on x, and the variance of the rest, for x ~ N(0, 1) coordinates and W entries N(0, 1/n). */
export function predicted(phi: Phi) {
  const [f, df] = PHI[phi];
  return { slope: E(df), rest: E((z) => f(z) ** 2) };
}

export function sampleProgram(phi: Phi, n: number, seed: number) {
  const r = rand(seed);
  const normal = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const x = Array.from({ length: n }, normal);
  const W = Array.from({ length: n }, () => Float64Array.from({ length: n }, () => normal() / Math.sqrt(n)));
  const [f] = PHI[phi];
  const v = W.map((row) => f(row.reduce((s, w, j) => s + w * x[j], 0)));
  const u = new Float64Array(n);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) u[j] += W[i][j] * v[i];
  let sxu = 0, sxx = 0;
  for (let j = 0; j < n; j++) { sxu += x[j] * u[j]; sxx += x[j] * x[j]; }
  const slope = sxu / sxx;
  let rest = 0;
  for (let j = 0; j < n; j++) rest += (u[j] - slope * x[j]) ** 2;
  return { x, u: Array.from(u), slope, rest: rest / n };
}

export function TransposeCorrectionViz() {
  const [phi, setPhi] = useState<Phi>("tanh");
  const [n, setN] = useState(300);
  const [seed, setSeed] = useState(1);
  const s = useMemo(() => sampleProgram(phi, n, seed), [phi, n, seed]);
  const pred = predicted(phi);
  const W = 330, H = 190, CX = 165, CY = 92, SC = 26;
  const px = (v: number) => CX + Math.max(-3.2, Math.min(3.2, v)) * SC * 1.6;
  const py = (v: number) => CY - Math.max(-3.2, Math.min(3.2, v)) * SC;
  const shown = Math.min(n, 600);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Nonlinearity">
          {(["linear", "relu", "tanh"] as Phi[]).map((p) => (
            <button key={p} className="seg" aria-pressed={phi === p} onClick={() => setPhi(p)}>{p === "relu" ? "ReLU" : p}</button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Width">
          {[50, 300, 1000].map((m) => (
            <button key={m} className="seg" aria-pressed={n === m} onClick={() => setN(m)}>n = {m}</button>
          ))}
        </div>
        <button className="btn" onClick={() => setSeed((k) => k + 1)}>Resample</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Scatter of the coordinates of x against those of W transpose phi of W x">
        <line x1={0} x2={W} y1={CY} y2={CY} stroke="var(--border)" />
        <line x1={CX} x2={CX} y1={0} y2={H - 14} stroke="var(--border)" />
        {s.x.slice(0, shown).map((xv, j) => <circle key={j} cx={px(xv)} cy={py(s.u[j])} r={1.6} fill="var(--code-function)" opacity={0.5} />)}
        <line x1={px(-3.2)} y1={py(-3.2 * pred.slope)} x2={px(3.2)} y2={py(3.2 * pred.slope)} stroke="var(--accent)" strokeWidth={2} />
        <line x1={px(-3.2)} y1={py(0)} x2={px(3.2)} y2={py(0)} stroke="var(--text-muted)" strokeWidth={1.5} strokeDasharray="5 4" />
        <text x={4} y={H - 2} className="viz-label">solid: transpose rule; dashed: Wᵀ as a fresh matrix</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        width {n}: fitted slope {s.slope.toFixed(3)} (limit {pred.slope.toFixed(3)}), variance about the line {s.rest.toFixed(3)} (limit {pred.rest.toFixed(3)})
      </div>
      <figcaption className="viz-caption">
        A three-line tensor program: draw x with standard normal coordinates and W with N(0, 1/n) entries, form v = φ(Wx), then
        u = Wᵀv, reusing the same matrix transposed, as backpropagation does. Each dot is one coordinate (x_j, u_j). If Wᵀ
        behaved like a fresh independent matrix, u would be Gaussian noise unrelated to x. Instead u = c·x + noise with
        c = E[φ′(Z)], the correction term of the transpose rule, and the fitted values settle on the predicted ones as n grows.
      </figcaption>
    </figure>
  );
}
