"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const T = 0.3, EPS = 0.1, TRIALS = 2000, BINS = 20;

/** Learn the threshold 1[x >= T] from n uniform samples by taking the smallest positive; returns the error of each trial. */
export function trials(n: number, seed: number) {
  const r = rand(seed);
  return Array.from({ length: TRIALS }, () => {
    let best = 1;
    for (let i = 0; i < n; i++) { const x = r(); if (x >= T && x < best) best = x; }
    return best - T;
  });
}

const NS = [5, 20, 50];

export function PacThresholdViz() {
  const [ni, setNi] = useState(1);
  const n = NS[ni];
  const errs = useMemo(() => trials(n, 7), [n]);
  const hist = useMemo(() => { const h = new Array(BINS).fill(0); errs.forEach((e) => { h[Math.min(BINS - 1, Math.floor((e / 0.5) * BINS))]++; }); return h; }, [errs]);
  const bad = errs.filter((e) => e > EPS).length / TRIALS;
  const W = 320, H = 170, X0 = 30, PW = 280, Y0 = 8, PH = 128;
  const top = Math.max(...hist);
  const sx = (e: number) => X0 + (e / 0.5) * PW;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">samples m</span>
        <div className="segmented" role="group" aria-label="Number of samples">
          {NS.map((m, i) => <button key={m} type="button" className="seg" aria-pressed={ni === i} onClick={() => setNi(i)}>{m}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }} role="img" aria-label="Histogram of the learned threshold's error over many runs">
        {hist.map((c, i) => {
          const h = (c / top) * PH, e0 = (i * 0.5) / BINS;
          return <rect key={i} x={sx(e0) + 1} y={Y0 + PH - h} width={PW / BINS - 2} height={h} fill={e0 >= EPS ? "var(--code-function)" : "var(--accent)"} fillOpacity={0.7} />;
        })}
        <line x1={sx(EPS)} x2={sx(EPS)} y1={Y0} y2={Y0 + PH} stroke="var(--text)" strokeDasharray="4 3" />
        <text x={sx(EPS) + 4} y={Y0 + 12} className="viz-label">ε = {EPS}</text>
        {[0, 0.1, 0.2, 0.3, 0.4, 0.5].map((t) => <text key={t} x={sx(t)} y={H - 16} textAnchor="middle" className="viz-label">{t}</text>)}
        <text x={X0 + PW / 2} y={H - 2} textAnchor="middle" className="viz-label">error of the learned threshold</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        m = {n}: runs with error &gt; ε {bad.toFixed(3)}; (1 − ε)^m = {((1 - EPS) ** n).toFixed(3)}; e^(−εm) = {Math.exp(-EPS * n).toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        The target labels x ≥ 0.3 positive under the uniform distribution, and the learner returns the smallest positive
        example it has seen, so its error is the gap between that example and 0.3. Over 2000 runs the fraction with error above
        ε matches (1 − ε)^m, and the exponential bound e^(−εm) sits just above it: at m = 50 both are below 0.01, so fifty
        examples make an error above 0.1 a rare event.
      </figcaption>
    </figure>
  );
}
