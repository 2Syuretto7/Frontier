"use client";

import { useMemo, useState } from "react";

const NAMES = ["a", "b", "⟨eos⟩"];
const EOS = 2, MAXN = 12, K = 3;

/** A two-word language: after a, b is likely; after b, a is likely; the end comes with probability e at every step. */
function model(e: number) {
  const rows = [
    [0.1 * (1 - e), 0.9 * (1 - e), e],
    [0.9 * (1 - e), 0.1 * (1 - e), e],
  ].map((r) => r.map(Math.log));
  return (seq: number[]) => rows[seq[seq.length - 1]];
}

type Hyp = { toks: number[]; s: number };

export function decodeAll(e: number) {
  const lp = model(e);
  const greedy: Hyp = { toks: [], s: 0 };
  for (let i = 0; i < MAXN; i++) {
    const r = lp([0, ...greedy.toks]);
    const t = r.indexOf(Math.max(...r));
    greedy.toks.push(t);
    greedy.s += r[t];
    if (t === EOS) break;
  }
  const beam = (alpha: number): Hyp => {
    let beams: Hyp[] = [{ toks: [], s: 0 }];
    const done: Hyp[] = [];
    for (let i = 0; i < MAXN && beams.length; i++) {
      const cand: Hyp[] = [];
      for (const b of beams) {
        const r = lp([0, ...b.toks]);
        r.forEach((v, t) => cand.push({ toks: [...b.toks, t], s: b.s + v }));
      }
      cand.sort((x, y) => y.s - x.s);
      beams = [];
      for (const c of cand.slice(0, K)) (c.toks[c.toks.length - 1] === EOS ? done : beams).push(c);
    }
    return [...done, ...beams].reduce((best, h) => (h.s / h.toks.length ** alpha > best.s / best.toks.length ** alpha ? h : best));
  };
  let best: Hyp = { toks: [], s: -Infinity };
  const go = (toks: number[], s: number) => {
    if (s <= best.s) return;
    if ((toks.length && toks[toks.length - 1] === EOS) || toks.length === MAXN) { best = { toks, s }; return; }
    lp([0, ...toks]).forEach((v, t) => go([...toks, t], s + v));
  };
  go([], 0);
  return [
    { name: "greedy", h: greedy },
    { name: `beam, k = ${K}`, h: beam(0) },
    { name: `beam, k = ${K}, score ÷ length`, h: beam(1) },
    { name: "most likely sequence", h: best },
  ];
}

const ES = [0.2, 0.45, 0.6];

export function DecodeStrategyViz() {
  const [ei, setEi] = useState(1);
  const rows = useMemo(() => decodeAll(ES[ei]), [ei]);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">probability of ⟨eos⟩ at each step</span>
        {ES.map((e, i) => (
          <button key={e} type="button" className="seg" aria-pressed={ei === i} onClick={() => setEi(i)}>{e}</button>
        ))}
      </div>
      <div aria-live="polite">
        {rows.map(({ name, h }) => (
          <div key={name} style={{ margin: "8px 0" }}>
            <div className="viz-label" style={{ marginBottom: 3 }}>
              {`${name}: log p = ${h.s.toFixed(2)}, per token ${(h.s / h.toks.length).toFixed(2)}${h.toks[h.toks.length - 1] === EOS ? "" : ", cut off at the length limit"}`}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {h.toks.map((t, i) => (
                <span key={i} className="mono" style={{ fontSize: 13, padding: "1px 5px", borderRadius: 4, border: "1px solid var(--border)", ...(t === EOS ? { background: "var(--accent-soft)" } : {}) }}>{NAMES[t]}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <figcaption className="viz-caption">
        A tiny language over the words a and b, starting after a: each word is usually followed by the other, and the text
        ends with the chosen probability at every step. The most likely sequence is always the empty one, because every
        extra token multiplies in a probability below 1. Greedy decoding loops a b a b … whenever continuing beats ending
        at each step, and dividing the beam&apos;s score by length, meant to stop the bias towards short outputs, rewards
        the loop instead whenever its per-token log-probability is higher than that of ending.
      </figcaption>
    </figure>
  );
}
