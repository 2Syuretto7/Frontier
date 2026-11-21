"use client";

import { useState } from "react";

type Where = "memory" | "gradient";
const RANKS = 8;
const STEPS = 120;
const FAULT = 47;
const BAD = 5;

export function SdcDetectViz() {
  const [k, setK] = useState(25);
  const [where, setWhere] = useState<Where>("memory");
  const corrupt = (r: number, s: number) =>
    s >= FAULT && (where === "gradient" || r === BAD);
  const checks = Array.from(
    { length: Math.floor((STEPS - 1) / k) },
    (_, i) => (i + 1) * k,
  );
  const detect =
    where === "memory" ? checks.find((c) => c >= FAULT) : undefined;
  const W = 330,
    H = 160,
    x0 = 44,
    y0 = 8,
    pw = 280,
    rh = 16;
  const cw = pw / STEPS;
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          compare checksums every {k} steps{" "}
          <input
            type="range"
            min={5}
            max={60}
            step={5}
            value={k}
            onChange={(e) => setK(+e.target.value)}
          />
        </label>
        <div
          role="group"
          aria-label="Where the fault strikes"
          style={{ display: "flex", gap: 6 }}
        >
          {(
            [
              ["memory", "fault in parameters"],
              ["gradient", "fault in a gradient"],
            ] as [Where, string][]
          ).map(([w, label]) => (
            <button
              key={w}
              type="button"
              className={w === where ? "btn btn-primary" : "btn"}
              aria-pressed={w === where}
              onClick={() => setWhere(w)}
            >
              {label}
            </button>
          ))}
        </div>
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
        aria-label="Replica state of eight ranks over training steps"
      >
        {Array.from({ length: RANKS }, (_, r) => (
          <g key={r}>
            <text
              x={x0 - 4}
              y={y0 + r * rh + rh - 3}
              textAnchor="end"
              className="viz-label"
            >
              rank {r}
            </text>
            <rect
              x={x0}
              y={y0 + r * rh + 1}
              width={FAULT * cw}
              height={rh - 2}
              fill="var(--accent)"
              opacity={0.35}
            />
            <rect
              x={x0 + FAULT * cw}
              y={y0 + r * rh + 1}
              width={(STEPS - FAULT) * cw}
              height={rh - 2}
              fill={corrupt(r, FAULT) ? "var(--danger)" : "var(--accent)"}
              opacity={corrupt(r, FAULT) ? 0.7 : 0.35}
            />
          </g>
        ))}
        {checks.map((c) => (
          <line
            key={c}
            x1={x0 + c * cw}
            x2={x0 + c * cw}
            y1={y0 - 2}
            y2={y0 + RANKS * rh + 2}
            stroke={c === detect ? "var(--success)" : "var(--text-muted)"}
            strokeWidth={c === detect ? 2.5 : 1}
          />
        ))}
        <text
          x={x0 + FAULT * cw}
          y={y0 + RANKS * rh + 16}
          textAnchor="middle"
          className="viz-label"
        >
          fault
        </text>
      </svg>
      <p className="viz-label" style={{ textAlign: "center" }}>
        {detect !== undefined
          ? `caught at step ${detect}, ${detect - FAULT} steps after the fault`
          : "never caught: every replica holds the same wrong values"}
      </p>
      <figcaption className="viz-caption">
        Eight data-parallel replicas over 120 steps; vertical lines are checksum
        comparisons. A fault that changes one rank&apos;s parameters makes it
        disagree with the others and is caught at the next comparison. A fault
        in one rank&apos;s gradient is averaged into the all-reduce and reaches
        every replica equally, so comparing replicas can never see it.
      </figcaption>
    </figure>
  );
}
