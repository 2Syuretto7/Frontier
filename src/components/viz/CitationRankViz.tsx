"use client";

import { useState } from "react";

/** A small citation graph: each paper lists the earlier papers it cites. */
const PAPERS: { id: string; x: number; y: number; cites: string[] }[] = [
  { id: "A", x: 40, y: 150, cites: [] },
  { id: "B", x: 40, y: 60, cites: [] },
  { id: "C", x: 120, y: 105, cites: ["A", "B"] },
  { id: "D", x: 120, y: 30, cites: ["B"] },
  { id: "E", x: 200, y: 150, cites: ["C"] },
  { id: "F", x: 200, y: 60, cites: ["C", "D"] },
  { id: "G", x: 280, y: 110, cites: ["E", "F", "B"] },
  { id: "H", x: 280, y: 30, cites: ["D", "B"] },
];

export function pagerankOf(d: number, iters = 100) {
  const n = PAPERS.length;
  let r: Record<string, number> = Object.fromEntries(
    PAPERS.map((p) => [p.id, 1 / n]),
  );
  for (let t = 0; t < iters; t++) {
    const dangling = PAPERS.filter((p) => p.cites.length === 0).reduce(
      (s, p) => s + r[p.id],
      0,
    );
    const next: Record<string, number> = Object.fromEntries(
      PAPERS.map((p) => [p.id, (1 - d) / n + (d * dangling) / n]),
    );
    for (const p of PAPERS)
      for (const q of p.cites) next[q] += (d * r[p.id]) / p.cites.length;
    r = next;
  }
  return r;
}

export function CitationRankViz() {
  const [di, setD] = useState(85);
  const [mode, setMode] = useState<"rank" | "count">("rank");
  const d = di / 100;
  const pr = pagerankOf(d);
  const count: Record<string, number> = Object.fromEntries(
    PAPERS.map((p) => [p.id, 0]),
  );
  for (const p of PAPERS) for (const q of p.cites) count[q] += 1;
  const score = mode === "rank" ? pr : count;
  const maxScore = Math.max(...Object.values(score));
  const order = PAPERS.map((p) => p.id).sort(
    (a, b) => score[b] - score[a] || a.localeCompare(b),
  );
  const pos = Object.fromEntries(PAPERS.map((p) => [p.id, p]));
  const radius = (id: string) => 7 + 13 * (score[id] / maxScore);
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          damping: {d.toFixed(2)}{" "}
          <input
            type="range"
            min={50}
            max={95}
            value={di}
            onChange={(e) => setD(+e.target.value)}
          />
        </label>
        <button
          className="btn"
          onClick={() => setMode(mode === "rank" ? "count" : "rank")}
        >
          size by {mode === "rank" ? "citation count" : "PageRank"}
        </button>
      </div>
      <svg
        viewBox="0 0 320 180"
        style={{
          width: "100%",
          maxWidth: 460,
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label="A citation graph with papers sized by importance"
      >
        <defs>
          <marker
            id="cite-arrow"
            viewBox="0 0 10 10"
            refX="10"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="var(--text-muted)" />
          </marker>
        </defs>
        {PAPERS.flatMap((p) =>
          p.cites.map((q) => {
            const a = pos[p.id],
              b = pos[q];
            const len = Math.hypot(b.x - a.x, b.y - a.y);
            const ux = (b.x - a.x) / len,
              uy = (b.y - a.y) / len;
            const ra = radius(p.id),
              rb = radius(q);
            return (
              <line
                key={p.id + q}
                x1={a.x + ux * ra}
                y1={a.y + uy * ra}
                x2={b.x - ux * (rb + 2)}
                y2={b.y - uy * (rb + 2)}
                stroke="var(--text-muted)"
                strokeWidth={1}
                markerEnd="url(#cite-arrow)"
              />
            );
          }),
        )}
        {PAPERS.map((p) => (
          <g key={p.id}>
            <circle
              cx={p.x}
              cy={p.y}
              r={radius(p.id)}
              fill="var(--accent)"
              opacity={0.75}
            />
            <text
              x={p.x}
              y={p.y + 4}
              textAnchor="middle"
              className="viz-label"
              style={{ fontSize: 11, fill: "var(--surface)" }}
            >
              {p.id}
            </text>
          </g>
        ))}
      </svg>
      <p style={{ textAlign: "center", fontSize: 13, margin: "6px 0 0" }}>
        Ranked by {mode === "rank" ? "PageRank" : "citation count"}:{" "}
        {order
          .slice(0, 4)
          .map((id) =>
            mode === "rank"
              ? `${id} ${score[id].toFixed(3)}`
              : `${id} ${score[id]}`,
          )
          .join(", ")}
      </p>
      <figcaption className="viz-caption">
        Arrows point from a paper to the papers it cites. Citation count treats
        every citation alike; PageRank weighs a citation by the importance of
        the citing paper and divides it among everything that paper cites, so a
        paper cited by central papers rises. Lower damping pulls every score
        towards the uniform share.
      </figcaption>
    </figure>
  );
}
