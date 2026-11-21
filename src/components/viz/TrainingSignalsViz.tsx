"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

type Fault = "none" | "data" | "lr";
const STEPS = 300,
  AT = 180;

function gauss(r: () => number) {
  const u = Math.max(r(), 1e-12),
    v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Synthetic per-step loss, gradient norm and update-to-weight ratio for a run with an optional fault. */
export function signals(fault: Fault) {
  const r = rand(21);
  const loss: number[] = [],
    gnorm: number[] = [],
    ratio: number[] = [];
  for (let t = 0; t < STEPS; t++) {
    let l = 3 * (t + 10) ** -0.2 + 0.04 * gauss(r);
    let g = 1 + 0.08 * gauss(r);
    let u = 1e-3 * (1 + 0.05 * gauss(r));
    if (fault === "data" && t >= AT && t < AT + 25) {
      l += 0.35;
      g *= 1.3;
    }
    if (fault === "lr" && t >= AT) {
      const k = t - AT;
      u *= 4;
      g *= 1 + 0.03 * k;
      if (k > 40) l += 0.01 * (k - 40);
    }
    loss.push(l);
    gnorm.push(g);
    ratio.push(u);
  }
  return { loss, gnorm, ratio };
}

function smooth(xs: number[], beta: number) {
  let m = 0;
  return xs.map((x, i) => {
    m = beta * m + (1 - beta) * x;
    return m / (1 - beta ** (i + 1));
  });
}

export function TrainingSignalsViz() {
  const [fault, setFault] = useState<Fault>("none");
  const [bi, setB] = useState(90);
  const beta = bi / 100;
  const s = signals(fault);
  const panels = [
    { label: "loss", raw: s.loss },
    { label: "gradient norm", raw: s.gnorm },
    { label: "update / weight", raw: s.ratio },
  ];
  const W = 330,
    ph = 60,
    x0 = 10,
    pw = 310;
  const sx = (t: number) => x0 + (t / (STEPS - 1)) * pw;
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <div
          role="group"
          aria-label="Fault"
          style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
        >
          {(
            [
              ["none", "healthy"],
              ["data", "bad data shard"],
              ["lr", "learning rate too high"],
            ] as [Fault, string][]
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              className={k === fault ? "btn btn-primary" : "btn"}
              aria-pressed={k === fault}
              onClick={() => setFault(k)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="viz-label">
          smoothing β: {beta.toFixed(2)}{" "}
          <input
            type="range"
            min={0}
            max={99}
            value={bi}
            onChange={(e) => setB(+e.target.value)}
          />
        </label>
      </div>
      <svg
        viewBox={`0 0 ${W} ${panels.length * (ph + 18)}`}
        style={{
          width: "100%",
          maxWidth: 460,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Loss, gradient norm and update ratio over training steps"
      >
        {panels.map((p, i) => {
          const y0 = i * (ph + 18) + 14;
          const sm = smooth(p.raw, beta);
          const lo = Math.min(...p.raw),
            hi = Math.max(...p.raw);
          const sy = (v: number) => y0 + (1 - (v - lo) / (hi - lo || 1)) * ph;
          const line = (xs: number[]) =>
            xs.map((v, t) => `${sx(t)},${sy(v)}`).join(" ");
          return (
            <g key={p.label}>
              <text
                x={x0}
                y={y0 - 3}
                className="viz-label"
                style={{ fontSize: 10 }}
              >
                {p.label}
              </text>
              <rect
                x={x0}
                y={y0}
                width={pw}
                height={ph}
                fill="none"
                stroke="var(--border)"
              />
              <polyline
                points={line(p.raw)}
                fill="none"
                stroke="var(--text-muted)"
                opacity={0.35}
                strokeWidth={1}
              />
              <polyline
                points={line(sm)}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={2}
              />
              {fault !== "none" && (
                <line
                  x1={sx(AT)}
                  x2={sx(AT)}
                  y1={y0}
                  y2={y0 + ph}
                  stroke="var(--danger)"
                  strokeDasharray="3 3"
                />
              )}
            </g>
          );
        })}
      </svg>
      <figcaption className="viz-caption">
        A synthetic run of 300 steps; grey lines are raw values and blue lines
        their bias-corrected moving averages. A bad data shard shows first in
        the loss and recovers once the shard has passed. A learning rate that is
        too high shows first in the update-to-weight ratio and the gradient
        norm, long before the loss moves. Heavy smoothing hides short events and
        delays the alarm.
      </figcaption>
    </figure>
  );
}
