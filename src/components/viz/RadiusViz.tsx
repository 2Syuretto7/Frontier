"use client";

import { useState } from "react";

type Fn = "geo" | "lor" | "exp";

const FNS: Record<Fn, { label: string; f: (x: number) => number; c: (k: number) => number; R: number; note: string }> = {
  geo: { label: "1/(1 − x)", f: (x) => 1 / (1 - x), c: () => 1, R: 1, note: "the function itself blows up at x = 1, which explains the radius" },
  lor: { label: "1/(1 + x²)", f: (x) => 1 / (1 + x * x), c: (k) => (k % 2 === 1 ? 0 : k % 4 === 0 ? 1 : -1), R: 1, note: "the function is smooth on the whole line, yet the series still stops at radius 1; the obstruction is at the complex points ±i" },
  exp: { label: "eˣ", f: Math.exp, c: (k) => { let p = 1; for (let i = 2; i <= k; i++) p *= i; return 1 / p; }, R: Infinity, note: "the radius is infinite, and the partial sums improve everywhere, faster near 0" },
};

/** Partial sums of a power series against the function, with the interval of convergence shaded. */
export function RadiusViz() {
  const [fn, setFn] = useState<Fn>("lor");
  const [N, setN] = useState(8);
  const { f, c, R, note } = FNS[fn];
  const S = (x: number) => { let s = 0, p = 1; for (let k = 0; k <= N; k++) { s += c(k) * p; p *= x; } return s; };
  const lo = -1.6, hi = 1.6, ylo = -1, yhi = 4;
  const W = 330, H = 170;
  const X = (x: number) => 12 + ((x - lo) / (hi - lo)) * (W - 24);
  const Y = (y: number) => 8 + ((yhi - Math.max(-30, Math.min(30, y))) / (yhi - ylo)) * (H - 16);
  const xs = Array.from({ length: 641 }, (_, i) => lo + ((hi - lo) * i) / 640);
  const fx = xs.filter((x) => fn !== "geo" || x < 0.985);
  const r = Math.min(R, hi);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {(Object.keys(FNS) as Fn[]).map((k) => (
          <button key={k} type="button" className="seg" aria-pressed={fn === k} onClick={() => setFn(k)}>{FNS[k].label}</button>
        ))}
      </div>
      <div className="viz-controls">
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          terms up to degree {N}
          <input type="range" min={0} max={30} value={N} onChange={(e) => setN(Number(e.target.value))} aria-label="degree of the partial sum" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="The function, a partial sum of its power series, and the interval of convergence">
        <rect x={X(-r)} y={8} width={X(r) - X(-r)} height={H - 16} fill="var(--accent)" opacity={0.08} />
        <line x1={12} x2={W - 12} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <line x1={X(0)} x2={X(0)} y1={8} y2={H - 8} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--text)" strokeWidth={2} points={fx.map((x) => `${X(x).toFixed(1)},${Y(f(x)).toFixed(1)}`).join(" ")} />
        <polyline fill="none" stroke="var(--danger)" strokeWidth={1.4} strokeDasharray="5 3" points={xs.map((x) => `${X(x).toFixed(1)},${Y(S(x)).toFixed(1)}`).join(" ")} />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        radius of convergence R = {R === Infinity ? "∞" : R}; at x = 0.5 the error is {Math.abs(S(0.5) - f(0.5)).toExponential(2)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The solid curve is the function and the dashed curve the partial sum; the shaded strip is the interval (−R, R). Inside
        it the partial sums converge, uniformly on any smaller closed interval; outside they diverge. Here {note}.
      </figcaption>
    </figure>
  );
}
