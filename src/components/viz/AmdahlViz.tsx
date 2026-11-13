"use client";

import { useState } from "react";

const PARTS = [
  { name: "data loading", ms: 30 },
  { name: "forward", ms: 25 },
  { name: "backward", ms: 35 },
  { name: "logging", ms: 10 },
];
const COLORS = ["var(--danger)", "var(--accent)", "var(--text-muted)", "var(--text-faint)"];

/** Speed up one part of a training step and see what happens to the whole step. */
export function AmdahlViz() {
  const [which, setWhich] = useState(1);
  const [lf, setLf] = useState(1);
  const factor = 2 ** lf;
  const before = PARTS.reduce((s, p) => s + p.ms, 0);
  const after = PARTS.map((p, i) => (i === which ? p.ms / factor : p.ms));
  const total = after.reduce((s, x) => s + x, 0);
  const limit = before / (before - PARTS[which].ms);
  const bar = (ms: number[], label: string) => (
    <div style={{ marginBottom: 8 }}>
      <div className="mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</div>
      <div style={{ display: "flex", height: 26, width: `${(ms.reduce((s, x) => s + x, 0) / before) * 100}%`, minWidth: 4 }}>
        {ms.map((m, i) => (
          <div key={i} title={`${PARTS[i].name}: ${m.toFixed(1)} ms`} style={{ flex: `${m} 0 0`, background: COLORS[i], outline: i === which ? "2px solid var(--text)" : undefined, outlineOffset: -2 }} />
        ))}
      </div>
    </div>
  );
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {PARTS.map((p, i) => (
          <button key={p.name} type="button" className="seg" aria-pressed={which === i} onClick={() => setWhich(i)}>
            <span style={{ display: "inline-block", width: 10, height: 10, background: COLORS[i], marginRight: 6 }} />{p.name} {p.ms} ms
          </button>
        ))}
      </div>
      <label className="viz-controls" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="mono">{factor}× faster</span>
        <input type="range" min={0} max={10} step={1} value={lf} onChange={(e) => setLf(Number(e.target.value))} style={{ flex: 1, minWidth: 0 }} />
      </label>
      {bar(PARTS.map((p) => p.ms), `before: ${before} ms`)}
      {bar(after, `after: ${total.toFixed(1)} ms`)}
      <figcaption className="viz-caption" aria-live="polite">
        Making {PARTS[which].name} {factor}× faster speeds up the whole step {(before / total).toFixed(2)}×. However fast it gets,
        the step can never be more than {limit.toFixed(2)}× faster, because the other parts still take {before - PARTS[which].ms} ms.
      </figcaption>
    </figure>
  );
}
