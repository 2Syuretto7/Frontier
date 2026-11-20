"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const SIMS = 300, RATERS = 8, PER = 40, GAP = 0.2;

/**
 * A human evaluation of two systems with true mean quality 3.2 and 3.0 on a five-point scale. Eight raters have leniency offsets
 * N(0, 0.5²), sorted so raters 0–3 are the harshest. Each of 40 outputs per system gets three ratings: score = quality + output
 * effect N(0, 0.4²) + rater offset + noise N(0, 0.6²). Balanced: raters drawn at random. Unbalanced: each rating comes from the
 * harsh half for system A and the lenient half for system B with probability 0.8. Returns the estimated gap A − B from each of
 * SIMS studies, from raw means or from a least-squares fit of output means plus rater offsets.
 */
export function raterStudy(balanced: boolean, adjust: boolean, seed = 33) {
  const r = rand(seed);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const gaps: number[] = [];
  for (let s = 0; s < SIMS; s++) {
    const off = Array.from({ length: RATERS }, () => 0.5 * gauss()).sort((a, b) => a - b);
    const it: number[] = [], rr: number[] = [], y: number[] = [];
    for (let sys = 0; sys < 2; sys++) {
      for (let i = 0; i < PER; i++) {
        const q = (sys === 0 ? 3.2 : 3.0) + 0.4 * gauss();
        for (let k = 0; k < 3; k++) {
          let who: number;
          if (balanced) who = Math.floor(r() * RATERS);
          else {
            const home = r() < 0.8 ? sys : 1 - sys;
            who = home * 4 + Math.floor(r() * 4);
          }
          it.push(sys * PER + i); rr.push(who); y.push(q + off[who] + 0.6 * gauss());
        }
      }
    }
    const NI = 2 * PER;
    const o = new Array(RATERS).fill(0);
    let im = new Array(NI).fill(0);
    for (let iter = 0; iter < (adjust ? 60 : 1); iter++) {
      const si = new Array(NI).fill(0), ci = new Array(NI).fill(0);
      y.forEach((v, j) => { si[it[j]] += v - o[rr[j]]; ci[it[j]]++; });
      im = si.map((v, i) => v / ci[i]);
      if (!adjust) break;
      const sr = new Array(RATERS).fill(0), cr = new Array(RATERS).fill(0);
      y.forEach((v, j) => { sr[rr[j]] += v - im[it[j]]; cr[rr[j]]++; });
      for (let k = 0; k < RATERS; k++) o[k] = cr[k] ? sr[k] / cr[k] : 0;
      const mo = o.reduce((a, b) => a + b, 0) / RATERS;
      for (let k = 0; k < RATERS; k++) o[k] -= mo;
    }
    const mean = (a: number, b: number) => im.slice(a, b).reduce((u, v) => u + v, 0) / (b - a);
    gaps.push(mean(0, PER) - mean(PER, NI));
  }
  return gaps;
}

export function RaterDesignViz() {
  const [bal, setBal] = useState(1);
  const [adj, setAdj] = useState(0);
  const gaps = useMemo(() => raterStudy(bal === 0, adj === 1), [bal, adj]);
  const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const wrong = gaps.filter((g) => g < 0).length / gaps.length;
  const LO = -0.8, HI = 0.8, BINS = 32;
  const h = new Array(BINS).fill(0);
  gaps.forEach((g) => { const b = Math.floor(((g - LO) / (HI - LO)) * BINS); if (b >= 0 && b < BINS) h[b]++; });
  const top = Math.max(...h);
  const W = 330, H = 160, X0 = 14, PW = 302, Y0 = 8, PH = 110, bw = PW / BINS;
  const px = (x: number) => X0 + ((x - LO) / (HI - LO)) * PW;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Assignment of raters">
          {["raters at random", "lenient raters on B"].map((name, i) => <button key={name} type="button" className="seg" aria-pressed={bal === i} onClick={() => setBal(i)}>{name}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Analysis">
          {["raw means", "adjust for raters"].map((name, i) => <button key={name} type="button" className="seg" aria-pressed={adj === i} onClick={() => setAdj(i)}>{name}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Estimated gap between two systems across simulated studies">
        {h.map((c, i) => <rect key={i} x={X0 + i * bw + 0.5} y={Y0 + PH - (c / top) * PH} width={bw - 1} height={(c / top) * PH} style={{ fill: "var(--accent)" }} />)}
        <line x1={px(GAP)} x2={px(GAP)} y1={Y0} y2={Y0 + PH} stroke="var(--text)" strokeDasharray="3 3" />
        <line x1={px(0)} x2={px(0)} y1={Y0} y2={Y0 + PH} stroke="var(--border-strong)" />
        <line x1={X0} x2={X0 + PW} y1={Y0 + PH} y2={Y0 + PH} stroke="var(--border)" />
        <text x={X0} y={Y0 + PH + 13} className="viz-label">{LO}</text>
        <text x={px(0)} y={Y0 + PH + 13} textAnchor="middle" className="viz-label">0</text>
        <text x={X0 + PW} y={Y0 + PH + 13} textAnchor="end" className="viz-label">+{HI}</text>
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">estimated A − B; dashed line: true gap {GAP}</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        mean estimate {mean.toFixed(2)}; B wrongly ahead in {(100 * wrong).toFixed(0)}% of {SIMS} studies
      </div>
      <figcaption className="viz-caption">
        Many simulated human studies of two systems, where system A is truly better by 0.2 points. Raters differ in leniency. If
        the lenient raters happen to see more of B&apos;s outputs, raw means favour B. Assigning raters at random removes the bias;
        fitting each rater&apos;s offset recovers the gap even from the lopsided design, as long as some raters see both systems.
      </figcaption>
    </figure>
  );
}
