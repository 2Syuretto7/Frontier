"use client";

import { useState } from "react";

type SetKind = "open" | "closed" | "half" | "recip";
const LABEL: Record<SetKind, string> = { open: "(0, 1)", closed: "[0, 1]", half: "[0, 1)", recip: "{1/n}" };
const RECIP = Array.from({ length: 40 }, (_, i) => 1 / (i + 1));

/** Interior, boundary and limit points: for a chosen point, the largest neighbourhood inside the set, if any. */
export function OpenClosedViz() {
  const [kind, setKind] = useState<SetKind>("half");
  const [k, setK] = useState(50);
  const x = (k - 20) / 100;
  const inSet = kind === "recip" ? RECIP.some((r) => Math.abs(r - x) < 1e-9) : kind === "open" ? x > 0 && x < 1 : kind === "closed" ? x >= 0 && x <= 1 : x >= 0 && x < 1;
  const r = kind === "recip" ? 0 : x > 0 && x < 1 ? Math.min(x, 1 - x) : 0;
  const nearest = kind === "recip" ? Math.min(...RECIP.map((v) => Math.abs(v - x)), Math.abs(x)) : Math.min(Math.abs(x), Math.abs(x - 1), x > 0 && x < 1 ? 0 : Infinity);
  const isLimit = kind === "recip" ? Math.abs(x) < 1e-9 : x >= -1e-9 && x <= 1 + 1e-9;
  const W = 330, H = 100;
  const X = (v: number) => 14 + ((v + 0.2) / 1.4) * (W - 28);
  const status = r > 0 ? `interior point: (x − ${r.toFixed(2)}, x + ${r.toFixed(2)}) lies inside` : inSet ? "in the set but not interior: every neighbourhood leaks out" : isLimit ? "not in the set, but a limit point of it" : `outside, at distance ${nearest.toFixed(2)} from the set`;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        {(Object.keys(LABEL) as SetKind[]).map((s) => (
          <button key={s} type="button" className="seg" aria-pressed={kind === s} onClick={() => setKind(s)}>{LABEL[s]}</button>
        ))}
      </div>
      <div className="viz-controls">
        <label className="mono" style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          x = {x.toFixed(2)}
          <input type="range" min={0} max={140} value={k} onChange={(e) => setK(Number(e.target.value))} aria-label="point x" style={{ width: 170 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="The set on a number line and the chosen point">
        <line x1={14} x2={W - 14} y1={50} y2={50} stroke="var(--border)" />
        {kind === "recip"
          ? RECIP.map((v, i) => <circle key={i} cx={X(v)} cy={50} r={2.4} fill="var(--accent)" />)
          : <line x1={X(0)} x2={X(1)} y1={50} y2={50} stroke="var(--accent)" strokeWidth={5} />}
        {kind !== "recip" && [0, 1].map((e) => {
          const closed = kind === "closed" || (kind === "half" && e === 0);
          return <circle key={e} cx={X(e)} cy={50} r={5} fill={closed ? "var(--accent)" : "var(--bg)"} stroke="var(--accent)" strokeWidth={2} />;
        })}
        {r > 0 && <rect x={X(x - r)} y={36} width={X(x + r) - X(x - r)} height={28} fill="var(--accent-soft)" opacity={0.7} />}
        <line x1={X(x)} x2={X(x)} y1={28} y2={72} stroke="var(--danger)" strokeWidth={2} />
        {[0, 0.5, 1].map((t) => <text key={t} x={X(t)} y={90} textAnchor="middle" className="viz-label">{t}</text>)}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0", overflowX: "auto" }}>{status}</div>
      <figcaption className="viz-caption" aria-live="polite">
        A set is open if every point has a neighbourhood inside it, and closed if it contains all its limit points. (0, 1) is
        open, [0, 1] closed, and [0, 1) neither: 0 is in it but not interior, and 1 is a limit point it misses. The set
        {"{1/n}"} has no interior points at all, and its only limit point, 0, is missing, so it is not closed either; adding 0
        makes it closed.
      </figcaption>
    </figure>
  );
}
