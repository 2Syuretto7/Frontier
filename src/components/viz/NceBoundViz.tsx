"use client";

import { useEffect, useState } from "react";
import { makeNormal, makeRng } from "./ml";

const NS = [4, 16, 64, 256];
const MIS = Array.from({ length: 13 }, (_, i) => 0.05 + (i * 3.95) / 12);
const MMAX = 4;

/** InfoNCE estimate log N - loss for correlated Gaussians, using the optimal critic log p(y|x) - log p(y). */
export function nceEstimate(mi: number, N: number, batches: number, seed: number) {
  const rho = Math.sqrt(1 - Math.exp(-2 * mi)), s2 = 1 - rho * rho, z = makeNormal(makeRng(seed));
  let total = 0;
  for (let b = 0; b < batches; b++) {
    const x = Array.from({ length: N }, z), y = x.map((v) => rho * v + Math.sqrt(s2) * z());
    let acc = 0;
    for (let i = 0; i < N; i++) {
      const f = y.map((yj) => -((yj - rho * x[i]) ** 2) / (2 * s2) + (yj * yj) / 2);
      const m = Math.max(...f), lse = m + Math.log(f.reduce((a, v) => a + Math.exp(v - m), 0));
      acc += f[i] - lse;
    }
    total += Math.log(N) + acc / N;
  }
  return total / batches;
}

export function NceBoundViz() {
  const [N, setN] = useState(16);
  const [est, setEst] = useState<number[] | null>(null);
  useEffect(() => setEst(MIS.map((m, i) => nceEstimate(m, N, N >= 64 ? 6 : 20, 31 + i))), [N]);
  const W = 300, H = 200, X0 = 28, PW = W - 36, PH = 172;
  const sx = (v: number) => X0 + (v / MMAX) * PW, sy = (v: number) => 8 + (1 - v / MMAX) * PH;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {NS.map((n) => (
          <button key={n} type="button" className="seg" aria-pressed={n === N} onClick={() => setN(n)}>batch N = {n}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 14}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="InfoNCE estimate of mutual information against the true value">
        <line x1={X0} y1={sy(0)} x2={X0 + PW} y2={sy(0)} stroke="var(--border)" />
        <line x1={X0} y1={sy(0)} x2={X0} y2={sy(MMAX)} stroke="var(--border)" />
        <line x1={sx(0)} y1={sy(0)} x2={sx(MMAX)} y2={sy(MMAX)} stroke="var(--text-muted)" strokeDasharray="4 3" />
        {Math.log(N) < MMAX && <line x1={X0} y1={sy(Math.log(N))} x2={X0 + PW} y2={sy(Math.log(N))} stroke="var(--danger)" strokeDasharray="2 3" />}
        {est && <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={MIS.map((m, i) => `${sx(m)},${sy(est[i])}`).join(" ")} />}
        {est && MIS.map((m, i) => <circle key={i} cx={sx(m)} cy={sy(est[i])} r={2.5} fill="var(--accent)" />)}
        {[0, 1, 2, 3, 4].map((v) => (
          <g key={v}>
            <text x={sx(v)} y={H + 12} textAnchor="middle" className="viz-label">{v}</text>
            <text x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {est ? `log N = ${Math.log(N).toFixed(2)} nats; at true MI ${MIS[12].toFixed(1)} the estimate is ${est[12].toFixed(2)}` : "simulating"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Pairs (x, y) of correlated Gaussians whose mutual information (horizontal axis, nats) is known exactly. The colour
        curve is log N minus the InfoNCE loss with the best possible critic. It always lies below the true value (dashed
        diagonal) and can never exceed log N (red): to certify more information you need more negatives, exponentially many.
      </figcaption>
    </figure>
  );
}
