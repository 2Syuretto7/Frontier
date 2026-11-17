"use client";

import { useMemo, useState } from "react";

const LINE = "the rain in the plain stays mainly in the drain, and the train in the rain is plainly late again. ";
const TEXT = LINE + LINE;

export function contextProbs(text: string, k: number, alpha: number, A: number) {
  const counts = new Map<string, Map<string, number>>();
  const totals = new Map<string, number>();
  const out: number[] = [];
  for (let t = 0; t < text.length; t++) {
    const ctx = text.slice(Math.max(0, t - k), t), ch = text[t];
    const row = counts.get(ctx) ?? new Map<string, number>();
    const tot = totals.get(ctx) ?? 0;
    out.push(((row.get(ch) ?? 0) + alpha) / (tot + alpha * A));
    row.set(ch, (row.get(ch) ?? 0) + 1);
    counts.set(ctx, row);
    totals.set(ctx, tot + 1);
  }
  return out;
}

export function mixtureProbs(lists: number[][]) {
  let post = lists.map(() => 1 / lists.length);
  const out: number[] = [];
  for (let t = 0; t < lists[0].length; t++) {
    const mix = post.reduce((a, w, i) => a + w * lists[i][t], 0);
    out.push(mix);
    post = post.map((w, i) => (w * lists[i][t]) / mix);
  }
  return out;
}

const OPTIONS = ["order 0", "order 1", "order 2", "order 3", "order 4", "mixture"];

/** Bits each character costs under an adaptive context model; the total is the arithmetic-coded size. */
export function ContextModelViz() {
  const [opt, setOpt] = useState(2);
  const all = useMemo(() => {
    const A = new Set(TEXT).size;
    const lists = [0, 1, 2, 3, 4].map((k) => contextProbs(TEXT, k, 0.05, A));
    return [...lists, mixtureProbs(lists)].map((q) => q.map((v) => -Math.log2(v)));
  }, []);
  const bits = all[opt];
  const total = bits.reduce((a, b) => a + b, 0);
  const half = LINE.length;
  const first = bits.slice(0, half).reduce((a, b) => a + b, 0);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {OPTIONS.map((o, i) => (
          <button key={o} type="button" className="seg" aria-pressed={i === opt} onClick={() => setOpt(i)}>{o}</button>
        ))}
      </div>
      <div className="mono" style={{ fontSize: 14, lineHeight: 1.9, overflowWrap: "anywhere", padding: "4px 0" }} aria-label="The text, each character shaded by the bits it costs">
        {TEXT.split("").map((ch, i) => (
          <span key={i} title={`${bits[i].toFixed(2)} bits`} style={{ background: `color-mix(in srgb, var(--accent) ${Math.min(100, Math.round((bits[i] / 6) * 100))}%, transparent)` }}>{ch === " " ? " " : ch}</span>
        ))}
      </div>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {(total / TEXT.length).toFixed(2)} bits/char overall; first copy {(first / half).toFixed(2)}, second copy {((total - first) / half).toFixed(2)}; 8 bits/char raw
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Darker characters cost more bits, namely −log₂ of the probability the model gave them just before seeing them. The
        sentence appears twice. Higher orders use longer contexts, so they pay heavily on the first copy while every context is
        new, then become the cheapest on the repeat. The mixture follows whichever order is doing best,
        losing at most log₂ 5 ≈ 2.3 bits in total to the best single order.
      </figcaption>
    </figure>
  );
}
