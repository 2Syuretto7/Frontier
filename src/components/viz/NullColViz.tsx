"use client";

import { useState } from "react";
import { fmtNum } from "./format";
import { det2, type Mat } from "./la";
import { MatrixView } from "./MatrixView";
import { Arrow, Axes, scales, type View } from "./Plot";

const V: View = { xmin: -4, xmax: 4, ymin: -4, ymax: 4, w: 260, h: 260 };

/** For a 2 × 2 matrix: the null space in the input plane and the column space in the output plane. */
export function NullColViz() {
  const [d, setD] = useState(2);
  const [t, setT] = useState(1);
  const A: Mat = [[1, 2], [0.5, d]];
  const singular = Math.abs(det2(A)) < 1e-9;
  const x = singular ? [-2 * t, t] : [0, 0];
  const s = scales(V);
  const nullDir = [-2, 1], colDir = [1, 0.5];
  return (
    <figure className="viz">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        <div>
          <p className="viz-caption" style={{ marginTop: 0 }}>Input plane: the null space</p>
          <Axes v={V} label="The null space of A">
            {singular ? <line x1={s.X(-4 * nullDir[0])} y1={s.Y(-4 * nullDir[1])} x2={s.X(4 * nullDir[0])} y2={s.Y(4 * nullDir[1])} className="plot-curve" /> : <circle cx={s.X(0)} cy={s.Y(0)} r={5} className="plot-point" />}
            {singular && <circle cx={s.X(x[0])} cy={s.Y(x[1])} r={5} className="plot-hot" />}
          </Axes>
        </div>
        <div>
          <p className="viz-caption" style={{ marginTop: 0 }}>Output plane: the column space</p>
          <Axes v={V} label="The column space of A">
            {singular ? <line x1={s.X(-8 * colDir[0])} y1={s.Y(-8 * colDir[1])} x2={s.X(8 * colDir[0])} y2={s.Y(8 * colDir[1])} className="plot-curve" /> : <rect x={0} y={0} width={V.w} height={V.h} className="viz-region" style={{ opacity: 0.35, strokeWidth: 0 }} />}
            <Arrow x1={s.X(0)} y1={s.Y(0)} x2={s.X(A[0][0])} y2={s.Y(A[1][0])} className="plot-arrow is-muted" />
            <Arrow x1={s.X(0)} y1={s.Y(0)} x2={s.X(A[0][1])} y2={s.Y(A[1][1])} className="plot-arrow is-muted" />
          </Axes>
        </div>
      </div>
      <div className="viz-sliders">
        <label>entry a₂₂ = <span className="mono">{fmtNum(d)}</span><input type="range" min={-1} max={3} step={0.5} value={d} onChange={(e) => setD(Number(e.target.value))} /></label>
        {singular && <label>point on the null space, t = <span className="mono">{fmtNum(t)}</span><input type="range" min={-1.5} max={1.5} step={0.25} value={t} onChange={(e) => setT(Number(e.target.value))} /></label>}
      </div>
      <div className="mat-row"><MatrixView M={A} label="A" /></div>
      <figcaption className="viz-caption" aria-live="polite">
        {singular
          ? `With a₂₂ = 1, column 2 is twice column 1. The columns span only a line, so the column space is a line, and the vectors (−2t, t) all map to 0: the null space is a line too. For the red point, A(${fmtNum(x[0])}, ${fmtNum(x[1])}) = (0, 0).`
          : "The two columns point in different directions, so their combinations fill the output plane (shaded), and only x = 0 maps to 0: the null space is just the origin. Set a₂₂ = 1 to make the columns dependent."}
      </figcaption>
    </figure>
  );
}
