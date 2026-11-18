"use client";

import { useEffect, useState } from "react";
import { makeNormal, makeRng } from "./ml";

const V = 10;
const DIMS = [16, 64, 256];
const LENS = Array.from({ length: 15 }, (_, i) => 4 * (i + 1));
const TMAX = 60;

/**
 * Encode a random sequence of length T into one d-dimensional vector h = sum_t r(t, x_t), where r(t, w) are fixed random
 * unit-variance codes for "token w at position t". Decode each position by picking the w whose code best matches h.
 * Returns the fraction of tokens recovered for each length in LENS.
 */
export function recallCurve(d: number, trials = 24, seed = 3) {
  const z = makeNormal(makeRng(seed + d)), u = makeRng(seed * 7 + d);
  const codes = Array.from({ length: TMAX }, () => Array.from({ length: V }, () => Array.from({ length: d }, () => z() / Math.sqrt(d))));
  return LENS.map((T) => {
    let hit = 0;
    for (let r = 0; r < trials; r++) {
      const xs = Array.from({ length: T }, () => Math.floor(u() * V)), h = new Array(d).fill(0);
      xs.forEach((w, t) => codes[t][w].forEach((v, i) => (h[i] += v)));
      xs.forEach((w, t) => {
        let best = 0, bs = -Infinity;
        for (let c = 0; c < V; c++) {
          const s = codes[t][c].reduce((a, v, i) => a + v * h[i], 0);
          if (s > bs) { bs = s; best = c; }
        }
        if (best === w) hit++;
      });
    }
    return hit / (T * trials);
  });
}

export function BottleneckRecallViz() {
  const [di, setDi] = useState(1);
  const [curves, setCurves] = useState<number[][] | null>(null);
  useEffect(() => setCurves(DIMS.map((d) => recallCurve(d))), []);
  const W = 300, H = 200, X0 = 30, PW = W - 38, PH = 172;
  const sx = (T: number) => X0 + (T / TMAX) * PW, sy = (v: number) => 8 + (1 - v) * PH;
  const c = curves?.[di];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {DIMS.map((d, i) => (
          <button key={d} type="button" className="seg" aria-pressed={i === di} onClick={() => setDi(i)}>state size {d}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 14}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Fraction of tokens recovered from a fixed-size summary vector against sequence length">
        <line x1={X0} y1={sy(0)} x2={X0 + PW} y2={sy(0)} stroke="var(--border)" />
        <line x1={X0} y1={sy(0)} x2={X0} y2={sy(1)} stroke="var(--border)" />
        <line x1={X0} y1={sy(1 / V)} x2={X0 + PW} y2={sy(1 / V)} stroke="var(--text-muted)" strokeDasharray="4 3" />
        {curves?.map((cv, i) => i !== di && (
          <polyline key={i} fill="none" stroke="var(--text-muted)" strokeWidth={1} points={cv.map((v, j) => `${sx(LENS[j])},${sy(v)}`).join(" ")} />
        ))}
        {c && <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={c.map((v, j) => `${sx(LENS[j])},${sy(v)}`).join(" ")} />}
        {c && c.map((v, j) => <circle key={j} cx={sx(LENS[j])} cy={sy(v)} r={2.5} fill="var(--accent)" />)}
        {[0, 20, 40, 60].map((T) => (
          <text key={T} x={sx(T)} y={H + 12} textAnchor="middle" className="viz-label">{T}</text>
        ))}
        {[0, 0.5, 1].map((v) => (
          <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {c ? `recovered: ${(100 * c[1]).toFixed(0)}% at length 8, ${(100 * c[14]).toFixed(0)}% at length 60` : "simulating"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        A sequence of tokens from a 10-word vocabulary is squeezed into one vector of the chosen size by adding a random code
        for each (position, token) pair, and each position is then read back by finding the best-matching code. Short
        sequences come back almost perfectly; long ones blur into each other, and the dashed line is chance. A bigger state
        moves the cliff but does not remove it: a fixed vector holds a fixed amount.
      </figcaption>
    </figure>
  );
}
