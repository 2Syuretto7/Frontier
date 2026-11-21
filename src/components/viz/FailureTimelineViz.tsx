"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const DAYS = 30;
const GPU_MTBF_H = 40000;
const SIZES = [512, 1024, 2048, 4096, 8192, 16384, 32768];

export function FailureTimelineViz() {
  const [si, setSi] = useState(2);
  const n = SIZES[si];
  const times = useMemo(() => {
    const r = rand(17 + si);
    const rate = n / GPU_MTBF_H;
    const out: number[] = [];
    let t = 0;
    for (;;) {
      t += -Math.log(Math.max(1e-12, r())) / rate;
      if (t > DAYS * 24) break;
      out.push(t);
    }
    return out;
  }, [n, si]);
  const expected = (DAYS * 24 * n) / GPU_MTBF_H;
  const gaps = times.slice(1).map((t, i) => t - times[i]);
  const longest = gaps.length ? Math.max(times[0], ...gaps) : DAYS * 24;
  const W = 330,
    H = 80,
    x0 = 10,
    pw = 310,
    y = 30;
  const sx = (h: number) => x0 + (h / (DAYS * 24)) * pw;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="viz-label">
          GPUs: {n.toLocaleString("en-IN")}{" "}
          <input
            type="range"
            min={0}
            max={SIZES.length - 1}
            step={1}
            value={si}
            onChange={(e) => setSi(+e.target.value)}
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
        aria-label="Failure times over thirty days"
      >
        <line
          x1={x0}
          x2={x0 + pw}
          y1={y}
          y2={y}
          stroke="var(--border)"
          strokeWidth={2}
        />
        {times.map((t, i) => (
          <line
            key={i}
            x1={sx(t)}
            x2={sx(t)}
            y1={y - 12}
            y2={y + 12}
            stroke="var(--danger)"
            strokeWidth={1}
          />
        ))}
        {[0, 10, 20, 30].map((d) => (
          <text
            key={d}
            x={sx(d * 24)}
            y={y + 30}
            textAnchor={d === 0 ? "start" : d === 30 ? "end" : "middle"}
            className="viz-label"
          >
            day {d}
          </text>
        ))}
      </svg>
      <p className="viz-label" style={{ textAlign: "center" }}>
        failures {times.length} (expected {expected.toFixed(1)}); mean gap{" "}
        {((DAYS * 24) / Math.max(1, times.length)).toFixed(1)} h; longest gap{" "}
        {longest.toFixed(1)} h
      </p>
      <figcaption className="viz-caption">
        One simulated month of a job whose GPUs each fail on average once every
        40,000 hours, about four and a half years. A single GPU almost never
        fails in a month, but the job stops whenever any of its GPUs does, so
        the failure rate grows in proportion to its size and the gaps between
        failures shrink to hours.
      </figcaption>
    </figure>
  );
}
