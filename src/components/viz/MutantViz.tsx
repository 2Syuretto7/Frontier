"use client";

import { useState } from "react";

type Case = { label: string; x: number; want: number };

const CASES: Case[] = [
  { label: "clip(5, 0, 10) == 5", x: 5, want: 5 },
  { label: "clip(-3, 0, 10) == 0", x: -3, want: 0 },
  { label: "clip(12, 0, 10) == 10", x: 12, want: 10 },
  { label: "clip(10, 0, 10) == 10", x: 10, want: 10 },
];

const MUTANTS: { label: string; f: (x: number) => number }[] = [
  { label: "return min(x, hi)", f: (x) => Math.min(x, 10) },
  { label: "return max(x, lo)", f: (x) => Math.max(x, 0) },
  { label: "return lo if x < lo else hi", f: (x) => (x < 0 ? 0 : 10) },
  { label: "return max(lo, min(x, hi - 1))", f: (x) => Math.max(0, Math.min(x, 9)) },
  { label: "return max(lo, x) if x < hi else hi - (x == hi)", f: (x) => (x < 10 ? Math.max(0, x) : x === 10 ? 9 : 10) },
];

/** Choose which tests to keep, and see which deliberately broken versions of clip they catch. */
export function MutantViz() {
  const [on, setOn] = useState<boolean[]>([true, false, false, false]);
  const kept = CASES.filter((_, i) => on[i]);
  const killed = MUTANTS.map((m) => kept.some((c) => m.f(c.x) !== c.want));
  const n = killed.filter(Boolean).length;
  return (
    <figure className="viz">
      <div className="mono" style={{ fontWeight: 600, marginBottom: 6 }}>Tests to run</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        {CASES.map((c, i) => (
          <button key={c.label} type="button" className="seg" aria-pressed={on[i]} onClick={() => setOn(on.map((v, j) => (j === i ? !v : v)))}>
            <span className="mono">assert {c.label}</span>
          </button>
        ))}
      </div>
      <div className="mono" style={{ fontWeight: 600, marginBottom: 6 }}>Broken versions of clip (mutants)</div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {MUTANTS.map((m, i) => (
          <li key={m.label} style={{ display: "flex", gap: 8, alignItems: "baseline", padding: "4px 0", borderTop: "1px solid var(--border)", minWidth: 0 }}>
            <span className={`seg ${killed[i] ? "is-right" : "is-wrong"}`} style={{ flex: "none", padding: "0 8px" }}>{killed[i] ? "caught" : "missed"}</span>
            <code className="mono" style={{ overflowWrap: "anywhere" }}>{m.label}</code>
          </li>
        ))}
      </ul>
      <figcaption className="viz-caption" aria-live="polite">
        {kept.length} test{kept.length === 1 ? "" : "s"} catch {n} of {MUTANTS.length} mutants.{" "}
        {n === MUTANTS.length
          ? "Every bug here makes at least one test fail. Could you drop a test and still catch them all?"
          : kept.length === 0
            ? "With no tests, every bug survives."
            : "A surviving mutant is a bug your tests would let through. Which input would expose it?"}
      </figcaption>
    </figure>
  );
}
