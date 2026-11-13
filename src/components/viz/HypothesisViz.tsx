"use client";

import { useState } from "react";

const HYPS = [
  { key: "lr", label: "the learning rate is 0" },
  { key: "detach", label: "the output is detached from the graph" },
  { key: "zeros", label: "the data loader returns all-zero inputs" },
  { key: "labels", label: "labels are shuffled against inputs" },
  { key: "blowup", label: "the learning rate is far too high" },
];

const EXPS: { label: string; out: (h: string) => string }[] = [
  { label: "Overfit one batch of 8", out: (h) => (h === "labels" ? "loss falls to 0" : "loss stays high") },
  { label: "Parameter change after one step", out: (h) => (h === "lr" || h === "detach" ? "zero" : "non-zero") },
  { label: "Gradient norm", out: (h) => (h === "detach" ? "zero" : "non-zero") },
  { label: "Input mean and std", out: (h) => (h === "zeros" ? "all zero" : "normal") },
  { label: "Loss over the first 20 steps", out: (h) => (h === "blowup" ? "jumps up, then flat" : "flat near 2.30") },
];

/** A stuck loss with five possible causes. Run experiments and strike out the causes they rule out. */
export function HypothesisViz() {
  const [truth, setTruth] = useState(3);
  const [ran, setRan] = useState<number[]>([]);
  const t = HYPS[truth].key;
  const alive = HYPS.filter((h) => ran.every((e) => EXPS[e].out(h.key) === EXPS[e].out(t)));
  return (
    <figure className="viz">
      <p style={{ margin: "0 0 8px" }}>A 10-class classifier&rsquo;s loss sits at 2.30 and never moves. Possible causes:</p>
      <ul style={{ margin: "0 0 10px", paddingLeft: 20 }}>
        {HYPS.map((h) => {
          const out = !alive.includes(h);
          return (
            <li key={h.key} style={{ color: out ? "var(--text-faint)" : undefined, textDecoration: out ? "line-through" : undefined }}>
              {h.label}
            </li>
          );
        })}
      </ul>
      <div className="viz-controls" style={{ flexWrap: "wrap" }}>
        {EXPS.map((e, i) => (
          <button key={e.label} type="button" className="seg" aria-pressed={ran.includes(i)} disabled={ran.includes(i)} onClick={() => setRan([...ran, i])}>
            {e.label}
          </button>
        ))}
        <button type="button" className="btn" onClick={() => { setTruth((truth * 3 + 1) % HYPS.length); setRan([]); }}>New mystery</button>
      </div>
      <div className="mono" style={{ fontSize: 13, lineHeight: 1.7 }}>
        {ran.map((e) => <div key={e}>{EXPS[e].label}: {EXPS[e].out(t)}</div>)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {ran.length === 0
          ? "Choose an experiment. A good one rules out as many causes as possible whatever its result."
          : alive.length === 1
            ? `Found after ${ran.length} experiment${ran.length === 1 ? "" : "s"}: ${alive[0].label}. Could fewer experiments have guaranteed it?`
            : `${alive.length} causes remain after ${ran.length} experiment${ran.length === 1 ? "" : "s"}.`}
      </figcaption>
    </figure>
  );
}
