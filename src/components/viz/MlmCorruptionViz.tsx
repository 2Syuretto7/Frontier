"use client";

import { useMemo, useState } from "react";

const WORDS = "the quick brown fox jumps over the lazy dog while the small cat sleeps on a warm mat near the open door of the old house".split(" ");
const RATES = [0.15, 0.4];

function rand(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Kind = "plain" | "mask" | "random" | "kept";

/** The 80-10-10 corruption of one sequence: each position is a target with probability p. */
export function corrupt(p: number, seed: number) {
  const u = rand(seed);
  return WORDS.map((w) => {
    const chosen = u() < p, r = u(), j = Math.floor(u() * WORDS.length);
    if (!chosen) return { kind: "plain" as Kind, shown: w, word: w };
    if (r < 0.8) return { kind: "mask" as Kind, shown: "[MASK]", word: w };
    if (r < 0.9) return { kind: "random" as Kind, shown: WORDS[j], word: w };
    return { kind: "kept" as Kind, shown: w, word: w };
  });
}

/** Fraction of positions shown as their own word that are targets, over many samples. */
export function keptTargetShare(p: number, samples: number) {
  let kept = 0, shown = 0;
  for (let s = 0; s < samples; s++) {
    for (const c of corrupt(p, 1000 + s)) {
      if (c.shown === c.word && c.kind !== "mask") {
        shown++;
        if (c.kind !== "plain") kept++;
      }
    }
  }
  return kept / shown;
}

const STYLE: Record<Kind, React.CSSProperties> = {
  plain: { border: "1px solid var(--border)" },
  mask: { background: "var(--accent)", color: "var(--bg, #fff)", border: "1px solid var(--accent)" },
  random: { border: "2px solid var(--danger)" },
  kept: { border: "2px solid var(--success)" },
};

export function MlmCorruptionViz() {
  const [ri, setRi] = useState(0);
  const [seed, setSeed] = useState(1);
  const p = RATES[ri];
  const seq = useMemo(() => corrupt(p, seed), [p, seed]);
  const share = useMemo(() => keptTargetShare(p, 4000), [p]);
  const n = (k: Kind) => seq.filter((c) => c.kind === k).length;
  const theory = (p * 0.1) / (1 - p + p * 0.1);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">masking rate</span>
        {RATES.map((r, i) => (
          <button key={r} type="button" className="seg" aria-pressed={ri === i} onClick={() => setRi(i)}>{r}</button>
        ))}
        <button type="button" className="seg" onClick={() => setSeed(seed + 1)}>resample</button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "10px 0" }} aria-live="polite">
        {seq.map((c, i) => (
          <span key={i} className="mono" style={{ ...STYLE[c.kind], borderRadius: 4, padding: "2px 6px", fontSize: 13 }}
            title={c.kind === "plain" ? "not a target" : `target: ${c.word}`}>
            {c.shown}
          </span>
        ))}
      </div>
      <div style={{ fontSize: 13, margin: "6px 0" }}>
        {`targets: ${n("mask")} masked (filled), ${n("random")} replaced (red), ${n("kept")} left as they were (green), out of ${seq.length} tokens`}
      </div>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`share of visible original tokens that are targets: ${share.toFixed(4)} over 4000 samples, ${theory.toFixed(4)} by the formula`}
      </div>
      <figcaption className="viz-caption">
        BERT-style corruption of one sentence. Each token becomes a prediction target with the chosen probability; a target
        is replaced by [MASK] 80% of the time, by a random word 10% of the time, and left alone otherwise. The model is
        scored only on targets, but it cannot tell the unchanged targets from ordinary tokens, so it has to keep a good
        guess for every position. The last line counts how often a token that looks untouched is in fact a target. It runs a
        little above the formula, because a random replacement sometimes picks the same word, which is common in a
        26-word sentence that repeats &quot;the&quot; five times and rare in a real vocabulary.
      </figcaption>
    </figure>
  );
}
