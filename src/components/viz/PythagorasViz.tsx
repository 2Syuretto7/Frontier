"use client";

import { useState } from "react";
import { fmtNum } from "./format";

const S = 300; // side of the big square, in screen units
const O = 20; // margin

/**
 * The rearrangement proof of Pythagoras. A square of side a + b holds four copies of a right triangle.
 * Arranged one way, the uncovered space is the square on the hypotenuse; arranged another, it is the
 * squares on the two legs. The four triangles are the same in both, so the uncovered areas are equal.
 */
export function PythagorasViz() {
  const [split, setSplit] = useState(0.35); // a as a fraction of a + b
  const [layout, setLayout] = useState<"tilted" | "split">("tilted");
  const a = split * S, b = S - a;
  const P = (x: number, y: number) => `${O + x},${O + y}`;

  // Four triangles for each layout, as point lists in big-square coordinates (y down).
  const tilted = [
    [P(0, 0), P(a, 0), P(0, b)],
    [P(a, 0), P(S, 0), P(S, a)],
    [P(S, a), P(S, S), P(b, S)],
    [P(b, S), P(0, S), P(0, b)],
  ];
  const splitTris = [
    [P(0, 0), P(b, 0), P(b, a)],
    [P(0, 0), P(0, a), P(b, a)],
    [P(b, a), P(S, a), P(S, S)],
    [P(b, a), P(b, S), P(S, S)],
  ];
  const tris = layout === "tilted" ? tilted : splitTris;

  const aLen = split * 10, bLen = 10 - aLen; // label lengths with a + b = 10
  const cLen = Math.hypot(aLen, bLen);

  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${S + 2 * O} ${S + 2 * O}`} role="img" aria-label={layout === "tilted" ? "Four triangles leave the square on the hypotenuse uncovered" : "Four triangles leave the squares on the two legs uncovered"}>
        <rect x={O} y={O} width={S} height={S} className="viz-frame" />
        {layout === "tilted" ? (
          <polygon points={[P(a, 0), P(S, a), P(b, S), P(0, b)].join(" ")} className="viz-region" />
        ) : (
          <>
            <rect x={O} y={O + a} width={b} height={b} className="viz-region" />
            <rect x={O + b} y={O} width={a} height={a} className="viz-region" />
          </>
        )}
        {tris.map((t, i) => <polygon key={i} points={t.join(" ")} className="viz-cell" />)}
        {layout === "tilted" ? (
          <text x={O + S / 2} y={O + S / 2 + 5} textAnchor="middle" className="viz-label is-on">c²</text>
        ) : (
          <>
            <text x={O + b / 2} y={O + a + b / 2 + 5} textAnchor="middle" className="viz-label is-on">b²</text>
            {a > 34 && <text x={O + b + a / 2} y={O + a / 2 + 5} textAnchor="middle" className="viz-label is-on">a²</text>}
          </>
        )}
      </svg>
      <div className="viz-controls">
        <button type="button" className={layout === "tilted" ? "btn btn-primary" : "btn"} aria-pressed={layout === "tilted"} onClick={() => setLayout("tilted")}>Arrangement 1</button>
        <button type="button" className={layout === "split" ? "btn btn-primary" : "btn"} aria-pressed={layout === "split"} onClick={() => setLayout("split")}>Arrangement 2</button>
      </div>
      <div className="viz-sliders">
        <label>
          <span>Shape of the triangle <span className="mono">a = {fmtNum(Number(aLen.toFixed(1)))}, b = {fmtNum(Number(bLen.toFixed(1)))}</span></span>
          <input type="range" min={0.15} max={0.5} step={0.05} value={split} onChange={(e) => setSplit(Number(e.target.value))} />
        </label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The big square has side <span className="mono">a + b</span> in both arrangements, and the four triangles are the same.
        So the shaded area is the same too:{" "}
        {layout === "tilted"
          ? <>here it is one square on the hypotenuse, <span className="mono">c² ≈ {cLen.toFixed(2)}² ≈ {(cLen * cLen).toFixed(1)}</span>.</>
          : <>here it is two squares on the legs, <span className="mono">a² + b² = {(aLen * aLen).toFixed(1)} + {(bLen * bLen).toFixed(1)} = {(aLen * aLen + bLen * bLen).toFixed(1)}</span>.</>}
      </figcaption>
    </figure>
  );
}
