"use client";

import { useState } from "react";

// harmonic oscillator x'' = -x, energy (x^2 + v^2) / 2, integrated by explicit Euler or velocity Verlet
const METHODS = ["explicit Euler", "velocity Verlet"];
const DTS = [0.1, 0.3, 0.6];

/** One step of the chosen method from (x, v). */
export function stepOsc(m: number, dt: number, x: number, v: number) {
  if (m === 0) return [x + dt * v, v - dt * x];
  const vh = v - (dt / 2) * x;
  const xn = x + dt * vh;
  return [xn, vh - (dt / 2) * xn];
}

/** Trajectory of n steps from (x0, v0). */
export function evolve(
  m: number,
  dt: number,
  n: number,
  x0: number,
  v0: number,
) {
  const out: [number, number][] = [[x0, v0]];
  let [x, v] = [x0, v0];
  for (let i = 0; i < n; i++) {
    [x, v] = stepOsc(m, dt, x, v);
    out.push([x, v]);
  }
  return out;
}

const area = (q: [number, number][]) =>
  Math.abs(
    q.reduce(
      (s, p, i) =>
        s + p[0] * q[(i + 1) % q.length][1] - q[(i + 1) % q.length][0] * p[1],
      0,
    ) / 2,
  );

export function SymplecticViz() {
  const [m, setM] = useState(0);
  const [d, setD] = useState(1);
  const [n, setN] = useState(10);
  const dt = DTS[d];
  const path = evolve(m, dt, n, 1, 0);
  // a small square of starting states around (1, 0), carried along
  const corners: [number, number][] = [
    [0.8, -0.2],
    [1.2, -0.2],
    [1.2, 0.2],
    [0.8, 0.2],
  ];
  const blob = corners.map((c) => evolve(m, dt, n, c[0], c[1])[n]);
  const [x, v] = path[n];
  const E = (x * x + v * v) / 2;
  const fmt = (u: number) => (u < 1000 ? u.toFixed(3) : u.toExponential(2));
  const ratio = area(blob) / 0.16;
  const ox = 100,
    oy = 100,
    s = 28;
  const P = (p: [number, number]) => [ox + p[0] * s, oy - p[1] * s];
  const clip = (p: [number, number]): [number, number] => {
    const r = Math.hypot(p[0], p[1]);
    return r > 3 ? [(p[0] * 3) / r, (p[1] * 3) / r] : p;
  };
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Integrator">
          {METHODS.map((name, j) => (
            <button
              key={name}
              type="button"
              className="seg"
              aria-pressed={m === j}
              onClick={() => {
                setM(j);
                setN(0);
              }}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Time step">
          {DTS.map((v, j) => (
            <button
              key={v}
              type="button"
              className="seg"
              aria-pressed={d === j}
              onClick={() => {
                setD(j);
                setN(0);
              }}
            >
              dt = {v}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn"
          onClick={() => setN(Math.min(n + 10, 100))}
        >
          10 steps
        </button>
        <button type="button" className="btn" onClick={() => setN(0)}>
          reset
        </button>
      </div>
      <svg
        viewBox="0 0 340 200"
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Phase plane of a harmonic oscillator, with the trajectory of an integrator and a small patch of starting states carried along"
      >
        <line
          x1={ox - 95}
          y1={oy}
          x2={ox + 95}
          y2={oy}
          stroke="var(--grid-line)"
        />
        <line
          x1={ox}
          y1={oy - 95}
          x2={ox}
          y2={oy + 95}
          stroke="var(--grid-line)"
        />
        <circle
          cx={ox}
          cy={oy}
          r={s}
          fill="none"
          stroke="var(--success)"
          strokeDasharray="3 3"
        />
        <circle cx={ox} cy={oy} r={3 * s} fill="none" stroke="var(--border)" />
        <path
          d={path
            .map((p, i) => `${i ? "L" : "M"}${P(clip(p)).join(",")}`)
            .join(" ")}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={1.4}
        />
        <polygon
          points={blob.map((p) => P(clip(p)).join(",")).join(" ")}
          fill="var(--danger)"
          fillOpacity={0.35}
          stroke="var(--danger)"
        />
        <circle
          cx={P(clip([x, v]))[0]}
          cy={P(clip([x, v]))[1]}
          r={3.5}
          fill="var(--text)"
        />
        <text x={ox + 92} y={oy - 4} textAnchor="end" className="viz-label">
          x
        </text>
        <text x={ox + 4} y={oy - 86} className="viz-label">
          v
        </text>
        <text x={210} y={50} className="viz-label">
          steps {n}
        </text>
        <text x={210} y={70} className="viz-label">
          energy {fmt(E)} (start 0.5)
        </text>
        <text x={210} y={90} className="viz-label">
          patch area × {fmt(ratio)}
        </text>
      </svg>
      <figcaption className="viz-caption">
        The phase plane of a spring: position across, velocity up. The exact
        motion stays on the dashed circle of constant energy. Explicit Euler
        spirals outwards, its energy multiplied by 1 + dt² every step, and it
        stretches the red patch of nearby starting states. Velocity Verlet keeps
        the patch area exactly and its energy only wobbles, for every step size
        here. Points beyond the outer circle are drawn on it.
      </figcaption>
    </figure>
  );
}
