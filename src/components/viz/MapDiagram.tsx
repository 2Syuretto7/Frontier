"use client";

import { Arrow } from "./Plot";

export type MapColumn = { title: string; items: string[]; on?: boolean[] };

/**
 * Columns of labelled dots joined by arrows: the standard picture of a relation or function between finite sets.
 * maps[s][i] lists the targets in column s + 1 of item i in column s.
 */
export function MapDiagram({
  columns,
  maps,
  arrowClass,
  onItem,
  label,
}: {
  columns: MapColumn[];
  maps: number[][][];
  arrowClass?: (stage: number, from: number, to: number) => string;
  onItem?: (col: number, idx: number) => void;
  label: string;
}) {
  const W = 620, STEP = 46, TOP = 44, R = 15;
  const rows = Math.max(...columns.map((c) => c.items.length));
  const H = TOP + rows * STEP + 6;
  const xs = columns.map((_, i) => (columns.length === 1 ? W / 2 : 90 + (i * (W - 180)) / (columns.length - 1)));
  const y = (col: number, i: number) => TOP + STEP / 2 + i * STEP + ((rows - columns[col].items.length) * STEP) / 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      {columns.map((c, ci) => (
        <g key={ci}>
          <rect x={xs[ci] - 30} y={TOP - 4} width={60} height={rows * STEP + 8} rx={30} style={{ fill: "none", stroke: "var(--border-strong)", strokeDasharray: "4 4" }} />
          <text x={xs[ci]} y={22} textAnchor="middle" className="viz-label">{c.title}</text>
        </g>
      ))}
      {maps.map((m, s) =>
        m.map((ts, i) =>
          ts.map((t) => {
            const x1 = xs[s] + R + 3, y1 = y(s, i), x2 = xs[s + 1] - R - 3, y2 = y(s + 1, t);
            return <Arrow key={`${s}-${i}-${t}`} x1={x1} y1={y1} x2={x2} y2={y2} className={arrowClass ? arrowClass(s, i, t) : "plot-arrow"} />;
          }),
        ),
      )}
      {columns.map((c, ci) =>
        c.items.map((it, i) => (
          <g
            key={`${ci}-${i}`}
            onClick={onItem ? () => onItem(ci, i) : undefined}
            style={onItem ? { cursor: "pointer" } : undefined}
            role={onItem ? "button" : undefined}
            aria-label={onItem ? `${c.title}: ${it}` : undefined}
          >
            <circle cx={xs[ci]} cy={y(ci, i)} r={R} className={c.on?.[i] ? "viz-cell is-on" : "viz-cell"} />
            <text x={xs[ci]} y={y(ci, i) + 5} textAnchor="middle" className={c.on?.[i] ? "viz-label is-on" : "viz-label"}>{it}</text>
          </g>
        )),
      )}
    </svg>
  );
}
