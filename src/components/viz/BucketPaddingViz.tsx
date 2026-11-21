"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

type Scheme = "none" | "linear" | "pow2";
const MAX = 512;

export function BucketPaddingViz() {
  const [scheme, setScheme] = useState<Scheme>("pow2");
  const [width, setWidth] = useState(64);
  const lengths = useMemo(() => {
    const r = rand(41);
    const out: number[] = [];
    for (let i = 0; i < 400; i++) {
      const u = r();
      out.push(Math.min(MAX, 1 + Math.floor(-90 * Math.log(1 - u * 0.995))));
    }
    return out;
  }, []);
  const buckets =
    scheme === "none"
      ? null
      : scheme === "linear"
        ? Array.from({ length: MAX / width }, (_, i) => (i + 1) * width)
        : [16, 32, 64, 128, 256, 512];
  const up = (n: number) => (buckets ? buckets.find((b) => b >= n)! : n);
  const padded = lengths.reduce((s, n) => s + up(n), 0);
  const real = lengths.reduce((s, n) => s + n, 0);
  const programs = new Set(lengths.map(up)).size;
  const bins = 64,
    bw = MAX / bins;
  const counts = new Array(bins).fill(0);
  lengths.forEach(
    (n) => counts[Math.min(bins - 1, Math.floor((n - 1) / bw))]++,
  );
  const cmax = Math.max(...counts);
  const W = 340,
    H = 170,
    x0 = 10,
    x1 = W - 10,
    yb = H - 24,
    yt = 10;
  const sx = (v: number) => x0 + ((x1 - x0) * v) / MAX;
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <div
          role="group"
          aria-label="Bucketing scheme"
          style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
        >
          {(
            [
              ["none", "no buckets"],
              ["linear", "equal widths"],
              ["pow2", "powers of two"],
            ] as [Scheme, string][]
          ).map(([s, l]) => (
            <button
              key={s}
              type="button"
              className={s === scheme ? "btn btn-primary" : "btn"}
              aria-pressed={s === scheme}
              onClick={() => setScheme(s)}
            >
              {l}
            </button>
          ))}
        </div>
        {scheme === "linear" && (
          <label className="viz-label">
            width: {width}{" "}
            <input
              type="range"
              min={4}
              max={8}
              step={1}
              value={Math.log2(width)}
              onChange={(e) => setWidth(2 ** +e.target.value)}
            />
          </label>
        )}
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
        aria-label="Histogram of request lengths with bucket boundaries"
      >
        {counts.map((c, i) => (
          <rect
            key={i}
            x={sx(i * bw) + 0.5}
            y={yb - ((yb - yt) * c) / cmax}
            width={Math.max(0.5, sx(bw) - sx(0) - 1)}
            height={((yb - yt) * c) / cmax}
            fill="var(--accent)"
            opacity={0.75}
          />
        ))}
        {buckets &&
          buckets.map((b) => (
            <line
              key={b}
              x1={sx(b)}
              x2={sx(b)}
              y1={yt}
              y2={yb}
              stroke="var(--text)"
              strokeDasharray="3 3"
              strokeWidth={1}
            />
          ))}
        <line x1={x0} x2={x1} y1={yb} y2={yb} stroke="var(--text-muted)" />
        {[0, 128, 256, 384, 512].map((v) => (
          <text
            key={v}
            x={sx(v)}
            y={yb + 14}
            textAnchor={v === 0 ? "start" : v === MAX ? "end" : "middle"}
            className="viz-label"
          >
            {v}
          </text>
        ))}
      </svg>
      <p className="viz-label" style={{ textAlign: "center" }}>
        {programs} compiled programs; padding is{" "}
        {((100 * (padded - real)) / padded).toFixed(1)}% of the tokens computed
      </p>
      <figcaption className="viz-caption">
        Four hundred requests with lengths up to 512 tokens. XLA compiles one
        program for each distinct input shape, so without buckets every new
        length triggers a compilation. Dashed lines mark bucket sizes: each
        request is padded up to the next one. Wide buckets mean few programs but
        much wasted work; powers of two keep the waste below half of every
        request with only a handful of programs.
      </figcaption>
    </figure>
  );
}
