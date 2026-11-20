"use client";

import { useMemo, useState } from "react";

export const SET: [number, number][] = [[0.1, 0.3], [0.45, 0.5], [0.7, 0.7], [0.8, 0.95]];
export const KS = [2, 3, 4, 5, 6, 8, 10];

/** Indices j of the dyadic cells [j/2^k, (j+1)/2^k) that meet the set, and the total length of those cells. */
export function cover(k: number) {
  const N = 2 ** k, cells = new Set<number>();
  for (const [a, b] of SET) for (let j = Math.floor(a * N); j <= Math.min(N - 1, Math.floor(b * N)); j++) cells.add(j);
  return { cells: [...cells].sort((x, y) => x - y), length: cells.size / N };
}

export function DyadicCoverViz() {
  const [ki, setKi] = useState(2);
  const k = KS[ki];
  const c = useMemo(() => cover(k), [k]);
  const all = useMemo(() => KS.map((kk) => cover(kk).length), []);
  const W = 330, H = 70, X0 = 12, PW = 306, sx = (x: number) => X0 + x * PW, N = 2 ** k;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">level k</span>
        <div className="segmented" role="group" aria-label="Level of the dyadic grid">
          {KS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={ki === i} onClick={() => setKi(i)}>{v}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="A set on the unit interval covered by dyadic cells">
        {c.cells.map((j) => <rect key={j} x={sx(j / N)} y={10} width={Math.max(0.6, PW / N - (N <= 64 ? 1 : 0))} height={26} fill="var(--accent)" fillOpacity={0.35} />)}
        <line x1={sx(0)} x2={sx(1)} y1={46} y2={46} stroke="var(--border)" />
        {SET.map(([a, b], i) => (a === b ? <circle key={i} cx={sx(a)} cy={46} r={3} fill="var(--text)" /> : <line key={i} x1={sx(a)} x2={sx(b)} y1={46} y2={46} stroke="var(--text)" strokeWidth={4} />))}
        {[0, 0.5, 1].map((v) => <text key={v} x={sx(v)} y={64} textAnchor="middle" className="viz-label">{v}</text>)}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        k = {k}: {c.cells.length} cells of length 1/{N}, total {c.length.toFixed(4)}; levels {KS.join(", ")}: {all.map((v) => v.toFixed(3)).join(", ")}
      </div>
      <figcaption className="viz-caption">
        A set made of three intervals of total length 0.4 and a single point, covered by every dyadic cell of length 2⁻ᵏ
        that it meets. At level 2 the cover is the whole interval, length 1; it shrinks to 0.6875 at level 4, 0.4688 at
        level 6 and 0.4043 at level 10. The excess comes only from cells sticking out past the ends of the intervals and
        from the one cell that the point needs, and it vanishes as k grows: the outer measure is 0.4, and the point
        contributes nothing.
      </figcaption>
    </figure>
  );
}
