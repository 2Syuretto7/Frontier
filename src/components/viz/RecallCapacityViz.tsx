"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const DV = 8, NMAX = 96;

type Rule = "additive" | "delta";

function gauss(r: () => number) {
  const u = Math.max(1e-12, r()), v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function unit(r: () => number, d: number) {
  const x = Array.from({ length: d }, () => gauss(r));
  const n = Math.hypot(...x);
  return x.map((v) => v / n);
}

/** Relative recall error after writing n random key-value pairs into a d × DV state, for each n from 1 to NMAX. */
export function recallCurve(rule: Rule, d: number, seed = 3) {
  const r = rand(seed);
  const keys = Array.from({ length: NMAX }, () => unit(r, d));
  const vals = Array.from({ length: NMAX }, () => unit(r, DV));
  const out: number[] = [];
  for (let n = 1; n <= NMAX; n++) {
    const S = Array.from({ length: d }, () => new Array(DV).fill(0));
    for (let t = 0; t < n; t++) {
      const k = keys[t], v = vals[t];
      const pred = new Array(DV).fill(0);
      if (rule === "delta") for (let i = 0; i < d; i++) for (let j = 0; j < DV; j++) pred[j] += S[i][j] * k[i];
      for (let i = 0; i < d; i++) for (let j = 0; j < DV; j++) S[i][j] += k[i] * (v[j] - pred[j]);
    }
    let err = 0;
    for (let t = 0; t < n; t++) {
      for (let j = 0; j < DV; j++) {
        let y = 0;
        for (let i = 0; i < d; i++) y += S[i][j] * keys[t][i];
        err += (y - vals[t][j]) ** 2;
      }
    }
    out.push(err / n);
  }
  return out;
}

export function RecallCapacityViz() {
  const [rule, setRule] = useState<Rule>("delta");
  const [d, setD] = useState(32);
  const curve = useMemo(() => recallCurve(rule, d), [rule, d]);
  const other = useMemo(() => recallCurve(rule === "delta" ? "additive" : "delta", d), [rule, d]);
  const W = 330, H = 200, X0 = 34, PW = 286, Y0 = 8, PH = 160, YMAX = 2;
  const px = (n: number) => X0 + ((n - 1) / (NMAX - 1)) * PW;
  const py = (v: number) => Y0 + PH - (Math.min(YMAX, v) / YMAX) * PH;
  const line = (ys: number[]) => ys.map((v, i) => `${px(i + 1).toFixed(1)},${py(v).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Update rule">
          {(["additive", "delta"] as Rule[]).map((u) => (
            <button key={u} className="seg" aria-pressed={rule === u} onClick={() => setRule(u)}>{u === "additive" ? "additive (linear attention)" : "delta rule"}</button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Key dimension">
          {[16, 32].map((v) => (
            <button key={v} className="seg" aria-pressed={d === v} onClick={() => setD(v)}>key dimension {v}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Recall error against number of stored pairs">
        {[0, 0.5, 1, 1.5, 2].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={X0 - 4} y={py(v) + 3} textAnchor="end" className="viz-label">{v}</text>
          </g>
        ))}
        <line x1={px(d)} x2={px(d)} y1={Y0} y2={Y0 + PH} stroke="var(--code-string)" strokeDasharray="4 3" />
        <text x={px(d) + 3} y={Y0 + 10} className="viz-label" style={{ fill: "var(--code-string)" }}>pairs = key dimension</text>
        <polyline points={line(other)} fill="none" stroke="var(--text-muted)" strokeDasharray="4 3" />
        <polyline points={line(curve)} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <text x={X0} y={H - 16} className="viz-label">pairs written, 1 to {NMAX}</text>
        <text x={X0} y={H - 4} className="viz-label">squared recall error per pair; dashed: other rule</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {rule === "delta" ? "delta rule" : "additive"}: error {curve[d / 2 - 1].toFixed(2)} at {d / 2} pairs, {curve[d - 1].toFixed(2)} at {d}, {curve[2 * d - 1].toFixed(2)} at {2 * d}
      </div>
      <figcaption className="viz-caption">
        Random unit keys and values are written into a fixed-size state and then read back with their keys. The additive
        update of linear attention suffers interference from the first pair onward, since random keys are not orthogonal. The
        delta rule first removes what a key currently retrieves, so it interferes less, but both degrade steadily as pairs
        approach the key dimension. A softmax attention cache, which grows with the sequence, has no such limit.
      </figcaption>
    </figure>
  );
}
