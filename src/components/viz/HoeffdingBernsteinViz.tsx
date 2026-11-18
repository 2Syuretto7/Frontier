"use client";

import { useState } from "react";

const N = 200;

function logChoose(n: number, k: number) {
  let s = 0;
  for (let i = 1; i <= k; i++) s += Math.log(n - k + i) - Math.log(i);
  return s;
}

/** Exact P(mean − p ≥ t) for N Bernoulli(p) trials, with the Hoeffding and Bernstein bounds. */
export function curves(p: number, t: number) {
  const k0 = Math.ceil(N * (p + t) - 1e-9);
  let exact = 0;
  for (let k = Math.max(k0, 0); k <= N; k++) exact += Math.exp(logChoose(N, k) + k * Math.log(p) + (N - k) * Math.log(1 - p));
  const hoeff = Math.exp(-2 * N * t * t);
  const bern = Math.exp((-N * t * t) / (2 * (p * (1 - p) + ((1 - p) * t) / 3)));
  return { exact: Math.min(exact, 1), hoeff, bern };
}

const SERIES = [
  { key: "exact", name: "exact", color: "var(--text)", dash: undefined },
  { key: "hoeff", name: "Hoeffding", color: "var(--danger)", dash: "4 3" },
  { key: "bern", name: "Bernstein", color: "var(--accent)", dash: "4 3" },
] as const;

export function HoeffdingBernsteinViz() {
  const [p, setP] = useState(0.05);
  const W = 330, H = 200, X0 = 44, Y0 = 8, PW = W - X0 - 10, PH = H - Y0 - 34;
  const TMAX = 0.25, LO = -12;
  const sx = (t: number) => X0 + (t / TMAX) * PW;
  const sy = (v: number) => Y0 + PH - ((Math.log10(Math.max(v, 1e-12)) - LO) / -LO) * PH;
  const ts = Array.from({ length: 101 }, (_, i) => 0.0025 + (i * (TMAX - 0.0025)) / 100);
  const rows = ts.map((t) => curves(p, t));
  const at = curves(p, 0.1);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="viz-label" htmlFor="hb-p">p = {p.toFixed(2)}</label>
        <input id="hb-p" type="range" min={0.01} max={0.5} step={0.01} value={p} onChange={(e) => setP(Number(e.target.value))} style={{ flex: 1, minWidth: 120 }} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Tail of a binomial mean against two bounds">
        {[0, -4, -8, -12].map((e) => (
          <g key={e}>
            <line x1={X0} x2={W - 10} y1={sy(10 ** e)} y2={sy(10 ** e)} stroke="var(--border)" />
            <text x={X0 - 4} y={sy(10 ** e) + 4} textAnchor="end" className="viz-label" style={{ fontSize: 9 }}>{e === 0 ? "1" : `1e${e}`}</text>
          </g>
        ))}
        {[0, 0.1, 0.2].map((x) => (
          <text key={x} x={sx(x)} y={Y0 + PH + 14} textAnchor="middle" className="viz-label">{x}</text>
        ))}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">deviation t of the mean above p</text>
        {SERIES.map((s) => (
          <path key={s.key} d={rows.map((r, i) => `${i ? "L" : "M"}${sx(ts[i]).toFixed(1)},${sy(r[s.key]).toFixed(1)}`).join("")}
            fill="none" stroke={s.color} strokeWidth={2} strokeDasharray={s.dash} />
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`at t = 0.1: exact ${at.exact.toExponential(1)}, Bernstein ${at.bern.toExponential(1)}, Hoeffding ${at.hoeff.toExponential(1)}`}
      </div>
      <figcaption className="viz-caption">
        The probability that the mean of 200 coin flips with success probability p exceeds p by t, with the two bounds of
        this lesson. Hoeffding uses only the range [0, 1], so its bound is the same for every p. Bernstein also uses the
        variance p(1 − p): for p = 0.5 the two are close, but for rare events, with p near 0.05, Bernstein is smaller by
        many orders of magnitude and follows the exact tail much more closely.
      </figcaption>
    </figure>
  );
}
