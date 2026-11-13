"use client";

import { useState } from "react";

type Seq = "pow" | "pow09" | "bump";

const SEQS: Record<Seq, { label: string; hi: number; fn: (n: number, x: number) => number; lim: (x: number) => number; note: string }> = {
  pow: { label: "xⁿ on [0, 1]", hi: 1, fn: (n, x) => Math.pow(x, n), lim: (x) => (x === 1 ? 1 : 0), note: "near x = 1 the graph always climbs out of the band, so the sup distance stays near 1 although each point converges" },
  pow09: { label: "xⁿ on [0, 0.9]", hi: 0.9, fn: (n, x) => Math.pow(x, n), lim: () => 0, note: "the sup distance is 0.9ⁿ, which tends to 0: the whole graph enters the band" },
  bump: { label: "2nx/(1 + n²x²)", hi: 1, fn: (n, x) => (2 * n * x) / (1 + n * n * x * x), lim: () => 0, note: "a bump of height 1 slides towards 0: every point is eventually passed, but the sup distance is always 1" },
};

/** A sequence of functions against an ε-band around its pointwise limit: uniform convergence means the whole graph eventually lies inside the band. */
export function EpsBandViz() {
  const [s, setS] = useState<Seq>("pow");
  const [n, setN] = useState(5);
  const eps = 0.1;
  const { hi, fn, lim, note } = SEQS[s];
  const xs = Array.from({ length: 401 }, (_, i) => (hi * i) / 400);
  const sup = Math.max(...xs.map((x) => Math.abs(fn(n, x) - lim(x))));
  const W = 330, H = 170;
  const X = (x: number) => 16 + x * (W - 32);
  const Y = (y: number) => H - 16 - ((y + 0.15) / 1.3) * (H - 26);
  const limPts = s === "pow" ? xs.slice(0, -1) : xs;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {(Object.keys(SEQS) as Seq[]).map((k) => (
          <button key={k} type="button" className="seg" aria-pressed={s === k} onClick={() => setS(k)}>{SEQS[k].label}</button>
        ))}
      </div>
      <div className="viz-controls">
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          n = {n}
          <input type="range" min={1} max={60} value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="index n" style={{ width: 160 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="The n-th function, its limit, and a band of width epsilon around the limit">
        <polygon
          points={[...limPts.map((x) => `${X(x).toFixed(1)},${Y(lim(x) + eps).toFixed(1)}`), ...limPts.slice().reverse().map((x) => `${X(x).toFixed(1)},${Y(lim(x) - eps).toFixed(1)}`)].join(" ")}
          fill="var(--accent)" opacity={0.15}
        />
        <line x1={X(0)} x2={X(1)} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.4} strokeDasharray="4 3" points={limPts.map((x) => `${X(x).toFixed(1)},${Y(lim(x)).toFixed(1)}`).join(" ")} />
        {s === "pow" && <circle cx={X(1)} cy={Y(1)} r={3.5} fill="var(--accent)" />}
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.8} points={xs.map((x) => `${X(x).toFixed(1)},${Y(fn(n, x)).toFixed(1)}`).join(" ")} />
        {xs.filter((x) => Math.abs(fn(n, x) - lim(x)) > eps).map((x, i) => (
          <circle key={i} cx={X(x)} cy={Y(fn(n, x))} r={1.4} fill="var(--danger)" />
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        sup |fₙ − f| = {sup.toFixed(4)} {sup < eps ? "(inside the band)" : "(outside the band somewhere)"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The dashed curve is the pointwise limit f and the shaded strip is the band of half-width ε = 0.1 around it; parts of
        the graph of fₙ outside the strip are marked. Here {note}.
      </figcaption>
    </figure>
  );
}
