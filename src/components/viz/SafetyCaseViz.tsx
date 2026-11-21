"use client";

import { useState } from "react";

const P_INABILITY = 0.01,
  P_SECURITY = 0.005;

/** Chance that two defences with miss rates p1, p2 and correlation rho both miss. */
export function bothMiss(p1: number, p2: number, rho: number) {
  return p1 * p2 + rho * Math.sqrt(p1 * (1 - p1) * p2 * (1 - p2));
}

type Box = { x: number; y: number; title: string; value: number };

export function SafetyCaseViz() {
  const [ai, setA] = useState(10);
  const [bi, setB] = useState(15);
  const [ri, setR] = useState(20);
  const pa = ai / 100,
    pb = bi / 100,
    rho = ri / 100;
  const control = Math.min(bothMiss(pa, pb, rho), pa, pb);
  const indep = pa * pb;
  const top = Math.min(1, P_INABILITY + control + P_SECURITY);
  const W = 330,
    H = 210,
    bw = 96,
    bh = 38;
  const boxes: Box[] = [
    { x: W / 2, y: 26, title: "deployment is safe", value: top },
    { x: 58, y: 96, title: "cannot do harm alone", value: P_INABILITY },
    { x: W / 2, y: 96, title: "control catches it", value: control },
    { x: W - 58, y: 96, title: "weights stay secure", value: P_SECURITY },
    { x: W / 2 - 54, y: 168, title: "monitor A", value: pa },
    { x: W / 2 + 54, y: 168, title: "monitor B", value: pb },
  ];
  const edges: [number, number][] = [
    [0, 1],
    [0, 2],
    [0, 3],
    [2, 4],
    [2, 5],
  ];
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          monitor A misses: {pa.toFixed(2)}{" "}
          <input
            type="range"
            min={1}
            max={40}
            value={ai}
            onChange={(e) => setA(+e.target.value)}
          />
        </label>
        <label className="viz-label">
          monitor B misses: {pb.toFixed(2)}{" "}
          <input
            type="range"
            min={1}
            max={40}
            value={bi}
            onChange={(e) => setB(+e.target.value)}
          />
        </label>
        <label className="viz-label">
          correlation of misses: {rho.toFixed(2)}{" "}
          <input
            type="range"
            min={0}
            max={100}
            value={ri}
            onChange={(e) => setR(+e.target.value)}
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
        aria-label="A safety case tree with the chance that each claim fails"
      >
        {edges.map(([a, b]) => (
          <line
            key={`${a}-${b}`}
            x1={boxes[a].x}
            y1={boxes[a].y + bh / 2}
            x2={boxes[b].x}
            y2={boxes[b].y - bh / 2}
            stroke="var(--border)"
            strokeWidth={1.5}
          />
        ))}
        {boxes.map((b, i) => (
          <g key={i}>
            <rect
              x={b.x - bw / 2}
              y={b.y - bh / 2}
              width={bw}
              height={bh}
              rx={4}
              fill="var(--surface)"
              stroke={i === 0 ? "var(--accent)" : "var(--border)"}
              strokeWidth={i === 0 ? 2 : 1}
            />
            <text
              x={b.x}
              y={b.y - 3}
              textAnchor="middle"
              className="viz-label"
              style={{ fontSize: 10 }}
            >
              {b.title}
            </text>
            <text
              x={b.x}
              y={b.y + 12}
              textAnchor="middle"
              className="viz-label"
              style={{ fontSize: 10, fill: "var(--danger)" }}
            >
              fails ≤ {b.value.toFixed(4)}
            </text>
          </g>
        ))}
        <text
          x={W / 2}
          y={62}
          textAnchor="middle"
          className="viz-label"
          style={{ fontSize: 9 }}
        >
          all must hold
        </text>
        <text
          x={W / 2}
          y={134}
          textAnchor="middle"
          className="viz-label"
          style={{ fontSize: 9 }}
        >
          either suffices
        </text>
      </svg>
      <p style={{ textAlign: "center", fontSize: 13, margin: "6px 0 0" }}>
        If the monitors missed independently, control would fail with chance{" "}
        {indep.toFixed(4)}; correlation raises it to {control.toFixed(4)}.
      </p>
      <figcaption className="viz-caption">
        The top claim holds only if all three supporting claims hold, so their
        failure chances add. The control claim holds if either monitor catches
        an attack, so it fails only when both miss. Independent misses multiply,
        but monitors trained on similar data tend to miss the same attacks, and
        even modest correlation can erase most of the benefit of the second
        monitor.
      </figcaption>
    </figure>
  );
}
