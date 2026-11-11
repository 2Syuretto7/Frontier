"use client";

import { useState } from "react";

const WORDS = ["tea", "ten", "tent", "to", "toe", "in", "inn", "ink"];

type N = { ch: string; kids: N[]; end: boolean; word: string };

function build(): N {
  const root: N = { ch: "", kids: [], end: false, word: "" };
  for (const w of WORDS) {
    let n = root;
    for (const c of w) {
      let k = n.kids.find((x) => x.ch === c);
      if (!k) { k = { ch: c, kids: [], end: false, word: n.word + c }; n.kids.push(k); n.kids.sort((a, b) => a.ch.localeCompare(b.ch)); }
      n = k;
    }
    n.end = true;
  }
  return root;
}

/** A trie stores words by their letters along paths from the root; typing a prefix walks one path, and the words below it are its completions. */
export function TrieViz() {
  const [prefix, setPrefix] = useState("te");
  const root = build();
  const p = prefix.toLowerCase().replace(/[^a-z]/g, "");
  const nodes: { n: N; x: number; y: number }[] = [];
  const edges: [number, number, number, number, string][] = [];
  let leaf = 0;
  const place = (n: N, d: number): number => {
    const xs = n.kids.map((k) => place(k, d + 1));
    const x = xs.length ? (xs[0] + xs[xs.length - 1]) / 2 : leaf++;
    nodes.push({ n, x, y: d });
    n.kids.forEach((k, i) => edges.push([x, d, xs[i], d + 1, k.word]));
    return x;
  };
  place(root, 0);
  let cur: N | null = root;
  for (const c of p) { cur = cur ? cur.kids.find((k) => k.ch === c) ?? null : null; }
  const done: string[] = [];
  const collect = (n: N) => { if (n.end) done.push(n.word); n.kids.forEach(collect); };
  if (cur) collect(cur);
  const W = 560, dx = W / (leaf + 1), dy = 44;
  const onPath = (w: string) => cur !== null && p.startsWith(w);
  const below = (w: string) => cur !== null && w.startsWith(p) && w.length > p.length;
  return (
    <figure className="viz">
      <div className="viz-sliders">
        <label><span>Prefix</span><input type="text" value={prefix} maxLength={6} onChange={(e) => setPrefix(e.target.value)} aria-label="Prefix to look up" className="input" style={{ maxWidth: 160 }} /></label>
      </div>
      <svg viewBox={`0 0 ${W} ${5 * dy + 10}`} role="img" aria-label={`Trie of ${WORDS.length} words; prefix ${p || "empty"} has ${done.length} completions`}>
        {edges.map(([x1, y1, x2, y2, w], i) => <line key={i} x1={dx * (x1 + 1)} y1={20 + y1 * dy} x2={dx * (x2 + 1)} y2={20 + y2 * dy} className={onPath(w) ? "plot-curve" : "plot-line"} />)}
        {nodes.map(({ n, x, y }) => (
          <g key={n.word || "root"}>
            <circle cx={dx * (x + 1)} cy={20 + y * dy} r={13} className={onPath(n.word) || below(n.word) ? "viz-node is-paired" : "viz-node"} style={n.end ? { strokeWidth: 3 } : undefined} />
            <text x={dx * (x + 1)} y={20 + y * dy + 5} textAnchor="middle" className="viz-label">{n.ch || "·"}</text>
          </g>
        ))}
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        Words: {WORDS.join(", ")}. Thick circles end a word. {cur === null ? <>No word starts with &ldquo;{p}&rdquo;: the walk falls off the trie after at most {p.length} steps.</> : <>
          Walking &ldquo;{p || "(empty)"}&rdquo; takes {p.length} step{p.length === 1 ? "" : "s"}, however many words are stored; the subtree below holds{" "}
          <span className="mono">{done.length}</span> completion{done.length === 1 ? "" : "s"}: {done.join(", ") || "none"}.</>}
      </figcaption>
    </figure>
  );
}
