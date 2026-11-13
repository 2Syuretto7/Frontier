"use client";

import { useState } from "react";

type Case = "closed" | "open" | "unbounded" | "jump";

const CASES: Record<Case, { label: string; f: (x: number) => number; a: number; b: number; inclA: boolean; inclB: boolean; ymax: number; note: string }> = {
  closed: { label: "x(1 − x) + x/4 on [0, 1]", f: (x) => x * (1 - x) + x / 4, a: 0, b: 1, inclA: true, inclB: true, ymax: 0.5, note: "continuous on a compact set: the maximum is attained" },
  open: { label: "x on (0, 1)", f: (x) => x, a: 0, b: 1, inclA: false, inclB: false, ymax: 1.2, note: "the supremum 1 is approached but never attained" },
  unbounded: { label: "1/x on (0, 1]", f: (x) => 1 / x, a: 0, b: 1, inclA: false, inclB: true, ymax: 10, note: "unbounded: no maximum and no finite supremum" },
  jump: { label: "x on [0, 1), 0 at 1", f: (x) => (x < 1 ? x : 0), a: 0, b: 1, inclA: true, inclB: true, ymax: 1.2, note: "compact domain but not continuous: supremum 1 not attained" },
};

/** The extreme value theorem needs both a compact domain and continuity; each example drops one hypothesis. */
export function AttainMaxViz() {
  const [c, setC] = useState<Case>("closed");
  const [n, setN] = useState(8);
  const { f, a, b, inclA, inclB, ymax, note } = CASES[c];
  const W = 330, H = 170;
  const X = (x: number) => 20 + ((x + 0.05) / 1.1) * (W - 40);
  const Y = (y: number) => H - 16 - (Math.min(y, ymax) / ymax) * (H - 30);
  const pts: string[] = [];
  for (let i = 0; i <= 400; i++) {
    const x = a + ((b - a) * i) / 400;
    if ((i === 0 && !inclA) || (c === "jump" && i === 400)) continue;
    pts.push(`${X(x).toFixed(1)},${Y(f(x)).toFixed(1)}`);
  }
  const grid = Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n).filter((x) => (x > a || inclA) && (x < b || inclB));
  const best = grid.reduce((m, x) => (f(x) > f(m) ? x : m), grid[0]);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {(Object.keys(CASES) as Case[]).map((k) => (
          <button key={k} type="button" className="seg" aria-pressed={c === k} onClick={() => setC(k)}>{CASES[k].label}</button>
        ))}
      </div>
      <div className="viz-controls">
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          grid of {n} steps
          <input type="range" min={2} max={40} value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="number of grid steps" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Graph of the function with grid samples and the best sample marked">
        <line x1={14} x2={W - 14} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        {c !== "unbounded" && <line x1={14} x2={W - 14} y1={Y(c === "closed" ? 0.390625 : 1)} y2={Y(c === "closed" ? 0.390625 : 1)} stroke="var(--text-muted)" strokeDasharray="3 3" />}
        <polyline fill="none" stroke="var(--text)" strokeWidth={1.8} points={pts.join(" ")} />
        {c === "open" && <circle cx={X(a)} cy={Y(0)} r={4} fill="var(--bg)" stroke="var(--text)" />}
        {c === "open" && <circle cx={X(b)} cy={Y(1)} r={4} fill="var(--bg)" stroke="var(--text)" />}
        {c === "jump" && (
          <g>
            <circle cx={X(1)} cy={Y(1)} r={4} fill="var(--bg)" stroke="var(--text)" />
            <circle cx={X(1)} cy={Y(0)} r={4} fill="var(--text)" />
          </g>
        )}
        {grid.map((x, i) => <circle key={i} cx={X(x)} cy={Y(f(x))} r={2.6} fill={x === best ? "var(--danger)" : "var(--accent)"} />)}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        best grid value {f(best).toFixed(4)} at x = {best.toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {note}. The dashed line marks the supremum where it is finite; hollow circles are points not in the domain or not on the
        graph. Refining the grid creeps towards the supremum in every bounded case, but only in the first does some point of
        the domain actually reach it.
      </figcaption>
    </figure>
  );
}
