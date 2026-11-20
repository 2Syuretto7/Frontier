"use client";

import { useMemo, useState } from "react";

const N0 = 10, CPUCT = 1.5, SIMS = [10, 50, 200, 800];
const PRIORS: { name: string; p: (n: number) => number[] }[] = [
  { name: "uniform", p: () => [1 / 3, 1 / 3, 1 / 3] },
  { name: "misleading", p: () => [0.8, 0.1, 0.1] },
  { name: "good", p: (n) => [1, 2, 3].map((k) => (k === n % 4 ? 0.8 : 0.1)) },
];
const movesOf = (n: number) => [1, 2, 3].filter((k) => k <= n);
/** A half-trained value network: the sign of the true value, at half strength. */
const valueNet = (n: number) => (n % 4 ? 0.5 : -0.5);

/** AlphaZero-style PUCT search on Nim from N0 with no rollouts; returns root visit counts per move. */
export function puctSearch(sims: number, prior: (n: number) => number[]) {
  const P = new Map<number, number[]>(), N = new Map<string, number>(), W = new Map<string, number>();
  const expand = (n: number) => {
    const ks = movesOf(n), raw = prior(n).slice(0, ks.length), z = raw.reduce((a, x) => a + x, 0);
    P.set(n, raw.map((x) => x / z));
    for (const k of ks) { N.set(`${n},${k}`, 0); W.set(`${n},${k}`, 0); }
  };
  expand(N0);
  for (let i = 0; i < sims; i++) {
    const path: [number, number][] = [];
    let n = N0;
    while (n > 0 && P.has(n)) {
      const ks = movesOf(n), total = ks.reduce((a, k) => a + N.get(`${n},${k}`)!, 0);
      let best = ks[0], bs = -Infinity;
      for (const k of ks) {
        const c = N.get(`${n},${k}`)!, q = c ? W.get(`${n},${k}`)! / c : 0;
        const sc = q + CPUCT * P.get(n)![k - 1] * Math.sqrt(total) / (1 + c);
        if (sc > bs) { bs = sc; best = k; }
      }
      path.push([n, best]);
      n -= best;
    }
    let v: number;
    if (n === 0) v = -1;
    else { expand(n); v = valueNet(n); }
    for (let j = path.length - 1; j >= 0; j--) {
      const key = `${path[j][0]},${path[j][1]}`;
      v = -v;
      N.set(key, N.get(key)! + 1);
      W.set(key, W.get(key)! + v);
    }
  }
  return movesOf(N0).map((k) => N.get(`${N0},${k}`)!);
}

export function PuctSearchViz() {
  const [pi, setPi] = useState(1);
  const [si, setSi] = useState(1);
  const counts = useMemo(() => puctSearch(SIMS[si], PRIORS[pi].p), [pi, si]);
  const prior = PRIORS[pi].p(N0), total = counts.reduce((a, x) => a + x, 0);
  const W = 330, H = 150, X0 = 34, Y0 = 8, PW = W - 44, PH = H - Y0 - 30, gw = PW / 3;
  const sy = (f: number) => Y0 + PH - f * PH;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">prior</span>
        <div className="segmented" role="group" aria-label="Prior from the policy network">
          {PRIORS.map((p, i) => <button key={p.name} type="button" className="seg" aria-pressed={pi === i} onClick={() => setPi(i)}>{p.name}</button>)}
        </div>
        <span className="viz-label">simulations</span>
        <div className="segmented" role="group" aria-label="Number of simulations">
          {SIMS.map((x, i) => <button key={x} type="button" className="seg" aria-pressed={si === i} onClick={() => setSi(i)}>{x}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Prior and visit distribution over the three moves">
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={X0} x2={X0 + PW} y1={sy(f)} y2={sy(f)} stroke="var(--border)" strokeDasharray={f ? "2 4" : undefined} />
            <text x={X0 - 4} y={sy(f) + 4} textAnchor="end" className="viz-label">{f}</text>
          </g>
        ))}
        {counts.map((c, i) => (
          <g key={i}>
            <rect x={X0 + i * gw + 10} y={sy(prior[i])} width={gw / 2 - 12} height={Y0 + PH - sy(prior[i])} fill="var(--text-muted)" />
            <rect x={X0 + i * gw + gw / 2 + 2} y={sy(c / total)} width={gw / 2 - 12} height={Y0 + PH - sy(c / total)} fill={i + 1 === N0 % 4 ? "var(--success)" : "var(--accent)"} />
            <text x={X0 + i * gw + gw / 2} y={Y0 + PH + 14} textAnchor="middle" className="viz-label">{`take ${i + 1}`}</text>
          </g>
        ))}
        <text x={X0 + PW / 2} y={H - 3} textAnchor="middle" className="viz-label">prior (grey) and share of visits (colour)</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`visits ${counts.join(", ")}; search policy ${counts.map((c) => (c / total).toFixed(2)).join(", ")}`}
      </div>
      <figcaption className="viz-caption">
        PUCT search from 10 stones of Nim, as in AlphaZero: no random rollouts, a value network that knows only the sign of
        each position&apos;s value (±0.5), and a prior from a policy network. The winning move is take 2 (green). With a good prior
        the search confirms it at once. With a misleading prior that puts 0.8 on take 1, 10 simulations split their visits
        evenly between take 1 and take 2; by 50 the values found below take 1 have overruled the prior and 34 of the 50
        visits go to take 2, and by 800 almost all of them. The visit
        distribution is a better policy than the prior, and AlphaZero trains the policy network towards it.
      </figcaption>
    </figure>
  );
}
