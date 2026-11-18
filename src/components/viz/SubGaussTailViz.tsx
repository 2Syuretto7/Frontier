"use client";

import { useState } from "react";

const phi = (x: number) => Math.exp((-x * x) / 2) / Math.sqrt(2 * Math.PI);

/** Upper tails P(X ≥ t) of three unit-variance laws, and the sub-Gaussian bound exp(−t²/2). */
export function tails(t: number) {
  const n = 600, h = 12 / n;
  let s = phi(t) + phi(t + 12);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * phi(t + i * h);
  const gauss = (s * h) / 3;
  const laplace = 0.5 * Math.exp(-Math.SQRT2 * t);
  // X = T/√3 with T ~ t₃, so P(X ≥ t) = P(T ≥ √3 t), and the t₃ CDF depends on T/√3 = t
  const student = 0.5 - (t / (1 + t * t) + Math.atan(t)) / Math.PI;
  return { gauss, laplace, student, bound: Math.exp((-t * t) / 2) };
}

const SERIES = [
  { key: "bound", name: "bound e^(−t²/2)", color: "var(--text-muted)", dash: "4 3" },
  { key: "gauss", name: "Gaussian", color: "var(--accent)", dash: undefined },
  { key: "laplace", name: "Laplace", color: "var(--success)", dash: undefined },
  { key: "student", name: "Student t, 3 d.f.", color: "var(--danger)", dash: undefined },
] as const;

export function SubGaussTailViz() {
  const [t, setT] = useState(3);
  const W = 330, H = 200, X0 = 44, Y0 = 8, PW = W - X0 - 10, PH = H - Y0 - 34;
  const LO = -10, TMAX = 6;
  const sx = (x: number) => X0 + (x / TMAX) * PW;
  const sy = (p: number) => Y0 + PH - ((Math.log10(Math.max(p, 1e-10)) - LO) / -LO) * PH;
  const xs = Array.from({ length: 121 }, (_, i) => (i * TMAX) / 120);
  const rows = xs.map(tails);
  const cur = tails(t);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="viz-label" htmlFor="sgt-t">t = {t.toFixed(1)} standard deviations</label>
        <input id="sgt-t" type="range" min={0.5} max={6} step={0.1} value={t} onChange={(e) => setT(Number(e.target.value))} style={{ flex: 1, minWidth: 120 }} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Tail probabilities on a log scale">
        {[0, -2, -4, -6, -8, -10].map((e) => (
          <g key={e}>
            <line x1={X0} x2={W - 10} y1={sy(10 ** e)} y2={sy(10 ** e)} stroke="var(--border)" />
            <text x={X0 - 4} y={sy(10 ** e) + 4} textAnchor="end" className="viz-label" style={{ fontSize: 9 }}>{e === 0 ? "1" : `1e${e}`}</text>
          </g>
        ))}
        {[0, 2, 4, 6].map((x) => (
          <text key={x} x={sx(x)} y={Y0 + PH + 14} textAnchor="middle" className="viz-label">{x}</text>
        ))}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">t</text>
        {SERIES.map((s) => (
          <path key={s.key} d={rows.map((r, i) => `${i ? "L" : "M"}${sx(xs[i]).toFixed(1)},${sy(r[s.key]).toFixed(1)}`).join("")}
            fill="none" stroke={s.color} strokeWidth={s.key === "bound" ? 1.5 : 2} strokeDasharray={s.dash} />
        ))}
        <line x1={sx(t)} x2={sx(t)} y1={Y0} y2={Y0 + PH} stroke="var(--text-muted)" strokeDasharray="2 3" />
      </svg>
      <div className="viz-label" style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", fontSize: 12 }}>
        {SERIES.map((s) => (
          <span key={s.key}><span style={{ display: "inline-block", width: 10, height: 3, background: s.color, marginRight: 4, verticalAlign: "middle" }} />{`${s.name}: ${cur[s.key].toExponential(1)}`}</span>
        ))}
      </div>
      <figcaption className="viz-caption">
        Upper tails P(X ≥ t) of three distributions with mean 0 and variance 1, on a logarithmic scale. The Gaussian tail
        stays below the sub-Gaussian bound e<sup>−t²/2</sup> and bends down like it. The Laplace tail is a straight line on
        this scale, decaying like e<sup>−√2 t</sup>: it crosses the bound near t = 3.2 and is far above it by t = 6, the
        mark of a sub-exponential variable. The Student t tail decays only like a power of t and is not even
        sub-exponential.
      </figcaption>
    </figure>
  );
}
