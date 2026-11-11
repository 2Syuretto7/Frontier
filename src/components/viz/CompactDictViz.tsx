"use client";

import { useState } from "react";

const WORDS = ["the", "cat", "sat", "on", "mat", "with", "a", "hat"];

function toyHash(s: string) {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 1000003;
  return h;
}

type State = { index: (number | null)[]; entries: { key: string; hash: number }[]; probes: number; slot: number };

function build(k: number): State {
  let size = 8;
  let index: (number | null)[] = Array(size).fill(null);
  const entries: { key: string; hash: number }[] = [];
  let probes = 0, slot = -1;
  const place = (e: number) => {
    let i = entries[e].hash % size, p = 1;
    while (index[i] !== null) { i = (i + 1) % size; p++; }
    index[i] = e;
    return [i, p];
  };
  for (let w = 0; w < k; w++) {
    entries.push({ key: WORDS[w], hash: toyHash(WORDS[w]) });
    if (3 * entries.length > 2 * size) {
      size *= 2;
      index = Array(size).fill(null);
      for (let e = 0; e < entries.length - 1; e++) place(e);
    }
    [slot, probes] = place(entries.length - 1);
  }
  return { index, entries, probes, slot };
}

/** CPython's compact dict: a sparse table of small indices pointing into a dense, insertion-ordered list of entries. */
export function CompactDictViz() {
  const [k, setK] = useState(3);
  const s = build(k);
  const C = 40;
  const W = Math.max(s.index.length * C, 8 * C) + 10;
  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${W} 120`} role="img" aria-label={`Index table of ${s.index.length} slots after inserting ${k} keys`}>
        <text x={5} y={12} className="plot-tick">index table (hash mod {s.index.length}, then the next free slot)</text>
        {s.index.map((v, i) => (
          <g key={i}>
            <rect x={5 + i * C + 2} y={20} width={C - 4} height={C - 4} rx={4} className={i === s.slot ? "viz-cell is-on" : "viz-cell"} />
            <text x={5 + i * C + C / 2} y={20 + C / 2 + 2} textAnchor="middle" className="viz-label">{v ?? "·"}</text>
            <text x={5 + i * C + C / 2} y={74} textAnchor="middle" className="plot-tick">{i}</text>
          </g>
        ))}
      </svg>
      <div style={{ overflowX: "auto" }}>
        <table className="table">
          <thead><tr><th>entry</th><th>key</th><th>hash</th><th>hash mod {s.index.length}</th></tr></thead>
          <tbody>{s.entries.map((e, i) => <tr key={e.key}><td className="mono">{i}</td><td className="mono">{e.key}</td><td className="mono">{e.hash}</td><td className="mono">{e.hash % s.index.length}</td></tr>)}</tbody>
        </table>
      </div>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={() => setK(k + 1)} disabled={k >= WORDS.length}>Insert {WORDS[k] ?? ""}</button>
        <button type="button" className="btn" onClick={() => setK(1)}>Reset</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The last insertion, <span className="mono">{s.entries[s.entries.length - 1]?.key}</span>, landed in slot <span className="mono">{s.slot}</span> after{" "}
        <span className="mono">{s.probes}</span> probe{s.probes === 1 ? "" : "s"}. Entries are appended in order, so iterating over the dict lists keys in
        insertion order; only the small index table is sparse. When it is two-thirds full it doubles and every index is placed again. (CPython probes in a
        scrambled order rather than to the next slot, and its hash is different; the layout is the same.)
      </figcaption>
    </figure>
  );
}
