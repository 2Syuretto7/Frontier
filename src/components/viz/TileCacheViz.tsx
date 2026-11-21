"use client";

import { useMemo, useState } from "react";

const N = 16;
const TILES = [1, 2, 4, 8, 16];
const CAPS = [32, 64, 128, 256];

function misses(t: number, cap: number) {
  const cache = new Map<number, true>();
  let miss = 0;
  const touch = (key: number) => {
    if (cache.has(key)) {
      cache.delete(key);
      cache.set(key, true);
    } else {
      miss++;
      cache.set(key, true);
      if (cache.size > cap) cache.delete(cache.keys().next().value as number);
    }
  };
  for (let io = 0; io < N; io += t)
    for (let jo = 0; jo < N; jo += t)
      for (let i = io; i < io + t; i++)
        for (let j = jo; j < jo + t; j++)
          for (let k = 0; k < N; k++) {
            touch(i * N + k);
            touch(N * N + k * N + j);
          }
  return miss;
}

export function TileCacheViz() {
  const [ti, setTi] = useState(0);
  const [ci, setCi] = useState(2);
  const t = TILES[ti],
    cap = CAPS[ci];
  const m = useMemo(() => misses(t, cap), [t, cap]);
  const all = useMemo(() => TILES.map((x) => misses(x, cap)), [cap]);
  const W = 330,
    x0 = 10,
    gs = 9,
    y0 = 8;
  const H = y0 + N * gs + 8;
  const bx = x0 + N * gs + 24,
    bw = W - bx - 10,
    top = Math.max(...all);
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          tile: {t} × {t}{" "}
          <input
            type="range"
            min={0}
            max={TILES.length - 1}
            step={1}
            value={ti}
            onChange={(e) => setTi(+e.target.value)}
          />
        </label>
        <label className="viz-label">
          cache: {cap} elements{" "}
          <input
            type="range"
            min={0}
            max={CAPS.length - 1}
            step={1}
            value={ci}
            onChange={(e) => setCi(+e.target.value)}
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
        aria-label="Order of output tiles and cache misses for each tile size"
      >
        {Array.from({ length: N }, (_, i) =>
          Array.from({ length: N }, (_, j) => {
            const tile = Math.floor(i / t) * (N / t) + Math.floor(j / t);
            const ntiles = (N / t) * (N / t);
            return (
              <rect
                key={`${i}-${j}`}
                x={x0 + j * gs}
                y={y0 + i * gs}
                width={gs - 1}
                height={gs - 1}
                fill="var(--accent)"
                opacity={0.15 + (0.75 * tile) / Math.max(1, ntiles - 1)}
              />
            );
          }),
        )}
        {TILES.map((x, k) => {
          const h = (all[k] / top) * (N * gs - 20);
          const bwi = bw / TILES.length;
          return (
            <g key={x}>
              <rect
                x={bx + k * bwi + 3}
                y={y0 + N * gs - 14 - h}
                width={bwi - 6}
                height={h}
                fill={k === ti ? "var(--accent)" : "var(--grid-line)"}
              />
              <text
                x={bx + k * bwi + bwi / 2}
                y={y0 + N * gs}
                textAnchor="middle"
                className="viz-label"
              >
                {x}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="viz-label" style={{ textAlign: "center" }}>
        cache misses: {m.toLocaleString("en-IN")} of{" "}
        {(2 * N * N * N).toLocaleString("en-IN")} reads
      </p>
      <figcaption className="viz-caption">
        A 16 × 16 × 16 matrix multiplication with a small least-recently-used
        cache. Left: the order in which output elements are computed, darker
        later. Right: misses for each tile size. Tiling makes consecutive
        outputs share rows of A and columns of B while they are still cached,
        until the tile&apos;s working set no longer fits and misses rise again.
      </figcaption>
    </figure>
  );
}
