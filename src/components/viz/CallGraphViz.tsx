"use client";

import { useState } from "react";

const FUNCS: { name: string; file: string; x: number; y: number; calls: string[] }[] = [
  { name: "main", file: "train.py", x: 50, y: 8, calls: ["load_config", "build_model", "make_loader", "fit"] },
  { name: "load_config", file: "config.py", x: 12, y: 30, calls: [] },
  { name: "build_model", file: "models/__init__.py", x: 38, y: 30, calls: ["Transformer"] },
  { name: "make_loader", file: "data/loader.py", x: 64, y: 30, calls: ["tokenize"] },
  { name: "fit", file: "trainer.py", x: 88, y: 30, calls: ["train_step", "evaluate"] },
  { name: "Transformer", file: "models/transformer.py", x: 30, y: 54, calls: ["attention"] },
  { name: "tokenize", file: "data/tokenize.py", x: 58, y: 54, calls: [] },
  { name: "train_step", file: "trainer.py", x: 78, y: 54, calls: ["loss_fn"] },
  { name: "evaluate", file: "eval.py", x: 96, y: 54, calls: ["loss_fn"] },
  { name: "attention", file: "models/attention.py", x: 30, y: 78, calls: [] },
  { name: "loss_fn", file: "losses.py", x: 86, y: 78, calls: [] },
  { name: "old_attention", file: "models/attention.py", x: 8, y: 78, calls: [] },
  { name: "train_v1", file: "scripts/train_v1.py", x: 60, y: 92, calls: ["loss_fn", "old_attention"] },
];
const byName = Object.fromEntries(FUNCS.map((f) => [f.name, f]));

function closure(start: string, next: (n: string) => string[]) {
  const seen = new Set<string>();
  const stack = [...next(start)];
  while (stack.length) {
    const n = stack.pop()!;
    if (!seen.has(n)) { seen.add(n); stack.push(...next(n)); }
  }
  return seen;
}
const callers = (n: string) => FUNCS.filter((f) => f.calls.includes(n)).map((f) => f.name);
const reachable = new Set(["main", ...closure("main", (n) => byName[n].calls)]);

/** A small repository's call graph. Pick a function to see what it calls and what calls it. */
export function CallGraphViz() {
  const [sel, setSel] = useState("loss_fn");
  const down = closure(sel, (n) => byName[n].calls);
  const up = closure(sel, callers);
  const color = (n: string) => (n === sel ? "var(--accent)" : up.has(n) ? "var(--danger)" : down.has(n) ? "var(--text-muted)" : "var(--bg)");
  return (
    <figure className="viz">
      <svg viewBox="0 0 108 100" style={{ width: "100%", maxWidth: 560, display: "block", margin: "0 auto" }} role="img" aria-label="Call graph of a training repository">
        {FUNCS.flatMap((f) => f.calls.map((c) => (
          <line key={f.name + c} x1={f.x} y1={f.y} x2={byName[c].x} y2={byName[c].y} stroke="var(--border)" strokeWidth={0.4} />
        )))}
        {FUNCS.map((f) => (
          <g key={f.name} onClick={() => setSel(f.name)} style={{ cursor: "pointer" }} role="button" aria-label={f.name}>
            <rect x={f.x - 10} y={f.y - 3.2} width={20} height={6.4} rx={1.5} fill={color(f.name)} stroke="var(--text-muted)" strokeWidth={0.3}
              strokeDasharray={reachable.has(f.name) ? undefined : "1 0.8"} />
            <text x={f.x} y={f.y + 1.2} textAnchor="middle" style={{ fontSize: 2.9, fill: f.name === sel || up.has(f.name) ? "white" : "var(--text)" }}>{f.name}</text>
          </g>
        ))}
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        <span className="mono">{sel}</span> is defined in <span className="mono">{byName[sel].file}</span>. It is reached from{" "}
        {up.size ? [...up].sort().join(", ") : "nothing"}{down.size ? `, and calls ${[...down].sort().join(", ")}` : ""}.{" "}
        {reachable.has(sel)
          ? "Following callers up to main tells you when it runs; following callees down tells you what it depends on."
          : "Nothing reachable from main calls it: dashed boxes are dead code from an old experiment, and reading it would waste your time."}
      </figcaption>
    </figure>
  );
}
