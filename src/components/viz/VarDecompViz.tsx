"use client";

import { useState } from "react";

const P = [0.5, 0.3, 0.2];
const OFF = [-1, 0.4, 1.5];
const HUES = ["var(--accent)", "var(--text-muted)", "var(--danger)"];

/** A mixture of three normal groups: total variance splits into the mean within-group variance plus the variance of the group means. */
export function VarDecompViz() {
  const [d, setD] = useState(15);
  const [s, setS] = useState(6);
  const spread = d / 10, sd = s / 10;
  const means = OFF.map((o) => o * spread);
  const mu = P.reduce((acc, p, i) => acc + p * means[i], 0);
  const within = sd * sd;
  const between = P.reduce((acc, p, i) => acc + p * (means[i] - mu) * (means[i] - mu), 0);
  const total = within + between;
  const W = 320, H = 150, lo = -5, hi = 5;
  const X = (x: number) => 10 + ((x - lo) / (hi - lo)) * (W - 20);
  const dens = (x: number, m: number) => Math.exp(-((x - m) * (x - m)) / (2 * within)) / Math.sqrt(2 * Math.PI * within);
  const xs: number[] = [];
  for (let i = 0; i <= 200; i++) xs.push(lo + ((hi - lo) * i) / 200);
  const mix = xs.map((x) => P.reduce((acc, p, i) => acc + p * dens(x, means[i]), 0));
  const peak = Math.max(1.4, ...mix);
  const Y = (y: number) => H - 14 - (y / peak) * (H - 24);
  const path = (f: (x: number) => number) => xs.map((x) => `${X(x).toFixed(1)},${Y(f(x)).toFixed(1)}`).join(" ");
  const bw = W - 20;
  const slider = (label: string, v: number, set: (v: number) => void, min: number, max: number, shown: string) => (
    <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
      {label} {shown}
      <input type="range" min={min} max={max} value={v} onChange={(e) => set(Number(e.target.value))} aria-label={label} style={{ width: 100 }} />
    </label>
  );
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        {slider("spread of group means", d, setD, 0, 30, spread.toFixed(1))}
        {slider("within-group sd", s, setS, 3, 20, sd.toFixed(1))}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 40}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Three group densities, their mixture, and a bar splitting the variance">
        <line x1={10} x2={W - 10} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        {means.map((m, i) => (
          <polyline key={i} fill="none" stroke={HUES[i]} strokeWidth={1.2} strokeDasharray="4 3" points={path((x) => P[i] * dens(x, m))} />
        ))}
        <polyline fill="none" stroke="var(--text)" strokeWidth={2} points={path((x) => P.reduce((acc, p, i) => acc + p * dens(x, means[i]), 0))} />
        <rect x={10} y={H + 6} width={(bw * within) / total} height={14} fill="var(--accent)" opacity={0.7} />
        <rect x={10 + (bw * within) / total} y={H + 6} width={(bw * between) / total} height={14} fill="var(--danger)" opacity={0.7} />
        <text x={10} y={H + 34} className="viz-label">within {within.toFixed(2)}</text>
        <text x={W - 10} y={H + 34} textAnchor="end" className="viz-label">between {between.toFixed(2)}</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        Var(Y) = {within.toFixed(2)} + {between.toFixed(2)} = {total.toFixed(2)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Y is drawn by first picking a group X with probabilities 0.5, 0.3 and 0.2, then sampling from that group&apos;s normal
        curve (dashed, scaled by its weight; the solid curve is their sum). The total variance is E[Var(Y | X)], the left
        part, plus Var(E[Y | X]), the right part. Push the group means apart and the right part grows; shrink the groups and the
        left part shrinks.
      </figcaption>
    </figure>
  );
}
