"use client";

import { useState } from "react";

const RESTART_S = 600;

export function CheckpointIntervalViz() {
  const [delta, setDelta] = useState(50);
  const [mtbfH, setMtbfH] = useState(6);
  const M = mtbfH * 3600;
  const lo = Math.log10(60),
    hi = Math.log10(6 * 3600);
  const taus = Array.from(
    { length: 120 },
    (_, i) => 10 ** (lo + ((hi - lo) * i) / 119),
  );
  const ck = (t: number) => delta / t;
  const lost = (t: number) => (t / 2 + RESTART_S) / M;
  const tot = (t: number) => ck(t) + lost(t);
  const best = Math.sqrt(2 * delta * M);
  const W = 330,
    H = 175,
    x0 = 34,
    y0 = 10,
    pw = 286,
    ph = 130,
    top = 0.4;
  const sx = (t: number) => x0 + ((Math.log10(t) - lo) / (hi - lo)) * pw;
  const sy = (v: number) => y0 + ph - (Math.min(top, v) / top) * ph;
  const path = (f: (t: number) => number) =>
    taus.map((t) => `${sx(t)},${sy(f(t))}`).join(" ");
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          checkpoint pause: {delta} s{" "}
          <input
            type="range"
            min={10}
            max={290}
            step={20}
            value={delta}
            onChange={(e) => setDelta(+e.target.value)}
          />
        </label>
        <label className="viz-label">
          job MTBF: {mtbfH} h{" "}
          <input
            type="range"
            min={1}
            max={24}
            step={1}
            value={mtbfH}
            onChange={(e) => setMtbfH(+e.target.value)}
          />
        </label>
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
        aria-label="Wasted fraction of time against checkpoint interval"
      >
        <rect
          x={x0}
          y={y0}
          width={pw}
          height={ph}
          fill="none"
          stroke="var(--border)"
        />
        {[0, 0.2, 0.4].map((v) => (
          <text
            key={v}
            x={x0 - 4}
            y={sy(v) + 4}
            textAnchor="end"
            className="viz-label"
          >
            {Math.round(v * 100)}%
          </text>
        ))}
        {[
          [60, "1 min"],
          [600, "10 min"],
          [3600, "1 h"],
        ].map(([t, l]) => (
          <text
            key={l}
            x={sx(t as number)}
            y={y0 + ph + 17}
            textAnchor="middle"
            className="viz-label"
          >
            {l}
          </text>
        ))}
        <polyline
          points={path(ck)}
          fill="none"
          stroke="var(--text-muted)"
          strokeDasharray="4 3"
        />
        <polyline
          points={path(lost)}
          fill="none"
          stroke="var(--danger)"
          strokeDasharray="4 3"
        />
        <polyline
          points={path(tot)}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={1.6}
        />
        {best >= 60 && best <= 6 * 3600 && (
          <circle
            cx={sx(best)}
            cy={sy(tot(best))}
            r={3.5}
            fill="var(--accent)"
          />
        )}
      </svg>
      <p className="viz-label" style={{ textAlign: "center" }}>
        best interval {(best / 60).toFixed(0)} min; waste there{" "}
        {(100 * tot(best)).toFixed(1)}%, of which restarts{" "}
        {((100 * RESTART_S) / M).toFixed(1)}%
      </p>
      <figcaption className="viz-caption">
        Fraction of time wasted against the interval between checkpoints, on a
        log axis. The grey dashed curve is time spent paused for checkpoints,
        which falls as they become rarer; the red dashed curve is work lost to
        failures plus a ten-minute restart, which grows with the interval. Their
        sum, in blue, has a minimum where the two slopes balance.
      </figcaption>
    </figure>
  );
}
