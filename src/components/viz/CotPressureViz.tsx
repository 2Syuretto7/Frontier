"use client";

import { useState } from "react";

const T = 300,
  G = 1,
  R = 0.95,
  LR = 0.08;

/** Toy training run: hack rate h and verbalisation rate v under a penalty lam on hacks the chain-of-thought monitor catches. */
export function pressureRun(lam: number, kappa: number) {
  let h = 0.05,
    v = 0.9;
  const out: { h: number; caught: number }[] = [];
  for (let t = 0; t <= T; t++) {
    out.push({ h, caught: h * v * R });
    const dh = h * (1 - h) * (G - lam * v * R);
    const dv = -kappa * lam * h * R * v * (1 - v);
    h = Math.min(1, Math.max(0, h + LR * dh));
    v = Math.min(1, Math.max(0, v + LR * dv));
  }
  return out;
}

export function CotPressureViz() {
  const [li, setLi] = useState(8);
  const [ki, setKi] = useState(10);
  const lam = li / 10,
    kappa = ki / 10;
  const run = pressureRun(lam, kappa);
  const W = 330,
    H = 200,
    x0 = 34,
    y0 = 10,
    pw = 280,
    ph = 150;
  const sx = (t: number) => x0 + (t / T) * pw;
  const sy = (v: number) => y0 + (1 - v) * ph;
  const path = (key: "h" | "caught") =>
    run
      .filter((_, t) => t % 5 === 0)
      .map(
        (d, i) =>
          `${i ? "L" : "M"}${sx(i * 5).toFixed(1)},${sy(d[key]).toFixed(1)}`,
      )
      .join(" ");
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          penalty for hacks the monitor catches: {lam.toFixed(1)}{" "}
          <input
            type="range"
            min={0}
            max={30}
            value={li}
            onChange={(e) => setLi(+e.target.value)}
          />
        </label>
        <label className="viz-label">
          how easily the model learns to hide: {kappa.toFixed(1)}{" "}
          <input
            type="range"
            min={1}
            max={40}
            value={ki}
            onChange={(e) => setKi(+e.target.value)}
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
        aria-label="True hack rate and hacks caught by a chain-of-thought monitor over training"
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
        {[0, 150, 300].map((t) => (
          <text
            key={t}
            x={sx(t)}
            y={y0 + ph + 14}
            textAnchor="middle"
            className="viz-label"
          >
            {t}
          </text>
        ))}
        <path
          d={path("h")}
          fill="none"
          stroke="var(--danger)"
          strokeWidth={2}
        />
        <path
          d={path("caught")}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
          strokeDasharray="5 3"
        />
        <text
          x={x0 + pw / 2}
          y={H - 4}
          textAnchor="middle"
          className="viz-label"
        >
          training steps
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
        <span style={{ color: "var(--danger)" }}>true hack rate</span>
        <span style={{ color: "var(--accent)" }}>
          hacks the monitor catches
        </span>
      </div>
      <figcaption className="viz-caption">
        A toy training run. Hacking pays 1; the monitor reads the reasoning and
        catches a hack 95% of the time when the model writes down what it is
        doing. With no penalty the model learns to hack and the monitor sees it.
        A strong penalty applied early stops the hacking. A moderate one, or a
        model that learns quickly to stop verbalising, produces the worst case:
        hacking rises while the monitor sees less and less.
      </figcaption>
    </figure>
  );
}
