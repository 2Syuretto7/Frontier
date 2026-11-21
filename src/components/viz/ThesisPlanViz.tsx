"use client";

import { useState } from "react";

type Task = { id: string; label: string; deps: string[] };

const TASKS: Task[] = [
  { id: "read", label: "read and map", deps: [] },
  { id: "repro", label: "reproduce", deps: ["read"] },
  { id: "pilot", label: "pilot the idea", deps: ["read"] },
  { id: "ext", label: "extension", deps: ["repro", "pilot"] },
  { id: "write", label: "write", deps: ["ext"] },
  { id: "figs", label: "figures", deps: ["ext"] },
];

export function ThesisPlanViz() {
  const [weeks, setWeeks] = useState<Record<string, number>>({
    read: 3,
    repro: 5,
    pilot: 2,
    ext: 6,
    write: 3,
    figs: 1,
  });
  const finish: Record<string, number> = {};
  const start: Record<string, number> = {};
  for (const t of TASKS) {
    start[t.id] = Math.max(0, ...t.deps.map((d) => finish[d]));
    finish[t.id] = start[t.id] + weeks[t.id];
  }
  const total = Math.max(...Object.values(finish));
  const critical = new Set<string>();
  let cur = TASKS.reduce((a, b) => (finish[b.id] > finish[a.id] ? b : a)).id;
  critical.add(cur);
  for (;;) {
    const deps = TASKS.find((t) => t.id === cur)!.deps;
    if (!deps.length) break;
    cur = deps.reduce((a, b) => (finish[b] > finish[a] ? b : a));
    critical.add(cur);
  }
  const W = 330,
    x0 = 92,
    pw = 225,
    bh = 18,
    H = TASKS.length * (bh + 8) + 24;
  const scale = pw / Math.max(total, 1);
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        {(["repro", "pilot"] as const).map((id) => (
          <label className="viz-label" key={id}>
            {TASKS.find((t) => t.id === id)!.label}: {weeks[id]} weeks{" "}
            <input
              type="range"
              min={1}
              max={10}
              value={weeks[id]}
              onChange={(e) => setWeeks({ ...weeks, [id]: +e.target.value })}
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
        aria-label="A thesis plan as a chart of tasks over weeks, with the critical path highlighted"
      >
        {TASKS.map((t, i) => {
          const y = 6 + i * (bh + 8);
          const crit = critical.has(t.id);
          return (
            <g key={t.id}>
              <text
                x={x0 - 6}
                y={y + bh / 2 + 4}
                textAnchor="end"
                className="viz-label"
              >
                {t.label}
              </text>
              <rect
                x={x0 + start[t.id] * scale}
                y={y}
                width={weeks[t.id] * scale}
                height={bh}
                fill={crit ? "var(--danger)" : "var(--accent)"}
                opacity={crit ? 0.85 : 0.5}
              />
            </g>
          );
        })}
        <line
          x1={x0}
          x2={x0 + pw}
          y1={H - 14}
          y2={H - 14}
          stroke="var(--border)"
        />
        <text x={x0} y={H - 2} className="viz-label">
          0
        </text>
        <text x={x0 + pw} y={H - 2} textAnchor="end" className="viz-label">
          {total} weeks
        </text>
      </svg>
      <figcaption className="viz-caption">
        Tasks start when everything they depend on is done. The red chain is the
        critical path: shortening any red task shortens the project, while
        shortening a blue task does not until it becomes critical itself. Here
        the pilot only matters once it takes longer than the reproduction.
      </figcaption>
    </figure>
  );
}
