"use client";

import { useState } from "react";

const SLOTS = 4;
const REQS: [number, number][] = [
  [0, 9],
  [0, 3],
  [1, 14],
  [2, 4],
  [3, 6],
  [4, 2],
  [6, 11],
  [7, 3],
  [9, 5],
  [10, 8],
  [12, 2],
  [13, 6],
]; // (arrival step, output tokens)

type Bar = {
  slot: number;
  start: number;
  end: number;
  arrival: number;
  i: number;
};

/** Static batching: groups of SLOTS in arrival order; a group starts once all its requests have arrived and the previous group ends. */
export function staticBars(): Bar[] {
  const bars: Bar[] = [];
  let t = 0;
  for (let g = 0; g < REQS.length; g += SLOTS) {
    const grp = REQS.slice(g, g + SLOTS);
    const start = Math.max(t, ...grp.map((r) => r[0]));
    const end = start + Math.max(...grp.map((r) => r[1]));
    grp.forEach((r, k) =>
      bars.push({ slot: k, start, end: start + r[1], arrival: r[0], i: g + k }),
    );
    t = end;
  }
  return bars;
}

/** Continuous batching: each request takes the earliest free slot as soon as it has arrived. */
export function continuousBars(): Bar[] {
  const free = Array(SLOTS).fill(0);
  return REQS.map(([a, n], i) => {
    let s = 0;
    for (let k = 1; k < SLOTS; k++) if (free[k] < free[s]) s = k;
    const start = Math.max(a, free[s]);
    free[s] = start + n;
    return { slot: s, start, end: start + n, arrival: a, i };
  });
}

export function BatchingTimelineViz() {
  const [cont, setCont] = useState(false);
  const bars = cont ? continuousBars() : staticBars();
  const groupEnd = (b: Bar) =>
    cont
      ? b.end
      : Math.max(
          ...bars
            .filter((c) => Math.floor(c.i / SLOTS) === Math.floor(b.i / SLOTS))
            .map((c) => c.end),
        );
  const span = Math.max(...bars.map((b) => b.end));
  const latency =
    bars.reduce((s, b) => s + groupEnd(b) - b.arrival, 0) / bars.length;
  const busy = REQS.reduce((s, r) => s + r[1], 0) / (SLOTS * span);
  const W = 330,
    X0 = 44,
    PW = 280,
    Y0 = 4,
    RH = 26,
    T = 40;
  const x = (t: number) => X0 + (t / T) * PW;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Batching policy">
          {[false, true].map((c) => (
            <button
              key={String(c)}
              type="button"
              className="seg"
              aria-pressed={cont === c}
              onClick={() => setCont(c)}
            >
              {c ? "continuous" : "static"}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${Y0 + SLOTS * RH + 18}`}
        style={{
          width: "100%",
          maxWidth: 460,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Requests scheduled on batch slots over time"
      >
        {Array.from({ length: SLOTS }, (_, s) => (
          <text
            key={s}
            x={X0 - 6}
            y={Y0 + s * RH + RH / 2 + 4}
            textAnchor="end"
            className="viz-label"
          >{`slot ${s}`}</text>
        ))}
        {bars.map((b) => {
          const yy = Y0 + b.slot * RH;
          return (
            <g key={b.i}>
              {!cont && groupEnd(b) > b.end && (
                <rect
                  x={x(b.end)}
                  y={yy + 4}
                  width={x(groupEnd(b)) - x(b.end)}
                  height={RH - 8}
                  style={{ fill: "var(--bg-subtle)" }}
                  stroke="var(--border)"
                  strokeDasharray="2 2"
                />
              )}
              <rect
                x={x(b.start) + 0.5}
                y={yy + 4}
                width={x(b.end) - x(b.start) - 1}
                height={RH - 8}
                rx={2}
                style={{ fill: "var(--accent)" }}
                opacity={0.55 + 0.45 * (b.i % 2)}
              />
            </g>
          );
        })}
        {[0, 20, 40].map((v) => (
          <text
            key={v}
            x={x(v)}
            y={Y0 + SLOTS * RH + 13}
            textAnchor="middle"
            className="viz-label"
          >
            {v}
          </text>
        ))}
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        all done at step {span}; mean latency {latency.toFixed(1)} steps; slots
        busy {(100 * busy).toFixed(0)}%
      </div>
      <figcaption className="viz-caption">
        Twelve requests of different lengths arriving over time, served by a
        batch of four slots; time runs to the right in decode steps. Static
        batching waits to fill a batch and holds every slot until the longest
        request ends (dashed: idle). Continuous batching admits a waiting
        request the moment any slot frees up.
      </figcaption>
    </figure>
  );
}
