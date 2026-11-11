"use client";

import { useMemo, useState } from "react";

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const WIDTHS = [0.5, 0.2, 0.1, 0.05, 0.02, 0.01, 0.005, 0.002, 0.001, 0.0005, 0.0002, 0.0001];
const N = 20000;
const W = 560, H = 90, PAD = 20;

/** Throw random darts at [0, 1] and count how many land in a shrinking window around 0.5. */
export function DartsViz() {
  const [k, setK] = useState(2);
  const [seed, setSeed] = useState(1);
  const darts = useMemo(() => {
    const r = makeRng(seed * 7919);
    return Array.from({ length: N }, () => r());
  }, [seed]);
  const w = WIDTHS[k];
  const lo = 0.5 - w / 2, hi = 0.5 + w / 2;
  const hits = darts.filter((x) => x >= lo && x <= hi).length;
  const exact = darts.filter((x) => x === 0.5).length;
  const sx = (x: number) => PAD + x * (W - 2 * PAD);
  const shown = darts.slice(0, 400);

  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Darts on the interval from 0 to 1, with a window of width ${w} around 0.5`}>
        <rect className="viz-region" x={sx(lo)} y={18} width={Math.max(1.5, sx(hi) - sx(lo))} height={40} />
        {shown.map((x, i) => (
          <line key={i} x1={sx(x)} x2={sx(x)} y1={28} y2={48} stroke="var(--text-faint)" strokeWidth={1} opacity={x >= lo && x <= hi ? 1 : 0.45} />
        ))}
        <line x1={sx(0)} x2={sx(1)} y1={58} y2={58} stroke="var(--text-muted)" strokeWidth={1.5} />
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line x1={sx(t)} x2={sx(t)} y1={58} y2={64} stroke="var(--text-muted)" />
            <text x={sx(t)} y={80} textAnchor="middle" fontSize={12} fill="var(--text-muted)">{t}</text>
          </g>
        ))}
      </svg>
      <div className="viz-sliders">
        <label>
          window width = {w}
          <input type="range" min={0} max={WIDTHS.length - 1} value={k} onChange={(e) => setK(Number(e.target.value))} />
        </label>
      </div>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={() => setSeed(seed + 1)}>Throw again</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Of {N.toLocaleString("en-IN")} darts, {hits.toLocaleString("en-IN")} landed in the window: a fraction of {(hits / N).toFixed(4)}, close to its width, {w}. Shrink the window towards the single point 0.5 and the fraction heads to 0. Darts landing exactly on 0.5: {exact}.
      </figcaption>
    </figure>
  );
}
