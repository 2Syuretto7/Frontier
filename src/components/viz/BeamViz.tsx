"use client";

import { useState } from "react";

const T = "ABC";
const START = [0.4, 0.5, 0.1];
const NEXT = [[0.6, 0.3, 0.1], [0.4, 0.5, 0.1], [0.7, 0.2, 0.1]];
const L = 3;

type Cand = { s: string; p: number; kept: boolean };

function run(k: number): Cand[][] {
  const steps: Cand[][] = [];
  let beam: { s: string; p: number }[] = [{ s: "", p: 1 }];
  for (let step = 0; step < L; step++) {
    const cand = beam.flatMap(({ s, p }) => [...T].map((t, j) => ({ s: s + t, p: p * (s ? NEXT[T.indexOf(s[s.length - 1])][j] : START[j]) })));
    cand.sort((a, b) => b.p - a.p || (a.s < b.s ? -1 : 1));
    steps.push(cand.map((c, i) => ({ ...c, kept: i < k })));
    beam = cand.slice(0, k);
  }
  return steps;
}

function best() {
  let top = { s: "", p: 0 };
  for (const a of T) for (const b of T) for (const c of T) {
    const p = START[T.indexOf(a)] * NEXT[T.indexOf(a)][T.indexOf(b)] * NEXT[T.indexOf(b)][T.indexOf(c)];
    if (p > top.p) top = { s: a + b + c, p };
  }
  return top;
}

/** Beam search on a three-token model: keep the k most probable prefixes at each step. Width 1 is greedy decoding. */
export function BeamViz() {
  const [k, setK] = useState(1);
  const [t, setT] = useState(1);
  const steps = run(k);
  const opt = best();
  const final = steps[L - 1][0];
  const shown = steps.slice(0, t);
  return (
    <figure className="viz">
      <div className="viz-sliders">
        <label><span>Beam width <span className="mono">k = {k}</span></span><input type="range" min={1} max={4} value={k} onChange={(e) => { setK(Number(e.target.value)); setT(1); }} /></label>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${L}, minmax(0, 1fr))`, gap: "0.5rem" }}>
        {Array.from({ length: L }, (_, i) => (
          <div key={i}>
            <p className="viz-caption" style={{ margin: "0 0 0.25rem" }}>Step {i + 1}</p>
            {i < shown.length && shown[i].slice(0, 12).map((c) => (
              <div key={c.s} className="mono" style={{ opacity: c.kept ? 1 : 0.4, fontWeight: c.kept ? 600 : 400, fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                {c.s} {c.p.toFixed(3)}
              </div>
            ))}
            {i < shown.length && shown[i].length > 12 && <div className="mono" style={{ opacity: 0.4, fontSize: "0.85rem" }}>+{shown[i].length - 12} more</div>}
          </div>
        ))}
      </div>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={() => setT(t + 1)} disabled={t >= L}>Next step</button>
        <button type="button" className="btn" onClick={() => setT(1)}>Reset</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each step extends every kept prefix by A, B or C and keeps the {k} most probable (bold). First token: A 0.4, B 0.5, C 0.1; after A the next is A 0.6, B 0.3, C 0.1; after B it is A 0.4, B 0.5, C 0.1; after C it is A 0.7, B 0.2, C 0.1.{" "}
        {t >= L && `Width ${k} returns ${final.s} with probability ${final.p.toFixed(3)}; the most probable sequence is ${opt.s} at ${opt.p.toFixed(3)}. ${final.s === opt.s ? "Found." : "Missed: the best sequence was pruned early because its first token was not the most likely."}`}
      </figcaption>
    </figure>
  );
}
