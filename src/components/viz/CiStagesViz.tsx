"use client";

import { useState } from "react";

const STAGES = [
  { name: "install", s: 90, cached: 10 },
  { name: "lint", s: 15 },
  { name: "type check", s: 40 },
  { name: "unit tests", s: 120 },
  { name: "tiny training run", s: 300 },
];

/** A CI pipeline for a research repository. How soon does a lint error turn the check red? */
export function CiStagesViz() {
  const [cache, setCache] = useState(false);
  const [parallel, setParallel] = useState(false);
  const [cheapFirst, setCheapFirst] = useState(true);
  const install = cache ? STAGES[0].cached! : STAGES[0].s;
  const rest = cheapFirst ? STAGES.slice(1) : [...STAGES.slice(1)].reverse();
  const bars: { name: string; start: number; end: number }[] = [{ name: "install", start: 0, end: install }];
  let t = install;
  for (const st of rest) {
    const start = parallel ? install : t;
    bars.push({ name: st.name, start, end: start + st.s });
    if (!parallel) t += st.s;
  }
  const total = Math.max(...bars.map((b) => b.end));
  const red = bars.find((b) => b.name === "lint")!.end;
  const scale = (x: number) => (x / 600) * 100;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <button type="button" className="seg" aria-pressed={cache} onClick={() => setCache(!cache)}>cache dependencies</button>
        <button type="button" className="seg" aria-pressed={parallel} onClick={() => setParallel(!parallel)}>run checks in parallel</button>
        <button type="button" className="seg" aria-pressed={cheapFirst} onClick={() => setCheapFirst(!cheapFirst)}>cheap checks first</button>
      </div>
      <div style={{ margin: "8px 0" }}>
        {bars.map((b) => (
          <div key={b.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span className="mono" style={{ width: 120, flex: "none", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</span>
            <div style={{ position: "relative", flex: 1, height: 16 }}>
              <div style={{ position: "absolute", left: `${scale(b.start)}%`, width: `${Math.max(scale(b.end - b.start), 0.8)}%`, top: 0, bottom: 0, background: b.name === "lint" ? "var(--danger)" : "var(--accent)", borderRadius: 3 }} />
            </div>
          </div>
        ))}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The lint check fails, and you learn it after {Math.floor(red / 60)} min {red % 60} s. A clean run takes{" "}
        {Math.floor(total / 60)} min {total % 60} s.{" "}
        {red <= 30 ? "Fast feedback: you are still thinking about the change when it comes back." : "Order and parallelism decide how long a trivial mistake takes to surface."}
      </figcaption>
    </figure>
  );
}
