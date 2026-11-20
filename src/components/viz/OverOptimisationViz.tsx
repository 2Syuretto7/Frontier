"use client";

import { useMemo, useState } from "react";
import { rand } from "./RandomWalkMcViz";

const NS = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024];
const SIZES = [
  { label: "Small reward model", k: 1.0 },
  { label: "Medium", k: 0.6 },
  { label: "Large", k: 0.35 },
];
const kl = (n: number) => Math.log(n) - (n - 1) / n;

/**
 * Best-of-n with a flawed proxy. Each candidate has true quality q and an exploitable feature e, both standard normal.
 * The proxy rewards q + k·e; the gold reward is q − 0.5·(e² − 1), so extreme values of e hurt. Returns mean proxy and gold
 * reward of the selected candidate for each n.
 */
export function simulate(k: number, trials = 800, seed = 33) {
  const r = rand(seed);
  const normal = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const P = new Array(NS.length).fill(0), G = new Array(NS.length).fill(0);
  for (let t = 0; t < trials; t++) {
    // One pool of 1,024 candidates per trial; best-of-n uses its first n, so the curves share randomness.
    let bp = -Infinity, bg = 0, j = 0;
    for (let i = 1; i <= NS[NS.length - 1]; i++) {
      const q = normal(), e = normal();
      const p = q + k * e;
      if (p > bp) { bp = p; bg = q - 0.5 * (e * e - 1); }
      if (i === NS[j]) { P[j] += bp; G[j] += bg; j++; }
    }
  }
  return NS.map((n, j) => ({ n, d: Math.sqrt(kl(n)), proxy: P[j] / trials, gold: G[j] / trials }));
}

export function OverOptimisationViz() {
  const [s, setS] = useState(0);
  const pts = useMemo(() => simulate(SIZES[s].k), [s]);
  const W = 340, H = 200, X0 = 36, Y0 = 12, PW = 290, PH = 150;
  const YMIN = -0.5, YMAX = 5;
  const px = (d: number) => X0 + (d / 2.5) * PW;
  const py = (v: number) => Y0 + PH - ((Math.max(YMIN, Math.min(YMAX, v)) - YMIN) / (YMAX - YMIN)) * PH;
  const path = (key: "proxy" | "gold") => pts.map((p, i) => `${i ? "L" : "M"}${px(p.d).toFixed(1)},${py(p[key]).toFixed(1)}`).join(" ");
  const peak = pts.reduce((a, b) => (b.gold > a.gold ? b : a));
  const last = pts[pts.length - 1];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="Reward model">
          {SIZES.map((z, i) => (
            <button key={z.label} className="seg" aria-pressed={s === i} onClick={() => setS(i)}>{z.label}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 480, display: "block", margin: "0 auto" }} role="img" aria-label="Proxy and gold reward against optimisation strength">
        {[0, 1, 2, 3, 4, 5].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={X0 - 6} y={py(v) + 3} textAnchor="end" className="viz-label">{v}</text>
          </g>
        ))}
        {[0, 0.5, 1, 1.5, 2, 2.5].map((v) => (
          <text key={v} x={px(v)} y={Y0 + PH + 13} textAnchor="middle" className="viz-label">{v}</text>
        ))}
        <path d={path("proxy")} fill="none" stroke="var(--text-muted)" strokeDasharray="4 3" strokeWidth={1.5} />
        <path d={path("gold")} fill="none" stroke="var(--accent)" strokeWidth={2} />
        {pts.map((p) => (
          <circle key={p.n} cx={px(p.d)} cy={py(p.gold)} r={2.5} style={{ fill: "var(--accent)" }} />
        ))}
        <circle cx={px(peak.d)} cy={py(peak.gold)} r={5} style={{ fill: "none", stroke: "var(--text)" }} />
        <text x={X0 + 4} y={Y0 + 10} className="viz-label">dashed: proxy reward; solid: gold reward</text>
        <text x={X0 + PW / 2} y={H - 4} textAnchor="middle" className="viz-label">√KL from the base policy (best-of-n, n = 1 to 1,024)</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        gold peaks at best-of-{peak.n.toLocaleString("en-IN")} ({peak.gold.toFixed(2)}); at best-of-1,024 proxy {last.proxy.toFixed(2)}, gold {last.gold.toFixed(2)}
      </div>
      <figcaption className="viz-caption">
        Each candidate has a true quality and a quirk, say verbosity, that the proxy reward model mistakes for quality while
        the gold judge penalises it in excess. Picking the best of n by the proxy pushes further from the base policy as n grows. The
        proxy score always rises; the gold score rises, then for a weak reward model turns down. A better reward model, one
        that leans less on the quirk, delays the turn.
      </figcaption>
    </figure>
  );
}
