"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

const N = 1000,
  DT = 1 / N;
const r0 = rand(1923);
const B = [0];
for (let i = 0; i < N; i++) {
  const u = Math.max(r0(), 1e-12),
    v = r0();
  B.push(
    B[i] +
      Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * Math.sqrt(DT),
  );
}

type Fn = {
  name: string;
  f: (x: number) => number;
  f1: (x: number) => number;
  f2: (x: number) => number;
};
const FNS: Fn[] = [
  { name: "x²", f: (x) => x * x, f1: (x) => 2 * x, f2: () => 2 },
  { name: "eˣ", f: Math.exp, f1: Math.exp, f2: Math.exp },
  {
    name: "cos x",
    f: Math.cos,
    f1: (x) => -Math.sin(x),
    f2: (x) => -Math.cos(x),
  },
];

/** f(B_t) - f(0) against the ordinary chain rule sum of f'(B) dB and the Itô sum that adds f''(B) dt / 2. */
export function itoCurves(j: number) {
  const { f, f1, f2 } = FNS[j];
  const exact = B.map((b) => f(b) - f(0));
  const naive = [0],
    ito = [0];
  for (let k = 0; k < N; k++) {
    const d = f1(B[k]) * (B[k + 1] - B[k]);
    naive.push(naive[k] + d);
    ito.push(ito[k] + d + 0.5 * f2(B[k]) * DT);
  }
  return { exact, naive, ito };
}

export function ItoFormulaViz() {
  const [j, setJ] = useState(0);
  const { exact, naive, ito } = itoCurves(j);
  const W = 340,
    H = 200,
    X0 = 30,
    X1 = W - 8,
    Y0 = 8,
    Y1 = H - 22;
  const all = [...exact, ...naive, ...ito];
  const lo = Math.min(...all) - 0.05,
    hi = Math.max(...all) + 0.05;
  const sx = (k: number) => X0 + (k / N) * (X1 - X0);
  const sy = (v: number) => Y1 - ((v - lo) / (hi - lo)) * (Y1 - Y0);
  const line = (p: number[]) =>
    p.map((v, k) => `${k ? "L" : "M"}${sx(k)},${sy(v)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Function f">
          {FNS.map((fn, i) => (
            <button
              key={fn.name}
              type="button"
              className="seg"
              aria-pressed={j === i}
              onClick={() => setJ(i)}
            >
              f(x) = {fn.name}
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
        aria-label="A function of Brownian motion compared with two candidate chain rules"
      >
        <line x1={X0} y1={sy(0)} x2={X1} y2={sy(0)} stroke="var(--border)" />
        <path
          d={line(naive)}
          fill="none"
          stroke="var(--danger)"
          strokeWidth={1.2}
        />
        <path
          d={line(exact)}
          fill="none"
          stroke="var(--text)"
          strokeWidth={2.4}
          strokeOpacity={0.35}
        />
        <path
          d={line(ito)}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={1.2}
        />
        <text x={X0 - 4} y={sy(0) + 4} textAnchor="end" className="viz-label">
          0
        </text>
        {[0, 0.5, 1].map((t) => (
          <text
            key={t}
            x={sx(t * N)}
            y={H - 6}
            textAnchor={t === 1 ? "end" : "middle"}
            className="viz-label"
          >
            {t}
          </text>
        ))}
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        at t = 1: f(B) − f(0) = {exact[N].toFixed(3)}, Itô sum{" "}
        {ito[N].toFixed(3)}, chain rule sum {naive[N].toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        One Brownian path on a grid of 1,000 steps. The thick grey curve is f(B)
        − f(0) over time. The red curve adds up f′(B) dB, as the ordinary chain
        rule would; it drifts away, because squared increments add up to elapsed
        time rather than vanishing. The coloured curve adds the second-order
        term ½ f″(B) dt as well, and follows the grey curve: this is Itô&apos;s
        formula.
      </figcaption>
    </figure>
  );
}
