"use client";

import { useState } from "react";

const LANGS: [string, number][] = [["English", 3000], ["Russian", 300], ["German", 250], ["Japanese", 220], ["French", 200], ["Chinese", 180], ["Hindi", 20], ["Icelandic", 4], ["Swahili", 2], ["Yoruba", 0.5]];
const ALPHAS = [1, 0.7, 0.5, 0.3];
const BUDGET = 2000;   // billions of tokens in the run

/** Sampling share of each language with probabilities proportional to its token count to the power alpha. */
export function shares(alpha: number) {
  const w = LANGS.map(([, n]) => n ** alpha);
  const s = w.reduce((a, b) => a + b, 0);
  return w.map((v) => v / s);
}

export function LangTemperatureViz() {
  const [ai, setAi] = useState(0);
  const p = shares(ALPHAS[ai]);
  const ep = p.map((v, i) => (BUDGET * v) / LANGS[i][1]);
  const W = 330, X0 = 70, BH = 12, GAP = 5, Y0 = 4, PW = 170;
  const x = (v: number) => (Math.log10(v * 100) + 1) / 3 * PW;   // 0.1% to 100% on a log scale
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <span className="viz-label">exponent α</span>
        <div className="segmented" role="group" aria-label="Sampling exponent">
          {ALPHAS.map((v, j) => <button key={v} type="button" className="seg" aria-pressed={ai === j} onClick={() => setAi(j)}>{v}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${Y0 + LANGS.length * (BH + GAP) + 14}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Sampling share of each language">
        {LANGS.map(([name], i) => {
          const y = Y0 + i * (BH + GAP);
          const many = ep[i] > 4;
          return (
            <g key={name}>
              <text x={X0 - 6} y={y + BH - 2} textAnchor="end" className="viz-label">{name}</text>
              <rect x={X0} y={y} width={Math.max(x(p[i]), 1)} height={BH} style={{ fill: many ? "var(--accent)" : "var(--text-muted)" }} opacity={0.85} />
              <text x={X0 + Math.max(x(p[i]), 1) + 4} y={y + BH - 2} className="viz-label">{`${(100 * p[i]).toFixed(p[i] < 0.01 ? 2 : 1)}%, ${ep[i] < 10 ? ep[i].toFixed(1) : Math.round(ep[i])}×`}</text>
            </g>
          );
        })}
        {[0.001, 0.01, 0.1, 1].map((v) => (
          <text key={v} x={X0 + x(v)} y={Y0 + LANGS.length * (BH + GAP) + 10} textAnchor="middle" className="viz-label">{`${v * 100}%`}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        English {(100 * p[0]).toFixed(1)}% of the run; {ep.filter((e) => e > 4).length} language(s) repeated more than 4 times
      </div>
      <figcaption className="viz-caption">
        Ten languages with very different amounts of text, in billions of tokens, sampled for a run of {BUDGET} billion tokens with
        probability proportional to the token count raised to α. Each bar shows the language&apos;s share and how many passes over its
        data the run makes. Lowering α moves share from English to the small languages, which are then repeated many times; bars in
        colour exceed four passes.
      </figcaption>
    </figure>
  );
}
