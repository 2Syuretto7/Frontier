"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

const TOPICS = 12;
const FRACS = [0.05, 0.1, 0.3, 0.6];

/** 600 synthetic documents: [classifier score, judged educational, topic]. Educational pages concentrate in a few topics. */
export function scored(): [number, boolean, number][] {
  const rng = rand(41);
  const normal = () => Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng());
  const sig = (z: number) => 1 / (1 + Math.exp(-z));
  return Array.from({ length: 600 }, () => {
    const topic = Math.floor(rng() * TOPICS);
    const prior = topic < 4 ? 0.45 : 0.08;              // science, history, maths, health pages are more often educational
    const good = rng() < prior;
    return [sig((good ? 1.6 : -1.2) + 1.1 * normal()), good, topic];
  });
}

export function QualityThresholdViz() {
  const [fi, setFi] = useState(1);
  const docs = scored();
  const sorted = docs.map((d) => d[0]).sort((a, b) => b - a);
  const t = sorted[Math.ceil(FRACS[fi] * docs.length) - 1];
  const kept = docs.filter((d) => d[0] >= t);
  const tp = kept.filter((d) => d[1]).length, pos = docs.filter((d) => d[1]).length;
  const topicCounts = Array.from({ length: TOPICS }, (_, k) => kept.filter((d) => d[2] === k).length);
  const BINS = 25, W = 330, X0 = 10, Y0 = 6, PW = 310, PH = 90;
  const hist = (good: boolean) => {
    const h = new Array(BINS).fill(0);
    docs.filter((d) => d[1] === good).forEach((d) => h[Math.min(BINS - 1, Math.floor(d[0] * BINS))]++);
    return h;
  };
  const hg = hist(true), hb = hist(false);
  const mx = Math.max(...hg, ...hb);
  const bw = PW / BINS;
  const TY = Y0 + PH + 26, tw = PW / TOPICS, TH = 30;
  const tmax = Math.max(...topicCounts, 1);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <span className="viz-label">keep the top</span>
        <div className="segmented" role="group" aria-label="Fraction kept">
          {FRACS.map((v, j) => <button key={v} type="button" className="seg" aria-pressed={fi === j} onClick={() => setFi(j)}>{`${v * 100}%`}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${TY + TH + 16}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Score distributions and topics kept">
        {hb.map((v, i) => <rect key={`b${i}`} x={X0 + i * bw + 1} y={Y0 + PH - (v / mx) * PH} width={bw - 2} height={(v / mx) * PH} style={{ fill: "var(--text-muted)" }} opacity={0.45} />)}
        {hg.map((v, i) => <rect key={`g${i}`} x={X0 + i * bw + 1} y={Y0 + PH - (v / mx) * PH} width={bw - 2} height={(v / mx) * PH} style={{ fill: "var(--accent)" }} opacity={0.55} />)}
        <line x1={X0 + t * PW} x2={X0 + t * PW} y1={Y0} y2={Y0 + PH} stroke="var(--text)" strokeDasharray="4 3" />
        <text x={X0} y={Y0 + PH + 12} className="viz-label">score 0</text>
        <text x={X0 + PW} y={Y0 + PH + 12} textAnchor="end" className="viz-label">1</text>
        {topicCounts.map((c, k) => (
          <rect key={k} x={X0 + k * tw + 2} y={TY + TH - (c / tmax) * TH} width={tw - 4} height={Math.max((c / tmax) * TH, 0.5)} style={{ fill: k < 4 ? "var(--accent)" : "var(--text-muted)" }} opacity={0.8} />
        ))}
        <text x={X0} y={TY + TH + 12} className="viz-label">documents kept per topic</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        kept {kept.length}: precision {(tp / kept.length).toFixed(2)}, recall {(tp / pos).toFixed(2)}; top 4 topics hold{" "}
        {((100 * topicCounts.slice(0, 4).reduce((a, b) => a + b, 0)) / kept.length).toFixed(0)}% of kept
      </div>
      <figcaption className="viz-caption">
        Classifier scores for synthetic web pages that annotators judged educational, in colour, and the rest, in grey. Keeping only
        the highest-scoring pages raises precision but narrows the corpus: the topics where educational pages are common, the four on
        the left of the lower chart, take over.
      </figcaption>
    </figure>
  );
}
