"use client";

import { useEffect, useState } from "react";
import { makeNormal, makeRng } from "./ml";

const V = 40;
const SIZES = [200, 2000, 20000];
const LAMS = Array.from({ length: 21 }, (_, i) => Math.min(0.99, i * 0.05));
const PMAX = 40;

/** A hidden bigram model with peaked rows: row v is softmax(2.5 * z). */
export function hiddenModel(seed: number) {
  const z = makeNormal(makeRng(seed));
  return Array.from({ length: V }, () => {
    const e = Array.from({ length: V }, () => Math.exp(2.5 * z()));
    const s = e.reduce((a, b) => a + b, 0);
    return e.map((x) => x / s);
  });
}

export function sample(P: number[][], n: number, seed: number) {
  const u = makeRng(seed), out = [0];
  for (let i = 1; i < n; i++) {
    const row = P[out[i - 1]];
    let r = u(), w = 0;
    while (w < V - 1 && r > row[w]) r -= row[w++];
    out.push(w);
  }
  return out;
}

/** Test perplexity of interpolated bigram/add-one unigram for each lambda, plus Kneser-Ney (d = 0.75). */
export function curves(train: number[], test: number[]) {
  const c2 = new Map<number, number>(), c1 = new Array(V).fill(0), cu = new Array(V).fill(0);
  train.forEach((w) => cu[w]++);
  for (let i = 1; i < train.length; i++) {
    const k = train[i - 1] * V + train[i];
    c2.set(k, (c2.get(k) ?? 0) + 1);
    c1[train[i - 1]]++;
  }
  const follow = new Array(V).fill(0), precede = new Array(V).fill(0);
  c2.forEach((_, k) => { follow[Math.floor(k / V)]++; precede[k % V]++; });
  const uni = (w: number) => (cu[w] + 1) / (train.length + V);
  const ppl = (p: (v: number, w: number) => number) => {
    let s = 0;
    for (let i = 1; i < test.length; i++) s += Math.log(p(test[i - 1], test[i]));
    return Math.exp(-s / (test.length - 1));
  };
  const interp = LAMS.map((l) => ppl((v, w) => l * (c1[v] ? (c2.get(v * V + w) ?? 0) / c1[v] : 0) + (1 - l) * uni(w)));
  const kn = ppl((v, w) => {
    const pc = (precede[w] + 1) / (c2.size + V);
    if (!c1[v]) return pc;
    return Math.max((c2.get(v * V + w) ?? 0) - 0.75, 0) / c1[v] + (0.75 * follow[v] / c1[v]) * pc;
  });
  return { interp, kn };
}

export function trueppl(P: number[][], test: number[]) {
  let s = 0;
  for (let i = 1; i < test.length; i++) s += Math.log(P[test[i - 1]][test[i]]);
  return Math.exp(-s / (test.length - 1));
}

export function InterpLambdaViz() {
  const [si, setSi] = useState(0);
  const [res, setRes] = useState<{ interp: number[]; kn: number; truth: number }[] | null>(null);
  useEffect(() => {
    const P = hiddenModel(7), test = sample(P, 5000, 99), truth = trueppl(P, test);
    setRes(SIZES.map((n, i) => ({ ...curves(sample(P, n, 11 + i), test), truth })));
  }, []);
  const W = 300, H = 200, X0 = 30, PW = W - 38, PH = 172;
  const sx = (l: number) => X0 + l * PW, sy = (v: number) => 8 + (1 - Math.min(v, PMAX) / PMAX) * PH;
  const r = res?.[si];
  const best = r ? r.interp.indexOf(Math.min(...r.interp)) : 0;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {SIZES.map((n, i) => (
          <button key={n} type="button" className="seg" aria-pressed={i === si} onClick={() => setSi(i)}>{n} training tokens</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H + 14}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }} role="img" aria-label="Test perplexity of an interpolated bigram model against the interpolation weight">
        <line x1={X0} y1={sy(0)} x2={X0 + PW} y2={sy(0)} stroke="var(--border)" />
        <line x1={X0} y1={sy(0)} x2={X0} y2={sy(PMAX)} stroke="var(--border)" />
        {r && <line x1={X0} y1={sy(r.truth)} x2={X0 + PW} y2={sy(r.truth)} stroke="var(--text-muted)" strokeDasharray="4 3" />}
        {r && <line x1={X0} y1={sy(r.kn)} x2={X0 + PW} y2={sy(r.kn)} stroke="var(--danger)" strokeDasharray="2 3" />}
        {r && <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={LAMS.map((l, i) => `${sx(l)},${sy(r.interp[i])}`).join(" ")} />}
        {r && <circle cx={sx(LAMS[best])} cy={sy(r.interp[best])} r={4} fill="var(--accent)" />}
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <text key={v} x={sx(v)} y={H + 12} textAnchor="middle" className="viz-label">{v}</text>
        ))}
        {[0, 10, 20, 30, 40].map((v) => (
          <text key={v} x={X0 - 4} y={sy(v) + 4} textAnchor="end" className="viz-label">{v}</text>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {r ? `best λ = ${LAMS[best].toFixed(2)}, perplexity ${r.interp[best].toFixed(2)}; Kneser-Ney ${r.kn.toFixed(2)}; true model ${r.truth.toFixed(2)}` : "simulating"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Text drawn from a hidden 40-word bigram model. The colour curve is held-out perplexity of λ times the bigram
        estimate plus 1 − λ times a smoothed unigram, as λ runs from 0 to 0.99 (values above 40 are clipped). Red is
        Kneser-Ney, grey is the true model. With little data the best λ is small, because the bigram counts are mostly
        zeros; with more data it climbs towards 1.
      </figcaption>
    </figure>
  );
}
