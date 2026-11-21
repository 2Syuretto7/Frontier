"use client";

import { useMemo, useState } from "react";

const CORPUS: [string, number][] = [
  ["hug", 10],
  ["pug", 5],
  ["pun", 12],
  ["bun", 4],
  ["hugs", 5],
  ["bunny", 3],
];
const MAX = 8;

function run() {
  let words = CORPUS.map(([w, f]) => ({ toks: w.split(""), f }));
  const steps = [words];
  const merges: string[] = [];
  for (let k = 0; k < MAX; k++) {
    const c = new Map<string, number>();
    for (const { toks, f } of words)
      for (let i = 0; i + 1 < toks.length; i++) {
        const key = toks[i] + "\u0000" + toks[i + 1];
        c.set(key, (c.get(key) ?? 0) + f);
      }
    if (!c.size) break;
    const best = [...c.entries()].sort(
      (a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1),
    )[0][0];
    const [a, b] = best.split("\u0000");
    merges.push(`${a} + ${b}`);
    words = words.map(({ toks, f }) => {
      const out: string[] = [];
      for (let i = 0; i < toks.length; i++)
        if (i + 1 < toks.length && toks[i] === a && toks[i + 1] === b) {
          out.push(a + b);
          i++;
        } else out.push(toks[i]);
      return { toks: out, f };
    });
    steps.push(words);
  }
  return { steps, merges };
}

export function BpeMergeViz() {
  const [k, setK] = useState(2);
  const { steps, merges } = useMemo(run, []);
  const words = steps[k];
  const total = words.reduce((s, w) => s + w.toks.length * w.f, 0);
  const bytes = CORPUS.reduce((s, [w, f]) => s + w.length * f, 0);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <label className="viz-label">
          merges: {k}{" "}
          <input
            type="range"
            min={0}
            max={steps.length - 1}
            step={1}
            value={k}
            onChange={(e) => setK(+e.target.value)}
          />
        </label>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          marginTop: 8,
        }}
      >
        {words.map((w, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              alignItems: "center",
            }}
          >
            <span className="viz-label" style={{ width: 44 }}>
              ×{w.f}
            </span>
            {w.toks.map((t, j) => (
              <span
                key={j}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 14,
                  padding: "2px 8px",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  background:
                    t.length > 1 ? "var(--accent-soft)" : "var(--surface)",
                  color: "var(--text)",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        ))}
      </div>
      <p className="viz-label" style={{ textAlign: "center" }}>
        merges so far: {merges.slice(0, k).join(", ") || "none"}
        <br />
        {total} tokens for {bytes} bytes, {(bytes / total).toFixed(2)} bytes per
        token
      </p>
      <figcaption className="viz-caption">
        Byte-pair encoding starts from single characters and repeatedly merges
        the adjacent pair that occurs most often, counting each word as often as
        it appears. Each merge adds one token to the vocabulary and shortens the
        corpus; frequent words soon become single tokens while rare ones stay in
        pieces.
      </figcaption>
    </figure>
  );
}
