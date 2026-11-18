"use client";

import { useEffect, useState } from "react";
import { makeRng } from "./ml";

const VF = 0.24203560745276542, COV = 0.14085908577047745, VG = 1 / 12;
const CSTAR = COV / VG;

export function varianceAt(c: number) {
  return VF - 2 * c * COV + c * c * VG;
}

/** Subtracting c(U − ½) from e^U: the variance is a parabola in c, smallest at c* = Cov/Var. */
export function ControlVariateViz() {
  const [c10, setC10] = useState(10);
  const c = c10 / 10;
  const [pts, setPts] = useState<number[]>([]);
  useEffect(() => {
    const r = makeRng(5);
    setPts(Array.from({ length: 120 }, () => r()));
  }, []);
  const mean = Math.E - 1;
  const W = 330, H = 170, X0 = 30, PW = W - 45, PH = 140;
  const sx = (u: number) => X0 + u * PW;
  const sy = (v: number) => 10 + ((2.9 - v) / 2.1) * PH;
  const v = varianceAt(c);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          c {c.toFixed(1)}
          <input type="range" min={0} max={30} value={c10} onChange={(e) => setC10(Number(e.target.value))} aria-label="control variate coefficient" style={{ width: 150 }} />
        </label>
        <button type="button" className="seg" onClick={() => setC10(Math.round(CSTAR * 10))}>use c*</button>
      </div>
      <svg viewBox={`0 0 ${W} ${H + 14}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Samples of e^U against U, with the line of slope c and the adjusted values">
        <line x1={sx(0)} y1={sy(mean - c * 0.5)} x2={sx(1)} y2={sy(mean + c * 0.5)} stroke="var(--accent)" strokeWidth={2} />
        <line x1={sx(0)} y1={sy(mean)} x2={sx(1)} y2={sy(mean)} stroke="var(--danger)" strokeDasharray="3 3" />
        {pts.map((u, i) => (
          <g key={i}>
            <circle cx={sx(u)} cy={sy(Math.exp(u))} r={2} fill="var(--text-muted)" />
            <circle cx={sx(u)} cy={sy(Math.exp(u) - c * (u - 0.5))} r={2} fill="var(--accent)" opacity={0.8} />
          </g>
        ))}
        <text x={sx(0)} y={H + 10} className="viz-label">U = 0</text>
        <text x={sx(1)} y={H + 10} textAnchor="end" className="viz-label">U = 1</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        variance {v.toFixed(4)} vs {VF.toFixed(4)} plain: ratio {(v / VF).toFixed(3)}; best c* = {CSTAR.toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Grey dots are samples of e^U; coloured dots are the adjusted values e^U − c(U − ½), which have the same mean e − 1
        (dashed) because U − ½ has mean zero. The line has slope c. When it matches the trend of the grey dots, the
        adjusted values collapse onto the dashed line and the variance falls to 1.6% of the plain one; too large a c
        overshoots and the variance rises again.
      </figcaption>
    </figure>
  );
}
