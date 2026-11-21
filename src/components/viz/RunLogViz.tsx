"use client";

import { useState } from "react";

type Axis = "step" | "time";
const STEP_H = 10 / 3600;
const SEGS: { from: number; to: number; start: number }[] = [
  { from: 0, to: 9000, start: 0 },
  { from: 8000, to: 15000, start: 27 },
  { from: 13500, to: 20000, start: 50 },
];
const COLORS = ["var(--text-muted)", "var(--danger)", "var(--accent)"];

function loss(step: number, seg: number) {
  let v = 2.1 + 1.8 * Math.exp(-step / 3500) + 0.015 * Math.sin(step / 37);
  if (seg === 0 && step > 8700) v += 0.9 * ((step - 8700) / 300) ** 2;
  if (seg === 1 && step > 14400) v += 1.4 * ((step - 14400) / 600) ** 3;
  if (seg === 2) v -= 0.02;
  return v;
}

export function RunLogViz() {
  const [axis, setAxis] = useState<Axis>("step");
  const end = SEGS[2].start + (SEGS[2].to - SEGS[2].from) * STEP_H;
  const xmax = axis === "step" ? 20000 : end;
  const W = 330,
    H = 170,
    x0 = 30,
    y0 = 10,
    pw = 290,
    ph = 130,
    lo = 2,
    hi = 4;
  const sx = (v: number) => x0 + (v / xmax) * pw;
  const sy = (v: number) =>
    y0 + (1 - (Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * ph;
  const executed = SEGS.reduce((a, s) => a + s.to - s.from, 0);
  return (
    <figure className="viz">
      <div
        role="group"
        aria-label="Horizontal axis"
        className="viz-controls"
        style={{ marginTop: 0, gap: 6 }}
      >
        {(
          [
            ["step", "by step"],
            ["time", "by wall-clock hours"],
          ] as [Axis, string][]
        ).map(([a, label]) => (
          <button
            key={a}
            type="button"
            className={a === axis ? "btn btn-primary" : "btn"}
            aria-pressed={a === axis}
            onClick={() => setAxis(a)}
          >
            {label}
          </button>
        ))}
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
        aria-label="Loss from a run log with two rollbacks"
      >
        <rect
          x={x0}
          y={y0}
          width={pw}
          height={ph}
          fill="none"
          stroke="var(--border)"
        />
        {[2, 3, 4].map((v) => (
          <text
            key={v}
            x={x0 - 4}
            y={sy(v) + 4}
            textAnchor="end"
            className="viz-label"
          >
            {v}
          </text>
        ))}
        {SEGS.map((s, i) => {
          const pts: string[] = [];
          for (let st = s.from; st <= s.to; st += 50) {
            const x = axis === "step" ? st : s.start + (st - s.from) * STEP_H;
            pts.push(`${sx(x)},${sy(loss(st, i))}`);
          }
          return (
            <polyline
              key={i}
              points={pts.join(" ")}
              fill="none"
              stroke={COLORS[i]}
              strokeWidth={1.3}
            />
          );
        })}
        <text
          x={x0 + pw}
          y={y0 + ph + 14}
          textAnchor="end"
          className="viz-label"
        >
          {axis === "step" ? "20,000 steps" : `${end.toFixed(0)} hours`}
        </text>
      </svg>
      <p className="viz-label" style={{ textAlign: "center" }}>
        steps executed {executed.toLocaleString("en-IN")}, kept 20,000; wall
        clock {end.toFixed(1)} h for {(20000 * STEP_H).toFixed(1)} h of kept
        work
      </p>
      <figcaption className="viz-caption">
        A reconstructed run log with three segments: grey until a spike forced a
        rollback, red until a divergence forced another with a lower learning
        rate, blue to the end. Plotted by step, the segments overlap where work
        was redone; plotted by wall-clock time, the gaps between them show
        restarts, and the overlaps become time that produced nothing.
      </figcaption>
    </figure>
  );
}
