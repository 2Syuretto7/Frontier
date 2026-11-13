"use client";

import { useState } from "react";

const NIN = 3, NH = 8;
const X = [1.0, -0.5, 2.0];
const W1 = [
  [0.6, -0.4, 0.3, 0.8, -0.2, 0.5, 0.1, -0.7],
  [0.2, 0.9, -0.5, 0.1, 0.7, -0.3, 0.6, 0.4],
  [-0.3, 0.2, 0.4, 0.5, 0.3, 0.2, -0.6, 0.5],
];
const W2 = [0.5, -0.6, 0.8, 0.4, -0.3, 0.7, 0.2, 0.6];
const H = Array.from({ length: NH }, (_, j) => Math.max(0, X.reduce((s, x, i) => s + x * W1[i][j], 0)));
const FULL = H.reduce((s, h, j) => s + h * W2[j], 0);

/** One dropout mask at a time on a small network, with the running average of the sampled outputs. */
export function DropoutMaskViz() {
  const [p, setP] = useState(0.5);
  const [mask, setMask] = useState<boolean[]>(() => Array(NH).fill(true));
  const [outs, setOuts] = useState<number[]>([]);
  const sample = (k: number) => {
    let m = mask;
    const fresh: number[] = [];
    for (let s = 0; s < k; s++) {
      m = Array.from({ length: NH }, () => Math.random() >= p);
      fresh.push(H.reduce((acc, h, j) => acc + (m[j] ? h / (1 - p) : 0) * W2[j], 0));
    }
    setMask(m);
    setOuts((o) => [...o, ...fresh].slice(-5000));
  };
  const last = outs.length ? outs[outs.length - 1] : null;
  const avg = outs.length ? outs.reduce((a, b) => a + b, 0) / outs.length : null;
  const W = 300, Ht = 190;
  const ix = 40, hx = 150, ox = 260;
  const iy = (i: number) => 50 + i * 45, hy = (j: number) => 15 + j * 22, oy = 95;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 10 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          p = {p.toFixed(1)}
          <input type="range" min={0.1} max={0.9} step={0.1} value={p} onChange={(e) => { setP(Number(e.target.value)); setOuts([]); }} aria-label="drop probability" style={{ width: 100 }} />
        </label>
        <button type="button" className="btn" onClick={() => sample(1)}>new mask</button>
        <button type="button" className="btn" onClick={() => sample(1000)}>1000 masks</button>
      </div>
      <svg viewBox={`0 0 ${W} ${Ht}`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }} role="img" aria-label="Network with dropped hidden units">
        {X.map((_, i) => H.map((__, j) => (
          <line key={`${i}-${j}`} x1={ix} y1={iy(i)} x2={hx} y2={hy(j)} stroke="var(--border)" strokeOpacity={mask[j] ? 1 : 0.25} />
        )))}
        {H.map((_, j) => <line key={j} x1={hx} y1={hy(j)} x2={ox} y2={oy} stroke={mask[j] ? "var(--accent)" : "var(--border)"} strokeOpacity={mask[j] ? 0.8 : 0.25} />)}
        {X.map((x, i) => (
          <g key={i}>
            <circle cx={ix} cy={iy(i)} r={11} fill="var(--bg)" stroke="var(--text-muted)" />
            <text x={ix} y={iy(i) + 4} textAnchor="middle" className="viz-label">{x}</text>
          </g>
        ))}
        {H.map((h, j) => (
          <g key={j}>
            <circle cx={hx} cy={hy(j)} r={9} fill={mask[j] ? "var(--accent-soft)" : "var(--bg)"} stroke={mask[j] ? "var(--accent)" : "var(--border)"} strokeDasharray={mask[j] ? undefined : "2 2"} />
            <text x={hx + 14} y={hy(j) + 4} className="viz-label">{mask[j] ? (h / (outs.length ? 1 - p : 1)).toFixed(2) : "0"}</text>
          </g>
        ))}
        <circle cx={ox} cy={oy} r={13} fill="var(--bg)" stroke="var(--text-muted)" />
        <text x={ox} y={oy + 4} textAnchor="middle" className="viz-label">ŷ</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        this mask: {last === null ? "–" : last.toFixed(3)}; average of {outs.length}: {avg === null ? "–" : avg.toFixed(3)}; no dropout: {FULL.toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each mask drops every hidden unit with probability p and scales the survivors by 1/(1 − p) (inverted dropout). One
        mask gives a noisy output from one of 2⁸ = 256 subnetworks. Averaged over many masks, the output matches the full
        network without dropout, because the scaling keeps every unit's expected contribution unchanged. That is why test
        time simply switches dropout off.
      </figcaption>
    </figure>
  );
}
