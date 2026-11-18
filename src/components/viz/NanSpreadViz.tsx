"use client";

import { useState } from "react";
import { makeNormal, makeRng } from "./ml";

const D = 8, BAD = 3;
const normal = makeNormal(makeRng(9));
const W1 = Array.from({ length: D }, () => Array.from({ length: D }, () => normal() * 0.4));
const W2 = Array.from({ length: D }, () => Array.from({ length: D }, () => normal() * 0.4));
const X = Array.from({ length: D }, (_, i) => (i === BAD ? NaN : normal()));
const MASK = X.map((_, i) => (i === BAD ? 0 : 1));

const MODES = ["no mask", "x * mask", "where(mask, x, 0)"] as const;
type Mode = (typeof MODES)[number];

const matvec = (W: number[][], v: number[]) => W.map((row) => row.reduce((s, w, j) => s + w * v[j], 0));

/** One forward and backward pass of a two-layer ReLU network with loss ½|h₂|², and an SGD step on W₁, in IEEE arithmetic. */
export function rows(mode: Mode) {
  const x = mode === "no mask" ? X : mode === "x * mask" ? X.map((v, i) => v * MASK[i]) : X.map((v, i) => (MASK[i] ? v : 0));
  const h1 = matvec(W1, x);
  const a1 = h1.map((v) => (v > 0 || Number.isNaN(v) ? v : 0));
  const h2 = matvec(W2, a1);
  const dh2 = h2;
  const da1 = Array.from({ length: D }, (_, j) => W2.reduce((s, row, i) => s + row[j] * dh2[i], 0));
  const dh1 = da1.map((v, j) => v * (h1[j] > 0 ? 1 : 0));
  const gW1row = dh1.map((d) => d * x[0]);
  const gW1col = x.map((v) => dh1[0] * v);
  const newW1row = W1[0].map((w, j) => w - 0.1 * gW1col[j]);
  return [
    { label: "input x", v: x },
    { label: "h₁ = W₁x", v: h1 },
    { label: "relu", v: a1 },
    { label: "h₂ = W₂a", v: h2 },
    { label: "∂L/∂h₁", v: dh1 },
    { label: "∂L/∂W₁ col 0", v: gW1row },
    { label: "W₁ row 0 after", v: newW1row },
  ];
}

export function NanSpreadViz() {
  const [mode, setMode] = useState<Mode>("no mask");
  const [stage, setStage] = useState(7);
  const rs = rows(mode).slice(0, stage);
  const bad = rs.reduce((s, r) => s + r.v.filter((v) => !Number.isFinite(v)).length, 0);
  const W = 320, X0 = 96, CW = (W - X0 - 4) / D, RH = 22;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {MODES.map((m) => (
          <button key={m} type="button" className="seg mono" aria-pressed={mode === m} onClick={() => setMode(m)}>{m}</button>
        ))}
      </div>
      <div className="viz-controls" style={{ marginTop: 4, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">show up to</span>
        {[1, 2, 4, 5, 7].map((k) => (
          <button key={k} type="button" className="seg" aria-pressed={stage === k} onClick={() => setStage(k)}>
            {k === 1 ? "input" : k === 2 ? "first matmul" : k === 4 ? "forward" : k === 5 ? "backward" : "update"}
          </button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${7 * RH + 4}`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }} role="img" aria-label="Which values become NaN as one bad input passes through a network and its update">
        {rs.map((r, k) => (
          <g key={r.label}>
            <text x={X0 - 6} y={k * RH + 15} textAnchor="end" className="viz-label">{r.label}</text>
            {r.v.map((v, i) => (
              <rect key={i} x={X0 + i * CW + 1} y={k * RH + 3} width={CW - 2} height={RH - 6} rx={2}
                fill={Number.isFinite(v) ? "var(--accent)" : "var(--danger)"} fillOpacity={Number.isFinite(v) ? 0.25 : 0.85} />
            ))}
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>{`${bad} non-finite values shown`}</div>
      <figcaption className="viz-caption" aria-live="polite">
        One input of a two-layer network is NaN (red). Every output of a matrix multiply sums over all inputs, so a single
        NaN fills the next layer, the loss, every gradient and, after one optimiser step, the weights themselves; from then
        on every step is NaN. Multiplying by a mask does not help, because NaN × 0 is NaN. Selecting with where replaces
        the value instead of multiplying it, and the rest of the computation stays finite.
      </figcaption>
    </figure>
  );
}
