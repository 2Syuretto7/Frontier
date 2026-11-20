"use client";

import { useMemo, useState } from "react";

type Cls = "thresholds" | "intervals" | "half-planes";
const VC: Record<Cls, number> = { thresholds: 1, intervals: 2, "half-planes": 3 };

/** Whether a labelling (bit i = label of point i) is produced by the class. Line classes use points in order; half-planes use points on a circle. */
export function realisable(cls: Cls, n: number, mask: number) {
  const lab = Array.from({ length: n }, (_, i) => (mask >> i) & 1);
  if (cls === "thresholds") return lab.every((v, i) => i === 0 || v >= lab[i - 1]);
  if (cls === "intervals") { const p = lab.flatMap((v, i) => (v ? [i] : [])); return p.length === 0 || p[p.length - 1] - p[0] + 1 === p.length; }
  // Points in convex position: a half-plane cuts out a cyclically contiguous arc.
  const ones = lab.reduce((a, v) => a + v, 0);
  if (ones === 0 || ones === n) return true;
  let changes = 0; for (let i = 0; i < n; i++) if (lab[i] !== lab[(i + 1) % n]) changes++;
  return changes === 2;
}

const choose = (m: number, k: number) => { let r = 1; for (let i = 0; i < k; i++) r = (r * (m - i)) / (i + 1); return r; };
export const sauer = (m: number, d: number) => Array.from({ length: d + 1 }, (_, i) => choose(m, i)).reduce((a, v) => a + v, 0);

export function ShatterViz() {
  const [cls, setCls] = useState<Cls>("half-planes");
  const [n, setN] = useState(4);
  const cells = useMemo(() => Array.from({ length: 2 ** n }, (_, m) => ({ m, ok: realisable(cls, n, m) })), [cls, n]);
  const count = cells.filter((c) => c.ok).length;
  const pos = (i: number) => (cls === "half-planes"
    ? [16 + 11 * Math.cos((2 * Math.PI * i) / n - Math.PI / 2), 16 + 11 * Math.sin((2 * Math.PI * i) / n - Math.PI / 2)]
    : [5 + (i * 22) / Math.max(1, n - 1), 16]);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Hypothesis class">
          {(Object.keys(VC) as Cls[]).map((c) => <button key={c} type="button" className="seg" aria-pressed={cls === c} onClick={() => setCls(c)}>{c}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Number of points">
          {[2, 3, 4, 5].map((k) => <button key={k} type="button" className="seg" aria-pressed={n === k} onClick={() => setN(k)}>{k} points</button>)}
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center", maxWidth: 440, margin: "0 auto" }}>
        {cells.map(({ m, ok }) => (
          <svg key={m} viewBox="0 0 32 32" width={40} height={40} role="img" aria-label={ok ? "realisable labelling" : "labelling the class cannot produce"}
            style={{ width: 40, height: 40, flex: "0 0 40px", display: "block", border: "1px solid var(--border)", borderRadius: 4, opacity: ok ? 1 : 0.35 }}>
            {Array.from({ length: n }, (_, i) => { const [x, y] = pos(i); return <circle key={i} cx={x} cy={y} r={3.2} fill={(m >> i) & 1 ? "var(--accent)" : "none"} stroke="var(--text)" strokeWidth={1} />; })}
            {!ok && <line x1={4} y1={28} x2={28} y2={4} stroke="var(--text)" strokeWidth={1} />}
          </svg>
        ))}
      </div>
      <div className="mono" style={{ fontSize: 12, margin: "8px 0 6px" }} aria-live="polite">
        {cls}: {count} of {2 ** n} labellings; VC dimension {VC[cls]}; Sauer bound {sauer(n, VC[cls])}; {count === 2 ** n ? "shattered" : "not shattered"}
      </div>
      <figcaption className="viz-caption">
        Each tile is one labelling of the points, filled for positive; crossed-out tiles are labellings the class cannot
        produce. Thresholds and intervals use points on a line, half-planes use points around a circle. Once the number of
        points exceeds the VC dimension, labellings start to go missing, and the count never exceeds the Sauer bound: five
        points admit 22 half-plane labellings of 32, against a bound of 26.
      </figcaption>
    </figure>
  );
}
