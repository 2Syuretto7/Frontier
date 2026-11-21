"use client";

import { useState } from "react";

const STAGES = [
  { name: "P", label: "pipeline check", cost: 1 },
  { name: "S", label: "small-scale signal", cost: 4 },
  { name: "B", label: "baseline sweep", cost: 10 },
];

const ORDERS = [
  [0, 1, 2],
  [0, 2, 1],
  [1, 0, 2],
  [1, 2, 0],
  [2, 0, 1],
  [2, 1, 0],
];

export function TestOrderViz() {
  const [ps, setPs] = useState([90, 50, 70]);
  const pass = ps.map((v) => v / 100);
  const costOf = (order: number[]) => {
    let total = 0,
      reach = 1;
    for (const i of order) {
      total += reach * STAGES[i].cost;
      reach *= pass[i];
    }
    return total;
  };
  const costs = ORDERS.map(costOf);
  const best = Math.min(...costs);
  const maxCost = Math.max(...costs);
  const W = 330,
    x0 = 60,
    pw = 230,
    bh = 18,
    H = ORDERS.length * (bh + 8) + 10;
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        {STAGES.map((s, i) => (
          <label className="viz-label" key={s.name}>
            {s.name}: {s.label}, cost {s.cost}, passes {pass[i].toFixed(2)}{" "}
            <input
              type="range"
              min={0}
              max={100}
              value={ps[i]}
              onChange={(e) =>
                setPs(ps.map((v, j) => (j === i ? +e.target.value : v)))
              }
            />
          </label>
        ))}
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
        aria-label="Expected cost of each order of the three tests"
      >
        {ORDERS.map((o, k) => {
          const y = 6 + k * (bh + 8);
          const isBest = Math.abs(costs[k] - best) < 1e-9;
          return (
            <g key={k}>
              <text
                x={x0 - 8}
                y={y + bh / 2 + 4}
                textAnchor="end"
                className="viz-label"
              >
                {o.map((i) => STAGES[i].name).join(" ")}
              </text>
              <rect
                x={x0}
                y={y}
                width={(costs[k] / maxCost) * pw}
                height={bh}
                fill={isBest ? "var(--success)" : "var(--accent)"}
                opacity={isBest ? 0.9 : 0.5}
              />
              <text
                x={x0 + (costs[k] / maxCost) * pw + 4}
                y={y + bh / 2 + 4}
                className="viz-label"
              >
                {costs[k].toFixed(2)}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="viz-caption">
        Each bar is the expected cost of running the three checks in that order,
        stopping at the first failure. The best order, in green, runs first the
        check with the lowest cost per unit chance of failing, so that an idea
        that will die tends to die cheaply.
      </figcaption>
    </figure>
  );
}
