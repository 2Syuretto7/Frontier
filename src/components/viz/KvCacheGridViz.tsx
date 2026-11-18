"use client";

import { useState } from "react";

const N = 12;

/** Key/value rows computed by the end of generation step t, with and without a cache. */
export function kvRows(t: number, cached: boolean) {
  return cached ? t : (t * (t + 1)) / 2;
}

export function KvCacheGridViz() {
  const [t, setT] = useState(6);
  const [cached, setCached] = useState(true);
  const W = 320, X0 = 54, cell = (W - X0 - 8) / N, Y0 = 18;
  const H = Y0 + N * cell + 8;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">mode</span>
        <button type="button" className="seg" aria-pressed={cached} onClick={() => setCached(true)}>KV cache</button>
        <button type="button" className="seg" aria-pressed={!cached} onClick={() => setCached(false)}>recompute</button>
      </div>
      <div className="viz-controls" style={{ flexWrap: "wrap", gap: 8 }}>
        <label className="viz-label" htmlFor="kv-step">tokens generated: {t}</label>
        <input id="kv-step" type="range" min={1} max={N} value={t} onChange={(e) => setT(Number(e.target.value))} style={{ flex: 1, minWidth: 120 }} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }} role="img" aria-label="For each generation step, which positions have their keys and values computed or read from the cache">
        <text x={X0} y={12} className="viz-label">position →</text>
        {Array.from({ length: t }, (_, s) => (
          <g key={s}>
            <text x={X0 - 6} y={Y0 + s * cell + cell * 0.7} textAnchor="end" className="viz-label">{`step ${s + 1}`}</text>
            {Array.from({ length: s + 1 }, (_, p) => {
              const fresh = !cached || p === s;
              return (
                <rect key={p} x={X0 + p * cell + 1} y={Y0 + s * cell + 1} width={cell - 2} height={cell - 2}
                  fill={fresh ? (p === s ? "var(--accent)" : "var(--danger)") : "var(--accent-soft)"} stroke="var(--border)" />
              );
            })}
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`key/value rows computed so far: ${kvRows(t, cached)}; the other mode needs ${kvRows(t, !cached)}`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each row is one generation step; each square a position whose key and value the step needs. Blue squares are
        computed for the new token, pale ones are read from the cache, and red ones are recomputed for positions whose keys
        and values were already known. Without a cache, step t repeats the work for all t positions, t(t + 1)/2 rows in
        total; with it, each position is computed exactly once. Because the model is causal, a cached key never goes out of
        date.
      </figcaption>
    </figure>
  );
}
