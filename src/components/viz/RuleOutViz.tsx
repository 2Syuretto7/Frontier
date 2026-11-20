"use client";

import { useState } from "react";

const KS = [0, 1, 3];
const NS = Array.from({ length: 41 }, (_, i) => Math.round(Math.pow(10, 1 + (2 * i) / 40)));
const THRESH = 0.02;

function cdf(k: number, n: number, p: number) {
  let s = 0, term = Math.pow(1 - p, n);
  for (let i = 0; i <= k; i++) {
    s += term;
    term *= ((n - i) / (i + 1)) * (p / (1 - p));
  }
  return s;
}

/** One-sided 95% Clopper–Pearson upper bound on a success rate after k successes in n trials, by bisection. */
export function upper(k: number, n: number, alpha = 0.05) {
  let lo = k / n, hi = 1;
  for (let it = 0; it < 60; it++) {
    const mid = (lo + hi) / 2;
    if (cdf(k, n, mid) > alpha) lo = mid; else hi = mid;
  }
  return hi;
}

export function RuleOutViz() {
  const [k, setK] = useState(0);
  const [ni, setNi] = useState(20);
  const n = NS[ni];
  const W = 330, H = 180, X0 = 36, PW = 284, Y0 = 10, PH = 140, LMIN = -3, LMAX = 0;
  const px = (nn: number) => X0 + ((Math.log10(nn) - 1) / 2) * PW;
  const py = (u: number) => Y0 + PH - ((Math.log10(Math.max(u, 1e-3)) - LMIN) / (LMAX - LMIN)) * PH;
  const valid = NS.filter((nn) => nn > KS[k]);
  const path = valid.map((nn, i) => `${i ? "L" : "M"}${px(nn).toFixed(1)},${py(upper(KS[k], nn)).toFixed(1)}`).join(" ");
  const u = n > KS[k] ? upper(KS[k], n) : 1;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Successes observed">
          {KS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={k === i} onClick={() => setK(i)}>{v} {v === 1 ? "success" : "successes"}</button>)}
        </div>
        <label className="viz-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {n} trials
          <input type="range" min={0} max={NS.length - 1} value={ni} onChange={(e) => setNi(Number(e.target.value))} aria-label="Number of trials" />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Upper bound on the success rate against the number of trials">
        {[0.001, 0.01, 0.1, 1].map((y) => (
          <g key={y}>
            <line x1={X0} x2={X0 + PW} y1={py(y)} y2={py(y)} stroke="var(--border)" strokeDasharray="2 3" />
            <text x={X0 - 4} y={py(y) + 4} textAnchor="end" className="viz-label">{y * 100}%</text>
          </g>
        ))}
        <line x1={X0} x2={X0 + PW} y1={py(THRESH)} y2={py(THRESH)} stroke="var(--danger)" strokeWidth={1.5} />
        <text x={X0 + PW} y={py(THRESH) - 4} textAnchor="end" className="viz-label">threshold 2%</text>
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2} />
        {n > KS[k] && <circle cx={px(n)} cy={py(u)} r={4} style={{ fill: "var(--accent)" }} />}
        {[10, 100, 1000].map((nn) => <text key={nn} x={px(nn)} y={Y0 + PH + 13} textAnchor={nn === 10 ? "start" : nn === 1000 ? "end" : "middle"} className="viz-label">{nn.toLocaleString("en-IN")}</text>)}
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">trials (log scale)</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        95% upper bound on the true rate: {(100 * u).toFixed(2)}%; {u < THRESH ? "below" : "not below"} the 2% threshold
      </div>
      <figcaption className="viz-caption">
        A capability evaluation that sees few or no successes does not show the rate is zero, only that it is probably below an
        upper bound. With no successes the bound is about three divided by the number of trials. Ruling out a 2% rate needs about
        150 clean trials, and every observed success pushes the requirement up.
      </figcaption>
    </figure>
  );
}
