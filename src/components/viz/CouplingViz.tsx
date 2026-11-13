"use client";

import { useState } from "react";

const NODES = ["config", "data", "model", "loss", "optim", "train", "eval", "logger"];
type Uses = Record<string, string[]>;

const MODULAR: Uses = {
  train: ["data", "model", "loss", "optim", "logger", "config"],
  eval: ["model", "data"],
};
const TANGLED: Uses = {
  data: ["config", "logger"],
  model: ["config", "data"],
  loss: ["config", "model"],
  optim: ["config", "model"],
  train: ["config", "data", "model", "loss", "optim", "logger", "eval"],
  eval: ["config", "train", "loss"],
  logger: ["config", "train"],
};

const W = 340, R = 120, C = W / 2;
const pos = (i: number) => {
  const a = (2 * Math.PI * i) / NODES.length - Math.PI / 2;
  return { x: C + R * Math.cos(a), y: C + R * Math.sin(a) };
};

function affected(uses: Uses, changed: string) {
  const hit = new Set<string>([changed]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const [a, bs] of Object.entries(uses)) {
      if (!hit.has(a) && bs.some((b) => hit.has(b))) { hit.add(a); grew = true; }
    }
  }
  hit.delete(changed);
  return hit;
}

/** Change one component and see which others might change behaviour with it. */
export function CouplingViz() {
  const [tangled, setTangled] = useState(true);
  const [changed, setChanged] = useState("model");
  const uses = tangled ? TANGLED : MODULAR;
  const hit = affected(uses, changed);
  const edges = Object.entries(uses).flatMap(([a, bs]) => bs.map((b) => [a, b] as const));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <button type="button" className="seg" aria-pressed={tangled} onClick={() => setTangled(true)}>one script with globals</button>
        <button type="button" className="seg" aria-pressed={!tangled} onClick={() => setTangled(false)}>modules with interfaces</button>
      </div>
      <svg viewBox={`0 0 ${W} ${W}`} style={{ maxWidth: 400, width: "100%", display: "block", margin: "0 auto" }} role="img" aria-label="Components and which ones use which">
        {edges.map(([a, b]) => {
          const p = pos(NODES.indexOf(a)), q = pos(NODES.indexOf(b));
          return <line key={a + b} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="var(--border)" strokeWidth={1.5} />;
        })}
        {NODES.map((n, i) => {
          const p = pos(i);
          const fill = n === changed ? "var(--accent)" : hit.has(n) ? "var(--danger)" : "var(--bg)";
          return (
            <g key={n} onClick={() => setChanged(n)} style={{ cursor: "pointer" }} role="button" aria-label={`change ${n}`}>
              <circle cx={p.x} cy={p.y} r={26} fill={fill} stroke="var(--text-muted)" />
              <text x={p.x} y={p.y + 4} textAnchor="middle" className="viz-label" style={{ fill: n === changed || hit.has(n) ? "white" : undefined }}>{n}</text>
            </g>
          );
        })}
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        Tap a component to change it. Changing <strong>{changed}</strong> can affect {hit.size} other component{hit.size === 1 ? "" : "s"}
        {hit.size ? `: ${[...hit].join(", ")}` : ""}. {edges.length} dependencies in all.{" "}
        {tangled ? "Through shared globals, almost anything can affect anything." : "With clear interfaces, a change stays near where it was made."}
      </figcaption>
    </figure>
  );
}
