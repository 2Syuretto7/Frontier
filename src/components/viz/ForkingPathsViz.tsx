"use client";

import { useState } from "react";

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

/** Try k variants that are all exactly as good as the baseline. How often does one look like a win? */
export function ForkingPathsViz() {
  const [k, setK] = useState(10);
  const [batch, setBatch] = useState(0);
  const [corrected, setCorrected] = useState(false);
  const alpha = corrected ? 0.05 / k : 0.05;
  const r = rng(batch * 9973 + 17);
  const trials = Array.from({ length: 20 }, () => Array.from({ length: k }, () => r()));
  const lucky = trials.map((t) => t.some((p) => p < alpha));
  const prob = 1 - (1 - alpha) ** k;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, flex: "1 1 220px" }}>
          <span className="mono">k = {k} variants</span>
          <input type="range" min={1} max={40} value={k} onChange={(e) => setK(Number(e.target.value))} style={{ flex: 1, minWidth: 0 }} />
        </label>
        <button type="button" className="seg" aria-pressed={corrected} onClick={() => setCorrected(!corrected)}>threshold 0.05 / k</button>
        <button type="button" className="btn" onClick={() => setBatch(batch + 1)}>New projects</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(44px, 1fr))", gap: 4, margin: "8px 0" }}>
        {lucky.map((l, i) => (
          <div key={i} className="mono" title={l ? "found a false win" : "nothing found"} style={{ textAlign: "center", fontSize: 12, padding: "4px 0", border: "1px solid var(--border)", borderRadius: 4, background: l ? "color-mix(in srgb, var(--danger) 20%, transparent)" : undefined }}>
            {l ? "win?" : "-"}
          </div>
        ))}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Twenty projects, each trying {k} variant{k === 1 ? "" : "s"} with no real effect at a threshold of{" "}
        {alpha < 0.01 ? alpha.toExponential(1) : alpha.toFixed(2)}. {lucky.filter(Boolean).length} of 20 found a
        &ldquo;win&rdquo;; the chance for each is {(prob * 100).toFixed(0)}%.{" "}
        {corrected ? "Dividing the threshold by k keeps it near 5% however many variants you try." : "Without a notebook saying in advance which comparison mattered, every one of these looks like a discovery."}
      </figcaption>
    </figure>
  );
}
