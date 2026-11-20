"use client";

import { useMemo, useState } from "react";

const P = 59;
const FREQS = [4, 11, 17, 23, 26];

/**
 * The clock algorithm for addition mod P: each frequency k contributes cos(2 pi k (a + b - c) / P) to the logit of answer c. Returns
 * the logits divided by the number of frequencies, the correct answer and the best wrong answer.
 */
export function clockLogits(a: number, b: number, n: number) {
  const fs = FREQS.slice(0, n);
  const s = (a + b) % P;
  const logits = Array.from({ length: P }, (_, c) => fs.reduce((t, k) => t + Math.cos((2 * Math.PI * k * (a + b - c)) / P), 0) / n);
  let wrong = s === 0 ? 1 : 0;
  for (let c = 0; c < P; c++) if (c !== s && logits[c] > logits[wrong]) wrong = c;
  return { logits, s, wrong };
}

const NS = [1, 3, 5];
const PAIRS: [number, number][] = [[17, 52], [30, 40], [5, 8]];

export function ClockAlgorithmViz() {
  const [n, setN] = useState(0);
  const [q, setQ] = useState(0);
  const [a, b] = PAIRS[q];
  const { logits, s, wrong } = useMemo(() => clockLogits(a, b, NS[n]), [a, b, n]);
  const W = 340, H = 170, X0 = 26, PW = 306, Y0 = 10, PH = 120;
  const bw = PW / P;
  const py = (v: number) => Y0 + ((1 - v) / 2) * PH;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Number of frequencies">
          {NS.map((v, i) => <button key={v} type="button" className="seg" aria-pressed={n === i} onClick={() => setN(i)}>{v} {v === 1 ? "frequency" : "frequencies"}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Which sum">
          {PAIRS.map(([x, y], i) => <button key={i} type="button" className="seg" aria-pressed={q === i} onClick={() => setQ(i)}>{x} + {y}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 480, display: "block", margin: "0 auto" }} role="img" aria-label="Logit for every possible answer under the clock algorithm">
        {[-1, 0, 1].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeDasharray={v ? "2 3" : undefined} />
            <text x={X0 - 4} y={py(v) + 4} textAnchor="end" className="viz-label">{v}</text>
          </g>
        ))}
        {logits.map((v, c) => (
          <rect key={c} x={X0 + c * bw + 0.5} width={Math.max(bw - 1, 1)} y={Math.min(py(v), py(0))} height={Math.abs(py(v) - py(0))}
            style={{ fill: c === s ? "var(--accent)" : c === wrong ? "var(--text)" : "var(--text-muted)" }} opacity={c === s || c === wrong ? 1 : 0.5} />
        ))}
        {[0, 20, 40, 58].map((c) => <text key={c} x={X0 + (c + 0.5) * bw} y={Y0 + PH + 14} textAnchor="middle" className="viz-label">{c}</text>)}
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">answer c (mod {P}); logit averaged over frequencies</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        ({a} + {b}) mod {P} = {s}: logit {logits[s].toFixed(3)}; best wrong answer {wrong}: {logits[wrong].toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        Each frequency turns a and b into angles on a clock, adds the angles, and scores every answer c by how well its angle matches.
        One frequency peaks at the right answer but leaves wrong answers almost as high. Adding frequencies, as small transformers trained
        on modular addition are reported to do, makes the right answer interfere constructively while the wrong ones cancel.
      </figcaption>
    </figure>
  );
}
