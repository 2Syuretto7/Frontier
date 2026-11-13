"use client";

import { useState } from "react";

type Kind = "closed" | "open";

/** Open covers of [0, 1] and of (0, 1): a greedy sweep extracts a finite subcover of the closed interval, but the cover (1/n, 1) of (0, 1) has none. */
export function OpenCoverViz() {
  const [kind, setKind] = useState<Kind>("closed");
  const [m, setM] = useState(12);
  const cover: [number, number][] = kind === "closed"
    ? Array.from({ length: 21 }, (_, i) => { const c = i / 20; const d = 0.03 + 0.12 * c * c; return [c - d, c + d] as [number, number]; })
    : Array.from({ length: m }, (_, i) => [1 / (i + 2), 1.02] as [number, number]);
  const chosen: number[] = [];
  let p = kind === "closed" ? 0 : 1 / (m + 2);
  let ok = true;
  while (p <= 1 && chosen.length < 40) {
    let best = -1;
    cover.forEach(([l, r], i) => { if (l < p && p < r && (best < 0 || r > cover[best][1])) best = i; });
    if (best < 0) { ok = false; break; }
    chosen.push(best);
    p = cover[best][1];
  }
  const W = 330, rowH = kind === "closed" ? 6 : 9, H = 40 + cover.length * rowH;
  const X = (v: number) => 14 + ((v + 0.2) / 1.4) * (W - 28);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <button type="button" className="seg" aria-pressed={kind === "closed"} onClick={() => setKind("closed")}>[0, 1], intervals around grid points</button>
        <button type="button" className="seg" aria-pressed={kind === "open"} onClick={() => setKind("open")}>(0, 1), intervals (1/n, 1)</button>
      </div>
      {kind === "open" && (
        <div className="viz-controls">
          <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            first {m} intervals
            <input type="range" min={2} max={40} value={m} onChange={(e) => setM(Number(e.target.value))} aria-label="number of intervals" style={{ width: 150 }} />
          </label>
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="The set and the intervals of the cover, with the chosen ones highlighted">
        <line x1={X(0)} x2={X(1)} y1={18} y2={18} stroke="var(--text)" strokeWidth={3} />
        {[0, 1].map((e) => <circle key={e} cx={X(e)} cy={18} r={4} fill={kind === "closed" ? "var(--text)" : "var(--bg)"} stroke="var(--text)" strokeWidth={1.5} />)}
        {cover.map(([l, r], i) => (
          <line key={i} x1={X(l)} x2={X(r)} y1={34 + i * rowH} y2={34 + i * rowH} stroke={chosen.includes(i) ? "var(--accent)" : "var(--border)"} strokeWidth={chosen.includes(i) ? 3 : 1.5} />
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        {kind === "closed" ? `${chosen.length} of ${cover.length} intervals suffice` : `these ${m} intervals miss (0, 1/${m + 1}]; adding more only pushes the gap closer to 0`}
        {!ok && kind === "closed" ? " (gap found)" : ""}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Sweep from the left, always taking the interval that reaches furthest right. For [0, 1] the sweep finishes after
        finitely many steps, giving a finite subcover. For (0, 1) the intervals (1/n, 1) cover every point, since each x &gt; 0
        exceeds some 1/n, yet any finitely many of them miss the points near 0. This is the difference compactness makes.
      </figcaption>
    </figure>
  );
}
