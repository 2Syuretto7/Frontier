"use client";

import { useState } from "react";

// recommender: S initial preferences, D recommendation, X preferences after, U engagement
const POS: Record<string, [number, number]> = {
  S: [50, 40],
  D: [50, 140],
  X: [190, 90],
  U: [300, 140],
};
const EDGES: [string, string][] = [
  ["S", "D"],
  ["S", "X"],
  ["D", "X"],
  ["X", "U"],
  ["D", "U"],
];
// P(X = 1 | d): the user's taste has shifted towards sensational content
const PX: Record<string, number> = { news: 0.2, clickbait: 0.7 };
const BASE: Record<string, number> = { news: 6, clickbait: 4 };

/** Expected engagement of each action, with X responding to d or frozen at its response to news. */
export function engagement(pathSpecific: boolean) {
  return Object.fromEntries(
    Object.keys(PX).map((d) => {
      const p = pathSpecific ? PX.news : PX[d];
      return [d, BASE[d] + 8 * p];
    }),
  ) as Record<string, number>;
}

export function CidViz() {
  const [ps, setPs] = useState(false);
  const ev = engagement(ps);
  const bestAct = ev.news >= ev.clickbait ? "news" : "clickbait";
  const shape = (v: string) => {
    const [x, y] = POS[v];
    if (v === "D")
      return (
        <rect
          x={x - 16}
          y={y - 13}
          width={32}
          height={26}
          fill="var(--surface)"
          stroke="var(--accent)"
          strokeWidth={2}
        />
      );
    if (v === "U")
      return (
        <polygon
          points={`${x},${y - 16} ${x + 16},${y} ${x},${y + 16} ${x - 16},${y}`}
          fill="var(--surface)"
          stroke="var(--success)"
          strokeWidth={2}
        />
      );
    return (
      <circle
        cx={x}
        cy={y}
        r={15}
        fill="var(--surface)"
        stroke="var(--text-muted)"
      />
    );
  };
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Objective">
          {["maximise engagement", "path-specific objective"].map((n, j) => (
            <button
              key={n}
              type="button"
              className="seg"
              aria-pressed={ps === (j === 1)}
              onClick={() => setPs(j === 1)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox="0 0 340 230"
        style={{
          width: "100%",
          maxWidth: 520,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="A causal influence diagram of a recommender system, with the control incentive on the user's preferences"
      >
        <defs>
          <marker
            id="cid-arrow"
            viewBox="0 0 10 10"
            refX="10"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="context-stroke" />
          </marker>
        </defs>
        {EDGES.map(([p, c]) => {
          const [x1, y1] = POS[p],
            [x2, y2] = POS[c];
          const d = Math.hypot(x2 - x1, y2 - y1);
          const control =
            !ps && ((p === "D" && c === "X") || (p === "X" && c === "U"));
          const cut = ps && p === "D" && c === "X";
          return (
            <line
              key={p + c}
              x1={x1 + ((x2 - x1) * 18) / d}
              y1={y1 + ((y2 - y1) * 18) / d}
              x2={x2 - ((x2 - x1) * 18) / d}
              y2={y2 - ((y2 - y1) * 18) / d}
              stroke={
                control
                  ? "var(--danger)"
                  : cut
                    ? "var(--border-strong)"
                    : "var(--text-muted)"
              }
              strokeWidth={control ? 2.5 : 1.3}
              strokeDasharray={
                p === "S" && c === "D" ? "4 3" : cut ? "2 4" : undefined
              }
              markerEnd="url(#cid-arrow)"
            />
          );
        })}
        {Object.keys(POS).map((v) => (
          <g key={v}>
            {shape(v)}
            <text
              x={POS[v][0]}
              y={POS[v][1] + 4}
              textAnchor="middle"
              className="viz-label"
            >
              {v}
            </text>
          </g>
        ))}
        <text x={10} y={182} className="viz-label">
          engagement: news {ev.news.toFixed(1)}, clickbait{" "}
          {ev.clickbait.toFixed(1)}
        </text>
        <text x={10} y={200} className="viz-label">
          optimal recommendation: {bestAct}
        </text>
        <text x={10} y={218} className="viz-label">
          {ps
            ? "no control incentive on X"
            : "control incentive on X: D → X → U (red)"}
        </text>
      </svg>
      <figcaption className="viz-caption">
        S: the user&apos;s preferences, observed by the decision D (dashed
        information link). X: the preferences after the recommendation. U:
        engagement. Maximising engagement rewards shifting the user towards
        sensational content, a control incentive along D → X → U. The
        path-specific objective scores each action with X responding as it would
        to news, which removes the incentive and changes the choice.
      </figcaption>
    </figure>
  );
}
