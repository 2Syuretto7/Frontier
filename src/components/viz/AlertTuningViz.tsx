"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const N = 600;
const W0 = 50;
const EVENTS: [number, number][] = [
  [150, 6],
  [380, 4],
  [520, 2],
];
const TOL = 8;

export function AlertTuningViz() {
  const [thr, setThr] = useState(2.5);
  const [k, setK] = useState(1);
  const { xs, zs } = useMemo(() => {
    const r = rand(11);
    const xs = Array.from({ length: N }, (_, t) => {
      const u = Math.max(1e-9, r()),
        v = r();
      let x =
        1 + 0.08 * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      for (const [s, d] of EVENTS) if (t >= s && t < s + d) x += 0.28;
      return x;
    });
    const zs = xs.map((x, i) => {
      if (i < W0) return null;
      const win = xs.slice(i - W0, i);
      const m = win.reduce((a, b) => a + b, 0) / W0;
      const sd = Math.sqrt(win.reduce((a, b) => a + (b - m) ** 2, 0) / W0);
      return (x - m) / sd;
    });
    return { xs, zs };
  }, []);
  const fired: number[] = [];
  let run = 0;
  zs.forEach((z, i) => {
    run = z !== null && z > thr ? run + 1 : 0;
    if (run === k) fired.push(i);
  });
  const isTrue = (a: number) => EVENTS.some(([s]) => s <= a && a <= s + TOL);
  const tp = fired.filter(isTrue).length;
  const caught = EVENTS.filter(([s]) =>
    fired.some((a) => s <= a && a <= s + TOL),
  ).length;
  const W = 330,
    H = 160,
    x0 = 10,
    y0 = 10,
    pw = 310,
    ph = 120,
    lo = 0.6,
    hi = 1.6;
  const sx = (i: number) => x0 + (i / N) * pw;
  const sy = (v: number) =>
    y0 + (1 - (Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * ph;
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          z threshold: {thr.toFixed(1)}{" "}
          <input
            type="range"
            min={1.5}
            max={5}
            step={0.5}
            value={thr}
            onChange={(e) => setThr(+e.target.value)}
          />
        </label>
        <div
          role="group"
          aria-label="Debounce"
          style={{ display: "flex", gap: 6, alignItems: "center" }}
        >
          <span className="viz-label">debounce</span>
          {[1, 2, 3, 4].map((v) => (
            <button
              key={v}
              type="button"
              className={v === k ? "btn btn-primary" : "btn"}
              aria-pressed={v === k}
              onClick={() => setK(v)}
            >
              {v}
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
        aria-label="A gradient-norm series with incidents and fired alerts"
      >
        <rect
          x={x0}
          y={y0}
          width={pw}
          height={ph}
          fill="none"
          stroke="var(--border)"
        />
        {EVENTS.map(([s, d]) => (
          <rect
            key={s}
            x={sx(s) - 1}
            y={y0}
            width={Math.max(3, sx(s + d) - sx(s)) + 2}
            height={ph}
            fill="var(--accent)"
            opacity={0.15}
          />
        ))}
        <rect
          x={x0}
          y={y0}
          width={sx(W0) - x0}
          height={ph}
          fill="var(--grid-line)"
          opacity={0.5}
        />
        <polyline
          points={xs.map((v, i) => `${sx(i)},${sy(v)}`).join(" ")}
          fill="none"
          stroke="var(--text-muted)"
          strokeWidth={0.8}
        />
        {fired.map((a) => (
          <line
            key={a}
            x1={sx(a)}
            x2={sx(a)}
            y1={y0 + ph + 4}
            y2={y0 + ph + 16}
            stroke={isTrue(a) ? "var(--success)" : "var(--danger)"}
            strokeWidth={2}
          />
        ))}
      </svg>
      <p className="viz-label" style={{ textAlign: "center" }}>
        alerts {fired.length}: {tp} during incidents, {fired.length - tp} false;
        incidents caught {caught} of {EVENTS.length}
      </p>
      <figcaption className="viz-caption">
        A gradient-norm series with three shaded incidents of six, four and two
        steps. An alert fires when the rolling z-score over the previous 50
        steps exceeds the threshold for the chosen number of consecutive steps;
        green ticks fall within a few steps of an incident, red ticks are false
        alarms. Raising the threshold or the debounce removes false alarms but
        eventually misses the shortest incident.
      </figcaption>
    </figure>
  );
}
