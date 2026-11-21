"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

// eight units with both potential outcomes; the true average effect is 1.5
const Y0 = [3, 5, 2, 6, 4, 7, 1, 4];
const Y1 = [5, 5, 6, 6, 3, 9, 4, 6];

/** Treatment vector: a random half (seed) or self-selection by largest gain. */
export function assign(mode: number, seed: number) {
  if (mode === 1) return Y1.map((v, i) => (v - Y0[i] >= 2 ? 1 : 0));
  const r = rand(seed);
  const idx = Y0.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  const t = new Array(8).fill(0);
  idx.slice(0, 4).forEach((i) => (t[i] = 1));
  return t;
}

export function estimate(t: number[]) {
  const tr = t.flatMap((v, i) => (v ? [Y1[i]] : []));
  const co = t.flatMap((v, i) => (v ? [] : [Y0[i]]));
  const m = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
  return m(tr) - m(co);
}

export function PotentialOutcomesViz() {
  const [mode, setMode] = useState(0);
  const [seed, setSeed] = useState(1);
  const [reveal, setReveal] = useState(false);
  const t = assign(mode, seed);
  const est = estimate(t);
  const cw = 34;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Assignment">
          {["coin flips", "people choose"].map((name, j) => (
            <button
              key={name}
              type="button"
              className="seg"
              aria-pressed={mode === j}
              onClick={() => setMode(j)}
            >
              {name}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn"
          disabled={mode === 1}
          onClick={() => setSeed(seed + 1)}
        >
          re-randomise
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => setReveal(!reveal)}
        >
          {reveal ? "hide unseen" : "reveal unseen"}
        </button>
      </div>
      <svg
        viewBox="0 0 340 150"
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="A table of eight units with their potential outcomes under treatment and control, of which only one is observed"
      >
        {["unit", "Y(0)", "Y(1)", "treated"].map((h, r) => (
          <text key={h} x={10} y={24 + r * 26} className="viz-label">
            {h}
          </text>
        ))}
        {Y0.map((_, i) => {
          const x = 68 + i * cw;
          const seen0 = !t[i],
            seen1 = !!t[i];
          return (
            <g key={i}>
              <text
                x={x + cw / 2}
                y={24}
                textAnchor="middle"
                className="viz-label"
              >
                {i + 1}
              </text>
              {[Y0[i], Y1[i]].map((v, r) => {
                const seen = r ? seen1 : seen0;
                return (
                  <g key={r}>
                    <rect
                      x={x + 3}
                      y={34 + r * 26}
                      width={cw - 6}
                      height={20}
                      fill={seen ? "var(--accent)" : "var(--surface)"}
                      fillOpacity={seen ? 0.25 : 1}
                      stroke="var(--border)"
                    />
                    <text
                      x={x + cw / 2}
                      y={48 + r * 26}
                      textAnchor="middle"
                      className="viz-label"
                    >
                      {seen || reveal ? v : "?"}
                    </text>
                  </g>
                );
              })}
              <text
                x={x + cw / 2}
                y={102}
                textAnchor="middle"
                className="viz-label"
              >
                {t[i] ? "yes" : "no"}
              </text>
            </g>
          );
        })}
        <text x={10} y={128} className="viz-label">
          true average effect 1.50 (needs both rows)
        </text>
        <text x={10} y={144} className="viz-label">
          difference in observed means {est.toFixed(2)}
        </text>
      </svg>
      <figcaption className="viz-caption">
        Each unit has two potential outcomes, but treatment reveals only one
        (shaded). With coin flips, the difference in observed means varies from
        one assignment to the next but is right on average. When people choose
        treatment because they gain the most from it, the comparison is between
        different kinds of people, and the estimate is biased.
      </figcaption>
    </figure>
  );
}
