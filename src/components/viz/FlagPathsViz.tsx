"use client";

import { useState } from "react";

const SIZE = 300;

/** k boolean flags make 2^k code paths. The usual tests run the default and each flag alone. */
export function FlagPathsViz() {
  const [k, setK] = useState(4);
  const n = 2 ** k;
  const cols = 2 ** Math.ceil(k / 2);
  const rows = n / cols;
  const cell = SIZE / Math.max(cols, rows);
  const popcount = (x: number) => x.toString(2).split("").filter((c) => c === "1").length;
  const tested = k + 1;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
          <span className="mono">{k} flag{k === 1 ? "" : "s"}</span>
          <input type="range" min={1} max={10} value={k} onChange={(e) => setK(Number(e.target.value))} style={{ flex: 1, minWidth: 0 }} />
        </label>
      </div>
      <svg viewBox={`0 0 ${cols * cell} ${rows * cell}`} style={{ maxWidth: SIZE, width: "100%", display: "block", margin: "8px auto" }} role="img" aria-label={`${n} combinations of flags, ${tested} of them tested`}>
        {Array.from({ length: n }, (_, i) => (
          <rect key={i} x={(i % cols) * cell + cell * 0.1} y={Math.floor(i / cols) * cell + cell * 0.1} width={cell * 0.8} height={cell * 0.8} rx={cell * 0.15}
            fill={popcount(i) <= 1 ? "var(--accent)" : "var(--border)"} />
        ))}
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        {n} combinations; the default plus each flag on its own is {tested}, so {((tested / n) * 100).toFixed(tested / n < 0.1 ? 1 : 0)}% are
        ever run. {k >= 5 ? "Most combinations have never run once. A bug that needs two flags together lives in the grey." : "Still small enough to test them all."}
      </figcaption>
    </figure>
  );
}
