"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

const T = 120; // minutes
const CAP = 50, // requests per second one replica serves
  UTIL = 0.8;
const r0 = rand(1517);
const RATES = Array.from({ length: T }, (_, t) => {
  const base = 300 + 120 * Math.sin((t / T) * Math.PI * 2 - 1);
  const spike = t >= 50 && t < 75 ? 380 : 0;
  return Math.round(base + spike + (r0() - 0.5) * 60);
});
const STARTUPS = [1, 4, 8];

/** Replicas desired each minute, those ready after the start-up delay, and the share of requests above capacity. */
export function autoscale(startup: number) {
  const desired = RATES.map((r) => Math.ceil(r / (CAP * UTIL)));
  const ready = desired.map((_, t) =>
    Math.min(...desired.slice(Math.max(t - startup, 0), t + 1)),
  );
  const over = RATES.reduce(
    (a, r, t) => a + Math.max(r - ready[t] * CAP, 0),
    0,
  );
  const total = RATES.reduce((a, r) => a + r, 0);
  return {
    desired,
    ready,
    overPct: (100 * over) / total,
    replicaHours: ready.reduce((a, n) => a + n, 0) / 60,
  };
}

export function AutoscaleViz() {
  const [si, setSi] = useState(1);
  const { ready, overPct, replicaHours } = autoscale(STARTUPS[si]);
  const W = 340,
    H = 200,
    X0 = 36,
    X1 = W - 14,
    Y0 = 10,
    Y1 = H - 32,
    VMAX = 1100;
  const sx = (t: number) => X0 + (t / T) * (X1 - X0);
  const sy = (v: number) => Y1 - (v / VMAX) * (Y1 - Y0);
  const capPath = ready
    .map(
      (n, t) =>
        `${t ? "L" : "M"}${sx(t)},${sy(n * CAP)} L${sx(t + 1)},${sy(n * CAP)}`,
    )
    .join(" ");
  const ratePath = RATES.map(
    (r, t) => `${t ? "L" : "M"}${sx(t + 0.5)},${sy(r)}`,
  ).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div
          className="segmented"
          role="group"
          aria-label="Replica start-up time"
        >
          {STARTUPS.map((s, j) => (
            <button
              key={s}
              type="button"
              className="seg"
              aria-pressed={si === j}
              onClick={() => setSi(j)}
            >
              {s} min start-up
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Request rate and ready capacity over two hours"
      >
        {RATES.map((r, t) =>
          r > ready[t] * CAP ? (
            <rect
              key={t}
              x={sx(t)}
              y={sy(r)}
              width={sx(t + 1) - sx(t)}
              height={sy(ready[t] * CAP) - sy(r)}
              style={{ fill: "var(--danger)" }}
            />
          ) : null,
        )}
        <line x1={X0} y1={Y1} x2={X1} y2={Y1} stroke="var(--border-strong)" />
        <line x1={X0} y1={Y0} x2={X0} y2={Y1} stroke="var(--border-strong)" />
        <path d={capPath} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <path d={ratePath} fill="none" stroke="var(--text)" strokeWidth={1} />
        {[0, 500, 1000].map((v) => (
          <text
            key={v}
            x={X0 - 4}
            y={sy(v) + 4}
            textAnchor="end"
            className="viz-label"
          >
            {v}
          </text>
        ))}
        {[0, 30, 60, 90, 120].map((t) => (
          <text
            key={t}
            x={sx(t)}
            y={Y1 + 14}
            textAnchor="middle"
            className="viz-label"
          >
            {t}
          </text>
        ))}
        <text x={X1} y={H - 1} textAnchor="end" className="viz-label">
          minutes
        </text>
      </svg>
      <div
        className="mono"
        style={{ fontSize: 12, margin: "6px 0" }}
        aria-live="polite"
      >
        {overPct.toFixed(1)}% of requests above capacity;{" "}
        {replicaHours.toFixed(1)} replica-hours
      </div>
      <figcaption className="viz-caption">
        Requests per second (thin line) over two hours, with a burst after fifty
        minutes. The autoscaler asks each minute for enough replicas to keep
        them at 80% of the 50 requests per second each can serve; capacity
        (colour) follows once new replicas have started, while unneeded ones are
        removed at once. Red marks requests beyond capacity, which queue or are
        refused. Slower start-up means a longer shortfall whenever demand rises.
      </figcaption>
    </figure>
  );
}
