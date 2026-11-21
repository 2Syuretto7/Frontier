"use client";

import { useState } from "react";

const X0 = [0.7, -1.3];

function f(x: number[]) {
  return Math.sin(x[0]) * x[1] * x[1] + Math.exp(0.5 * x[0]);
}

function grad(x: number[], bug: boolean) {
  const dx = Math.cos(x[0]) * x[1] * x[1] + 0.5 * Math.exp(0.5 * x[0]);
  const dy = (bug ? 1 : 2) * Math.sin(x[0]) * x[1];
  return [dx, dy];
}

/** Largest coordinate-wise relative error between an analytic and a central-difference gradient. */
export function gradCheckError(eps: number, bug: boolean) {
  const g = grad(X0, bug);
  let worst = 0;
  for (let i = 0; i < 2; i++) {
    const up = [...X0],
      dn = [...X0];
    up[i] += eps;
    dn[i] -= eps;
    const num = (f(up) - f(dn)) / (2 * eps);
    const rel =
      Math.abs(g[i] - num) / Math.max(Math.abs(g[i]) + Math.abs(num), 1e-300);
    worst = Math.max(worst, rel);
  }
  return worst;
}

export function GradCheckViz() {
  const [ei, setE] = useState(-3);
  const [bug, setBug] = useState(false);
  const eps = 10 ** ei;
  const err = gradCheckError(eps, bug);
  const pass = err < 1e-6;
  const W = 330,
    H = 190,
    x0 = 40,
    y0 = 10,
    pw = 275,
    ph = 150;
  const sx = (e: number) => x0 + ((e + 14) / 14) * pw;
  const sy = (l: number) =>
    y0 + ((0 - Math.max(-16, Math.min(0, l))) / 16) * ph;
  const curve = (b: boolean) => {
    const pts: string[] = [];
    for (let e = -14; e <= 0.001; e += 0.1) {
      const v = gradCheckError(10 ** e, b);
      pts.push(`${sx(e)},${sy(Math.log10(Math.max(v, 1e-16)))}`);
    }
    return pts.join(" ");
  };
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          step: 1e{ei}{" "}
          <input
            type="range"
            min={-14}
            max={0}
            value={ei}
            onChange={(e) => setE(+e.target.value)}
          />
        </label>
        <button
          type="button"
          className={bug ? "btn btn-primary" : "btn"}
          aria-pressed={bug}
          onClick={() => setBug(!bug)}
        >
          {bug ? "gradient has a bug" : "gradient is correct"}
        </button>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          maxWidth: 460,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Relative error of a gradient check against the finite-difference step, on log scales"
      >
        <rect
          x={x0}
          y={y0}
          width={pw}
          height={ph}
          fill="none"
          stroke="var(--border)"
        />
        {[0, -4, -8, -12, -16].map((l) => (
          <g key={l}>
            <line
              x1={x0}
              x2={x0 + pw}
              y1={sy(l)}
              y2={sy(l)}
              stroke="var(--grid-line)"
            />
            <text
              x={x0 - 4}
              y={sy(l) + 4}
              textAnchor="end"
              className="viz-label"
            >
              1e{l}
            </text>
          </g>
        ))}
        <line
          x1={x0}
          x2={x0 + pw}
          y1={sy(-6)}
          y2={sy(-6)}
          stroke="var(--danger)"
          strokeDasharray="4 3"
        />
        <polyline
          points={curve(bug)}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
        />
        <circle
          cx={sx(ei)}
          cy={sy(Math.log10(Math.max(err, 1e-16)))}
          r={5}
          fill={pass ? "var(--success)" : "var(--danger)"}
        />
        <text
          x={x0 + pw / 2}
          y={H - 4}
          textAnchor="middle"
          className="viz-label"
        >
          finite-difference step, 1e-14 to 1
        </text>
      </svg>
      <p style={{ textAlign: "center", fontSize: 13, margin: "6px 0 0" }}>
        Relative error {err.toExponential(2)}: {pass ? "passes" : "fails"} a
        tolerance of 1e-6.
      </p>
      <figcaption className="viz-caption">
        The curve is computed in double precision. Large steps suffer from
        truncation error, which shrinks like the step squared; tiny steps suffer
        from rounding error, which grows like one over the step. A correct
        gradient passes only near the bottom of the V, so a check run with a bad
        step can fail a correct gradient. A real bug leaves the error high at
        every step.
      </figcaption>
    </figure>
  );
}
