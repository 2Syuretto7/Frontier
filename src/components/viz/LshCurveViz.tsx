"use client";

import { useState } from "react";

const CONFIGS: [number, number][] = [[32, 2], [16, 4], [14, 8], [8, 16]];

/** Probability that two documents with Jaccard similarity s share at least one of b bands of r MinHash rows. */
export function pCand(s: number, b: number, r: number) {
  return 1 - (1 - s ** r) ** b;
}

export function LshCurveViz() {
  const [ci, setCi] = useState(2);
  const [b, r] = CONFIGS[ci];
  const W = 330, X0 = 34, Y0 = 8, PW = 284, PH = 130;
  const x = (s: number) => X0 + s * PW;
  const y = (p: number) => Y0 + PH - p * PH;
  const curve = (bb: number, rr: number) => Array.from({ length: 101 }, (_, i) => `${x(i / 100)},${y(pCand(i / 100, bb, rr))}`).join(" ");
  const thr = (1 / b) ** (1 / r);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <span className="viz-label">bands × rows</span>
        <div className="segmented" role="group" aria-label="Bands and rows">
          {CONFIGS.map(([bb, rr], j) => <button key={j} type="button" className="seg" aria-pressed={ci === j} onClick={() => setCi(j)}>{`${bb}×${rr}`}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${Y0 + PH + 18}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Probability of becoming a candidate pair against similarity">
        <line x1={X0} x2={X0 + PW} y1={y(0)} y2={y(0)} stroke="var(--border)" />
        <line x1={X0} x2={X0} y1={y(0)} y2={y(1)} stroke="var(--border)" />
        {CONFIGS.map(([bb, rr], j) => j !== ci && <polyline key={j} points={curve(bb, rr)} fill="none" stroke="var(--text-muted)" strokeWidth={1} opacity={0.5} />)}
        <polyline points={curve(b, r)} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <line x1={x(thr)} x2={x(thr)} y1={y(0)} y2={y(1)} stroke="var(--text)" strokeDasharray="4 3" />
        {[0, 0.25, 0.5, 0.75, 1].map((s) => <text key={s} x={x(s)} y={Y0 + PH + 13} textAnchor="middle" className="viz-label">{s}</text>)}
        {[0, 0.5, 1].map((p) => <text key={p} x={X0 - 5} y={y(p) + 4} textAnchor="end" className="viz-label">{p}</text>)}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {b * r} hashes; threshold ≈ {thr.toFixed(2)}; P(candidate) at similarity 0.5: {pCand(0.5, b, r).toFixed(3)}, at 0.85:{" "}
        {pCand(0.85, b, r).toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        The chance that two documents become a candidate pair, against their Jaccard similarity, when signatures are cut into b bands
        of r rows each. More rows per band make the step steeper and move it to the right; the dashed line marks the approximate
        threshold (1/b) to the power 1/r. Pairs left of the step are rarely compared, pairs right of it are almost always found.
      </figcaption>
    </figure>
  );
}
