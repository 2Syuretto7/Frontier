"use client";

import { useState } from "react";

export function DpoLossViz() {
  const [beta, setBeta] = useState(0.1);
  const [m, setM] = useState(10);
  const loss = (x: number) => Math.log1p(Math.exp(-beta * x));
  const weight = (x: number) => 1 / (1 + Math.exp(beta * x));
  const W = 340,
    H = 180,
    x0 = 30,
    x1 = W - 10,
    y0 = 10,
    y1 = H - 28;
  const X = (x: number) => x0 + ((x + 40) / 80) * (x1 - x0);
  const Y = (v: number) => y1 - (Math.min(v, 4) / 4) * (y1 - y0);
  const path = (f: (x: number) => number) =>
    Array.from({ length: 161 }, (_, i) => -40 + i * 0.5)
      .map((x, i) => `${i ? "L" : "M"}${X(x).toFixed(1)},${Y(f(x)).toFixed(1)}`)
      .join(" ");
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          β: {beta.toFixed(2)}{" "}
          <input
            type="range"
            min={0.02}
            max={0.5}
            step={0.02}
            value={beta}
            onChange={(e) => setBeta(+e.target.value)}
          />
        </label>
        <label className="viz-label">
          log-ratio margin: {m}{" "}
          <input
            type="range"
            min={-40}
            max={40}
            step={1}
            value={m}
            onChange={(e) => setM(+e.target.value)}
          />
        </label>
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
        aria-label="DPO loss and gradient weight against the log-ratio margin"
      >
        {[0, 1, 2, 3, 4].map((v) => (
          <g key={v}>
            <line
              x1={x0}
              x2={x1}
              y1={Y(v)}
              y2={Y(v)}
              stroke="var(--grid-line)"
            />
            <text
              x={x0 - 6}
              y={Y(v) + 4}
              textAnchor="end"
              className="viz-label"
            >
              {v}
            </text>
          </g>
        ))}
        {[-40, -20, 0, 20, 40].map((v) => (
          <text
            key={v}
            x={X(v)}
            y={y1 + 16}
            textAnchor={v === -40 ? "start" : v === 40 ? "end" : "middle"}
            className="viz-label"
          >
            {v}
          </text>
        ))}
        <path
          d={path(loss)}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2.5}
        />
        <path
          d={path(weight)}
          fill="none"
          stroke="var(--success)"
          strokeWidth={2}
          strokeDasharray="5 3"
        />
        <circle cx={X(m)} cy={Y(loss(m))} r={5} fill="var(--accent)" />
      </svg>
      <p className="viz-label" style={{ textAlign: "center" }}>
        loss {loss(m).toFixed(3)}; gradient weight {weight(m).toFixed(3)}
      </p>
      <figcaption className="viz-caption">
        The margin is how much more the policy has raised the chosen
        response&apos;s log-probability than the rejected one&apos;s, relative
        to the reference model. The solid curve is the DPO loss; the dashed
        curve is the weight each pair receives in the gradient. Pairs the policy
        already gets right by a wide margin stop contributing, and a larger β
        makes that happen sooner, keeping the policy closer to the reference.
      </figcaption>
    </figure>
  );
}
