"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const D = 128;

/** Rotate consecutive pairs of x by pos·base^(−2i/d). */
export function rope(x: number[], pos: number, base: number) {
  const out = x.slice();
  for (let i = 0; i < D / 2; i++) {
    const t = pos * Math.pow(base, (-2 * i) / D);
    const c = Math.cos(t), s = Math.sin(t);
    out[2 * i] = x[2 * i] * c - x[2 * i + 1] * s;
    out[2 * i + 1] = x[2 * i] * s + x[2 * i + 1] * c;
  }
  return out;
}

const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0);

function vectors() {
  const r = rand(11);
  const normal = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const k = Array.from({ length: D }, normal);
  const q = k.map((v) => 0.8 * v + 0.6 * normal());
  return { q, k };
}
const { q, k } = vectors();
const ONES = new Array<number>(D).fill(1);

const DELTAS: number[] = [];
for (let i = 0; i <= 120; i++) DELTAS.push(Math.round(Math.pow(10, (4 * i) / 120)) - 1);

export function RopeDecayViz() {
  const [base, setBase] = useState(10000);
  const [m, setM] = useState(0);
  const env = useMemo(() => DELTAS.map((d) => dot(rope(ONES, d, base), ONES) / D), [base]);
  const sc = useMemo(() => DELTAS.map((d) => dot(rope(q, m + d, base), rope(k, m, base)) / D), [base, m]);
  const sc0 = useMemo(() => DELTAS.map((d) => dot(rope(q, d, base), k) / D), [base]);
  const diff = sc.reduce((s, v, i) => Math.max(s, Math.abs(v - sc0[i])), 0);
  const W = 330, H = 165, X0 = 30, PW = 290, Y0 = 10, PH = 120;
  const px = (d: number) => X0 + (Math.log10(d + 1) / 4) * PW;
  const py = (v: number) => Y0 + PH - ((Math.max(-0.4, Math.min(1.1, v)) + 0.4) / 1.5) * PH;
  const line = (ys: number[]) => DELTAS.map((d, i) => `${px(d).toFixed(1)},${py(ys[i]).toFixed(1)}`).join(" ");
  const at = (dd: number) => sc[DELTAS.indexOf(dd)];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="RoPE base">
          {[100, 10000, 500000].map((b) => (
            <button key={b} className="seg" aria-pressed={base === b} onClick={() => setBase(b)}>base {b.toLocaleString("en-IN")}</button>
          ))}
        </div>
        <label className="viz-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          key position {m}
          <input type="range" min={0} max={5000} step={50} value={m} onChange={(e) => setM(Number(e.target.value))} aria-label="Absolute position of the key" />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Attention score against relative distance under rotary position embeddings">
        <line x1={X0} x2={X0 + PW} y1={py(0)} y2={py(0)} stroke="var(--border)" />
        {[1, 0.5, 0].map((v) => (
          <text key={v} x={X0 - 4} y={py(v) + 3} textAnchor="end" className="viz-label">{v}</text>
        ))}
        {[0, 9, 99, 999, 9999].map((d) => (
          <text key={d} x={px(d)} y={Y0 + PH + 12} textAnchor={d === 9999 ? "end" : "middle"} className="viz-label">{d + 1 === 1 ? 0 : (d + 1).toLocaleString("en-IN")}</text>
        ))}
        <polyline points={line(env)} fill="none" stroke="var(--text-muted)" strokeDasharray="4 3" />
        <polyline points={line(sc)} fill="none" stroke="var(--code-function)" strokeWidth={1.8} />
        <text x={X0} y={H - 2} className="viz-label">distance from key to query (log); dashed: all-ones q, k</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        score/d at distance 0: {at(0).toFixed(3)}, 99: {at(99).toFixed(3)}, 9,999: {at(9999).toFixed(3)}; largest change from moving the key to {m}:{" "}
        {diff.toExponential(1)}
      </div>
      <figcaption className="viz-caption">
        A query and a key in 128 dimensions, rotated by RoPE according to their positions, and their dot product as the query
        moves away from the key. Moving both by the same amount with the slider changes nothing beyond rounding error: the
        score depends only on the distance. The dashed curve, for identical all-ones vectors, shows the long-range decay as
        the rotating pairs fall out of phase; a larger base slows the low frequencies so that the decay reaches further.
      </figcaption>
    </figure>
  );
}
