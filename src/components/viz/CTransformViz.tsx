"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

// nine source points, cost c(x, y) = (x - y)^2 / 2
const XS = Array.from({ length: 9 }, (_, i) => -2 + i * 0.5);
const r0 = rand(4049);
const RND = XS.map(() => 2 * r0() - 1);
const PHIS = [
  { name: "φ = 0", phi: XS.map(() => 0) },
  { name: "φ(x) = x", phi: XS.map((x) => x) },
  { name: "random φ", phi: RND },
];
const NY = 241,
  YS = Array.from({ length: NY }, (_, k) => -3 + (6 * k) / (NY - 1));

/** The c-transform on the grid and the number of sources whose parabola touches it. */
export function envelope(phi: number[]) {
  const arg: number[] = [];
  const val = YS.map((y) => {
    let best = Infinity,
      bi = 0;
    XS.forEach((x, i) => {
      const v = (x - y) ** 2 / 2 - phi[i];
      if (v < best) {
        best = v;
        bi = i;
      }
    });
    arg.push(bi);
    return best;
  });
  return { val, active: new Set(arg).size };
}

export function CTransformViz() {
  const [k, setK] = useState(2);
  const phi = PHIS[k].phi;
  const { val, active } = envelope(phi);
  const W = 340,
    H = 200,
    XL = 30,
    XR = W - 10,
    Y0 = 10,
    Y1 = H - 24,
    LO = -2.5,
    HI = 3;
  const sx = (y: number) => XL + ((y + 3) / 6) * (XR - XL);
  const sy = (v: number) => Y1 - ((v - LO) / (HI - LO)) * (Y1 - Y0);
  const line = (vs: number[]) =>
    vs.map((v, j) => `${j ? "L" : "M"}${sx(YS[j])},${sy(v)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Potential">
          {PHIS.map((p, j) => (
            <button
              key={p.name}
              type="button"
              className="seg"
              aria-pressed={k === j}
              onClick={() => setK(j)}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Parabolas c(x_i, y) minus phi(x_i) for nine sources and their lower envelope, the c-transform"
      >
        <defs>
          <clipPath id="ctclip">
            <rect x={XL} y={Y0} width={XR - XL} height={Y1 - Y0} />
          </clipPath>
        </defs>
        <line x1={XL} y1={sy(0)} x2={XR} y2={sy(0)} stroke="var(--border)" />
        <g clipPath="url(#ctclip)">
          {XS.map((x, i) => (
            <path
              key={i}
              d={line(YS.map((y) => (x - y) ** 2 / 2 - phi[i]))}
              fill="none"
              stroke="var(--text-muted)"
              strokeWidth={0.8}
              strokeOpacity={0.6}
            />
          ))}
          <path
            d={line(val)}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={2.4}
          />
        </g>
        {XS.map((x, i) => (
          <circle key={i} cx={sx(x)} cy={Y1 + 8} r={2.5} fill="var(--accent)" />
        ))}
        {[-2, 0, 2].map((y) => (
          <text
            key={y}
            x={sx(y)}
            y={H - 2}
            textAnchor="middle"
            className="viz-label"
          >
            {y}
          </text>
        ))}
        {[-2, 0, 2].map((v) => (
          <text
            key={v}
            x={XL - 4}
            y={sy(v) + 4}
            textAnchor="end"
            className="viz-label"
          >
            {v}
          </text>
        ))}
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        sources whose parabola touches the envelope: {active} of {XS.length}
      </div>
      <figcaption className="viz-caption">
        Each source x (dots) contributes the parabola y ↦ (x − y)²/2 − φ(x),
        lowered by its price. The c-transform φᶜ is their lower envelope (thick
        curve): the largest ψ with φ(x) + ψ(y) ≤ c(x, y) for every pair. A
        source whose parabola never touches the envelope could raise its price
        without breaking any constraint. Transforming back does exactly that,
        which is why a double transform can only improve the dual.
      </figcaption>
    </figure>
  );
}
