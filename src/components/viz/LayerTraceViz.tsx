"use client";

import { useState } from "react";

const L = 12;
const SOFTMAX = 6;
const F16MAX = 65504;

export function LayerTraceViz() {
  const [g, setG] = useState(1.3);
  const [stable, setStable] = useState(false);
  const amax: number[] = [];
  let a = 1;
  for (let i = 0; i < L; i++) {
    if (i === SOFTMAX) {
      if (Number.isNaN(a)) a = NaN;
      else if (!stable && Math.exp(a) > F16MAX) a = NaN;
      else a = 1;
    } else {
      a = a * g;
      if (a > F16MAX) a = Infinity;
    }
    amax.push(a);
  }
  const first = amax.findIndex((v) => !Number.isFinite(v));
  const W = 330,
    H = 170,
    x0 = 36,
    y0 = 10,
    pw = 284,
    ph = 130,
    top = 17;
  const bw = pw / L;
  const sy = (l: number) =>
    y0 + ph - (Math.max(0, Math.min(top, l)) / top) * ph;
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          growth per layer: {g.toFixed(2)}{" "}
          <input
            type="range"
            min={1}
            max={7}
            step={0.1}
            value={g}
            onChange={(e) => setG(+e.target.value)}
          />
        </label>
        <div
          role="group"
          aria-label="Softmax"
          style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
        >
          {[
            [false, "naive softmax"],
            [true, "subtract the max"],
          ].map(([s, label]) => (
            <button
              key={String(s)}
              type="button"
              className={s === stable ? "btn btn-primary" : "btn"}
              aria-pressed={s === stable}
              onClick={() => setStable(s as boolean)}
            >
              {label as string}
            </button>
          ))}
        </div>
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
        aria-label="Largest activation magnitude per layer on a log scale"
      >
        <line
          x1={x0}
          x2={x0 + pw}
          y1={sy(Math.log2(F16MAX))}
          y2={sy(Math.log2(F16MAX))}
          stroke="var(--danger)"
          strokeDasharray="4 3"
        />
        {[0, 8, 16].map((l) => (
          <text
            key={l}
            x={x0 - 4}
            y={sy(l) + 4}
            textAnchor="end"
            className="viz-label"
          >
            2^{l}
          </text>
        ))}
        {amax.map((v, i) => {
          const bad = !Number.isFinite(v);
          const y = bad ? y0 : sy(Math.log2(v));
          return (
            <g key={i}>
              <rect
                x={x0 + i * bw + 2}
                y={Math.min(y, y0 + ph - 3)}
                width={bw - 4}
                height={Math.max(3, y0 + ph - y)}
                fill={
                  bad
                    ? "var(--danger)"
                    : i === SOFTMAX
                      ? "var(--success)"
                      : "var(--accent)"
                }
                opacity={bad && i !== first ? 0.35 : 1}
              />
              <text
                x={x0 + i * bw + bw / 2}
                y={y0 + ph + 14}
                textAnchor="middle"
                className="viz-label"
              >
                {i}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="viz-label" style={{ textAlign: "center" }}>
        {first < 0
          ? "all layers finite"
          : `first non-finite output: layer ${first}${first === SOFTMAX ? " (softmax)" : ""}`}
      </p>
      <figcaption className="viz-caption">
        The largest magnitude in each layer&apos;s output during one FP16
        forward pass, on a log scale; the dashed line is the FP16 maximum. Layer
        6, in green, is a softmax over the previous layer&apos;s output. Every
        later layer is non-finite once one is, so only the first red bar says
        where the fault is, and whether it lies in the softmax or in the growth
        before it depends on the settings.
      </figcaption>
    </figure>
  );
}
