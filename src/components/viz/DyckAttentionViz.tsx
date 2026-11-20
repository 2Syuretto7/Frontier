"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

export const LENGTHS = [8, 32, 128];

/** A seeded bracket string: balanced (a random Dyck word) or with one bracket flipped. */
export function brackets(n: number, seed: number, flipped: boolean) {
  const g = rand(seed * 37 + n);
  const s: number[] = [];
  let open = 0;
  for (let i = 0; i < n; i++) {
    const left = n - i;
    const canOpen = open + 1 <= left - 1, mustClose = open === left;
    const v = mustClose ? -1 : open === 0 ? 1 : canOpen && g() < 0.5 ? 1 : -1;
    s.push(v);
    open += v;
  }
  if (flipped) { const k = Math.floor(g() * n); s[k] = -s[k]; }
  return s;
}

/** Causal uniform attention: each position averages the ±1 values up to itself. */
export function analyse(s: number[]) {
  let tot = 0, minBal = 0;
  const means = s.map((v, i) => { tot += v; minBal = Math.min(minBal, tot); return tot / (i + 1); });
  return { means, final: tot, minBal, ok: minBal >= 0 && tot === 0 };
}

export function DyckAttentionViz() {
  const [li, setLi] = useState(1);
  const [seed, setSeed] = useState(1);
  const [flip, setFlip] = useState(false);
  const n = LENGTHS[li];
  const s = brackets(n, seed, flip);
  const a = analyse(s);
  const W = 330, H = 150, X0 = 30, PW = 292, Y0 = 8, PH = 110;
  const sx = (i: number) => X0 + ((i + 0.5) / n) * PW, sy = (y: number) => Y0 + PH / 2 - y * (PH / 2) * 0.95;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="String length">
          {LENGTHS.map((v, i) => (
            <button key={v} type="button" className="seg" aria-pressed={li === i} onClick={() => setLi(i)}>n = {v}</button>
          ))}
        </div>
        <button type="button" className="btn" aria-pressed={flip} onClick={() => setFlip((f) => !f)}>{flip ? "Undo flip" : "Flip one bracket"}</button>
        <button type="button" className="btn" onClick={() => setSeed((v) => (v % 9) + 1)}>New string</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Brackets and the output of causal uniform attention at each position">
        <line x1={X0} x2={X0 + PW} y1={sy(0)} y2={sy(0)} stroke="var(--border)" />
        {[-1, 0, 1].map((v) => <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>)}
        {a.means.map((m, i) => (
          <rect key={i} x={sx(i) - Math.max(0.5, (PW / n) * 0.35)} y={Math.min(sy(m), sy(0))} width={Math.max(1, (PW / n) * 0.7)} height={Math.abs(sy(m) - sy(0))} fill={m < 0 ? "var(--code-function)" : "var(--accent)"} />
        ))}
        {n <= 32 && s.map((v, i) => <text key={i} x={sx(i)} y={H - 4} textAnchor="middle" className="viz-label">{v > 0 ? "(" : ")"}</text>)}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        last attention output {(a.means[n - 1]).toFixed(4)} = balance {a.final} / {n}; lowest prefix balance {a.minBal}: {a.ok ? "balanced" : "not balanced"}
      </div>
      <figcaption className="viz-caption">
        Each bar is the output of one causal attention head with equal scores: the average of +1 for &quot;(&quot; and −1 for &quot;)&quot; up to
        that position, that is, the running balance divided by the position. Multiplying back by the position recovers
        the balance, and the string is a Dyck word exactly when no balance is negative and the last is 0. Flipping one
        bracket moves the last output by only 2/n, so the following layers must resolve ever finer differences as n grows.
      </figcaption>
    </figure>
  );
}
