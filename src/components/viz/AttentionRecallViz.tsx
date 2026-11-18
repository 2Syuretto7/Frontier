"use client";

import { useEffect, useState } from "react";
import { makeNormal, makeRng } from "./ml";
import { recallCurve } from "./BottleneckRecallViz";

const V = 10;
const DIMS = [16, 64, 256];
const LENS = Array.from({ length: 15 }, (_, i) => 4 * (i + 1));
const TMAX = 60;

/**
 * Keep one state per source position: key = a random position code p_s (unit length on average), value = one-hot token.
 * Position t is read back by attending with query beta * p_t and taking the most heavily weighted token.
 */
export function attentionCurve(d: number, beta = 12, trials = 24, seed = 5) {
  const z = makeNormal(makeRng(seed + d)), u = makeRng(seed * 7 + d);
  const P = Array.from({ length: TMAX }, () => Array.from({ length: d }, () => z() / Math.sqrt(d)));
  return LENS.map((T) => {
    let hit = 0;
    for (let r = 0; r < trials; r++) {
      const xs = Array.from({ length: T }, () => Math.floor(u() * V));
      for (let t = 0; t < T; t++) {
        const s = xs.map((_, j) => beta * P[t].reduce((a, v, i) => a + v * P[j][i], 0)), m = Math.max(...s);
        const mass = new Array(V).fill(0);
        s.forEach((v, j) => (mass[xs[j]] += Math.exp(v - m)));
        if (mass.indexOf(Math.max(...mass)) === xs[t]) hit++;
      }
    }
    return hit / (T * trials);
  });
}

export function AttentionRecallViz() {
  const [di, setDi] = useState(0);
  const [res, setRes] = useState<{ fixed: number[]; att: number[] }[] | null>(null);
  useEffect(() => setRes(DIMS.map((d) => ({ fixed: recallCurve(d), att: attentionCurve(d) }))), []);
  const W = 300, H = 200, X0 = 30, PW = W - 38, PH = 172;
  const sx = (T: number) => X0 + (T / TMAX) * PW, sy = (v: number) => 8 + (1 - v) * PH;
  const r = res?.[di];
  const pts = (c: number[]) => c.map((v, j) => `${sx(LENS[j])},${sy(v)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {DIMS.map((d, i) => (
          <button key={d} type="button" className="seg" aria-pressed={i === di} onClick={() => setDi(i)}>size {d}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 14}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Tokens recovered by attention over all encoder states compared with a single summary vector">
        <line x1={X0} y1={sy(0)} x2={X0 + PW} y2={sy(0)} stroke="var(--border)" />
        <line x1={X0} y1={sy(0)} x2={X0} y2={sy(1)} stroke="var(--border)" />
        <line x1={X0} y1={sy(1 / V)} x2={X0 + PW} y2={sy(1 / V)} stroke="var(--text-muted)" strokeDasharray="4 3" />
        {r && <polyline fill="none" stroke="var(--danger)" strokeWidth={1.5} strokeDasharray="5 3" points={pts(r.fixed)} />}
        {r && <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={pts(r.att)} />}
        {[0, 20, 40, 60].map((T) => (
          <text key={T} x={sx(T)} y={H + 12} textAnchor="middle" className="viz-label">{T}</text>
        ))}
        {[0, 0.5, 1].map((v) => (
          <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {r ? `length 60: attention ${(100 * r.att[14]).toFixed(0)}%, one vector ${(100 * r.fixed[14]).toFixed(0)}%` : "simulating"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The same task as the bottleneck figure: read back every token of a sequence from a 10-word vocabulary. Red dashed is
        one summary vector of the chosen size. The colour curve keeps one state per position, keyed by a random position code
        of the same size, and reads position t by attending with that position&apos;s code. Memory now grows with the length, and
        recall stays high far beyond where the single vector fails.
      </figcaption>
    </figure>
  );
}
