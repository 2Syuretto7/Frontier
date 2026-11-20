"use client";

import { useState } from "react";

const SIZES = ["50 words", "400 words", "2000 words"];
/** Per-word chance that a word of each kind of text is on the list, for each list size. */
const HIT: Record<string, number[]> = {
  "benign, mainstream": [0.00002, 0.00008, 0.0003],
  "benign, dialect and identity topics": [0.0001, 0.0005, 0.0015],
  "toxic": [0.002, 0.006, 0.012],
};
const LENGTHS = [100, 300, 1000];

/** Probability that a document of n words contains at least one listed word. */
export function removed(q: number, n: number) {
  return 1 - (1 - q) ** n;
}

export function BlocklistViz() {
  const [s, setS] = useState(1);
  const [li, setLi] = useState(1);
  const n = LENGTHS[li];
  const kinds = Object.keys(HIT);
  const rates = kinds.map((k) => removed(HIT[k][s], n));
  const W = 330, X0 = 8, BH = 16, GAP = 24, Y0 = 16, PW = 250;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <div className="segmented" role="group" aria-label="Blocklist size">
          {SIZES.map((v, j) => <button key={v} type="button" className="seg" aria-pressed={s === j} onClick={() => setS(j)}>{v}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Document length">
          {LENGTHS.map((v, j) => <button key={v} type="button" className="seg" aria-pressed={li === j} onClick={() => setLi(j)}>{`${v}-word docs`}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${Y0 + kinds.length * (BH + GAP)}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Share of documents removed by a word blocklist">
        {kinds.map((k, i) => {
          const y = Y0 + i * (BH + GAP);
          return (
            <g key={k}>
              <text x={X0} y={y - 4} className="viz-label">{k}</text>
              <rect x={X0} y={y} width={PW} height={BH} style={{ fill: "var(--text-muted)" }} opacity={0.15} />
              <rect x={X0} y={y} width={rates[i] * PW} height={BH} style={{ fill: i === 2 ? "var(--accent)" : "var(--text-muted)" }} opacity={0.85} />
              <text x={X0 + PW + 6} y={y + BH - 4} className="viz-label">{`${(100 * rates[i]).toFixed(1)}%`}</text>
            </g>
          );
        })}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        benign dialect and identity text removed {(rates[1] / rates[0]).toFixed(1)} times as often as mainstream text
      </div>
      <figcaption className="viz-caption">
        Share of documents removed by a word blocklist, for illustrative per-word rates. Longer lists and longer documents catch more
        toxic text, but they also remove benign text, and they remove it far more often from writing in dialects or about identity,
        where listed words appear in reclaimed, quoted or descriptive use.
      </figcaption>
    </figure>
  );
}
