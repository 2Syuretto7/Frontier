"use client";

import { useState } from "react";

type Fn = "sin" | "xsin";

/** sin(1/x) and x sin(1/x) near 0, sampled along two sequences tending to 0: different limits along them mean no limit at 0. */
export function SeqCriterionViz() {
  const [fn, setFn] = useState<Fn>("sin");
  const [n, setN] = useState(4);
  const f = (x: number) => (fn === "sin" ? Math.sin(1 / x) : x * Math.sin(1 / x));
  const s1 = (k: number) => 1 / (k * Math.PI);
  const s2 = (k: number) => 1 / (2 * k * Math.PI + Math.PI / 2);
  const W = 330, H = 170, lo = -0.4, hi = 0.4, ymax = fn === "sin" ? 1.2 : 0.45;
  const X = (x: number) => 12 + ((x - lo) / (hi - lo)) * (W - 24);
  const Y = (y: number) => H / 2 - (y / ymax) * (H / 2 - 12);
  const pts: string[] = [];
  for (let i = 0; i <= 1600; i++) {
    const x = 0.004 + (0.396 * i) / 1600;
    pts.push(`${X(x).toFixed(1)},${Y(f(x)).toFixed(1)}`);
  }
  const neg = pts.map((p) => { const [a, b] = p.split(",").map(Number); return `${(2 * X(0) - a).toFixed(1)},${(fn === "sin" ? 2 * Y(0) - b : b).toFixed(1)}`; });
  const ks = Array.from({ length: n }, (_, i) => i + 1);
  const last1 = Math.abs(f(s1(n))) < 1e-9 ? 0 : f(s1(n));
  const last2 = f(s2(n));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <button type="button" className="seg" aria-pressed={fn === "sin"} onClick={() => setFn("sin")}>sin(1/x)</button>
        <button type="button" className="seg" aria-pressed={fn === "xsin"} onClick={() => setFn("xsin")}>x sin(1/x)</button>
      </div>
      <div className="viz-controls">
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          terms n = 1 to {n}
          <input type="range" min={1} max={12} value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="number of sequence terms" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Graph of the function near zero with two sequences of sample points">
        <line x1={12} x2={W - 12} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <line x1={X(0)} x2={X(0)} y1={8} y2={H - 8} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--text-muted)" strokeWidth={0.8} points={pts.join(" ")} />
        <polyline fill="none" stroke="var(--text-muted)" strokeWidth={0.8} points={neg.join(" ")} />
        {ks.map((k) => <circle key={"a" + k} cx={X(s1(k))} cy={Y(Math.abs(f(s1(k))) < 1e-9 ? 0 : f(s1(k)))} r={3.2} fill="var(--accent)" />)}
        {ks.map((k) => <circle key={"b" + k} cx={X(s2(k))} cy={Y(f(s2(k)))} r={3.2} fill="var(--danger)" />)}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        f(1/(nπ)) = {last1.toFixed(4)}, f(1/(2nπ + π/2)) = {last2.toFixed(4)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Both sequences of points tend to 0 from the right. For sin(1/x) the function is 0 along the first (accent dots) and 1
        along the second (contrasting dots) however far out you go, so no single L can be the limit at 0. Multiplying by x
        squeezes the oscillation between −|x| and |x|, and both sequences of values now tend to 0, as the limit 0 requires.
      </figcaption>
    </figure>
  );
}
