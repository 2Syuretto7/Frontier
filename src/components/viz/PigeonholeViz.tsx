"use client";

import { useState } from "react";

/** Put n pigeons into k holes, as evenly as you like: some hole always holds at least ⌈n/k⌉. */
export function PigeonholeViz() {
  const [n, setN] = useState(10);
  const [k, setK] = useState(4);
  const [spread, setSpread] = useState(true);
  const counts = Array.from({ length: k }, () => 0);
  for (let i = 0; i < n; i++) counts[spread ? i % k : Math.min(k - 1, Math.floor((i * i) / Math.max(1, n)) % k)]++;
  const most = Math.max(...counts), bound = Math.ceil(n / k);
  const C = 22, W = 560, colW = Math.min(90, (W - 20) / k), H = 40 + Math.max(most, bound) * C + 30;
  return (
    <figure className="viz">
      <div className="segmented" role="group" aria-label="Placement">
        <button type="button" className="seg" aria-pressed={spread} onClick={() => setSpread(true)}>As evenly as possible</button>
        <button type="button" className="seg" aria-pressed={!spread} onClick={() => setSpread(false)}>Unevenly</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${n} pigeons in ${k} holes; the fullest holds ${most}`}>
        {counts.map((c, h) => {
          const x = 10 + h * colW + colW / 2;
          return (
            <g key={h}>
              <rect x={x - colW / 2 + 6} y={30} width={colW - 12} height={H - 60} rx={6} className="viz-frame" style={{ fill: "none" }} />
              {Array.from({ length: c }, (_, i) => (
                <circle key={i} cx={x} cy={H - 42 - i * C} r={8} className={c === most ? "viz-cell is-on" : "viz-cell"} />
              ))}
              <text x={x} y={H - 12} textAnchor="middle" className="viz-label">{c}</text>
            </g>
          );
        })}
        <line x1={6} x2={W - 6} y1={H - 42 - (bound - 1) * C - 11} y2={H - 42 - (bound - 1) * C - 11} className="plot-ghost" />
        <text x={W - 8} y={H - 42 - (bound - 1) * C - 16} textAnchor="end" className="plot-tick">⌈n/k⌉ = {bound}</text>
      </svg>
      <div className="viz-sliders">
        <label><span>Pigeons <span className="mono">n = {n}</span></span><input type="range" min={1} max={24} value={n} onChange={(e) => setN(Number(e.target.value))} /></label>
        <label><span>Holes <span className="mono">k = {k}</span></span><input type="range" min={1} max={6} value={k} onChange={(e) => setK(Number(e.target.value))} /></label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The fullest hole holds <span className="mono">{most}</span>. If every hole held at most {bound - 1}, there would be at most{" "}
        <span className="mono">{k} × {bound - 1} = {k * (bound - 1)}</span> pigeons, fewer than {n}. So some hole holds at least{" "}
        <span className="mono">⌈{n}/{k}⌉ = {bound}</span>, however the pigeons are placed.
      </figcaption>
    </figure>
  );
}
