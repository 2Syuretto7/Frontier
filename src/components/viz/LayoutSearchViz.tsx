"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const STRATS = ["data", "tensor", "pipeline"];
const L = 6;

function solve(node: number[][], r: number) {
  const S = STRATS.length;
  let cost = [...node[0]];
  const back: number[][] = [];
  for (let l = 1; l < L; l++) {
    const prev: number[] = [];
    const next: number[] = [];
    for (let b = 0; b < S; b++) {
      let best = 0;
      for (let a = 1; a < S; a++)
        if (cost[a] + (a === b ? 0 : r) < cost[best] + (best === b ? 0 : r))
          best = a;
      prev.push(best);
      next.push(cost[best] + (best === b ? 0 : r) + node[l][b]);
    }
    back.push(prev);
    cost = next;
  }
  let s = cost.indexOf(Math.min(...cost));
  const total = cost[s];
  const path = [s];
  for (let i = back.length - 1; i >= 0; i--) {
    s = back[i][s];
    path.push(s);
  }
  return { total, path: path.reverse() };
}

export function LayoutSearchViz() {
  const [r, setR] = useState(6);
  const node = useMemo(() => {
    const g = rand(17);
    return Array.from({ length: L }, () =>
      STRATS.map(() => 10 + Math.floor(g() * 21)),
    );
  }, []);
  const opt = solve(node, r);
  const greedy = node.map((c) => c.indexOf(Math.min(...c)));
  const gCost =
    greedy.reduce((s, b, l) => s + node[l][b], 0) +
    greedy.slice(1).reduce((s, b, i) => s + (b === greedy[i] ? 0 : r), 0);
  const W = 340,
    x0 = 66,
    dx = (W - x0 - 20) / (L - 1),
    y0 = 22,
    dy = 46;
  const X = (l: number) => x0 + l * dx,
    Y = (s: number) => y0 + s * dy;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <label className="viz-label">
          resharding cost: {r}{" "}
          <input
            type="range"
            min={0}
            max={16}
            step={1}
            value={r}
            onChange={(e) => setR(+e.target.value)}
          />
        </label>
      </div>
      <svg
        viewBox={`0 0 ${W} ${y0 + 2 * dy + 38}`}
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="Trellis of layers and strategies with the cheapest and greedy paths"
      >
        {greedy.slice(1).map((b, i) => (
          <line
            key={`g${i}`}
            x1={X(i)}
            y1={Y(greedy[i]) + 4}
            x2={X(i + 1)}
            y2={Y(b) + 4}
            stroke="var(--danger)"
            strokeWidth={2}
            strokeDasharray="4 3"
          />
        ))}
        {opt.path.slice(1).map((b, i) => (
          <line
            key={`o${i}`}
            x1={X(i)}
            y1={Y(opt.path[i])}
            x2={X(i + 1)}
            y2={Y(b)}
            stroke="var(--accent)"
            strokeWidth={3}
          />
        ))}
        {STRATS.map((s, j) => (
          <text
            key={s}
            x={x0 - 18}
            y={Y(j) + 4}
            textAnchor="end"
            className="viz-label"
          >
            {s}
          </text>
        ))}
        {node.map((c, l) =>
          c.map((v, s) => (
            <g key={`${l}-${s}`}>
              <circle
                cx={X(l)}
                cy={Y(s)}
                r={12}
                fill="var(--surface)"
                stroke={opt.path[l] === s ? "var(--accent)" : "var(--border)"}
                strokeWidth={opt.path[l] === s ? 2.5 : 1}
              />
              <text
                x={X(l)}
                y={Y(s) + 4}
                textAnchor="middle"
                className="viz-label"
              >
                {v}
              </text>
            </g>
          )),
        )}
        {node.map((_, l) => (
          <text
            key={l}
            x={X(l)}
            y={y0 + 2 * dy + 32}
            textAnchor="middle"
            className="viz-label"
          >
            L{l + 1}
          </text>
        ))}
      </svg>
      <p className="viz-label" style={{ textAlign: "center" }}>
        cheapest plan {opt.total}; choosing each layer&apos;s cheapest strategy
        alone {gCost}
      </p>
      <figcaption className="viz-caption">
        Each circle is the cost of running a layer with one strategy, and
        switching strategy between neighbouring layers adds the resharding cost.
        The solid path is the cheapest plan, found by dynamic programming; the
        dashed path picks each layer&apos;s cheapest strategy on its own. As
        resharding grows dearer, the best plan switches less often and the
        greedy plan falls behind.
      </figcaption>
    </figure>
  );
}
