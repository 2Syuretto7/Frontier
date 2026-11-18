"use client";

import { useState } from "react";

const SETS = 64, WAYS = 8, LINE = 64, ROWS = 256;

/** Lines mapped to each set when walking down one column of a row-major float32 matrix with the given row length. */
export function columnSets(rowLen: number) {
  const perSet = new Array(SETS).fill(0);
  for (let i = 0; i < ROWS; i++) perSet[Math.floor((i * rowLen * 4) / LINE) % SETS]++;
  const used = perSet.filter((c) => c > 0).length;
  const rehits = perSet.reduce((a, c) => a + (c <= WAYS ? c : 0), 0);
  return { perSet, used, rehits };
}

export function CacheConflictViz() {
  const [len, setLen] = useState(1024);
  const { perSet, used, rehits } = columnSets(len);
  const W = 330, H = 150, X0 = 26, Y0 = 8, PH = 110, bw = (W - X0 - 4) / SETS;
  const maxC = 32;
  const sy = (c: number) => Y0 + PH - (Math.min(c, maxC) / maxC) * PH;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="viz-label" htmlFor="cc-len">row length: {len} floats</label>
        <input id="cc-len" type="range" min={1008} max={1040} step={1} value={len} onChange={(e) => setLen(Number(e.target.value))} style={{ flex: 1, minWidth: 120 }} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Lines per cache set when reading one matrix column">
        {[0, 8, 16, 32].map((t) => (
          <g key={t}>
            <line x1={X0} x2={W - 4} y1={sy(t)} y2={sy(t)} stroke={t === WAYS ? "var(--danger)" : "var(--border)"} strokeDasharray={t === WAYS ? "3 3" : undefined} />
            <text x={X0 - 3} y={sy(t) + 3} textAnchor="end" className="viz-label" style={{ fontSize: 9 }}>{t === 32 ? "32+" : t}</text>
          </g>
        ))}
        {perSet.map((c, s) => (
          <rect key={s} x={X0 + s * bw + 0.5} y={sy(c)} width={Math.max(bw - 1, 1)} height={Y0 + PH - sy(c)} fill={c > WAYS ? "var(--danger)" : "var(--accent)"} />
        ))}
        <text x={X0 + (W - X0) / 2} y={H - 12} textAnchor="middle" className="viz-label">cache set (64 sets, 8 ways, dashed line)</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`${used} of ${SETS} sets used; second pass over the column: ${rehits} of ${ROWS} lines still cached`}
      </div>
      <figcaption className="viz-caption">
        Reading one column of a 256-row float32 matrix touches one cache line per row. In a 32 KB cache with 64 sets of 8
        ways, a row of 1024 floats is exactly 64 lines, so every row lands in the same set: 256 lines compete for 8 places
        and nothing survives to the second pass; 1023 and 1025 are almost as bad. Padding the row to 1040 floats spreads the column over all 64 sets and all
        256 lines fit, although the cache is no larger.
      </figcaption>
    </figure>
  );
}
