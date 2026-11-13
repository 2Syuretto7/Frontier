"use client";

import { useState } from "react";

type Fn = "wave" | "jump";

const FNS: Record<Fn, { label: string; f: (x: number) => number }> = {
  wave: { label: "0.5 + 0.3 sin 7x + 0.4x", f: (x) => 0.5 + 0.3 * Math.sin(7 * x) + 0.4 * x },
  jump: { label: "jump at 1/3", f: (x) => (x < 1 / 3 ? 0.3 : 0.9) },
};

function vdc(k: number) {
  let v = 0, denom = 1;
  while (k > 0) { denom *= 2; v += (k % 2) / denom; k = Math.floor(k / 2); }
  return v;
}

/** Upper and lower Darboux sums on a partition that is refined one point at a time: the lower sum never falls and the upper sum never rises. */
export function RefineSumViz() {
  const [fn, setFn] = useState<Fn>("wave");
  const [k, setK] = useState(3);
  const { f } = FNS[fn];
  const P = [0, 1, ...Array.from({ length: k }, (_, i) => vdc(i + 1))].sort((a, b) => a - b);
  const cells = P.slice(1).map((v, i) => {
    const u = P[i];
    const ys = Array.from({ length: 61 }, (_, j) => f(u + ((v - u) * j) / 60));
    return { u, v, lo: Math.min(...ys), hi: Math.max(...ys) };
  });
  const L = cells.reduce((s, c) => s + c.lo * (c.v - c.u), 0);
  const U = cells.reduce((s, c) => s + c.hi * (c.v - c.u), 0);
  const W = 330, H = 170;
  const X = (x: number) => 16 + x * (W - 32);
  const Y = (y: number) => H - 16 - (y / 1.3) * (H - 26);
  const xs = Array.from({ length: 301 }, (_, i) => i / 300);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {(Object.keys(FNS) as Fn[]).map((key) => (
          <button key={key} type="button" className="seg" aria-pressed={fn === key} onClick={() => setFn(key)}>{FNS[key].label}</button>
        ))}
      </div>
      <div className="viz-controls">
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          points added {k}
          <input type="range" min={0} max={40} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="number of partition points added" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Upper and lower rectangles over a partition, with the graph">
        {cells.map((c, i) => (
          <g key={i}>
            <rect x={X(c.u)} y={Y(c.hi)} width={X(c.v) - X(c.u)} height={Y(c.lo) - Y(c.hi)} fill="var(--danger)" opacity={0.25} />
            <rect x={X(c.u)} y={Y(c.lo)} width={X(c.v) - X(c.u)} height={Y(0) - Y(c.lo)} fill="var(--accent)" opacity={0.3} stroke="var(--accent)" strokeWidth={0.5} />
          </g>
        ))}
        <line x1={X(0)} x2={X(1)} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.6} points={xs.map((x) => `${X(x).toFixed(1)},${Y(f(x)).toFixed(1)}`).join(" ")} />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        L = {L.toFixed(4)}, U = {U.toFixed(4)}, U − L = {(U - L).toFixed(4)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The lower sum is the area of the solid rectangles under the graph; the upper sum adds the lighter boxes above them,
        whose total area is U − L. Each new point splits one cell, which can only raise its lower rectangle and lower its
        upper one. For the jump the box around 1/3 always has height 0.6, but its width shrinks, so U − L still tends to 0.
      </figcaption>
    </figure>
  );
}
