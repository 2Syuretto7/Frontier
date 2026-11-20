"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const D = 5, H = 10;
const ORDERS: [string, number[]][] = [["natural", [0, 1, 2, 3, 4]], ["reversed", [4, 3, 2, 1, 0]], ["shuffled", [2, 0, 4, 1, 3]]];

/** MADE masks: input degree = position in the order; hidden degrees drawn from 1..D-1. */
export function masks(order: number[], seed: number) {
  const deg = new Array(D).fill(0);
  order.forEach((d, p) => { deg[d] = p + 1; });
  const r = rand(seed);
  const hd = Array.from({ length: H }, () => 1 + Math.floor(r() * (D - 1)));
  const m1 = hd.map((h) => deg.map((g) => (h >= g ? 1 : 0)));
  const m2 = deg.map((g) => hd.map((h) => (g > h ? 1 : 0)));
  const dep = deg.map((_, o) => deg.map((_, i) => (hd.some((_, k) => m2[o][k] && m1[k][i]) ? 1 : 0)));
  return { deg, hd, m1, m2, dep };
}

export function MadeMaskViz() {
  const [oi, setOi] = useState(0), [seed, setSeed] = useState(1), [out, setOut] = useState(3);
  const { deg, hd, m1, m2, dep } = useMemo(() => masks(ORDERS[oi][1], seed), [oi, seed]);
  const W = 320, Hh = 200, yIn = 175, yHid = 100, yOut = 25;
  const xi = (d: number) => 40 + d * 60, xh = (k: number) => 16 + k * 32;
  const live = (k: number) => m2[out][k] === 1;
  const kept1 = m1.flat().reduce<number>((a, v) => a + v, 0), kept2 = m2.flat().reduce<number>((a, v) => a + v, 0);
  const inputs = dep[out].map((v, i) => (v ? `x${i + 1}` : "")).filter(Boolean);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">order</span>
        <div className="segmented" role="group" aria-label="Variable order">
          {ORDERS.map(([n], i) => <button key={n} type="button" className="seg" aria-pressed={oi === i} onClick={() => setOi(i)}>{n}</button>)}
        </div>
        <span className="viz-label">output</span>
        <div className="segmented" role="group" aria-label="Output to inspect">
          {deg.map((_, d) => <button key={d} type="button" className="seg" aria-pressed={out === d} onClick={() => setOut(d)}>{`x${d + 1}`}</button>)}
        </div>
        <button type="button" className="btn" onClick={() => setSeed((s) => s + 1)}>new hidden degrees</button>
      </div>
      <svg viewBox={`0 0 ${W} ${Hh}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Masked autoencoder connections">
        {m1.map((row, k) => row.map((v, d) => v ? <line key={`a${k}-${d}`} x1={xi(d)} y1={yIn} x2={xh(k)} y2={yHid} stroke={live(k) ? "var(--accent)" : "var(--border)"} strokeWidth={live(k) ? 1.4 : 1} /> : null))}
        {m2.map((row, d) => row.map((v, k) => v ? <line key={`b${d}-${k}`} x1={xh(k)} y1={yHid} x2={xi(d)} y2={yOut} stroke={d === out ? "var(--accent)" : "var(--border)"} strokeWidth={d === out ? 1.4 : 1} /> : null))}
        {hd.map((h, k) => <g key={k}><circle cx={xh(k)} cy={yHid} r={9} fill="var(--surface)" stroke="var(--border-strong)" /><text x={xh(k)} y={yHid + 4} textAnchor="middle" className="viz-label">{h}</text></g>)}
        {deg.map((g, d) => (
          <g key={d}>
            <circle cx={xi(d)} cy={yIn} r={11} fill="var(--bg)" />
            <circle cx={xi(d)} cy={yIn} r={11} fill={dep[out][d] ? "var(--accent-soft)" : "var(--surface)"} stroke="var(--border-strong)" />
            <text x={xi(d)} y={yIn + 4} textAnchor="middle" className="viz-label">{`x${d + 1}`}</text>
            <text x={xi(d)} y={yIn + 22} textAnchor="middle" className="viz-label">{g}</text>
            <circle cx={xi(d)} cy={yOut} r={11} fill={d === out ? "var(--accent)" : "var(--surface)"} stroke="var(--border-strong)" />
            <text x={xi(d)} y={yOut + 4} textAnchor="middle" className="viz-label" style={{ fill: d === out ? "var(--bg)" : undefined }}>{`p${d + 1}`}</text>
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`p${out + 1} depends on: ${inputs.length ? inputs.join(", ") : "nothing (first in order)"}; connections kept ${kept1 + kept2} of ${2 * D * H}`}
      </div>
      <figcaption className="viz-caption">
        A masked autoencoder for distribution estimation (MADE) computes all five conditionals in one pass. Each input gets a
        degree, its position in the order (below it); each hidden unit gets a degree from 1 to 4 (inside it). A hidden unit
        connects to inputs of degree at most its own, and an output connects to hidden units of degree strictly below its own,
        so each output can see only variables earlier in the order. Pick an output to light up the paths into it.
      </figcaption>
    </figure>
  );
}
