"use client";

import { useState } from "react";

const fails = (xs: number[]) => new Set(xs).size !== xs.length;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

/** One shrinking step: the first smaller candidate that still fails, or null. */
function shrinkStep(xs: number[]): number[] | null {
  const cands: number[][] = xs.map((_, i) => [...xs.slice(0, i), ...xs.slice(i + 1)]);
  xs.forEach((x, i) => {
    if (x !== 0) for (const y of [Math.trunc(x / 2), x - Math.sign(x)]) cands.push([...xs.slice(0, i), y, ...xs.slice(i + 1)]);
  });
  return cands.find(fails) ?? null;
}

const show = (xs: number[]) => `[${xs.join(", ")}]`;

/** Random inputs until a buggy sort fails, then shrinking to the smallest failing input. */
export function ShrinkViz() {
  const [seed, setSeed] = useState(7);
  const [tried, setTried] = useState<number[][]>([]);
  const [shrunk, setShrunk] = useState<number[][]>([]);
  const failing = tried.length > 0 && fails(tried[tried.length - 1]) ? tried[tried.length - 1] : null;
  const current = shrunk.length ? shrunk[shrunk.length - 1] : failing;
  const done = current !== null && shrinkStep(current) === null;

  const generate = () => {
    const r = rng(seed);
    const out: number[][] = [];
    for (let k = 0; k < 50; k++) {
      const n = Math.floor(r() * 7);
      const xs = Array.from({ length: n }, () => Math.floor(r() * 30) - 5);
      out.push(xs);
      if (fails(xs)) break;
    }
    setTried(out);
    setShrunk([]);
    setSeed(seed + 1);
  };
  const step = () => {
    if (!current) return;
    const next = shrinkStep(current);
    if (next) setShrunk([...shrunk, next]);
  };

  return (
    <figure className="viz">
      <pre className="mono" style={{ margin: "0 0 10px", fontSize: 13, overflowX: "auto" }}>
        {`def my_sort(xs):\n    return sorted(set(xs))      # fast, and wrong\n\n# property: my_sort(xs) == sorted(xs)`}
      </pre>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={generate}>Generate random lists</button>
        <button type="button" className="btn" onClick={step} disabled={!current || done}>Shrink one step</button>
      </div>
      <div className="mono" style={{ fontSize: 13, lineHeight: 1.7, overflowWrap: "anywhere" }}>
        {tried.map((xs, i) => (
          <div key={`t${i}`} style={{ color: fails(xs) ? "var(--danger)" : "var(--text-muted)" }}>
            try {i + 1}: {show(xs)} {fails(xs) ? "fails" : "passes"}
          </div>
        ))}
        {shrunk.map((xs, i) => (
          <div key={`s${i}`} style={{ color: "var(--danger)" }}>shrink {i + 1}: {show(xs)} still fails</div>
        ))}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {!tried.length
          ? "Generate lists until the property fails."
          : !failing
            ? "Fifty lists all passed. Generate again."
            : done
              ? `Minimal failing input: ${show(current!)}. Every one-step simplification of it passes, and it points straight at the bug: duplicates.`
              : `Found a failing list after ${tried.length} tries. It is noisy; shrink it.`}
      </figcaption>
    </figure>
  );
}
