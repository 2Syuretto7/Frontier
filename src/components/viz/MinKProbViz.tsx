"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const METHODS = ["mean log-probability", "min-20% log-probability"];
const N = 400, LEN = 60;

/**
 * Texts of 60 tokens with a text-level difficulty s ~ U(0.4, 1.6) and token surprisals s·d, d ~ 1.5·Exp(1). Texts seen in
 * training have their rare tokens memorised: surprisals above 1.5·s are halved beyond that point. Scores each text by its mean
 * token log-probability or by the mean of its lowest 20%, and returns both groups' scores and the AUC for telling them apart.
 */
export function membership(method: number, seed = 10) {
  const r = rand(seed);
  const score = (seen: boolean) => {
    const s = 0.4 + 1.2 * r();
    const lp: number[] = [];
    for (let i = 0; i < LEN; i++) {
      let d = -1.5 * Math.log(1 - r());
      if (seen && d > 1.5) d = 1.5 + 0.5 * (d - 1.5);
      lp.push(-s * d);
    }
    if (method === 0) return lp.reduce((a, b) => a + b, 0) / LEN;
    const k = Math.floor(LEN * 0.2);
    return lp.sort((a, b) => a - b).slice(0, k).reduce((a, b) => a + b, 0) / k;
  };
  const seen = Array.from({ length: N }, () => score(true));
  const unseen = Array.from({ length: N }, () => score(false));
  let wins = 0;
  for (const a of seen) for (const b of unseen) wins += a > b ? 1 : a === b ? 0.5 : 0;
  return { seen, unseen, auc: wins / (N * N) };
}

export function MinKProbViz() {
  const [m, setM] = useState(1);
  const { seen, unseen, auc } = useMemo(() => membership(m), [m]);
  const all = [...seen, ...unseen];
  const lo = Math.min(...all), hi = Math.max(...all);
  const BINS = 30;
  const hist = (xs: number[]) => { const h = new Array(BINS).fill(0); xs.forEach((x) => h[Math.min(BINS - 1, Math.floor(((x - lo) / (hi - lo)) * BINS))]++); return h; };
  const hs = hist(seen), hu = hist(unseen);
  const top = Math.max(...hs, ...hu);
  const W = 330, H = 170, X0 = 14, PW = 302, Y0 = 10, PH = 120, bw = PW / BINS;
  const py = (c: number) => Y0 + PH - (c / top) * PH;
  const step = (h: number[]) => h.map((c, i) => `${i ? "L" : "M"}${(X0 + i * bw).toFixed(1)},${py(c).toFixed(1)} L${(X0 + (i + 1) * bw).toFixed(1)},${py(c).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Detection score">
          {METHODS.map((name, i) => <button key={name} type="button" className="seg" aria-pressed={m === i} onClick={() => setM(i)}>{name}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Scores of texts seen and unseen in training">
        <line x1={X0} x2={X0 + PW} y1={Y0 + PH} y2={Y0 + PH} stroke="var(--border)" />
        <path d={step(hu)} fill="none" stroke="var(--text-muted)" strokeWidth={1.5} />
        <path d={step(hs)} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <text x={X0} y={Y0 + PH + 13} className="viz-label">{lo.toFixed(1)}</text>
        <text x={X0 + PW} y={Y0 + PH + 13} textAnchor="end" className="viz-label">{hi.toFixed(1)}</text>
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">score; coloured: seen in training, grey: unseen</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        chance a seen text outscores an unseen one (AUC): {auc.toFixed(3)}
      </div>
      <figcaption className="viz-caption">
        Testing whether a benchmark item was in the training data, from the model&apos;s probabilities alone. Texts differ a lot
        in how predictable they are, which swamps the effect of training on them when every token is averaged. Memorisation
        shows most on the rare, surprising tokens, so averaging only the least likely fifth separates seen from unseen texts
        better. Neither is reliable enough to prove a single item was seen.
      </figcaption>
    </figure>
  );
}
