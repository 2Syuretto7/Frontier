"use client";

import { useState } from "react";

/** Bayes in odds form: each observation with likelihood ratio LR adds log10(LR) to the log-odds. */
export function OddsUpdateViz() {
  const [lp, setLp] = useState(-2); // log10 prior odds
  const [llr, setLlr] = useState(0.3); // log10 likelihood ratio
  const [n, setN] = useState(3);
  const W = 320, H = 110, lo = -5, hi = 5;
  const X = (l: number) => 20 + ((Math.max(lo, Math.min(hi, l)) - lo) / (hi - lo)) * (W - 40);
  const prob = (l: number) => 1 / (1 + Math.pow(10, -l));
  const steps = Array.from({ length: n + 1 }, (_, k) => lp + k * llr);
  const post = steps[n];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          prior P = {prob(lp).toPrecision(2)}
          <input type="range" min={-40} max={0} value={Math.round(lp * 10)} onChange={(e) => setLp(Number(e.target.value) / 10)} aria-label="prior log odds" style={{ width: 90 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          LR = {Math.pow(10, llr).toFixed(1)}
          <input type="range" min={0} max={20} value={Math.round(llr * 10)} onChange={(e) => setLlr(Number(e.target.value) / 10)} aria-label="log likelihood ratio" style={{ width: 90 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          observations {n}
          <input type="range" min={0} max={10} value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="number of observations" style={{ width: 90 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Log odds moving with each observation">
        <line x1={X(lo)} x2={X(hi)} y1={60} y2={60} stroke="var(--border)" strokeWidth={2} />
        {[-4, -2, 0, 2, 4].map((l) => (
          <g key={l}>
            <line x1={X(l)} x2={X(l)} y1={55} y2={65} stroke="var(--border)" />
            <text x={X(l)} y={82} textAnchor="middle" className="viz-label">{l === 0 ? "1:1" : l > 0 ? `10^${l}:1` : `1:10^${-l}`}</text>
          </g>
        ))}
        {steps.slice(1).map((l, k) => (
          <line key={k} x1={X(steps[k])} x2={X(l)} y1={44 - (k % 2) * 6} y2={44 - (k % 2) * 6} stroke="var(--accent)" strokeWidth={2} />
        ))}
        <circle cx={X(lp)} cy={60} r={5} fill="var(--text-muted)" />
        <circle cx={X(post)} cy={60} r={5} fill="var(--danger)" />
        <text x={X(post)} y={100} textAnchor="middle" className="viz-label" style={{ fill: "var(--danger)" }}>posterior</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        posterior odds = LR^{n} × prior odds; P(H | data) = {prob(post).toPrecision(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        On the log-odds scale Bayes&apos; rule is addition: every independent observation with likelihood ratio LR moves the
        grey point right by the same step, log LR. A rare hypothesis (prior far left) needs several strong observations before
        it is more likely than not, which is the base-rate effect seen as distance.
      </figcaption>
    </figure>
  );
}
