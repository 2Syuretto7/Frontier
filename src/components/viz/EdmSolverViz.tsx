"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const MUS = [-1, 1],
  S0 = 0.3;

/** Exact denoiser D(x; sigma) = E[x_0 | x_0 + sigma n = x] for two equal bumps N(-1, 0.3^2) and N(1, 0.3^2). */
export function edmD(x: number, s: number) {
  const v = S0 * S0 + s * s;
  const l = MUS.map((m) => -((x - m) ** 2) / (2 * v)),
    mx = Math.max(...l);
  const w = l.map((u) => Math.exp(u - mx)),
    z = w[0] + w[1];
  return MUS.reduce(
    (a, m, k) => a + (w[k] / z) * (m + ((S0 * S0) / v) * (x - m)),
    0,
  );
}

/** n noise levels from 80 down to 0.002 with exponent rho, followed by 0. */
export function karras(n: number, rho: number) {
  const a = 80 ** (1 / rho),
    b = 0.002 ** (1 / rho);
  return [
    ...Array.from(
      { length: n },
      (_, i) => (a + (i / (n - 1)) * (b - a)) ** rho,
    ),
    0,
  ];
}

/** Solve dx/dsigma = (x - D(x; sigma)) / sigma along the levels; returns the end point and the number of D calls. */
export function solveOde(x: number, ss: number[], heun: boolean) {
  let nfe = 0;
  for (let i = 0; i + 1 < ss.length; i++) {
    const s = ss[i],
      sn = ss[i + 1],
      d = (x - edmD(x, s)) / s,
      xe = x + (sn - s) * d;
    nfe++;
    if (heun && sn > 0) {
      const d2 = (xe - edmD(xe, sn)) / sn;
      nfe++;
      x += ((sn - s) * (d + d2)) / 2;
    } else x = xe;
  }
  return { x, nfe };
}

/** Mean distance from the converged solution against the number of D calls, for Euler and Heun. */
export function errorCurves(rho: number, m: number, seed: number) {
  const r = rand(seed);
  const x0 = Array.from(
    { length: m },
    () => 80 * Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r()),
  );
  const ref = x0.map((x) => solveOde(x, karras(1000, 7), true).x);
  const curve = (heun: boolean, ns: number[]) =>
    ns.map((n) => {
      const ss = karras(n, rho);
      let e = 0,
        nfe = 0;
      x0.forEach((x, i) => {
        const o = solveOde(x, ss, heun);
        e += Math.abs(o.x - ref[i]);
        nfe = o.nfe;
      });
      return { nfe, err: e / m };
    });
  return {
    euler: curve(false, [8, 16, 32, 64, 128]),
    heun: curve(true, [4, 8, 16, 32, 64]),
  };
}

const RHOS = [1, 3, 7];

export function EdmSolverViz() {
  const [ri, setRi] = useState(2);
  const { euler, heun } = useMemo(() => errorCurves(RHOS[ri], 300, 1), [ri]);
  const W = 330,
    H = 220,
    X0 = 40,
    PW = 270,
    Y0 = 10,
    PH = 170;
  const lx = (n: number) =>
    X0 +
    ((Math.log10(n) - Math.log10(6)) / (Math.log10(140) - Math.log10(6))) * PW;
  const ly = (e: number) =>
    Y0 + ((1 - Math.log10(Math.min(10, Math.max(1e-3, e)))) / 4) * PH;
  const line = (pts: { nfe: number; err: number }[]) =>
    pts
      .map(
        (p, i) =>
          `${i ? "L" : "M"}${lx(p.nfe).toFixed(1)},${ly(p.err).toFixed(1)}`,
      )
      .join(" ");
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}
      >
        <span className="viz-label">step spacing ρ</span>
        <div
          className="segmented"
          role="group"
          aria-label="Step spacing exponent"
        >
          {RHOS.map((v, i) => (
            <button
              key={v}
              type="button"
              className="seg"
              aria-pressed={ri === i}
              onClick={() => setRi(i)}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          maxWidth: 440,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="ODE solver error against network evaluations"
      >
        <rect
          x={X0}
          y={Y0}
          width={PW}
          height={PH}
          fill="none"
          stroke="var(--border)"
        />
        {[10, 1, 0.1, 0.01, 0.001].map((e) => (
          <g key={e}>
            <line
              x1={X0}
              x2={X0 + PW}
              y1={ly(e)}
              y2={ly(e)}
              stroke="var(--grid-line)"
            />
            <text
              x={X0 - 4}
              y={ly(e) + 4}
              textAnchor="end"
              className="viz-label"
            >
              {e}
            </text>
          </g>
        ))}
        {[8, 16, 32, 64, 128].map((n) => (
          <text
            key={n}
            x={lx(n)}
            y={Y0 + PH + 14}
            textAnchor="middle"
            className="viz-label"
          >
            {n}
          </text>
        ))}
        <text
          x={X0 + PW / 2}
          y={H - 4}
          textAnchor="middle"
          className="viz-label"
        >
          network evaluations
        </text>
        <path
          d={line(euler)}
          fill="none"
          stroke="var(--text-muted)"
          strokeWidth={2}
        />
        {euler.map((p, i) => (
          <circle
            key={i}
            cx={lx(p.nfe)}
            cy={ly(p.err)}
            r={3}
            fill="var(--text-muted)"
          />
        ))}
        <path
          d={line(heun)}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
        />
        {heun.map((p, i) => (
          <circle
            key={i}
            cx={lx(p.nfe)}
            cy={ly(p.err)}
            r={3}
            fill="var(--accent)"
          />
        ))}
      </svg>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "4px 16px",
          justifyContent: "center",
          fontSize: 13,
        }}
      >
        <span>
          <span style={{ color: "var(--text-muted)" }}>●</span> Euler
        </span>
        <span>
          <span style={{ color: "var(--accent)" }}>●</span> Heun
        </span>
      </div>
      <figcaption className="viz-caption">
        Average distance between the sampler&apos;s output and the exact ODE
        solution, for 300 starting points at σ = 80 and the exact denoiser of
        two bumps at ±1, on log scales. Levels evenly spaced in σ (ρ = 1) waste
        almost every step where nothing happens; ρ = 7 crowds them near σ = 0,
        where the denoiser changes fastest. There, Heun&apos;s error falls about
        four times per doubling of evaluations and Euler&apos;s about two, so
        Heun wins once the budget passes a few dozen evaluations; with very few
        steps its correction can overshoot.
      </figcaption>
    </figure>
  );
}
