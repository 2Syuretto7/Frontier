"use client";

import { useState } from "react";

const CHANNELS = ["symmetric", "erasure", "Z"] as const;

export function channel(kind: number, e: number): number[][] {
  if (kind === 0) return [[1 - e, e], [e, 1 - e]];
  if (kind === 1) return [[1 - e, e, 0], [0, e, 1 - e]];
  return [[1, 0], [e, 1 - e]];
}

export function info(a: number, W: number[][]) {
  const px = [1 - a, a];
  const py = W[0].map((_, j) => px[0] * W[0][j] + px[1] * W[1][j]);
  let s = 0;
  for (let i = 0; i < 2; i++) for (let j = 0; j < py.length; j++) {
    if (px[i] > 0 && W[i][j] > 0) s += px[i] * W[i][j] * Math.log2(W[i][j] / py[j]);
  }
  return s;
}

/** Mutual information between input and output as a function of the input distribution; capacity is its maximum. */
export function CapacityViz() {
  const [kind, setKind] = useState(2);
  const [e100, setE100] = useState(50);
  const e = e100 / 100;
  const W = channel(kind, e);
  const G = 200;
  const pts = Array.from({ length: G + 1 }, (_, i) => ({ a: i / G, v: info(i / G, W) }));
  const best = pts.reduce((b, p) => (p.v > b.v ? p : b), pts[0]);
  const VW = 330, VH = 170, X0 = 30, PW = VW - 50, PH = 130;
  const sx = (a: number) => X0 + a * PW, sy = (v: number) => 10 + (1 - v) * PH;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {CHANNELS.map((c, i) => (
          <button key={c} type="button" className="seg" aria-pressed={i === kind} onClick={() => setKind(i)}>{c}</button>
        ))}
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          ε {e.toFixed(2)}
          <input type="range" min={0} max={100} value={e100} onChange={(ev) => setE100(Number(ev.target.value))} aria-label="noise level epsilon" style={{ width: 120 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Mutual information against the probability of sending a 1">
        <line x1={X0} y1={sy(0)} x2={X0 + PW} y2={sy(0)} stroke="var(--border)" />
        <line x1={X0} y1={sy(0)} x2={X0} y2={sy(1)} stroke="var(--border)" />
        <text x={X0 - 4} y={sy(1) + 4} textAnchor="end" className="viz-label">1</text>
        <text x={X0 - 4} y={sy(0) + 4} textAnchor="end" className="viz-label">0</text>
        <text x={X0 + PW / 2} y={VH - 8} textAnchor="middle" className="viz-label">P(X = 1)</text>
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={pts.map((p) => `${sx(p.a)},${sy(p.v)}`).join(" ")} />
        <line x1={sx(best.a)} y1={sy(0)} x2={sx(best.a)} y2={sy(best.v)} stroke="var(--danger)" strokeDasharray="3 3" />
        <circle cx={sx(best.a)} cy={sy(best.v)} r={4} fill="var(--danger)" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        capacity ≈ {best.v.toFixed(3)} bits per use, at P(X = 1) = {best.a.toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The curve is I(X; Y) for each input distribution. It is concave, so it has a single peak, the capacity. For the
        symmetric and erasure channels the peak is at ½, unless the channel is useless and the curve is flat at 0. The Z channel never corrupts a 0 but turns a 1 into a 0 with
        probability ε, so 1s are less reliable and the best input sends them less than half the time.
      </figcaption>
    </figure>
  );
}
