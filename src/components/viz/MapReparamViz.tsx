"use client";

import { useState } from "react";

/** The same posterior for a coin's bias drawn against p and against the log-odds η: its peak sits at different places, so the MAP estimate depends on the parametrisation. */
export function MapReparamViz() {
  const [n, setN] = useState(4);
  const [h, setH] = useState(3);
  const hh = Math.min(h, n);
  const a = hh + 1, b = n - hh + 1;
  const ps = Array.from({ length: 199 }, (_, i) => (i + 1) / 200);
  const logp = (p: number) => (a - 1) * Math.log(p) + (b - 1) * Math.log(1 - p);
  const lp = ps.map(logp);
  const mp = Math.max(...lp);
  const dp = lp.map((v) => Math.exp(v - mp));
  const es = Array.from({ length: 241 }, (_, i) => -6 + (12 * i) / 240);
  const le = es.map((e) => { const p = 1 / (1 + Math.exp(-e)); return a * Math.log(p) + b * Math.log(1 - p); });
  const me = Math.max(...le);
  const de = le.map((v) => Math.exp(v - me));
  const mapP = n > 0 ? hh / n : NaN;
  const mapE = a / (a + b);
  const mean = a / (a + b);
  const W = 330, H = 120;
  const XP = (p: number) => 14 + p * (W - 28);
  const XE = (e: number) => 14 + ((e + 6) / 12) * (W - 28);
  const Y = (y: number) => H - 16 - y * (H - 26);
  const logit = (p: number) => Math.log(p / (1 - p));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          flips n = {n}
          <input type="range" min={1} max={40} value={n} onChange={(e) => { const v = Number(e.target.value); setN(v); if (h > v) setH(v); }} aria-label="number of flips" style={{ width: 110 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          heads h = {hh}
          <input type="range" min={0} max={n} value={hh} onChange={(e) => setH(Number(e.target.value))} aria-label="number of heads" style={{ width: 110 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Posterior density against p">
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} points={ps.map((p, i) => `${XP(p).toFixed(1)},${Y(dp[i]).toFixed(1)}`).join(" ")} />
        <line x1={XP(0)} x2={XP(1)} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        {Number.isFinite(mapP) && <line x1={XP(mapP)} x2={XP(mapP)} y1={8} y2={Y(0)} stroke="var(--danger)" strokeDasharray="3 3" />}
        <line x1={XP(mapE)} x2={XP(mapE)} y1={8} y2={Y(0)} stroke="var(--text)" strokeDasharray="2 2" />
        <text x={XP(0)} y={H - 2} className="viz-label">p = 0</text>
        <text x={XP(1)} y={H - 2} textAnchor="end" className="viz-label">1</text>
      </svg>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="The same posterior against the log-odds">
        <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} points={es.map((e, i) => `${XE(e).toFixed(1)},${Y(de[i]).toFixed(1)}`).join(" ")} />
        <line x1={XE(-6)} x2={XE(6)} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        {Number.isFinite(mapP) && mapP > 0 && mapP < 1 && <line x1={XE(logit(mapP))} x2={XE(logit(mapP))} y1={8} y2={Y(0)} stroke="var(--danger)" strokeDasharray="3 3" />}
        <line x1={XE(logit(mapE))} x2={XE(logit(mapE))} y1={8} y2={Y(0)} stroke="var(--text)" strokeDasharray="2 2" />
        <text x={XE(-6)} y={H - 2} className="viz-label">η = −6</text>
        <text x={XE(6)} y={H - 2} textAnchor="end" className="viz-label">6</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        MAP in p: {mapP.toFixed(3)}; MAP in η, mapped to p: {mapE.toFixed(3)}; posterior mean {mean.toFixed(3)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Both panels show one posterior, from a uniform prior on p after h heads in n flips, scaled to peak height 1. The
        top panel plots its density against p, whose peak is h/n (danger dashes). The bottom plots the density of η =
        log(p/(1 − p)), which includes the Jacobian p(1 − p); its peak (fine dashes, marked in both panels) corresponds to
        p = (h + 1)/(n + 2). Same beliefs, different &quot;most probable value&quot;. With h = n the top peak sits at the
        edge p = 1, while the bottom one stays inside.
      </figcaption>
    </figure>
  );
}
