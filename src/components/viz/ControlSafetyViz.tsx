"use client";

import { useState } from "react";
import { phi } from "./RobustFeatureViz";

const N = 1000;

/** Inverse standard normal CDF by bisection on phi. */
function invPhi(q: number) {
  let lo = -8,
    hi = 8;
  for (let i = 0; i < 60; i++) {
    const m = (lo + hi) / 2;
    if (phi(m) < q) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}

/** Safety of upfront auditing of the first k = aN tasks against the best attack rate, when an unaudited attack works with probability b. */
export function upfrontSafety(a: number, b: number) {
  const k = Math.round(a * N);
  let best = 0;
  for (let i = 1; i <= 400; i++) {
    const p = 10 ** (-4 + (i / 400) * 4);
    const red = (1 - p) ** k * (1 - (1 - p * b) ** (N - k));
    if (red > best) best = red;
  }
  return 1 - best;
}

/** Safety of trusted monitoring that audits the top share a of suspicion scores, attacks scoring mu higher on average. */
export function monitorSafety(a: number, mu: number, b: number) {
  const c = 1 - phi(invPhi(1 - a) - mu);
  return c / (c + (1 - c) * b);
}

export function ControlSafetyViz() {
  const [mi, setMi] = useState(20);
  const [bi, setBi] = useState(50);
  const mu = mi / 10,
    b = bi / 100;
  const W = 330,
    H = 200,
    x0 = 34,
    y0 = 10,
    pw = 280,
    ph = 150,
    amax = 0.1;
  const sx = (a: number) => x0 + (a / amax) * pw;
  const sy = (v: number) => y0 + (1 - v) * ph;
  const as = Array.from({ length: 40 }, (_, i) => ((i + 1) * amax) / 40);
  const path = (fn: (a: number) => number) =>
    as
      .map(
        (a, i) => `${i ? "L" : "M"}${sx(a).toFixed(1)},${sy(fn(a)).toFixed(1)}`,
      )
      .join(" ");
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          how much more suspicious attacks look: {mu.toFixed(1)}{" "}
          <input
            type="range"
            min={0}
            max={40}
            value={mi}
            onChange={(e) => setMi(+e.target.value)}
          />
        </label>
        <label className="viz-label">
          share of unnoticed attacks that work: {b.toFixed(2)}{" "}
          <input
            type="range"
            min={10}
            max={100}
            value={bi}
            onChange={(e) => setBi(+e.target.value)}
          />
        </label>
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
        aria-label="Safety of two control protocols against the human audit budget"
      >
        <rect
          x={x0}
          y={y0}
          width={pw}
          height={ph}
          fill="none"
          stroke="var(--border)"
        />
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line
              x1={x0}
              x2={x0 + pw}
              y1={sy(v)}
              y2={sy(v)}
              stroke="var(--grid-line)"
            />
            <text
              x={x0 - 4}
              y={sy(v) + 4}
              textAnchor="end"
              className="viz-label"
            >
              {v}
            </text>
          </g>
        ))}
        {[0, 0.05, 0.1].map((a) => (
          <text
            key={a}
            x={sx(a)}
            y={y0 + ph + 14}
            textAnchor="middle"
            className="viz-label"
          >
            {`${Math.round(a * 100)}%`}
          </text>
        ))}
        <path
          d={path((a) => upfrontSafety(a, b))}
          fill="none"
          stroke="var(--text-muted)"
          strokeWidth={2}
          strokeDasharray="5 3"
        />
        <path
          d={path((a) => monitorSafety(a, mu, b))}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
        />
        <text
          x={x0 + pw / 2}
          y={H - 4}
          textAnchor="middle"
          className="viz-label"
        >
          share of outputs humans can audit
        </text>
      </svg>
      <div
        style={{
          display: "flex",
          gap: "4px 16px",
          justifyContent: "center",
          fontSize: 13,
          flexWrap: "wrap",
        }}
      >
        <span style={{ color: "var(--text-muted)" }}>
          audit the first outputs
        </span>
        <span style={{ color: "var(--accent)" }}>
          audit the outputs a trusted model finds most suspicious
        </span>
      </div>
      <figcaption className="viz-caption">
        An untrusted model solves 1,000 tasks and may slip a backdoor into any
        of them; the blue team wins if it audits an attack before one succeeds.
        Auditing the first few outputs is easily beaten by attacking rarely.
        Auditing the outputs a weaker, trusted model finds most suspicious does
        much better, as long as attacks look at least somewhat suspicious.
      </figcaption>
    </figure>
  );
}
