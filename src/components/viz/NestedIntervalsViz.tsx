"use client";

import { useState } from "react";

const TARGETS = [
  { label: "√2", square: 2 },
  { label: "√3", square: 3 },
  { label: "√5", square: 5 },
] as const;

/**
 * Zooming in on a square root by decimal intervals. Each step cuts the current interval into ten
 * and keeps the piece that contains the number. The intervals shrink and nest; completeness says
 * exactly one real number lies in all of them.
 */
export function NestedIntervalsViz() {
  const [t, setT] = useState(0);
  const [depth, setDepth] = useState(0);
  const target = TARGETS[t];
  const root = Math.sqrt(target.square);

  const width = 10 ** -depth;
  const lo = Math.floor(root / width) * width;
  const fmt = (v: number) => v.toFixed(Math.max(0, depth));
  const pieces = Array.from({ length: 10 }, (_, i) => lo + (i * width) / 10);
  const chosen = Math.min(9, Math.floor((root - lo) / (width / 10)));

  const W = 620, x0 = 20, span = 580, y = 46;
  const px = (i: number) => x0 + (i * span) / 10;

  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }} role="group" aria-label="Number to find">
        {TARGETS.map((x, i) => (
          <button key={x.label} type="button" className={i === t ? "btn btn-primary" : "btn"} aria-pressed={i === t}
            onClick={() => { setT(i); setDepth(0); }}>{x.label}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} 100`} role="img" aria-label={`The interval from ${fmt(lo)} to ${fmt(lo + width)}, cut into ten`}>
        <line x1={x0} y1={y} x2={x0 + span} y2={y} className="viz-axis" />
        <rect x={px(chosen)} y={y - 12} width={span / 10} height={24} className="viz-region" />
        {Array.from({ length: 11 }, (_, i) => (
          <line key={i} x1={px(i)} y1={y - (i % 10 === 0 ? 14 : 7)} x2={px(i)} y2={y + (i % 10 === 0 ? 14 : 7)} className="viz-axis" />
        ))}
        <text x={x0} y={y + 34} textAnchor="start" className="viz-label">{fmt(lo)}</text>
        <text x={x0 + span} y={y + 34} textAnchor="end" className="viz-label">{fmt(lo + width)}</text>
        <text x={px(chosen) + span / 20} y={y - 20} textAnchor="middle" className="viz-label is-on">
          {(pieces[chosen]).toFixed(depth + 1)}
        </text>
      </svg>
      <div className="viz-controls">
        <button type="button" className="btn btn-primary" onClick={() => setDepth((d) => d + 1)} disabled={depth >= 9}>Zoom in ten times</button>
        <button type="button" className="btn btn-ghost" onClick={() => setDepth(0)} disabled={depth === 0}>Start again</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {target.label} lies in the shaded tenth, because{" "}
        <span className="mono">{pieces[chosen].toFixed(depth + 1)}² ≤ {target.square} &lt; {(pieces[chosen] + width / 10).toFixed(depth + 1)}²</span>.
        So far: {target.label} = <span className="mono">{pieces[chosen].toFixed(depth + 1)}…</span> The intervals shrink to a single point, but
        every endpoint is a fraction and none of them is {target.label} itself.
      </figcaption>
    </figure>
  );
}
