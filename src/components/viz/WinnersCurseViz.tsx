"use client";

import { useMemo, useState } from "react";

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const REPS = 4000, SHOW = 300;

/** Repeated experiments estimating a true effect with standard error 1: those that reach significance overestimate the effect, badly so when power is low. */
export function WinnersCurseViz() {
  const [d10, setD10] = useState(10);
  const delta = d10 / 10;
  const z = useMemo(() => {
    const r = makeRng(5150);
    return Array.from({ length: REPS }, () => [Math.sqrt(-2 * Math.log(Math.max(r(), 1e-12))) * Math.cos(2 * Math.PI * r()), r()]);
  }, []);
  const est = z.map(([e]) => delta + e);
  const sig = est.map((v) => Math.abs(v) > 1.96);
  const nSig = sig.filter(Boolean).length;
  const power = nSig / REPS;
  const sigVals = est.filter((_, i) => sig[i]);
  const exag = nSig > 0 ? sigVals.reduce((s, v) => s + Math.abs(v), 0) / nSig / delta : NaN;
  const wrongSign = nSig > 0 ? sigVals.filter((v) => v < 0).length / nSig : 0;
  const W = 330, H = 130, lo = -4, hi = 8;
  const X = (v: number) => 12 + ((Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo)) * (W - 24);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          true effect = {delta.toFixed(1)} standard errors
          <input type="range" min={2} max={50} value={d10} onChange={(e) => setD10(Number(e.target.value))} aria-label="true effect in standard errors" style={{ width: 150 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Estimates from repeated experiments, with the significant ones highlighted">
        <rect x={X(-1.96)} y={8} width={X(1.96) - X(-1.96)} height={H - 30} fill="var(--text-muted)" opacity={0.08} />
        {z.slice(0, SHOW).map(([, u], i) => (
          <circle key={i} cx={X(est[i])} cy={14 + u * (H - 40)} r={2} fill={sig[i] ? "var(--danger)" : "var(--accent)"} opacity={sig[i] ? 0.85 : 0.35} />
        ))}
        <line x1={X(delta)} x2={X(delta)} y1={6} y2={H - 20} stroke="var(--text)" strokeWidth={1.6} />
        <line x1={X(0)} x2={X(0)} y1={6} y2={H - 20} stroke="var(--border)" strokeDasharray="3 3" />
        <text x={X(-1.96)} y={H - 6} textAnchor="middle" className="viz-label">−1.96</text>
        <text x={X(1.96)} y={H - 6} textAnchor="middle" className="viz-label">1.96</text>
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        power {power.toFixed(3)}; significant estimates average {Number.isFinite(exag) ? exag.toFixed(2) : "none"}× the truth; wrong sign {(100 * wrongSign).toFixed(1)}%
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each dot is the estimate from one replication of the same experiment, in units of its standard error; the solid
        line is the true effect. Estimates outside the shaded band (danger colour) are statistically significant. When the
        true effect is small relative to the noise, only lucky overestimates cross the threshold, so the published,
        significant results exaggerate the effect several times and sometimes even get its sign wrong.
      </figcaption>
    </figure>
  );
}
