"use client";

import { useMemo, useState } from "react";
import { Chart } from "./Chart";
import { scales, type View } from "./Plot";
import { clusters, inertiaOf, kmeans } from "./ml";

const V: View = { xmin: 0, xmax: 1, ymin: 0, ymax: 1, w: 320, h: 320 };
const KMAX = 8;
const E: View = { xmin: 1, xmax: KMAX, ymin: 0, ymax: 1, w: 440, h: 150 };
const CLR = ["var(--accent)", "var(--danger)", "var(--success)", "var(--text-muted)"];
const CENTRES = [{ x: 0.25, y: 0.72 }, { x: 0.68, y: 0.78 }, { x: 0.3, y: 0.25 }, { x: 0.76, y: 0.32 }];

const dot = (c: number) => (c < 4 ? { fill: CLR[c], stroke: "var(--surface)", strokeWidth: 1.5 } : { fill: "var(--surface)", stroke: CLR[c % 4], strokeWidth: 2 });

/** Lloyd's algorithm step by step, restarts, and the elbow in the within-cluster sum of squares. */
export function KMeansLloydViz() {
  const [k, setK] = useState(4);
  const [seed, setSeed] = useState(2);
  const [step, setStep] = useState(0);
  const pts = useMemo(() => clusters(21, CENTRES, 30, 0.07), []);
  const run = useMemo(() => kmeans(pts, k, seed), [pts, k, seed]);
  const best = useMemo(() => Array.from({ length: KMAX }, (_, i) => Math.min(...Array.from({ length: 10 }, (_, s) => kmeans(pts, i + 1, 100 + s).inertia))), [pts]);
  const s = Math.min(step, run.history.length - 1);
  const cs = run.history[s];
  const labels = run.assign(cs);
  const inertia = inertiaOf(pts, cs);
  const done = s === run.history.length - 1;
  const { X, Y } = scales(V);
  const e = scales(E);
  const top = best[0];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <button type="button" className="btn" onClick={() => setStep(s + 1)} disabled={done}>Step</button>
        <button type="button" className="btn" onClick={() => setStep(run.history.length - 1)} disabled={done}>Run to the end</button>
        <button type="button" className="btn" onClick={() => { setSeed(seed + 1); setStep(0); }}>New random start</button>
      </div>
      <div style={{ maxWidth: 380, margin: "12px auto 0" }}>
        <Chart v={V} label={`k-means with k = ${k}, after ${s} steps`} xticks={[0, 0.5, 1]} yticks={[0, 0.5, 1]}>
          {pts.map((p, i) => <circle key={i} cx={X(p.x)} cy={Y(p.y)} r={4} style={dot(labels[i])} />)}
          {cs.map((c, j) => (
            <g key={j}>
              <path d={`M${X(c.x) - 9} ${Y(c.y)}h18M${X(c.x)} ${Y(c.y) - 9}v18`} style={{ stroke: "var(--text)", strokeWidth: 4 }} />
              <path d={`M${X(c.x) - 8} ${Y(c.y)}h16M${X(c.x)} ${Y(c.y) - 8}v16`} style={{ stroke: CLR[j % 4], strokeWidth: 2.5 }} />
            </g>
          ))}
        </Chart>
      </div>
      <div className="ml-stats">
        <div className="ml-stat"><b>{inertia.toFixed(2)}</b><span>within-cluster sum of squares</span></div>
        <div className="ml-stat"><b>{best[k - 1].toFixed(2)}</b><span>best of 10 restarts for this k</span></div>
      </div>
      <Chart v={E} label="Best within-cluster sum of squares against k" xticks={[1, 2, 3, 4, 5, 6, 7, 8]} yticks={[0, 0.5, 1]} yfmt={(v) => `${Math.round(v * 100)}%`} xlabel="number of clusters k">
        <path d={best.map((b, i) => `${i ? "L" : "M"}${e.X(i + 1).toFixed(1)} ${e.Y(b / top).toFixed(1)}`).join(" ")} className="plot-curve" />
        {best.map((b, i) => <circle key={i} cx={e.X(i + 1)} cy={e.Y(b / top)} r={i + 1 === k ? 5 : 3} className={i + 1 === k ? "plot-hot" : "plot-point"} />)}
      </Chart>
      <div className="viz-sliders">
        <label>
          k = {k}
          <input type="range" min={1} max={KMAX} value={k} onChange={(ev) => { setK(Number(ev.target.value)); setStep(0); }} />
        </label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {s === 0 ? "The crosses start on randomly chosen points. Each step assigns every point to its nearest cross, then moves each cross to the mean of its points." : done ? `Converged after ${s} step${s === 1 ? "" : "s"}.` : `After ${s} step${s === 1 ? "" : "s"}; the sum of squares has fallen.`}{" "}
        {done && inertia > best[k - 1] * 1.05 ? "This run is stuck in a worse solution than the best restart: try a new random start." : ""}{" "}
        The lower chart shows the best sum of squares as a share of the k = 1 value; it always falls as k grows, but the bend at k = 4 marks where extra clusters stop paying.
      </figcaption>
    </figure>
  );
}
