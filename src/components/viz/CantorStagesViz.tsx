"use client";

import { useMemo, useState } from "react";

export const KINDS = ["middle thirds", "fat"] as const;

/** Stage n of the construction: remove the open middle third of every interval, or (fat) a middle piece of length 4^(−n). */
export function stages(kind: string, n: number) {
  let cur: [number, number][] = [[0, 1]];
  const out = [cur];
  for (let k = 1; k <= n; k++) {
    cur = cur.flatMap(([a, b]) => {
      const gap = kind === "fat" ? 4 ** -k : (b - a) / 3, m = (a + b) / 2;
      return [[a, m - gap / 2], [m + gap / 2, b]] as [number, number][];
    });
    out.push(cur);
  }
  return out;
}

export const total = (iv: [number, number][]) => iv.reduce((s, [a, b]) => s + (b - a), 0);

export function CantorStagesViz() {
  const [kind, setKind] = useState<string>("middle thirds");
  const rows = useMemo(() => stages(kind, 6), [kind]);
  const W = 330, X0 = 10, PW = 310, RH = 14, H = rows.length * RH + 6;
  const lens = rows.map(total);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Construction">
          {KINDS.map((k) => <button key={k} type="button" className="seg" aria-pressed={kind === k} onClick={() => setKind(k)}>{k}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Stages 0 to 6 of a Cantor-type construction">
        {rows.map((iv, r) => iv.map(([a, b], i) => <rect key={`${r}-${i}`} x={X0 + a * PW} y={4 + r * RH} width={Math.max(0.5, (b - a) * PW)} height={RH - 5} fill={r === rows.length - 1 ? "var(--accent)" : "var(--text)"} fillOpacity={r === rows.length - 1 ? 0.9 : 0.45} />))}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        total length at stages 0–6: {lens.map((v) => v.toFixed(3)).join(", ")}; limit {kind === "fat" ? "0.5" : "0"}
      </div>
      <figcaption className="viz-caption">
        Two constructions, each of which keeps 64 closed intervals after six stages. Removing middle thirds leaves total length
        (2/3)ⁿ, which is 0.088 at stage 6 and tends to 0: the Cantor set is uncountable but has measure zero. Removing a
        middle piece of length 4⁻ⁿ instead takes away only 1/4 + 2/16 + 4/64 + ⋯ = 1/2, so the fat Cantor set keeps measure
        ½ (0.508 at stage 6) while still containing no interval at all.
      </figcaption>
    </figure>
  );
}
