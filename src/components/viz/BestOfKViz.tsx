"use client";

import { useMemo, useState } from "react";
import { makeNormal, makeRng } from "./ml";

const TRUE_ACC = 0.7;
const N_TEST = 200;
const SD = Math.sqrt((TRUE_ACC * (1 - TRUE_ACC)) / N_TEST);
const W = 560, H = 70, PAD = 20, LO = 0.58, HI = 0.84;

/** Try K equally good models, keep the one with the best test score, and see how that score flatters it. */
export function BestOfKViz() {
  const [k, setK] = useState(20);
  const [seed, setSeed] = useState(1);
  const { scores, fresh, avgMax } = useMemo(() => {
    const g = makeNormal(makeRng(seed * 101));
    const scores = Array.from({ length: k }, () => TRUE_ACC + SD * g());
    const fresh = TRUE_ACC + SD * g();
    const g2 = makeNormal(makeRng(999));
    let tot = 0;
    for (let rep = 0; rep < 400; rep++) {
      let m = -1;
      for (let i = 0; i < k; i++) m = Math.max(m, TRUE_ACC + SD * g2());
      tot += m;
    }
    return { scores, fresh, avgMax: tot / 400 };
  }, [k, seed]);
  const best = Math.max(...scores);
  const sx = (a: number) => PAD + ((a - LO) / (HI - LO)) * (W - 2 * PAD);
  const pct = (a: number) => `${(a * 100).toFixed(1)}%`;
  return (
    <figure className="viz">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Test scores of ${k} models, all truly 70% accurate`}>
        <line x1={sx(TRUE_ACC)} x2={sx(TRUE_ACC)} y1={6} y2={46} className="plot-mirror" />
        {scores.map((s, i) => <circle key={i} cx={sx(s)} cy={26 + ((i * 7) % 15) - 7} r={4} className={s === best ? "plot-hot" : "ml-c0"} />)}
        <line x1={PAD} x2={W - PAD} y1={48} y2={48} className="viz-axis" />
        {[0.6, 0.65, 0.7, 0.75, 0.8].map((t) => <text key={t} x={sx(t)} y={64} textAnchor="middle" className="plot-tick">{pct(t)}</text>)}
      </svg>
      <div className="ml-stats">
        <div className="ml-stat"><b>{pct(TRUE_ACC)}</b><span>true accuracy of every model</span></div>
        <div className="ml-stat"><b>{pct(best)}</b><span>best test score of the {k}</span></div>
        <div className="ml-stat"><b>{pct(fresh)}</b><span>the winner on a fresh test set</span></div>
        <div className="ml-stat"><b>{pct(avgMax)}</b><span>best score, averaged over 400 repeats</span></div>
      </div>
      <div className="viz-sliders">
        <label>
          models tried = {k}
          <input type="range" min={1} max={100} value={k} onChange={(e) => setK(Number(e.target.value))} />
        </label>
      </div>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={() => setSeed(seed + 1)}>Run again</button>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Every model is truly 70% accurate, and each is scored on its own {N_TEST}-question test sample. Choosing the best of {k} by test score reports about {pct(avgMax)} on average: {((avgMax - TRUE_ACC) * 100).toFixed(1)} points of pure luck. A fresh test set reveals the truth.
      </figcaption>
    </figure>
  );
}
