"use client";

import { useState } from "react";

const SIZE: Record<string, number> = { a: 1, b: 4, c: 4, d: 1, e: 1 };
const INS: Record<string, string[]> = {
  b: ["a"],
  c: ["a"],
  d: ["b"],
  e: ["c", "d"],
};
const ORDERS: string[][] = [
  ["a", "b", "c", "d", "e"],
  ["a", "b", "d", "c", "e"],
];
const COLORS: Record<string, string> = {
  a: "var(--accent)",
  b: "var(--danger)",
  c: "var(--success)",
  d: "var(--text-muted)",
  e: "var(--accent)",
};

function intervals(order: string[]) {
  const iv: Record<string, [number, number]> = {};
  order.forEach((n, i) => (iv[n] = [i, i]));
  order.forEach((n, i) =>
    (INS[n] ?? []).forEach((x) => (iv[x][1] = Math.max(iv[x][1], i))),
  );
  iv.e[1] = order.length - 1;
  return iv;
}

function offsets(iv: Record<string, [number, number]>, reuse: boolean) {
  const placed: Record<string, number> = {};
  const names = Object.keys(iv).sort(
    (p, q) => SIZE[q] - SIZE[p] || (p < q ? -1 : 1),
  );
  let next = 0;
  for (const n of names) {
    if (!reuse) {
      placed[n] = next;
      next += SIZE[n];
      continue;
    }
    const busy = Object.keys(placed)
      .filter((m) => iv[n][0] <= iv[m][1] && iv[m][0] <= iv[n][1])
      .map((m) => [placed[m], placed[m] + SIZE[m]])
      .sort((x, y) => x[0] - y[0]);
    let off = 0;
    for (const [lo, hi] of busy) {
      if (off + SIZE[n] <= lo) break;
      off = Math.max(off, hi);
    }
    placed[n] = off;
  }
  return placed;
}

export function MemoryArenaViz() {
  const [oi, setOi] = useState(0);
  const [reuse, setReuse] = useState(true);
  const order = ORDERS[oi];
  const iv = intervals(order);
  const off = offsets(iv, reuse);
  const arena = Math.max(...Object.keys(off).map((n) => off[n] + SIZE[n]));
  const peak = Math.max(
    ...order.map((_, t) =>
      Object.keys(iv)
        .filter((n) => iv[n][0] <= t && t <= iv[n][1])
        .reduce((a, n) => a + SIZE[n], 0),
    ),
  );
  const W = 330,
    x0 = 40,
    y0 = 8,
    cw = 56,
    uh = 12,
    top = 11;
  const H = y0 + top * uh + 24;
  const seg = (
    opts: [number | boolean, string][],
    val: number | boolean,
    set: (v: never) => void,
    label: string,
  ) => (
    <div
      role="group"
      aria-label={label}
      style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
    >
      {opts.map(([v, l]) => (
        <button
          key={String(v)}
          type="button"
          className={v === val ? "btn btn-primary" : "btn"}
          aria-pressed={v === val}
          onClick={() => set(v as never)}
        >
          {l}
        </button>
      ))}
    </div>
  );
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 10 }}
      >
        {seg(
          [
            [0, "order a b c d e"],
            [1, "order a b d c e"],
          ],
          oi,
          setOi,
          "Schedule",
        )}
        {seg(
          [
            [false, "separate buffers"],
            [true, "reuse memory"],
          ],
          reuse,
          setReuse,
          "Allocation",
        )}
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
        aria-label="Buffers placed in memory over the steps of the schedule"
      >
        <line
          x1={x0}
          x2={x0}
          y1={y0}
          y2={y0 + top * uh}
          stroke="var(--border)"
        />
        <line
          x1={x0}
          x2={x0 + 5 * cw}
          y1={y0 + top * uh}
          y2={y0 + top * uh}
          stroke="var(--border)"
        />
        {[0, 5, 10].map((v) => (
          <text
            key={v}
            x={x0 - 4}
            y={y0 + (top - v) * uh + 4}
            textAnchor="end"
            className="viz-label"
          >
            {v}
          </text>
        ))}
        {order.map((n, t) => (
          <text
            key={n}
            x={x0 + t * cw + cw / 2}
            y={y0 + top * uh + 16}
            textAnchor="middle"
            className="viz-label"
          >
            step {t}: {n}
          </text>
        ))}
        {Object.keys(iv).map((n) => {
          const [s, e] = iv[n];
          const y = y0 + (top - off[n] - SIZE[n]) * uh;
          return (
            <g key={n}>
              <rect
                x={x0 + s * cw + 2}
                y={y + 1}
                width={(e - s + 1) * cw - 4}
                height={SIZE[n] * uh - 2}
                fill={COLORS[n]}
                opacity={0.45}
                rx={3}
              />
              <text
                x={x0 + s * cw + 8}
                y={y + (SIZE[n] * uh) / 2 + 4}
                className="viz-label"
              >
                {n}
              </text>
            </g>
          );
        })}
        <line
          x1={x0}
          x2={x0 + 5 * cw}
          y1={y0 + (top - arena) * uh}
          y2={y0 + (top - arena) * uh}
          stroke="var(--danger)"
          strokeDasharray="4 3"
        />
      </svg>
      <p className="viz-label" style={{ textAlign: "center" }}>
        largest total live at one step: {peak} GB; memory needed: {arena} GB
      </p>
      <figcaption className="viz-caption">
        Each buffer is a box spanning the steps during which it is live, placed
        at an offset in memory; the dashed line is the memory the plan needs.
        Reuse lets buffers whose lifetimes do not overlap share space, bringing
        the plan down towards the most memory live at any one step. The schedule
        matters too: finishing d before computing c frees b sooner.
      </figcaption>
    </figure>
  );
}
