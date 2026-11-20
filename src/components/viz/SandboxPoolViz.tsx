"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

const NE = 40,
  START = 3; // time units to boot a sandbox from cold
const r0 = rand(2104);
let clock = 0;
// episodes arrive about once per time unit and hold a sandbox for about eight
const EPISODES = Array.from({ length: NE }, () => {
  clock += -Math.log(Math.max(r0(), 1e-9));
  const u = Math.max(r0(), 1e-9),
    v = r0();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return { arrive: clock, dur: Math.exp(1.9 + 0.5 * z) };
});
const POOLS = [8, 12, 16];

type Slot = { sb: number; boot: number; start: number; end: number };

/** Assign episodes in arrival order to the first free sandbox; cold sandboxes boot before each episode, warm ones are ready. */
export function runPool(size: number, warm: boolean) {
  const free = Array(size).fill(0);
  const slots: Slot[] = [];
  let wait = 0;
  for (const e of EPISODES) {
    let sb = 0;
    for (let i = 1; i < size; i++) if (free[i] < free[sb]) sb = i;
    const boot = Math.max(e.arrive, free[sb]);
    const start = boot + (warm ? 0 : START);
    wait += start - e.arrive;
    free[sb] = start + e.dur;
    slots.push({ sb, boot, start, end: free[sb] });
  }
  return { slots, meanWait: wait / NE, end: Math.max(...free) };
}

export function SandboxPoolViz() {
  const [pi, setPi] = useState(1);
  const [warm, setWarm] = useState(false);
  const size = POOLS[pi];
  const { slots, meanWait } = runPool(size, warm);
  const W = 340,
    X0 = 8,
    X1 = W - 8,
    Y0 = 4,
    RH = 9,
    TMAX = 75;
  const sx = (t: number) => X0 + (Math.min(t, TMAX) / TMAX) * (X1 - X0);
  const H = Y0 + 16 * RH + 16;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <div
          className="segmented"
          role="group"
          aria-label="Sandboxes in the pool"
        >
          {POOLS.map((p, j) => (
            <button
              key={p}
              type="button"
              className="seg"
              aria-pressed={pi === j}
              onClick={() => setPi(j)}
            >
              {p} sandboxes
            </button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Sandbox start">
          {[false, true].map((w) => (
            <button
              key={String(w)}
              type="button"
              className="seg"
              aria-pressed={warm === w}
              onClick={() => setWarm(w)}
            >
              {w ? "warm" : "cold"}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          maxWidth: 560,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Episodes running in a pool of sandboxes over time"
      >
        {Array.from({ length: size }, (_, i) => (
          <rect
            key={i}
            x={X0}
            y={Y0 + i * RH}
            width={X1 - X0}
            height={RH - 2}
            style={{ fill: "var(--bg-subtle)" }}
          />
        ))}
        {slots.map((s, k) =>
          s.boot >= TMAX ? null : (
            <g key={k}>
              {s.start > s.boot ? (
                <rect
                  x={sx(s.boot)}
                  y={Y0 + s.sb * RH}
                  width={sx(s.start) - sx(s.boot)}
                  height={RH - 2}
                  style={{ fill: "var(--danger)" }}
                />
              ) : null}
              <rect
                x={sx(s.start)}
                y={Y0 + s.sb * RH}
                width={Math.max(sx(s.end) - sx(s.start) - 1, 0)}
                height={RH - 2}
                style={{ fill: "var(--accent)" }}
              />
            </g>
          ),
        )}
        {[0, 25, 50, 75].map((t) => (
          <text
            key={t}
            x={sx(t)}
            y={H - 2}
            textAnchor={t === 0 ? "start" : t === TMAX ? "end" : "middle"}
            className="viz-label"
          >
            {t}
          </text>
        ))}
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        mean wait before an episode starts: {meanWait.toFixed(1)} time units
      </div>
      <figcaption className="viz-caption">
        Forty agent episodes arrive about once per time unit and each holds a
        sandbox for about eight (colour). Each row is a sandbox. A cold sandbox
        boots for three units before its episode starts (red); a warm pool keeps
        booted sandboxes ready, replacing them in the background. By
        Little&apos;s law the pool needs about the arrival rate times the time
        each episode holds a sandbox; below that, episodes queue and waits grow.
      </figcaption>
    </figure>
  );
}
