"use client";

import { useMemo, useState } from "react";

const T = 200;

/** Distance to the optimum per coordinate for SGD and Adam on a quadratic whose two curvatures differ greatly. */
export function AdamScaleViz() {
  const [rExp, setRExp] = useState(4);
  const lam = [1, Number(`1e-${rExp}`)];
  const runs = useMemo(() => {
    const l = [1, Number(`1e-${rExp}`)];
    const sgd: number[][] = [[1, 1]], adam: number[][] = [[1, 1]];
    let x = [1, 1];
    for (let t = 0; t < T; t++) { x = x.map((v, i) => v - 1.9 * l[i] * v); sgd.push(x.map(Math.abs)); }
    let y = [1, 1], m = [0, 0], v = [0, 0], p1 = 1, p2 = 1;
    for (let t = 1; t <= T; t++) {
      p1 *= 0.9;
      p2 *= 0.999;
      const g = y.map((val, i) => l[i] * val);
      m = m.map((mi, i) => 0.9 * mi + 0.1 * g[i]);
      v = v.map((vi, i) => 0.999 * vi + 0.001 * g[i] * g[i]);
      y = y.map((val, i) => val - (0.02 * m[i] / (1 - p1)) / (Math.sqrt(v[i] / (1 - p2)) + 1e-12));
      adam.push(y.map(Math.abs));
    }
    return { sgd, adam };
  }, [rExp]);
  const W = 320, H = 170;
  const px = (t: number) => 34 + (t / T) * (W - 44);
  const py = (d: number) => 10 + (-Math.max(-8, Math.log10(Math.max(d, 1e-300))) / 8) * (H - 34);
  const line = (pts: number[][], i: number) => pts.map((p, t) => `${px(t).toFixed(1)},${py(p[i]).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          curvature ratio 10^{rExp}
          <input type="range" min={0} max={6} step={1} value={rExp} onChange={(e) => setRExp(Number(e.target.value))} aria-label="curvature ratio, power of ten" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Distance to optimum per coordinate, log scale">
        {[0, -4, -8].map((e) => (
          <g key={e}>
            <line x1={34} x2={W - 10} y1={py(10 ** e)} y2={py(10 ** e)} stroke="var(--border)" />
            <text x={30} y={py(10 ** e) + 4} textAnchor="end" className="viz-label">1e{e}</text>
          </g>
        ))}
        {[0, 100, 200].map((t) => <text key={t} x={px(t)} y={H - 8} textAnchor="middle" className="viz-label">{t}</text>)}
        <polyline fill="none" stroke="var(--text-muted)" strokeWidth={2} points={line(runs.sgd, 0)} />
        <polyline fill="none" stroke="var(--text-muted)" strokeWidth={2} strokeDasharray="4 3" points={line(runs.sgd, 1)} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={line(runs.adam, 0)} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} strokeDasharray="4 3" points={line(runs.adam, 1)} />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        after {T} steps, flat coordinate: SGD {runs.sgd[T][1].toExponential(1)}, Adam {runs.adam[T][1].toExponential(1)} (curvatures {lam[0]} and {lam[1]})
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Grey is gradient descent at the largest safe learning rate, 1.9/λ_max; blue is Adam with learning rate 0.02. Solid
        lines are the steep coordinate, dashed the flat one. Gradient descent's flat coordinate barely moves once the ratio is
        large. Adam divides each coordinate's step by its own gradient size, so both coordinates move at the same pace
        whatever the ratio.
      </figcaption>
    </figure>
  );
}
