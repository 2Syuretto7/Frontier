"use client";

import { useState } from "react";

const PS = ["1", "2", "∞"] as const;
type P = (typeof PS)[number];

/** ‖A‖_p is the radius of the smallest p-ball containing the image of the unit p-ball. */
export function OpNormViz() {
  const [p, setP] = useState<P>("2");
  const [a10, setA10] = useState(8), [b10, setB10] = useState(-4);
  const A = [[1, a10 / 10], [b10 / 10, 0.5]];
  const ap = (x: number, y: number) => [A[0][0] * x + A[0][1] * y, A[1][0] * x + A[1][1] * y];
  let norm: number;
  if (p === "1") norm = Math.max(Math.abs(A[0][0]) + Math.abs(A[1][0]), Math.abs(A[0][1]) + Math.abs(A[1][1]));
  else if (p === "∞") norm = Math.max(Math.abs(A[0][0]) + Math.abs(A[0][1]), Math.abs(A[1][0]) + Math.abs(A[1][1]));
  else {
    const m11 = A[0][0] * A[0][0] + A[1][0] * A[1][0], m12 = A[0][0] * A[0][1] + A[1][0] * A[1][1], m22 = A[0][1] * A[0][1] + A[1][1] * A[1][1];
    norm = Math.sqrt((m11 + m22) / 2 + Math.sqrt(((m11 - m22) / 2) * ((m11 - m22) / 2) + m12 * m12));
  }
  const C = 120, S = 42;
  const pt = ([x, y]: number[]) => `${(C + x * S).toFixed(1)},${(C - y * S).toFixed(1)}`;
  const ballPts = (r: number) => {
    if (p === "1") return [[r, 0], [0, r], [-r, 0], [0, -r]];
    if (p === "∞") return [[r, r], [-r, r], [-r, -r], [r, -r]];
    return Array.from({ length: 73 }, (_, i) => [r * Math.cos((i / 72) * 2 * Math.PI), r * Math.sin((i / 72) * 2 * Math.PI)]);
  };
  const image = ballPts(1).map(([x, y]) => ap(x, y));
  const slider = (label: string, v: number, set: (x: number) => void) => (
    <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
      {label} {(v / 10).toFixed(1)}
      <input type="range" min={-15} max={15} value={v} onChange={(e) => set(Number(e.target.value))} aria-label={label} style={{ width: 90 }} />
    </label>
  );
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {PS.map((q) => (
          <button key={q} type="button" className="seg" aria-pressed={p === q} onClick={() => setP(q)}>p = {q}</button>
        ))}
      </div>
      <div className="viz-controls" style={{ flexWrap: "wrap", gap: 12 }}>
        {slider("a", a10, setA10)}
        {slider("b", b10, setB10)}
      </div>
      <svg viewBox="0 0 240 240" style={{ width: "100%", maxWidth: 340, display: "block", margin: "0 auto" }} role="img" aria-label="The unit ball, its image and the smallest enclosing ball">
        <defs><clipPath id="onv-clip"><rect x={0} y={0} width={240} height={240} /></clipPath></defs>
        <g clipPath="url(#onv-clip)">
          <polygon points={ballPts(1).map(pt).join(" ")} fill="none" stroke="var(--border)" />
          <polygon points={ballPts(norm).map(pt).join(" ")} fill="none" stroke="var(--danger)" strokeDasharray="5 3" />
          <polygon points={image.map(pt).join(" ")} fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth={2} />
        </g>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        A = [[1, {(a10 / 10).toFixed(1)}], [{(b10 / 10).toFixed(1)}, 0.5]], ‖A‖_{p} = {norm.toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Grey: the unit ball of the p-norm. Blue: its image under A. Red dashed: the smallest p-ball that contains the image;
        its radius is the operator norm. For p = 1 the image is the convex hull of ±Ae₁, ±Ae₂, so the norm is the largest
        column sum of absolute values; for p = ∞ it is the largest row sum; for p = 2 it is the ellipse&apos;s longest
        semi-axis, the top singular value.
      </figcaption>
    </figure>
  );
}
