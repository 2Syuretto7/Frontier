"use client";

import { useState } from "react";

const GPUS = 2048;
const FIX = 45;
const RECOMPUTE = 20;

export function IncidentCostViz() {
  const [detect, setDetect] = useState(20);
  const [ack, setAck] = useState(25);
  const parts: [string, number, string][] = [
    ["undetected", detect, "var(--danger)"],
    ["waiting for a person", ack, "var(--text-muted)"],
    ["rolling back and restarting", FIX, "var(--accent)"],
    ["recomputing lost steps", RECOMPUTE, "var(--success)"],
  ];
  const total = parts.reduce((a, [, m]) => a + m, 0);
  const W = 330,
    x0 = 10,
    pw = 310,
    y0 = 10,
    bh = 26,
    maxMin = 60 + 60 + FIX + RECOMPUTE;
  const H = y0 + bh + 18 + parts.length * 18 + 6;
  let acc = 0;
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          time to alert: {detect} min{" "}
          <input
            type="range"
            min={0}
            max={60}
            step={5}
            value={detect}
            onChange={(e) => setDetect(+e.target.value)}
          />
        </label>
        <label className="viz-label">
          time to acknowledge: {ack} min{" "}
          <input
            type="range"
            min={0}
            max={60}
            step={5}
            value={ack}
            onChange={(e) => setAck(+e.target.value)}
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
        aria-label="Minutes lost in each phase of an incident"
      >
        <rect
          x={x0}
          y={y0}
          width={pw}
          height={bh}
          fill="none"
          stroke="var(--border)"
        />
        {parts.map(([name, m, color]) => {
          const x = x0 + (acc / maxMin) * pw;
          acc += m;
          return (
            <rect
              key={name}
              x={x}
              y={y0}
              width={(m / maxMin) * pw}
              height={bh}
              fill={color}
              opacity={0.75}
            />
          );
        })}
        {parts.map(([name, m, color], i) => (
          <g key={name}>
            <rect
              x={x0}
              y={y0 + bh + 12 + i * 18}
              width={10}
              height={10}
              fill={color}
              opacity={0.75}
            />
            <text x={x0 + 16} y={y0 + bh + 21 + i * 18} className="viz-label">
              {name}: {m} min
            </text>
          </g>
        ))}
      </svg>
      <p className="viz-label" style={{ textAlign: "center" }}>
        {total} minutes on {GPUS.toLocaleString("en-IN")} GPUs:{" "}
        {((total * GPUS) / 60).toFixed(0)} GPU-hours
      </p>
      <figcaption className="viz-caption">
        Where the time goes in a loss-spike incident. The rollback and the
        recomputation are fixed by the checkpoint strategy; the time before
        anyone acts is set by alerting and on-call practice, and can be the
        largest share. A postmortem that measures each phase shows which one an
        action item should shrink.
      </figcaption>
    </figure>
  );
}
