"use client";

import { useMemo, useState } from "react";

const CORPUS: [string, number][] = [["low", 5], ["lower", 2], ["newest", 6], ["widest", 3], ["lowest", 1]];
const UNSEEN = ["slowest", "newer", "wide"];
const MAX = 10;

/** Byte-pair encoding on characters: merge the most frequent adjacent pair, ties to the smallest pair. */
export function trainBpe(corpus: [string, number][], k: number) {
  let words = corpus.map(([w, f]) => ({ toks: w.split(""), f }));
  const merges: [string, string][] = [];
  for (let step = 0; step < k; step++) {
    const counts = new Map<string, number>();
    for (const { toks, f } of words) for (let i = 0; i + 1 < toks.length; i++) {
      const key = toks[i] + "\u0000" + toks[i + 1];
      counts.set(key, (counts.get(key) ?? 0) + f);
    }
    if (!counts.size) break;
    let best = "", bestC = -1;
    for (const [key, c] of counts) {
      if (c > bestC || (c === bestC && key.split("\u0000").join("\u0001") < best.split("\u0000").join("\u0001"))) { best = key; bestC = c; }
    }
    const [a, b] = best.split("\u0000") as [string, string];
    merges.push([a, b]);
    words = words.map(({ toks, f }) => {
      const out: string[] = [];
      for (let i = 0; i < toks.length; i++) {
        if (i + 1 < toks.length && toks[i] === a && toks[i + 1] === b) { out.push(a + b); i++; } else out.push(toks[i]);
      }
      return { toks: out, f };
    });
  }
  return merges;
}

/** Encode by repeatedly merging the adjacent pair with the lowest merge rank. */
export function encode(word: string, merges: [string, string][]) {
  const rank = new Map(merges.map(([a, b], r) => [a + "\u0000" + b, r]));
  const toks = word.split("");
  for (;;) {
    let bi = -1, br = Infinity;
    for (let i = 0; i + 1 < toks.length; i++) {
      const r = rank.get(toks[i] + "\u0000" + toks[i + 1]);
      if (r !== undefined && r < br) { br = r; bi = i; }
    }
    if (bi < 0) return toks;
    toks.splice(bi, 2, toks[bi] + toks[bi + 1]);
  }
}

export function BpeMergeViz() {
  const [k, setK] = useState(4);
  const all = useMemo(() => trainBpe(CORPUS, MAX), []);
  const merges = all.slice(0, k);
  const total = CORPUS.reduce((s, [w, f]) => s + f * encode(w, merges).length, 0);
  const chars = CORPUS.reduce((s, [w, f]) => s + f * w.length, 0);
  const seg = (w: string) => (
    <span className="mono">
      {encode(w, merges).map((t, i) => (
        <span key={i} style={{ border: "1px solid var(--border)", borderRadius: 4, padding: "0 3px", marginRight: 2, background: t.length > 1 ? "var(--accent-soft)" : "transparent" }}>{t}</span>
      ))}
    </span>
  );
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="viz-label" htmlFor="bpe-k">merges learned: {k}</label>
        <input id="bpe-k" type="range" min={0} max={MAX} value={k} onChange={(e) => setK(Number(e.target.value))} style={{ flex: "1 1 160px" }} />
      </div>
      <div style={{ display: "grid", gap: 6, fontSize: 14 }}>
        {CORPUS.map(([w, f]) => (
          <div key={w}>{seg(w)} <span className="viz-label">× {f}</span></div>
        ))}
        <div className="viz-label" style={{ marginTop: 4 }}>words not in the corpus</div>
        {UNSEEN.map((w) => <div key={w}>{seg(w)}</div>)}
      </div>
      <div className="mono" style={{ fontSize: 13, margin: "8px 0", overflowWrap: "anywhere" }}>
        <div>{`merges: ${merges.length ? merges.map(([a, b]) => `${a}+${b}`).join(", ") : "none"}`}</div>
        <div>{`corpus tokens ${total} for ${chars} characters, ${(chars / total).toFixed(2)} characters per token; vocabulary ${new Set(CORPUS.flatMap(([w]) => w.split(""))).size + k}`}</div>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Byte-pair encoding on a corpus of five words with the counts shown. Each merge joins the most frequent adjacent pair
        into one new token, so the total number of tokens falls by exactly the number of places the pair was merged. Common
        endings such as &quot;est&quot; are learned first; frequent whole words follow. New words are cut into pieces the
        tokeniser has learned, falling back to single characters, so nothing is ever out of vocabulary.
      </figcaption>
    </figure>
  );
}
