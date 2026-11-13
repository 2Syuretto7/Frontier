"use client";

import { useState } from "react";

// x = 2: a = x^2, b = 3x, c = a*b, L = c + a
const POS: Record<string, [number, number]> = { x: [30, 80], a: [120, 35], b: [120, 125], c: [210, 80], L: [295, 45] };
const EDGES: { u: string; v: string; d: number; label: string }[] = [
  { u: "x", v: "a", d: 4, label: "2x = 4" },
  { u: "x", v: "b", d: 3, label: "3" },
  { u: "a", v: "c", d: 6, label: "b = 6" },
  { u: "b", v: "c", d: 4, label: "a = 4" },
  { u: "c", v: "L", d: 1, label: "1" },
  { u: "a", v: "L", d: 1, label: "1" },
];
const PATHS = [["x", "a", "c", "L"], ["x", "b", "c", "L"], ["x", "a", "L"]];

/** dL/dx as a sum over all paths from x to L of the product of the local derivatives along each path. */
export function PathSumViz() {
  const [p, setP] = useState<number | null>(0);
  const onPath = (u: string, v: string) => p !== null && PATHS[p].some((n, i) => n === u && PATHS[p][i + 1] === v);
  const prod = (path: string[]) => path.slice(1).reduce((acc, v, i) => acc * EDGES.find((e) => e.u === path[i] && e.v === v)!.d, 1);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {PATHS.map((path, i) => (
          <button key={i} type="button" className="seg" aria-pressed={p === i} onClick={() => setP(i)}>{path.join(" → ")}</button>
        ))}
        <button type="button" className="seg" aria-pressed={p === null} onClick={() => setP(null)}>all</button>
      </div>
      <svg viewBox="0 0 330 160" style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Computational graph with local derivatives on the edges">
        {EDGES.map((e) => {
          const [x1, y1] = POS[e.u], [x2, y2] = POS[e.v];
          const hi = p === null || onPath(e.u, e.v);
          return (
            <g key={e.u + e.v}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={hi ? "var(--accent)" : "var(--border)"} strokeWidth={hi ? 2.4 : 1.2} />
              <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 5} textAnchor="middle" className="viz-label" style={{ opacity: hi ? 1 : 0.5 }}>{e.label}</text>
            </g>
          );
        })}
        {Object.entries(POS).map(([n, [x, y]]) => (
          <g key={n}>
            <circle cx={x} cy={y} r={15} fill="var(--bg)" stroke="var(--text-muted)" />
            <text x={x} y={y + 4} textAnchor="middle" className="viz-label">{n}</text>
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>
        {p === null
          ? `dL/dx = ${PATHS.map(prod).join(" + ")} = ${PATHS.map(prod).reduce((s, v) => s + v, 0)}`
          : `${PATHS[p].join(" → ")}: ${PATHS[p].slice(1).map((v, i) => EDGES.find((e) => e.u === PATHS[p][i] && e.v === v)!.d).join(" × ")} = ${prod(PATHS[p])}`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        a = x², b = 3x, c = a·b and L = c + a, at x = 2. Each edge carries the local derivative of its head with respect to its
        tail. The chain rule says dL/dx is the sum, over every path from x to L, of the product along the path: here 24 + 12 +
        4 = 40, which matches d(3x³ + x²)/dx = 9x² + 2x at x = 2.
      </figcaption>
    </figure>
  );
}
