"use client";

import { useState } from "react";

const WORDS = ["banana", "mississippi", "abracadabra"];

/** A suffix array: the suffixes of a word in sorted order, with LCP values; all occurrences of a pattern form one block. */
export function SuffixArrayViz() {
  const [w, setW] = useState(1);
  const [p, setP] = useState("ssi");
  const s = WORDS[w];
  const sa = [...Array(s.length).keys()].sort((a, b) => (s.slice(a) < s.slice(b) ? -1 : 1));
  const lcp = sa.map((a, r) => {
    if (r === 0) return 0;
    const b = sa[r - 1];
    let k = 0;
    while (a + k < s.length && b + k < s.length && s[a + k] === s[b + k]) k++;
    return k;
  });
  const q = p.toLowerCase().replace(/[^a-z]/g, "").slice(0, 12);
  const pre = (r: number) => s.slice(sa[r], sa[r] + q.length);
  let lo = 0, hi = sa.length, probes = 0;
  while (lo < hi) { const m = (lo + hi) >> 1; probes++; if (pre(m) < q) lo = m + 1; else hi = m; }
  const start = lo;
  hi = sa.length;
  while (lo < hi) { const m = (lo + hi) >> 1; probes++; if (pre(m) <= q) lo = m + 1; else hi = m; }
  const end = lo;
  const distinct = (s.length * (s.length + 1)) / 2 - lcp.reduce((x, y) => x + y, 0);
  return (
    <figure className="viz">
      <div className="segmented" role="group" aria-label="Text">
        {WORDS.map((word, k) => <button key={word} type="button" className="seg" aria-pressed={w === k} onClick={() => setW(k)}>{word}</button>)}
      </div>
      <div className="viz-sliders">
        <label><span>Pattern</span><input className="input mono" value={p} onChange={(e) => setP(e.target.value)} aria-label="Pattern to search for" maxLength={12} /></label>
      </div>
      <table className="table mono" style={{ fontSize: "0.85rem" }}>
        <thead><tr><th>rank</th><th>SA</th><th>LCP</th><th style={{ textAlign: "left" }}>suffix</th></tr></thead>
        <tbody>
          {sa.map((i, r) => {
            const hit = q && r >= start && r < end;
            return (
              <tr key={i} style={hit ? { background: "var(--accent-soft)" } : undefined}>
                <td>{r}</td><td>{i}</td><td>{lcp[r]}</td>
                <td style={{ textAlign: "left" }}>
                  <span style={{ color: "var(--text-muted)" }}>{s.slice(i, i + lcp[r])}</span>{s.slice(i + lcp[r])}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <figcaption className="viz-caption" aria-live="polite">
        {q
          ? end > start
            ? `"${q}" is a prefix of ranks ${start} to ${end - 1}, so it occurs ${end - start} time${end - start > 1 ? "s" : ""}, at positions ${sa.slice(start, end).sort((a, b) => a - b).join(", ")}. Two binary searches took ${probes} probes.`
            : `"${q}" would sit at rank ${start} but no suffix starts with it: it does not occur. ${probes} probes.`
          : "Type a pattern to search for."}{" "}
        Grey letters are shared with the suffix above (the LCP). {s} has {distinct} distinct substrings: n(n + 1)/2 minus the sum of the LCPs.
      </figcaption>
    </figure>
  );
}
