"use client";

import { useState } from "react";

const CORPUS = [
  "the cat sat on the mat .",
  "the dog sat on the rug .",
  "the cat saw the dog .",
  "the dog saw a bird .",
  "a bird sat on the cat .",
  "the cat ate the fish .",
];

// Count which word follows which.
const NEXT = new Map<string, Map<string, number>>();
for (const line of CORPUS) {
  const w = ["<start>", ...line.split(" ")];
  for (let i = 0; i + 1 < w.length; i++) {
    const m = NEXT.get(w[i]) ?? new Map<string, number>();
    m.set(w[i + 1], (m.get(w[i + 1]) ?? 0) + 1);
    NEXT.set(w[i], m);
  }
}

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Probabilities for the next word, sharpened or flattened by the temperature. */
function probs(word: string, temp: number): [string, number][] {
  const m = NEXT.get(word);
  if (!m) return [];
  const entries = [...m.entries()];
  const w = entries.map(([, c]) => Math.pow(c, 1 / temp));
  const z = w.reduce((s, v) => s + v, 0);
  return entries.map(([k], i) => [k, w[i] / z]);
}

/** A tiny generative model: count which word follows which in six sentences, then write new sentences one word at a time. */
export function BigramViz() {
  const [temp, setTemp] = useState(1);
  const [seed, setSeed] = useState(1);
  const rnd = makeRng(seed);
  const words: string[] = [];
  let cur = "<start>";
  while (words.length < 12) {
    const p = probs(cur, temp);
    let r = rnd(), pick = p[p.length - 1][0];
    for (const [w, q] of p) { if ((r -= q) <= 0) { pick = w; break; } }
    if (pick === ".") break;
    words.push(pick);
    cur = pick;
  }
  const sentence = words.join(" ");
  const novel = !CORPUS.includes(sentence + " .");
  const table = probs("the", temp);

  return (
    <figure className="viz">
      <p className="viz-caption" style={{ marginTop: 0 }}>Training data, six sentences:</p>
      <p className="mono" style={{ fontSize: 13, lineHeight: 1.7, margin: "4px 0 12px" }}>{CORPUS.join(" ")}</p>
      <p className="viz-caption" style={{ marginTop: 0 }}>What the model learnt to say after &ldquo;the&rdquo;:</p>
      <svg viewBox="0 0 440 112" role="img" aria-label="Probabilities of each word after the">
        {table.map(([w, p], i) => (
          <g key={w} transform={`translate(0 ${i * 22})`}>
            <text x={52} y={14} textAnchor="end" className="viz-label">{w}</text>
            <rect x={60} y={3} width={Math.max(1, p * 360)} height={15} className="viz-cell is-on" />
            <text x={66 + p * 360} y={15} className="plot-tick">{(p * 100).toFixed(0)}%</text>
          </g>
        ))}
      </svg>
      <div className="viz-controls">
        <button type="button" className="btn btn-primary" onClick={() => setSeed(seed + 1)}>Generate a sentence</button>
      </div>
      <div className="viz-sliders">
        <label>
          <span>Temperature <span className="mono">{temp.toFixed(1)}</span></span>
          <input type="range" min={0.2} max={3} step={0.1} value={temp} onChange={(e) => setTemp(Number(e.target.value))} />
        </label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        <span className="mono" style={{ color: "var(--text)" }}>{sentence} .</span>{" "}
        {novel ? "This sentence is not in the training data: the model made it up from pieces it had seen." : "This one is copied straight from the training data."}{" "}
        Low temperature makes the likeliest word almost certain; high temperature makes rare words more likely.
      </figcaption>
    </figure>
  );
}
