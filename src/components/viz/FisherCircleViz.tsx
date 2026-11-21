"use client";

import { useState } from "react";

// Bernoulli(p) mapped to (2 sqrt(p), 2 sqrt(1 - p)) on a quarter circle of radius 2; Fisher-Rao distance is arc length
const PS = [0.01, 0.1, 0.3, 0.5, 0.7, 0.9, 0.99];

/** Fisher-Rao distance between Bernoulli(p) and Bernoulli(q), and KL(p || q). */
export function compare(p: number, q: number) {
  const bc = Math.sqrt(p * q) + Math.sqrt((1 - p) * (1 - q));
  const kl = p * Math.log(p / q) + (1 - p) * Math.log((1 - p) / (1 - q));
  return { fr: 2 * Math.acos(Math.min(1, bc)), kl };
}

export function FisherCircleViz() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(1);
  const p = PS[a],
    q = PS[b];
  const { fr, kl } = compare(p, q);
  const ox = 24,
    oy = 180,
    R = 145;
  const pt = (v: number) => [ox + R * Math.sqrt(v), oy - R * Math.sqrt(1 - v)];
  const ticks = Array.from({ length: 11 }, (_, i) => i / 10);
  const lx = (v: number) => 210 + v * 115;
  const t0 = Math.asin(Math.sqrt(Math.min(p, q))),
    t1 = Math.asin(Math.sqrt(Math.max(p, q)));
  const arc = Array.from({ length: 41 }, (_, i) => {
    const t = t0 + ((t1 - t0) * i) / 40;
    return `${i ? "L" : "M"}${ox + R * Math.sin(t)},${oy - R * Math.cos(t)}`;
  }).join(" ");
  const picker = (label: string, k: number, set: (j: number) => void) => (
    <div className="segmented" role="group" aria-label={label}>
      {PS.map((v, j) => (
        <button
          key={v}
          type="button"
          className="seg"
          aria-pressed={k === j}
          onClick={() => set(j)}
        >
          {v}
        </button>
      ))}
    </div>
  );
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <span className="viz-label">p</span>
        {picker("first distribution", a, setA)}
        <span className="viz-label">q</span>
        {picker("second distribution", b, setB)}
      </div>
      <svg
        viewBox="0 0 340 190"
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Bernoulli distributions placed on a quarter circle by the square-root map, with the Fisher-Rao distance as arc length"
      >
        <path
          d={`M${ox},${oy - R} A${R},${R} 0 0 1 ${ox + R},${oy}`}
          fill="none"
          stroke="var(--border-strong)"
          strokeWidth={1.2}
        />
        {ticks.map((v) => {
          const [x, y] = pt(v);
          return (
            <circle key={v} cx={x} cy={y} r={2} fill="var(--text-faint)" />
          );
        })}
        <path d={arc} fill="none" stroke="var(--accent)" strokeWidth={3} />
        {[p, q].map((v, i) => {
          const [x, y] = pt(v);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={4.5}
              fill={i ? "var(--danger)" : "var(--text)"}
            />
          );
        })}
        <text x={ox + 30} y={24} className="viz-label">
          sphere picture (p = 0.0, 0.1, …, 1.0)
        </text>
        <line
          x1={lx(0)}
          y1={110}
          x2={lx(1)}
          y2={110}
          stroke="var(--border-strong)"
        />
        {ticks.map((v) => (
          <line
            key={v}
            x1={lx(v)}
            y1={106}
            x2={lx(v)}
            y2={114}
            stroke="var(--text-faint)"
          />
        ))}
        <line
          x1={lx(Math.min(p, q))}
          y1={110}
          x2={lx(Math.max(p, q))}
          y2={110}
          stroke="var(--accent)"
          strokeWidth={3}
        />
        <circle cx={lx(p)} cy={110} r={4.5} fill="var(--text)" />
        <circle cx={lx(q)} cy={110} r={4.5} fill="var(--danger)" />
        <text x={210} y={96} className="viz-label">
          parameter p
        </text>
        <text x={210} y={140} className="viz-label">
          |p − q| = {Math.abs(p - q).toFixed(3)}
        </text>
        <text x={210} y={158} className="viz-label">
          Fisher-Rao = {fr.toFixed(3)}
        </text>
        <text x={210} y={176} className="viz-label">
          KL(p‖q) = {kl.toFixed(3)}
        </text>
      </svg>
      <figcaption className="viz-caption">
        Each Bernoulli distribution is placed at (2√p, 2√(1 − p)) on a circle of
        radius 2. Equal steps in p (grey dots) are spread unevenly: they are far
        apart near p = 0 and p = 1, where a change in p is easy to detect from
        data, and bunched in the middle. The Fisher-Rao distance is the arc
        length on the circle. Compare 0.01 to 0.1 with 0.5 to 0.7.
      </figcaption>
    </figure>
  );
}
