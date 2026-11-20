"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const WORDS = 20, TOKENS = 4000, MAPPERS = 8, R = 4, SALT = 4;

/** Word count over a Zipf-distributed corpus. Returns pairs shuffled and the load on each reducer. */
export function wordCount(combiner: boolean, salted: boolean, seed = 3) {
  const r = rand(seed), w = Array.from({ length: WORDS }, (_, i) => 1 / (i + 1) ** 1.2), tot = w.reduce((a, b) => a + b, 0);
  const perMapper = Array.from({ length: MAPPERS }, () => new Map<string, number>());
  for (let t = 0; t < TOKENS; t++) {
    let u = r() * tot, k = 0;
    while (u >= w[k]) { u -= w[k]; k++; }
    const key = salted && k === 0 ? `w0#${t % SALT}` : `w${k}`;
    const m = perMapper[t % MAPPERS];
    m.set(key, (m.get(key) ?? 0) + 1);
  }
  const part = (key: string) => (key.includes("#") ? Number(key.split("#")[1]) : Number(key.slice(1))) % R;
  const loads = Array(R).fill(0);
  let pairs = 0;
  for (const m of perMapper) for (const [key, c] of m) {
    const n = combiner ? 1 : c;
    pairs += n;
    loads[part(key)] += n;
  }
  return { pairs, loads };
}

export function MapReduceSkewViz() {
  const [combiner, setCombiner] = useState(false), [salted, setSalted] = useState(false);
  const { pairs, loads } = useMemo(() => wordCount(combiner, salted), [combiner, salted]);
  const mean = loads.reduce((a, b) => a + b, 0) / R, maxL = Math.max(...loads);
  const W = 330, H = 160, X0 = 40, Y0 = 8, PW = W - 48, PH = H - Y0 - 30, top = combiner ? 50 : 2000;
  const sy = (v: number) => Y0 + PH - (Math.min(v, top) / top) * PH, bw = PW / R;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">combiner</span>
        <div className="segmented" role="group" aria-label="Combiner">
          <button type="button" className="seg" aria-pressed={!combiner} onClick={() => setCombiner(false)}>off</button>
          <button type="button" className="seg" aria-pressed={combiner} onClick={() => setCombiner(true)}>on</button>
        </div>
        <span className="viz-label">hottest word</span>
        <div className="segmented" role="group" aria-label="Salting of the hottest word">
          <button type="button" className="seg" aria-pressed={!salted} onClick={() => setSalted(false)}>one key</button>
          <button type="button" className="seg" aria-pressed={salted} onClick={() => setSalted(true)}>salted 4 ways</button>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Pairs received by each reducer">
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={X0} x2={X0 + PW} y1={sy(f * top)} y2={sy(f * top)} stroke="var(--border)" strokeDasharray={f ? "2 4" : undefined} />
            <text x={X0 - 4} y={sy(f * top) + 4} textAnchor="end" className="viz-label">{f * top}</text>
          </g>
        ))}
        {loads.map((l, i) => (
          <g key={i}>
            <rect x={X0 + i * bw + 10} y={sy(l)} width={bw - 20} height={Y0 + PH - sy(l)} fill={l === maxL ? "var(--danger)" : "var(--accent)"} />
            <text x={X0 + i * bw + bw / 2} y={Y0 + PH + 14} textAnchor="middle" className="viz-label">{`reducer ${i}`}</text>
          </g>
        ))}
        <line x1={X0} x2={X0 + PW} y1={sy(mean)} y2={sy(mean)} stroke="var(--text)" strokeDasharray="4 3" />
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">pairs received (dashed: mean)</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`pairs shuffled ${pairs}; busiest reducer ${(maxL / mean).toFixed(2)}× the mean`}
      </div>
      <figcaption className="viz-caption">
        Word count over 4000 words drawn from a vocabulary of 20 with Zipf frequencies, mapped by 8 mappers and reduced by 4
        reducers, word i going to reducer i mod 4. Without a combiner every word is shuffled as its own pair, 4000 in all, and
        the reducer that owns the commonest word receives 1.78 times the mean load. Salting splits that word into 4 keys spread
        over all reducers, cutting the busiest to 1.35 times the mean. A combiner sums counts inside each mapper first, so only
        one pair per distinct word per mapper crosses the network: 160 pairs instead of 4000, and the loads even out.
      </figcaption>
    </figure>
  );
}
