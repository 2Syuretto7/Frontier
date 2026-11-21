"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

type Mode = "mean" | "minmax";
const N = 20000;
const SPIKES = [3100, 9400, 9401, 15800, 15801, 15802];

export function DecimationViz() {
  const [buckets, setBuckets] = useState(200);
  const [mode, setMode] = useState<Mode>("mean");
  const series = useMemo(() => {
    const r = rand(7);
    return Array.from({ length: N }, (_, t) => {
      let v = 2.2 + 1.5 * Math.exp(-t / 3000) + 0.03 * (r() - 0.5);
      if (SPIKES.includes(t)) v += 1.2;
      return v;
    });
  }, []);
  const k = Math.ceil(N / buckets);
  const W = 330,
    H = 170,
    x0 = 30,
    y0 = 10,
    pw = 290,
    ph = 140,
    lo = 2,
    hi = 4;
  const sx = (i: number) => x0 + (i / N) * pw;
  const sy = (v: number) =>
    y0 + (1 - (Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * ph;
  const pts: string[] = [];
  for (let i = 0; i < N; i += k) {
    const chunk = series.slice(i, i + k);
    if (mode === "mean") {
      const m = chunk.reduce((a, b) => a + b, 0) / chunk.length;
      pts.push(`${sx(i + k / 2)},${sy(m)}`);
    } else {
      let mi = 0,
        ma = 0;
      chunk.forEach((v, j) => {
        if (v < chunk[mi]) mi = j;
        if (v > chunk[ma]) ma = j;
      });
      const order = mi < ma ? [mi, ma] : [ma, mi];
      for (const j of order) pts.push(`${sx(i + j)},${sy(chunk[j])}`);
    }
  }
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          plotted buckets: {buckets} ({k} steps each){" "}
          <input
            type="range"
            min={20}
            max={2000}
            step={20}
            value={buckets}
            onChange={(e) => setBuckets(+e.target.value)}
          />
        </label>
        <div
          role="group"
          aria-label="Downsampling"
          style={{ display: "flex", gap: 6 }}
        >
          {(
            [
              ["mean", "bucket mean"],
              ["minmax", "bucket min and max"],
            ] as [Mode, string][]
          ).map(([m, label]) => (
            <button
              key={m}
              type="button"
              className={m === mode ? "btn btn-primary" : "btn"}
              aria-pressed={m === mode}
              onClick={() => setMode(m)}
            >
              {label}
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
        aria-label="A downsampled loss curve of twenty thousand steps"
      >
        <rect
          x={x0}
          y={y0}
          width={pw}
          height={ph}
          fill="none"
          stroke="var(--border)"
        />
        {[2, 3, 4].map((v) => (
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
        <polyline
          points={pts.join(" ")}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={1.2}
        />
      </svg>
      <figcaption className="viz-caption">
        Twenty thousand logged losses contain three short spikes, of one, two
        and three steps. Averaging each bucket, as many dashboards do when
        zoomed out, flattens them into invisibility; keeping each bucket&apos;s
        minimum and maximum shows every spike at any zoom, at the cost of two
        points per bucket.
      </figcaption>
    </figure>
  );
}
