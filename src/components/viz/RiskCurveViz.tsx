"use client";

import { useState } from "react";

// power utility u(x) = x^rho on [0, 100]; the lottery pays HI with probability q, else LO
const RHOS = [1, 0.5, 0.25];
const QS = [0.25, 0.5, 0.75];
const LO = 10,
  HI = 100;

/** Expected value, expected utility, certainty equivalent and risk premium. */
export function summary(rho: number, q: number) {
  const u = (x: number) => Math.pow(x, rho);
  const ev = q * HI + (1 - q) * LO;
  const eu = q * u(HI) + (1 - q) * u(LO);
  const ce = Math.pow(eu, 1 / rho);
  return { ev, eu, ce, premium: ev - ce };
}

export function RiskCurveViz() {
  const [r, setR] = useState(1);
  const [qi, setQi] = useState(1);
  const rho = RHOS[r],
    q = QS[qi];
  const { ev, eu, ce, premium } = summary(rho, q);
  const umax = Math.pow(HI, rho);
  const X = (x: number) => 30 + x * 2.9,
    Y = (v: number) => 170 - (v / umax) * 140;
  const curve = Array.from(
    { length: 101 },
    (_, i) => `${i ? "L" : "M"}${X(i)},${Y(Math.pow(i, rho))}`,
  ).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Utility">
          {RHOS.map((v, j) => (
            <button
              key={v}
              type="button"
              className="seg"
              aria-pressed={r === j}
              onClick={() => setR(j)}
            >
              {["u = x", "u = √x", "u = ∜x"][j]}
            </button>
          ))}
        </div>
        <div
          className="segmented"
          role="group"
          aria-label="Chance of the high prize"
        >
          {QS.map((v, j) => (
            <button
              key={v}
              type="button"
              className="seg"
              aria-pressed={qi === j}
              onClick={() => setQi(j)}
            >
              P(100) = {v}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox="0 0 340 210"
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="A utility curve with a two-outcome lottery, its expected utility and its certainty equivalent"
      >
        <line
          x1={30}
          y1={170}
          x2={325}
          y2={170}
          stroke="var(--border-strong)"
        />
        <line x1={30} y1={20} x2={30} y2={170} stroke="var(--border-strong)" />
        <path d={curve} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <line
          x1={X(LO)}
          y1={Y(Math.pow(LO, rho))}
          x2={X(HI)}
          y2={Y(umax)}
          stroke="var(--text-muted)"
          strokeDasharray="4 3"
        />
        <circle cx={X(ev)} cy={Y(eu)} r={4} fill="var(--danger)" />
        <line
          x1={X(ce)}
          y1={Y(eu)}
          x2={X(ev)}
          y2={Y(eu)}
          stroke="var(--danger)"
        />
        <line
          x1={X(ce)}
          y1={Y(eu)}
          x2={X(ce)}
          y2={170}
          stroke="var(--danger)"
          strokeDasharray="2 2"
        />
        <line
          x1={X(ev)}
          y1={Y(eu)}
          x2={X(ev)}
          y2={170}
          stroke="var(--text-muted)"
          strokeDasharray="2 2"
        />
        <text
          x={X(ce)}
          y={184}
          textAnchor="middle"
          className="viz-label"
          fill="var(--danger)"
        >
          CE
        </text>
        <text x={X(ev)} y={184} textAnchor="middle" className="viz-label">
          EV
        </text>
        <text x={36} y={30} className="viz-label">
          utility
        </text>
        <text x={325} y={164} textAnchor="end" className="viz-label">
          money
        </text>
        <text x={30} y={204} className="viz-label">
          EV {ev.toFixed(1)}, certainty equivalent {ce.toFixed(1)}, risk premium{" "}
          {premium.toFixed(1)}
        </text>
      </svg>
      <figcaption className="viz-caption">
        A lottery pays 100 or 10. Its expected utility (red dot) lies on the
        chord between the two outcomes, above the expected value. Following it
        across to the curve gives the certainty equivalent, the sure amount
        valued as highly as the lottery. With a concave utility the certainty
        equivalent is below the expected value, and the gap is the risk premium.
      </figcaption>
    </figure>
  );
}
