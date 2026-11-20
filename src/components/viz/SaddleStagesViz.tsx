"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";
import { symEigs } from "./IsometryViz";

const DIM = 6;
const TARGET = [3, 2, 1, 0.5, 0, 0];
const LR = 0.02, STEPS = 2000, EVERY = 10;
const COLORS = ["var(--code-string)", "var(--code-function)", "var(--text-muted)", "var(--accent)"];

/** Gradient descent on ½‖W₂W₁ − S‖² from small random weights; records singular values of W₂W₁ and the loss. */
export function trainLinear(scale: number, seed: number) {
  const r = rand(seed);
  const normal = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  let W1 = Array.from({ length: DIM }, () => Array.from({ length: DIM }, () => (normal() * scale) / Math.sqrt(DIM)));
  let W2 = Array.from({ length: DIM }, () => Array.from({ length: DIM }, () => (normal() * scale) / Math.sqrt(DIM)));
  const mul = (A: number[][], B: number[][]) => A.map((row) => B[0].map((_, j) => row.reduce((s, a, k) => s + a * B[k][j], 0)));
  const tr = (A: number[][]) => A[0].map((_, j) => A.map((row) => row[j]));
  const svals: number[][] = [], losses: number[] = [];
  for (let t = 0; t <= STEPS; t++) {
    const P = mul(W2, W1);
    const R = P.map((row, i) => row.map((p, j) => p - (i === j ? TARGET[i] : 0)));
    if (t % EVERY === 0) {
      svals.push(symEigs(mul(tr(P), P)).map((l) => Math.sqrt(Math.max(0, l))).sort((a, b) => b - a));
      losses.push(0.5 * R.reduce((s, row) => s + row.reduce((u, x) => u + x * x, 0), 0));
    }
    const g2 = mul(R, tr(W1)), g1 = mul(tr(W2), R);
    W2 = W2.map((row, i) => row.map((w, j) => w - LR * g2[i][j]));
    W1 = W1.map((row, i) => row.map((w, j) => w - LR * g1[i][j]));
  }
  return { svals, losses };
}

export function SaddleStagesViz() {
  const [scale, setScale] = useState(1e-3);
  const [seed, setSeed] = useState(1);
  const { svals, losses } = useMemo(() => trainLinear(scale, seed), [scale, seed]);
  const W = 330, H = 200, X0 = 34, PW = 286, TOP = 8, PH1 = 100, Y2 = 186, PH2 = 56;
  const T = losses.length - 1;
  const px = (k: number) => X0 + (k / T) * PW;
  const py1 = (v: number) => TOP + PH1 - (v / 3.3) * PH1;
  const lmin = -6, lmax = 1;
  const py2 = (L: number) => Y2 - ((Math.max(lmin, Math.min(lmax, Math.log10(Math.max(L, 1e-12)))) - lmin) / (lmax - lmin)) * PH2;
  const halfTimes = TARGET.slice(0, 4).map((s, a) => {
    const k = svals.findIndex((sv) => sv[a] >= s / 2);
    return k < 0 ? null : (k * EVERY * LR).toFixed(1);
  });
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Initial scale">
          {[0.3, 1e-3, 1e-6].map((v) => (
            <button key={v} className="seg" aria-pressed={scale === v} onClick={() => setScale(v)}>init {v === 0.3 ? "0.3" : v === 1e-3 ? "10⁻³" : "10⁻⁶"}</button>
          ))}
        </div>
        <button className="btn" onClick={() => setSeed((s) => s + 1)}>Resample</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Singular values of a deep linear network and its loss during training">
        {TARGET.slice(0, 4).map((s, a) => (
          <g key={a}>
            <line x1={X0} x2={X0 + PW} y1={py1(s)} y2={py1(s)} stroke={COLORS[a]} strokeDasharray="3 4" opacity={0.6} />
            <path d={svals.map((sv, k) => `${k ? "L" : "M"}${px(k).toFixed(1)},${py1(sv[a]).toFixed(1)}`).join(" ")} fill="none" stroke={COLORS[a]} strokeWidth={2} />
            <text x={X0 - 4} y={py1(s) + 4} textAnchor="end" className="viz-label">{s}</text>
          </g>
        ))}
        <line x1={X0} x2={X0 + PW} y1={TOP + PH1} y2={TOP + PH1} stroke="var(--border)" />
        <line x1={X0} x2={X0 + PW} y1={Y2} y2={Y2} stroke="var(--border)" />
        <path d={losses.map((L, k) => `${k ? "L" : "M"}${px(k).toFixed(1)},${py2(L).toFixed(1)}`).join(" ")} fill="none" stroke="var(--text)" strokeWidth={1.8} />
        <text x={X0 - 4} y={Y2 - PH2 + 8} textAnchor="end" className="viz-label">10</text>
        <text x={X0 - 4} y={Y2} textAnchor="end" className="viz-label">10⁻⁶</text>
        <text x={X0 + PW} y={Y2 - PH2 - 2} textAnchor="end" className="viz-label">loss (log scale), time 0 to {(STEPS * LR).toFixed(0)}</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        time to half-learn modes 3, 2, 1, 0.5: {halfTimes.map((h) => h ?? "not yet").join(", ")}
      </div>
      <figcaption className="viz-caption">
        A two-layer linear network W₂W₁ trained by gradient descent to fit a matrix with singular values 3, 2, 1 and 0.5,
        starting from random weights of the chosen scale. Top: the singular values of W₂W₁ against their targets (dashed).
        Bottom: the loss. From the larger initialisation the modes are learned smoothly, without plateaus. From small
        initialisation the network sits near a saddle, then learns one mode in a sudden drop, plateaus at the next saddle,
        and so on in order of strength. Shrinking the initialisation lengthens every wait, and the weakest modes most.
      </figcaption>
    </figure>
  );
}
