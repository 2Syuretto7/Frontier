"use client";

import { useState } from "react";

type Layout = "row" | "col";
type Access = "row" | "col";
const R = 4,
  C = 6;

export function LayoutStridesViz() {
  const [layout, setLayout] = useState<Layout>("row");
  const [access, setAccess] = useState<Access>("row");
  const [sr, sc] = layout === "row" ? [C, 1] : [1, R];
  const off = (i: number, j: number) => i * sr + j * sc;
  const touched =
    access === "row"
      ? Array.from({ length: C }, (_, j) => off(1, j))
      : Array.from({ length: R }, (_, i) => off(i, 2));
  const span = Math.max(...touched) - Math.min(...touched) + 1;
  const W = 330,
    cw = 30,
    gx = 70,
    gy = 8,
    my = gy + R * cw + 26,
    mw = (W - 20) / (R * C);
  const H = my + 40;
  const seg = (
    opts: [string, string][],
    val: string,
    set: (v: string) => void,
    label: string,
  ) => (
    <div
      role="group"
      aria-label={label}
      style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
    >
      {opts.map(([v, l]) => (
        <button
          key={v}
          type="button"
          className={v === val ? "btn btn-primary" : "btn"}
          aria-pressed={v === val}
          onClick={() => set(v)}
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
            ["row", "row-major"],
            ["col", "column-major"],
          ],
          layout,
          (v) => setLayout(v as Layout),
          "Layout",
        )}
        {seg(
          [
            ["row", "read row 1"],
            ["col", "read column 2"],
          ],
          access,
          (v) => setAccess(v as Access),
          "Access",
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
        aria-label="A 4 by 6 matrix with memory offsets and the memory positions a read touches"
      >
        {Array.from({ length: R }, (_, i) =>
          Array.from({ length: C }, (_, j) => {
            const o = off(i, j);
            const hit = touched.includes(o);
            return (
              <g key={`${i}-${j}`}>
                <rect
                  x={gx + j * cw}
                  y={gy + i * cw}
                  width={cw - 2}
                  height={cw - 2}
                  fill={hit ? "var(--accent)" : "var(--surface)"}
                  fillOpacity={hit ? 0.35 : 1}
                  stroke="var(--border)"
                />
                <text
                  x={gx + j * cw + cw / 2 - 1}
                  y={gy + i * cw + cw / 2 + 4}
                  textAnchor="middle"
                  className="viz-label"
                >
                  {o}
                </text>
              </g>
            );
          }),
        )}
        <text x={10} y={my - 6} className="viz-label">
          memory
        </text>
        {Array.from({ length: R * C }, (_, k) => (
          <rect
            key={k}
            x={10 + k * mw}
            y={my}
            width={mw - 1}
            height={16}
            fill={touched.includes(k) ? "var(--accent)" : "var(--grid-line)"}
            opacity={touched.includes(k) ? 0.8 : 0.6}
          />
        ))}
      </svg>
      <p className="viz-label" style={{ textAlign: "center" }}>
        strides ({sr}, {sc}); the read touches {touched.length} elements spread
        over {span} consecutive positions
      </p>
      <figcaption className="viz-caption">
        Each cell shows its offset in memory, row index times the row stride
        plus column index times the column stride. A read along the dimension
        with stride 1 touches one contiguous run, which hardware serves in few
        transactions; a read along the other dimension jumps by the larger
        stride and touches scattered positions. Layout assignment chooses
        strides so that each kernel&apos;s inner loop runs along stride 1.
      </figcaption>
    </figure>
  );
}
