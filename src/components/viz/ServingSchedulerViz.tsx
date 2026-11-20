"use client";

import { useState } from "react";

const BS = 4; // tokens per KV block
const MAX_BATCH = 4;
// [arrival step, prompt tokens, tokens to generate]
const REQS: [number, number, number][] = [
  [0, 6, 10],
  [0, 9, 8],
  [1, 5, 12],
  [2, 11, 6],
  [3, 7, 9],
  [5, 4, 11],
  [6, 10, 7],
  [8, 6, 8],
];
const POOLS = [10, 14, 18];

type Cell = "idle" | "wait" | "run" | "pre" | "done";

/** Step the engine loop (grow running sequences, preempting the latest admitted; then admit FIFO) and record each request's state. */
export function simulate(pool: number) {
  const len = REQS.map(([, p]) => p);
  const gen = REQS.map(() => 0);
  const held = REQS.map(() => 0);
  let running: number[] = [];
  const waiting: number[] = [];
  const rows: Cell[][] = REQS.map(() => []);
  let free = pool,
    preemptions = 0,
    used = 0,
    t = 0;
  const finished = () => gen.every((g, i) => g >= REQS[i][2]);
  while (!finished() && t < 80) {
    REQS.forEach(([a], i) => a === t && waiting.push(i));
    const pre: number[] = [];
    for (;;) {
      const need = running.filter((i) => len[i] % BS === 0).length;
      if (need <= free) break;
      const j = running.pop()!;
      free += held[j];
      held[j] = 0;
      pre.push(j);
      preemptions++;
    }
    running.forEach((i) => {
      if (len[i] % BS === 0) {
        held[i]++;
        free--;
      }
      len[i]++;
      gen[i]++;
    });
    waiting.unshift(...pre.reverse());
    while (waiting.length && running.length < MAX_BATCH) {
      const i = waiting[0];
      const need = Math.ceil((len[i] + 1) / BS);
      if (need > free) break;
      waiting.shift();
      held[i] = need;
      free -= need;
      len[i]++;
      gen[i]++;
      running.push(i);
    }
    const done = running.filter((i) => gen[i] >= REQS[i][2]);
    done.forEach((i) => {
      free += held[i];
      held[i] = 0;
    });
    used += pool - free;
    REQS.forEach((r, i) => {
      rows[i].push(
        pre.includes(i)
          ? "pre"
          : running.includes(i)
            ? "run"
            : waiting.includes(i)
              ? "wait"
              : gen[i] >= REQS[i][2]
                ? "done"
                : "idle",
      );
    });
    running = running.filter((i) => gen[i] < REQS[i][2]);
    t++;
  }
  return { rows, steps: t, preemptions, util: used / (t * pool) };
}

export function ServingSchedulerViz() {
  const [pi, setPi] = useState(0);
  const { rows, steps, preemptions } = simulate(POOLS[pi]);
  const X0 = 34,
    Y0 = 16,
    RH = 20,
    W = 360;
  const cw = (W - X0 - 6) / steps;
  const fill: Record<Cell, string> = {
    idle: "none",
    wait: "var(--bg-subtle)",
    run: "var(--accent)",
    pre: "var(--danger)",
    done: "none",
  };
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div
          className="segmented"
          role="group"
          aria-label="KV blocks in the pool"
        >
          {POOLS.map((p, j) => (
            <button
              key={p}
              type="button"
              className="seg"
              aria-pressed={pi === j}
              onClick={() => setPi(j)}
            >
              {p} blocks
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${Y0 + REQS.length * RH + 6}`}
        style={{
          width: "100%",
          maxWidth: 560,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Timeline of requests waiting, running and preempted"
      >
        {rows.map((row, i) => (
          <g key={i}>
            <text
              x={X0 - 6}
              y={Y0 + i * RH + RH / 2 + 4}
              textAnchor="end"
              className="viz-label"
            >
              {`r${i + 1}`}
            </text>
            {row.map((c, s) =>
              fill[c] === "none" ? null : (
                <rect
                  key={s}
                  x={X0 + s * cw}
                  y={Y0 + i * RH + 3}
                  width={Math.max(cw - 0.6, 0.5)}
                  height={RH - 6}
                  style={{ fill: fill[c] }}
                  stroke={c === "wait" ? "var(--border)" : "none"}
                />
              ),
            )}
          </g>
        ))}
        <text x={X0} y={10} className="viz-label">
          step 1
        </text>
        <text x={W - 6} y={10} textAnchor="end" className="viz-label">
          {`step ${steps}`}
        </text>
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        all requests done after {steps} steps; {preemptions} preemption
        {preemptions === 1 ? "" : "s"}
      </div>
      <figcaption className="viz-caption">
        Eight requests arrive over the first few steps; each row shows one
        request waiting (pale), running (colour) or preempted (red). Every step
        the engine first grows the running sequences, preempting the latest
        admitted when a new KV block is needed and none is free, then admits
        waiting requests in order while their blocks fit, up to four at once. A
        small pool forces preemptions, and preempted requests must recompute
        their caches when readmitted.
      </figcaption>
    </figure>
  );
}
