"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

type Act = "continue" | "replay" | "lowlr" | "skip";
const N = 1000;
const SPIKE = 600;
const DETECT = 604;
const CKPT = 100;
const ROLLBACK = 500;

const ACTS: [Act, string][] = [
  ["continue", "keep going"],
  ["replay", "roll back, same data"],
  ["lowlr", "roll back, lower learning rate"],
  ["skip", "roll back, skip batches"],
];

export function SpikeResponseViz() {
  const [act, setAct] = useState<Act>("continue");
  const noise = useMemo(() => {
    const r = rand(5);
    return Array.from({ length: N }, () => 0.04 * (r() - 0.5));
  }, []);
  const base = (t: number) => 2.4 + 1.2 * Math.exp(-t / 250) + noise[t];
  const spike = (t: number, h: number, scar: number) =>
    t < SPIKE
      ? 0
      : h * Math.exp(-(t - SPIKE) / 18) + scar * Math.exp(-(t - SPIKE) / 400);
  const first = Array.from(
    { length: N },
    (_, t) => base(t) + spike(t, 1.6, 0.12),
  );
  const second = Array.from({ length: N }, (_, t) => {
    if (act === "replay") return first[t];
    if (act === "lowlr") return base(t) + spike(t, 0.7, 0.05);
    return base(t);
  });
  const W = 330,
    H = 170,
    x0 = 28,
    y0 = 10,
    pw = 292,
    ph = 140,
    lo = 2.2,
    hi = 4.4;
  const sx = (i: number) => x0 + (i / N) * pw;
  const sy = (v: number) =>
    y0 + (1 - (Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * ph;
  const line = (ys: number[], a: number, b: number) =>
    ys
      .slice(a, b)
      .map((v, i) => `${sx(a + i)},${sy(v)}`)
      .join(" ");
  const rolled = act !== "continue";
  const recurs = act === "replay";
  return (
    <figure className="viz">
      <div
        role="group"
        aria-label="Response to the spike"
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 6 }}
      >
        {ACTS.map(([a, label]) => (
          <button
            key={a}
            type="button"
            className={a === act ? "btn btn-primary" : "btn"}
            aria-pressed={a === act}
            onClick={() => setAct(a)}
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
        aria-label="A loss curve with a spike and the run after the chosen response"
      >
        <rect
          x={x0}
          y={y0}
          width={pw}
          height={ph}
          fill="none"
          stroke="var(--border)"
        />
        {Array.from({ length: N / CKPT - 1 }, (_, j) => (j + 1) * CKPT).map(
          (c) => (
            <line
              key={c}
              x1={sx(c)}
              x2={sx(c)}
              y1={y0 + ph - 6}
              y2={y0 + ph}
              stroke="var(--text-muted)"
            />
          ),
        )}
        {[3, 4].map((v) => (
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
        {rolled && (
          <rect
            x={sx(ROLLBACK)}
            y={y0}
            width={sx(DETECT) - sx(ROLLBACK)}
            height={ph}
            fill="var(--danger)"
            opacity={0.12}
          />
        )}
        <polyline
          points={line(first, 0, rolled ? DETECT + 1 : N)}
          fill="none"
          stroke={rolled ? "var(--text-muted)" : "var(--accent)"}
          strokeWidth={1}
        />
        {rolled && (
          <polyline
            points={line(second, ROLLBACK, N)}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={1.2}
          />
        )}
      </svg>
      <p className="viz-label" style={{ textAlign: "center" }}>
        {rolled
          ? `steps redone: ${DETECT - ROLLBACK}; spike ${recurs ? "recurs" : act === "lowlr" ? "smaller" : "gone"}; loss at the end ${second[N - 1].toFixed(3)}`
          : `loss at the end ${first[N - 1].toFixed(3)}`}
      </p>
      <figcaption className="viz-caption">
        A spike at step 600 is noticed four steps later; ticks mark checkpoints
        every 100 steps. Keeping going lets the loss recover but leaves a
        lasting gap. Rolling back to step 500 and replaying the same batches
        reproduces the spike exactly, which shows that data and state, not
        chance, caused it; lowering the learning rate shrinks it, and skipping
        the batches around it avoids it.
      </figcaption>
    </figure>
  );
}
