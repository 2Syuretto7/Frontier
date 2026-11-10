"use client";

import { useState } from "react";

const A = { x: 120, y: 280 }, B = { x: 500, y: 280 };
const deg = (rad: number) => (rad * 180) / Math.PI;

/** Angle at P between rays P→Q and P→R, in degrees. */
function angle(P: { x: number; y: number }, Q: { x: number; y: number }, R: { x: number; y: number }) {
  const a = Math.atan2(Q.y - P.y, Q.x - P.x), b = Math.atan2(R.y - P.y, R.x - P.x);
  let d = Math.abs(a - b);
  if (d > Math.PI) d = 2 * Math.PI - d;
  return deg(d);
}

/** An arc of radius r at P from the direction of Q to the direction of R (the shorter way). */
function arc(P: { x: number; y: number }, Q: { x: number; y: number }, R: { x: number; y: number }, r: number) {
  const a = Math.atan2(Q.y - P.y, Q.x - P.x), b = Math.atan2(R.y - P.y, R.x - P.x);
  let d = b - a;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  const end = a + d;
  return `M${P.x + r * Math.cos(a)} ${P.y + r * Math.sin(a)} A${r} ${r} 0 0 ${d > 0 ? 1 : 0} ${P.x + r * Math.cos(end)} ${P.y + r * Math.sin(end)}`;
}

/** Why a triangle's angles add to 180 degrees: the line through C parallel to AB, and two pairs of alternate angles. */
export function AngleSumViz() {
  const [cx, setCx] = useState(230);
  const [h, setH] = useState(180);
  const C = { x: cx, y: A.y - h };
  const a = angle(A, B, C), b = angle(B, A, C), c = 180 - a - b;
  const L = { x: C.x - 400, y: C.y }, R = { x: C.x + 400, y: C.y };
  const r1 = (n: number) => Math.round(n);

  return (
    <figure className="viz">
      <svg viewBox="0 0 620 310" role="img" aria-label={`A triangle with angles ${r1(a)}, ${r1(b)} and ${r1(c)} degrees, summing to 180`}>
        <line x1={L.x} y1={L.y} x2={R.x} y2={R.y} className="plot-mirror" />
        <path d={`M${A.x} ${A.y} L${B.x} ${B.y} L${C.x} ${C.y} Z`} className="viz-region" style={{ opacity: 0.35 }} />
        <path d={`M${A.x} ${A.y} L${B.x} ${B.y} L${C.x} ${C.y} Z`} className="plot-curve" />
        <path d={arc(A, B, C, 34)} className="plot-curve" style={{ stroke: "var(--danger)" }} />
        <path d={arc(B, C, A, 34)} className="plot-curve-2" style={{ strokeDasharray: "none" }} />
        <path d={arc(C, A, B, 26)} className="plot-curve" />
        <path d={arc(C, L, A, 40)} className="plot-curve" style={{ stroke: "var(--danger)" }} />
        <path d={arc(C, B, R, 40)} className="plot-curve-2" style={{ strokeDasharray: "none" }} />
        <text x={A.x - 18} y={A.y + 18} className="viz-label">A</text>
        <text x={B.x + 6} y={B.y + 18} className="viz-label">B</text>
        <text x={C.x - 4} y={C.y - 12} className="viz-label">C</text>
      </svg>
      <div className="viz-sliders">
        <label>
          <span>Slide C sideways</span>
          <input type="range" min={60} max={560} step={5} value={cx} onChange={(e) => setCx(Number(e.target.value))} />
        </label>
        <label>
          <span>Height of C</span>
          <input type="range" min={40} max={240} step={5} value={h} onChange={(e) => setH(Number(e.target.value))} />
        </label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Angles <span className="mono">A ≈ {r1(a)}°</span>, <span className="mono">B ≈ {r1(b)}°</span>, <span className="mono">C ≈ {r1(c)}°</span>, total{" "}
        <span className="mono">180°</span>. The dotted line through C is parallel to AB. The angle at A reappears at C on the left, and the angle at B
        on the right (alternate angles), so the three angles at C fill a straight line.
      </figcaption>
    </figure>
  );
}
