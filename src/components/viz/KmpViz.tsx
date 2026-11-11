"use client";

import { useState } from "react";

const TEXT = "abababcabababcab";
const PAT = "ababc";

function prefixFunction(p: string) {
  const pi = Array(p.length).fill(0);
  let k = 0;
  for (let i = 1; i < p.length; i++) {
    while (k && p[i] !== p[k]) k = pi[k - 1];
    if (p[i] === p[k]) k++;
    pi[i] = k;
  }
  return pi;
}

type Snap = { i: number; k: number; cmp: number; ok: boolean | null; found: number[]; note: string };

function trace(): Snap[] {
  const pi = prefixFunction(PAT);
  const out: Snap[] = [{ i: 0, k: 0, cmp: 0, ok: null, found: [], note: "The pattern starts under the text. i is the text position, k how many pattern characters match so far." }];
  let i = 0, k = 0, cmp = 0;
  const found: number[] = [];
  while (i < TEXT.length) {
    cmp++;
    const at = i - k;
    if (TEXT[i] === PAT[k]) {
      k++; i++;
      let note = `text[${i - 1}] = ${TEXT[i - 1]} matches pattern[${k - 1}]: advance both.`;
      if (k === PAT.length) {
        found.push(i - k);
        note += ` Full match at ${i - k}. Fall back to k = π[${k - 1}] = ${pi[k - 1]}.`;
        out.push({ i, k, cmp, ok: true, found: [...found], note });
        k = pi[k - 1];
        continue;
      }
      out.push({ i, k, cmp, ok: true, found: [...found], note });
    } else if (k > 0) {
      const nk = pi[k - 1];
      const before = k;
      k = nk;
      out.push({ i, k, cmp, ok: false, found: [...found], note: `text[${i}] = ${TEXT[i]} ≠ pattern[${before}] = ${PAT[before]}. The last ${before} text characters equal pattern[0:${before}], whose longest border has length ${nk}: slide the pattern from ${at} to ${i - nk} and keep i. The first ${nk} still match.` });
    } else {
      i++;
      out.push({ i, k, cmp, ok: false, found: [...found], note: `text[${i - 1}] = ${TEXT[i - 1]} ≠ pattern[0]: move on in the text.` });
    }
  }
  out[out.length - 1].note += ` Done: ${cmp} comparisons for a text of ${TEXT.length}, never more than 2n.`;
  return out;
}

/** Knuth–Morris–Pratt: on a mismatch the pattern slides by its prefix function, and the text pointer never moves back. */
export function KmpViz() {
  const snaps = trace();
  const pi = prefixFunction(PAT);
  const [t, setT] = useState(0);
  const s = snaps[t];
  const off = s.i - s.k;
  const C = 30, X0 = 40, W = X0 + (TEXT.length + PAT.length - 1) * C + 10;
  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${W} 150`} role="img" aria-label={`Text ${TEXT}; pattern ${PAT} aligned at ${off}`}>
        <text x={4} y={36} className="plot-tick">text</text>
        <text x={4} y={80} className="plot-tick">pattern</text>
        <text x={4} y={124} className="plot-tick">π</text>
        {[...TEXT].map((ch, i) => (
          <g key={i}>
            <rect x={X0 + i * C + 1} y={16} width={C - 2} height={C - 2} rx={4} className={s.found.some((f) => i >= f && i < f + PAT.length) ? "viz-cell is-on" : "viz-cell"} style={i === s.i && t < snaps.length - 1 ? { strokeWidth: 3 } : undefined} />
            <text x={X0 + i * C + C / 2} y={36} textAnchor="middle" className="viz-label">{ch}</text>
            <text x={X0 + i * C + C / 2} y={12} textAnchor="middle" className="plot-tick" style={{ fontSize: 9 }}>{i}</text>
          </g>
        ))}
        {[...PAT].map((ch, j) => (
          <g key={j}>
            <rect x={X0 + (off + j) * C + 1} y={60} width={C - 2} height={C - 2} rx={4} className={j < s.k ? "viz-cell is-on" : "viz-cell"} />
            <text x={X0 + (off + j) * C + C / 2} y={80} textAnchor="middle" className="viz-label">{ch}</text>
            <text x={X0 + (off + j) * C + C / 2} y={124} textAnchor="middle" className="plot-tick">{pi[j]}</text>
          </g>
        ))}
      </svg>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={() => setT(t + 1)} disabled={t >= snaps.length - 1}>Next comparison</button>
        <button type="button" className="btn" onClick={() => setT(snaps.length - 1)} disabled={t >= snaps.length - 1}>Finish</button>
        <button type="button" className="btn" onClick={() => setT(0)}>Reset</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {s.note} Comparisons so far: <span className="mono">{s.cmp}</span>. Matches at: <span className="mono">{s.found.join(", ") || "none yet"}</span>.
      </figcaption>
    </figure>
  );
}
