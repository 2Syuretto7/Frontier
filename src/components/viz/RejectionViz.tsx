"use client";

import { useEffect, useState } from "react";
import { makeRng } from "./ml";

const XMAX = 4;
const TARGETS = ["half-normal, exponential envelope", "two bumps, flat envelope"];

export function ptilde(k: number, x: number) {
  return k === 0 ? Math.exp(-0.5 * x * x) : Math.exp(-((x - 1) ** 2) / 0.18) + 0.6 * Math.exp(-((x - 3) ** 2) / 0.32);
}

const FLAT = Math.max(...Array.from({ length: 401 }, (_, i) => ptilde(1, (i / 400) * XMAX))) * 1.0001;

export function envelope(k: number, x: number) {
  return k === 0 ? Math.exp(0.5) * Math.exp(-x) : FLAT;
}

export function draw(k: number, seed: number, n: number) {
  const r = makeRng(seed);
  return Array.from({ length: n }, () => {
    const x = k === 0 ? -Math.log(1 - r()) : r() * XMAX;
    const y = r() * envelope(k, x);
    return { x, y, ok: y <= ptilde(k, x) };
  });
}

/** Rejection sampling: points uniform under the envelope are kept when they fall under the target curve. */
export function RejectionViz() {
  const [k, setK] = useState(0);
  const [seed, setSeed] = useState(1);
  const [pts, setPts] = useState<{ x: number; y: number; ok: boolean }[]>([]);
  useEffect(() => setPts(draw(k, seed, 400)), [k, seed]);
  const W = 330, H = 170, X0 = 15, PW = W - 25;
  const top = k === 0 ? Math.exp(0.5) : envelope(1, 0) * 1.05;
  const sx = (x: number) => X0 + (Math.min(x, XMAX) / XMAX) * PW;
  const sy = (y: number) => H - (y / top) * (H - 10);
  const grid = Array.from({ length: 201 }, (_, i) => (i / 200) * XMAX);
  const acc = pts.filter((p) => p.ok).length;
  const z = Math.sqrt(Math.PI / 2);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {TARGETS.map((t, i) => (
          <button key={t} type="button" className="seg" aria-pressed={i === k} onClick={() => setK(i)}>{t}</button>
        ))}
        <button type="button" className="seg" onClick={() => setSeed(seed + 1)}>new points</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H + 6}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Proposals scattered under the envelope, accepted ones under the target curve">
        {pts.filter((p) => p.x <= XMAX).map((p, i) => (
          <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={1.8} fill={p.ok ? "var(--accent)" : "var(--text-muted)"} opacity={p.ok ? 0.9 : 0.4} />
        ))}
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.5} strokeDasharray="4 3" points={grid.map((x) => `${sx(x)},${sy(envelope(k, x))}`).join(" ")} />
        <polyline fill="none" stroke="var(--danger)" strokeWidth={2} points={grid.map((x) => `${sx(x)},${sy(ptilde(k, x))}`).join(" ")} />
        <line x1={X0} y1={H} x2={X0 + PW} y2={H} stroke="var(--border)" />
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        accepted {acc} of {pts.length} ({pts.length ? ((100 * acc) / pts.length).toFixed(0) : 0}%){k === 0 ? `; theory ${(100 * z / Math.exp(0.5)).toFixed(0)}%` : ""}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each proposal x is drawn from the envelope&apos;s shape and lifted to a uniform height under the envelope (dashed).
        Points under the target curve (red) are kept. The kept points are uniform under the target, so their x values follow
        it. The fraction kept is the area under the target divided by the area under the envelope, so a loose envelope,
        like the flat one over two narrow bumps, wastes most proposals.
      </figcaption>
    </figure>
  );
}
