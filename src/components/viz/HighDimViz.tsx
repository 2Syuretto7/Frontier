"use client";

import { useMemo, useState } from "react";

function gamma(x: number): number {
  // Γ for positive half-integers and integers, enough for d/2 + 1
  if (Math.abs(x - 1) < 1e-9 || Math.abs(x - 2) < 1e-9) return 1;
  if (Math.abs(x - 0.5) < 1e-9) return Math.sqrt(Math.PI);
  return (x - 1) * gamma(x - 1);
}
const ballFraction = (d: number) => Math.pow(Math.PI, d / 2) / gamma(d / 2 + 1) / Math.pow(2, d);
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}
const N = 20000;

/** As dimension grows, grids explode, the ball fills almost none of the cube, and Monte Carlo's error does not care. */
export function HighDimViz() {
  const [d, setD] = useState(3);
  const est = useMemo(() => {
    const r = rng(12345 + d);
    let hits = 0;
    for (let k = 0; k < N; k++) {
      let s = 0;
      for (let j = 0; j < d; j++) {
        const u = 2 * r() - 1;
        s += u * u;
      }
      if (s <= 1) hits++;
    }
    return hits / N;
  }, [d]);
  const exact = ballFraction(d);
  const se = Math.sqrt((exact * (1 - exact)) / N);
  const grid = Math.pow(10, d);
  const shell = 1 - Math.pow(0.9, d);
  const rows: [string, string][] = [
    ["grid points at 10 per axis", grid >= 1e6 ? `10^${d}` : grid.toLocaleString("en-IN")],
    ["ball's share of the cube (exact)", exact < 1e-4 ? exact.toExponential(2) : exact.toFixed(4)],
    [`Monte Carlo estimate, ${N.toLocaleString("en-IN")} points`, est.toFixed(4)],
    ["Monte Carlo standard error", se < 1e-4 ? se.toExponential(1) : se.toFixed(4)],
    ["ball's volume in its outer 10% shell", `${(100 * shell).toFixed(1)}%`],
  ];
  return (
    <figure className="viz">
      <label className="viz-controls" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 0 }}>
        <span className="mono" style={{ minWidth: 70 }}>d = {d}</span>
        <input type="range" min={1} max={30} step={1} value={d} onChange={(e) => setD(Number(e.target.value))} style={{ flex: 1, minWidth: 0 }} />
      </label>
      <div className="mono" style={{ fontSize: 13, lineHeight: 1.9, margin: "8px 0" }}>
        {rows.map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
            <span style={{ color: "var(--text-muted)" }}>{k}</span>
            <span>{v}</span>
          </div>
        ))}
      </div>
      <svg viewBox="0 0 300 40" style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }} role="img" aria-label="Share of the ball's volume in the outer shell">
        <rect x={0} y={10} width={300} height={20} rx={4} fill="var(--accent-soft)" />
        <rect x={300 * (1 - shell)} y={10} width={300 * shell} height={20} rx={4} fill="var(--accent)" />
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        The unit ball inside the cube [−1, 1]<sup>d</sup>. A grid fine enough to see the ball needs 10<sup>d</sup> points.
        Random points estimate its share with error about √(p(1 − p)/N), whatever d is, though once the share is tiny almost no
        sample lands inside, and relative accuracy suffers. The bar shows how much of the ball&rsquo;s volume lies within 10% of
        its surface: in high dimensions, nearly all of it.
      </figcaption>
    </figure>
  );
}
