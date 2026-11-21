"use client";

import { useState } from "react";

const N = 16;

/** The (lo, hi) bracket after each bisection run when change `culprit` breaks the result. */
export function bisectTrace(n: number, culprit: number) {
  let lo = 0,
    hi = n;
  const trace: [number, number, number | null][] = [[lo, hi, null]];
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (mid >= culprit) hi = mid;
    else lo = mid;
    trace.push([lo, hi, mid]);
  }
  return trace;
}

export function ChangeBisectViz() {
  const [culprit, setCulprit] = useState(11);
  const [step, setStep] = useState(0);
  const trace = bisectTrace(N, culprit);
  const s = Math.min(step, trace.length - 1);
  const [lo, hi, mid] = trace[s];
  const done = hi - lo === 1;
  const W = 330,
    x0 = 10,
    bw = 310 / N,
    H = 70;
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          change that causes the gap: {culprit}{" "}
          <input
            type="range"
            min={1}
            max={N}
            value={culprit}
            onChange={(e) => {
              setCulprit(+e.target.value);
              setStep(0);
            }}
          />
        </label>
        <button
          type="button"
          className="btn btn-primary"
          disabled={done}
          onClick={() => setStep(s + 1)}
        >
          run the midpoint
        </button>
        <button type="button" className="btn" onClick={() => setStep(0)}>
          reset
        </button>
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
        aria-label="Sixteen code changes with the bisection bracket narrowing"
      >
        {Array.from({ length: N }, (_, i) => {
          const k = i + 1;
          const inside = k > lo && k <= hi;
          return (
            <g key={k}>
              <rect
                x={x0 + i * bw + 1}
                y={14}
                width={bw - 2}
                height={28}
                fill={
                  done && k === hi
                    ? "var(--danger)"
                    : inside
                      ? "var(--accent)"
                      : "var(--grid-line)"
                }
                opacity={inside ? 0.8 : 1}
              />
              <text
                x={x0 + i * bw + bw / 2}
                y={58}
                textAnchor="middle"
                className="viz-label"
                style={{ fontSize: 9 }}
              >
                {k}
              </text>
            </g>
          );
        })}
        {mid !== null && (
          <line
            x1={x0 + mid * bw}
            x2={x0 + mid * bw}
            y1={6}
            y2={48}
            stroke="var(--text)"
            strokeWidth={2}
          />
        )}
      </svg>
      <p style={{ textAlign: "center", fontSize: 13, margin: "6px 0 0" }}>
        {done
          ? `Found change ${hi} after ${s} runs; checking one change at a time could take up to ${N}.`
          : `After ${s} runs the culprit is among changes ${lo + 1} to ${hi}.`}
      </p>
      <figcaption className="viz-caption">
        Each run applies the first k changes to the original code and checks
        whether the gap appears. The vertical line marks the last change applied
        in the most recent run. Every run halves the bracket of suspects, so
        sixteen changes need only four runs.
      </figcaption>
    </figure>
  );
}
