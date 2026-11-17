"use client";

import { useEffect, useState } from "react";

const XS = Array.from({ length: 401 }, (_, i) => -8 + (16 * i) / 400);
const DX = 16 / 400;
const npdf = (x: number, m: number, s: number) => Math.exp(-0.5 * ((x - m) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));

function klGrid(p: number[], q: number[]) {
  let d = 0;
  for (let i = 0; i < p.length; i++) if (p[i] > 1e-300) d += p[i] * Math.log(p[i] / Math.max(q[i], 1e-300));
  return d * DX;
}

function fit(p: number[], reverse: boolean) {
  let best = { d: Infinity, m: 0, s: 1 };
  for (let m = -4; m <= 4.0001; m += 0.1) for (let s = 0.2; s <= 4.0001; s += 0.1) {
    const q = XS.map((x) => npdf(x, m, s));
    const d = reverse ? klGrid(q, p) : klGrid(p, q);
    if (d < best.d) best = { d, m, s };
  }
  return best;
}

/** Fitting one Gaussian to a two-bump density by minimising KL(p‖q) (mode covering) or KL(q‖p) (mode seeking). */
export function KlFitViz() {
  const [sep, setSep] = useState(2);
  const [w, setW] = useState(0.5);
  const p = XS.map((x) => w * npdf(x, -sep, 0.6) + (1 - w) * npdf(x, sep, 0.6));
  const [fits, setFits] = useState<{ fwd: { d: number; m: number; s: number }; rev: { d: number; m: number; s: number } } | null>(null);
  useEffect(() => {
    const pp = XS.map((x) => w * npdf(x, -sep, 0.6) + (1 - w) * npdf(x, sep, 0.6));
    setFits({ fwd: fit(pp, false), rev: fit(pp, true) });
  }, [sep, w]);
  const W = 330, H = 170, ymax = 0.8;
  const X = (x: number) => 10 + ((x + 7) / 14) * (W - 20);
  const Y = (y: number) => H - 16 - (Math.min(y, ymax) / ymax) * (H - 30);
  const line = (ys: number[]) => XS.map((x, i) => `${X(Math.max(-7, Math.min(7, x))).toFixed(1)},${Y(ys[i]).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          bump centres ±{sep.toFixed(1)}
          <input type="range" min={0} max={4} step={0.1} value={sep} onChange={(e) => setSep(Number(e.target.value))} aria-label="separation of the bumps" style={{ width: 100 }} />
        </label>
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
          left weight {w.toFixed(2)}
          <input type="range" min={0.1} max={0.9} step={0.05} value={w} onChange={(e) => setW(Number(e.target.value))} aria-label="weight of the left bump" style={{ width: 100 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="A two-bump density with the Gaussians that minimise forward and reverse KL">
        <polygon points={`${X(-7)},${Y(0)} ${line(p)} ${X(7)},${Y(0)}`} fill="var(--text-muted)" opacity={0.25} />
        <line x1={X(-7)} x2={X(7)} y1={Y(0)} y2={Y(0)} stroke="var(--border)" />
        {fits && (
          <>
            <polyline fill="none" stroke="var(--accent)" strokeWidth={1.8} points={line(XS.map((x) => npdf(x, fits.fwd.m, fits.fwd.s)))} />
            <polyline fill="none" stroke="var(--danger)" strokeWidth={1.8} strokeDasharray="5 3" points={line(XS.map((x) => npdf(x, fits.rev.m, fits.rev.s)))} />
          </>
        )}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {fits
          ? `KL(p‖q) fit: mean ${(fits.fwd.m + 0).toFixed(1)}, sd ${fits.fwd.s.toFixed(1)}; KL(q‖p) fit: mean ${(fits.rev.m + 0).toFixed(1)}, sd ${fits.rev.s.toFixed(1)}`
          : "fitting…"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        The shaded density p has two bumps. The solid curve is the Gaussian q minimising KL(p‖q): it pays heavily wherever
        p has mass and q does not, so it stretches to cover both bumps, matching p&apos;s mean and variance. The dashed curve
        minimises KL(q‖p): it pays wherever q has mass and p does not, so once the bumps separate it sits on one of them
        and ignores the other. Push the bumps together and the two fits agree.
      </figcaption>
    </figure>
  );
}
