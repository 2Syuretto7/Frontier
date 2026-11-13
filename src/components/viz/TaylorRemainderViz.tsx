"use client";

import { useState } from "react";

type Fn = "sin" | "log" | "flat";

const FNS: Record<Fn, { label: string; f: (x: number) => number; coef: (k: number) => number; lo: number; hi: number; note: string }> = {
  sin: {
    label: "sin x", f: Math.sin, lo: -7, hi: 7,
    coef: (k) => { let fact = 1; for (let i = 2; i <= k; i++) fact *= i; return [0, 1, 0, -1][k % 4] / fact; },
    note: "every derivative is bounded by 1, so the Lagrange remainder is at most |x|^(n+1)/(n+1)!, which tends to 0 for every x",
  },
  log: {
    label: "ln(1 + x)", f: (x) => Math.log(1 + x), lo: -0.95, hi: 2.5,
    coef: (k) => (k === 0 ? 0 : (k % 2 === 1 ? 1 : -1) / k),
    note: "the polynomials improve for |x| < 1 and blow up for x > 1, although the function is perfectly smooth there",
  },
  flat: {
    label: "e^(−1/x²)", f: (x) => (x === 0 ? 0 : Math.exp(-1 / (x * x))), lo: -2.5, hi: 2.5,
    coef: () => 0,
    note: "every derivative at 0 is 0, so every Taylor polynomial is the zero function, and the remainder is the whole function",
  },
};

/** Taylor polynomials at 0 of increasing degree against the function, for a function whose series converges everywhere, one whose series has radius 1, and one whose series misses the function entirely. */
export function TaylorRemainderViz() {
  const [fn, setFn] = useState<Fn>("sin");
  const [n, setN] = useState(5);
  const { f, coef, lo, hi, note } = FNS[fn];
  const P = (x: number) => { let s = 0, p = 1; for (let k = 0; k <= n; k++) { s += coef(k) * p; p *= x; } return s; };
  const W = 330, H = 170, ylo = -2.5, yhi = 2.5;
  const X = (x: number) => 12 + ((x - lo) / (hi - lo)) * (W - 24);
  const Y = (y: number) => 8 + ((yhi - Math.max(-40, Math.min(40, y))) / (yhi - ylo)) * (H - 16);
  const xs = Array.from({ length: 501 }, (_, i) => lo + ((hi - lo) * i) / 500);
  const line = (g: (x: number) => number) => xs.map((x) => `${X(x).toFixed(1)},${Y(g(x)).toFixed(1)}`).join(" ");
  const x0 = fn === "log" ? 0.5 : fn === "sin" ? 3 : 1;
  const err = Math.abs(f(x0) - P(x0));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {(Object.keys(FNS) as Fn[]).map((k) => (
          <button key={k} type="button" className="seg" aria-pressed={fn === k} onClick={() => setFn(k)}>{FNS[k].label}</button>
        ))}
      </div>
      <div className="viz-controls">
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          degree n = {n}
          <input type="range" min={0} max={15} value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="degree of the Taylor polynomial" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="The function and its Taylor polynomial of the chosen degree">
        <line x1={12} x2={W - 12} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <line x1={X(0)} x2={X(0)} y1={8} y2={H - 8} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--text)" strokeWidth={2} points={line(f)} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.6} strokeDasharray="5 3" points={line(P)} />
        <circle cx={X(x0)} cy={Y(f(x0))} r={3.5} fill="var(--danger)" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        |f(x) − Pₙ(x)| at x = {x0}: {err < 1e-4 ? err.toExponential(2) : err.toFixed(4)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The solid curve is the function and the dashed curve its Taylor polynomial of degree n at 0; the marked point is
        where the error is reported. For this function {note}.
      </figcaption>
    </figure>
  );
}
