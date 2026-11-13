"use client";

import { useMemo, useState } from "react";

const XS_SEP = [-2, -1.2, -0.5, 0.4, 1, 2.2];
const YS_SEP = [0, 0, 0, 1, 1, 1];
const YS_OVL = [0, 0, 1, 0, 1, 1];
const CHECK = [1, 3, 10, 30, 100, 300, 1000, 3000, 10000];
const sig = (z: number) => 1 / (1 + Math.exp(-z));

/** Logistic regression by gradient descent: on separable data the weights grow without bound and the fitted curve becomes a step; overlap or an L2 penalty keeps them finite. */
export function LogitDivergeViz() {
  const [overlap, setOverlap] = useState(false);
  const [reg, setReg] = useState(false);
  const [j, setJ] = useState(4);
  const ys = overlap ? YS_OVL : YS_SEP;
  const lam = reg ? 0.05 : 0;
  const traj = useMemo(() => {
    let a = 0, b = 0;
    const out: number[][] = [];
    let k = 0;
    for (let s = 1; s <= CHECK[CHECK.length - 1]; s++) {
      let ga = 0, gb = 0;
      XS_SEP.forEach((x, i) => { const e = sig(a + b * x) - ys[i]; ga += e; gb += e * x; });
      a -= 1.0 * (ga / XS_SEP.length + lam * a);
      b -= 1.0 * (gb / XS_SEP.length + lam * b);
      if (s === CHECK[k]) { out.push([a, b]); k++; }
    }
    return out;
  }, [ys, lam]);
  const [a, b] = traj[j];
  const W = 330, H = 140;
  const X = (x: number) => 14 + ((x + 3) / 6) * (W - 28);
  const Y = (p: number) => H - 16 - p * (H - 30);
  const grid = Array.from({ length: 241 }, (_, i) => -3 + (6 * i) / 240);
  const H2 = 90;
  const norms = traj.map(([u, v]) => Math.hypot(u, v));
  const nmax = Math.max(...norms, 1) * 1.1;
  const NX = (i: number) => 20 + (i / (CHECK.length - 1)) * (W - 40);
  const NY = (v: number) => H2 - 14 - (v / nmax) * (H2 - 24);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <button type="button" className="seg" aria-pressed={!overlap} onClick={() => setOverlap(false)}>separable</button>
        <button type="button" className="seg" aria-pressed={overlap} onClick={() => setOverlap(true)}>overlapping</button>
        <button type="button" className="seg" aria-pressed={reg} onClick={() => setReg(!reg)}>L2 penalty 0.05</button>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          steps = {CHECK[j]}
          <input type="range" min={0} max={CHECK.length - 1} value={j} onChange={(e) => setJ(Number(e.target.value))} aria-label="number of gradient steps" style={{ width: 120 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Data and the fitted logistic curve">
        <line x1={14} x2={W - 14} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <line x1={14} x2={W - 14} y1={Y(1)} y2={Y(1)} stroke="var(--border)" strokeDasharray="2 3" />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={grid.map((x) => `${X(x).toFixed(1)},${Y(sig(a + b * x)).toFixed(1)}`).join(" ")} />
        {XS_SEP.map((x, i) => <circle key={i} cx={X(x)} cy={Y(ys[i])} r={4} fill={ys[i] ? "var(--accent)" : "var(--danger)"} />)}
      </svg>
      <svg viewBox={`0 0 ${W} ${H2}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Norm of the weights against the number of steps on a log scale">
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.5} points={norms.map((v, i) => `${NX(i).toFixed(1)},${NY(v).toFixed(1)}`).join(" ")} />
        <circle cx={NX(j)} cy={NY(norms[j])} r={4} fill="var(--accent)" />
        <text x={20} y={H2 - 2} className="viz-label">1 step</text>
        <text x={W - 20} y={H2 - 2} textAnchor="end" className="viz-label">10000 steps (log scale)</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        intercept {a.toFixed(2)}, slope {b.toFixed(2)}, ‖w‖ = {norms[j].toFixed(2)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Six labelled points and logistic regression fitted by gradient descent with step size 1. When a threshold separates
        the classes, every increase in the slope lowers the log loss, so the weights keep growing, roughly like the log of
        the number of steps, and the curve sharpens towards a step: the maximum-likelihood estimate does not exist. Swap two
        labels so the classes overlap, or add an L2 penalty, and the weights settle at a finite value.
      </figcaption>
    </figure>
  );
}
