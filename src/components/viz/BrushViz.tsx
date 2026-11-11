"use client";

import { useMemo, useState } from "react";
import { Chart } from "./Chart";
import { scales, type View } from "./Plot";
import { makeNormal, makeRng } from "./ml";

const V: View = { xmin: 0, xmax: 1, ymin: 0, ymax: 1, w: 320, h: 260 };
const BINS = 20;
const HV: View = { xmin: 0, xmax: 1, ymin: 0, ymax: 1, w: 320, h: 90 };

/** Linked views: choose a range of confidence on the histogram and the matching points light up in the scatter. */
export function BrushViz() {
  const [lo, setLo] = useState(0.9);
  const [hi, setHi] = useState(1);
  const pts = useMemo(() => {
    const r = makeRng(77), g = makeNormal(r);
    return Array.from({ length: 300 }, (_, i) => {
      const hard = i % 5 === 0;
      const conf = Math.min(0.999, Math.max(0.02, hard ? 0.55 + 0.18 * g() : 0.86 + 0.08 * g()));
      const len = Math.min(0.98, Math.max(0.02, hard ? 0.75 + 0.12 * g() : 0.35 + 0.15 * g()));
      const wrong = r() > conf;
      return { conf, len, wrong };
    });
  }, []);
  const a = Math.min(lo, hi), b = Math.max(lo, hi);
  const inR = (p: { conf: number }) => p.conf >= a && p.conf <= b;
  const counts = Array.from({ length: BINS }, (_, k) => pts.filter((p) => Math.min(BINS - 1, Math.floor(p.conf * BINS)) === k).length);
  const top = Math.max(...counts);
  const { X, Y } = scales(V);
  const h = scales(HV);
  const sel = pts.filter(inR);
  const errRate = sel.length ? sel.filter((p) => p.wrong).length / sel.length : 0;
  return (
    <figure className="viz">
      <div style={{ maxWidth: 400, margin: "0 auto" }}>
        <Chart v={V} label="Validation examples: input length against model confidence" xticks={[0, 0.5, 1]} yticks={[0, 0.5, 1]} xlabel="model confidence" ylabel="input length (scaled)">
          {pts.map((p, i) => <circle key={i} cx={X(p.conf)} cy={Y(p.len)} r={inR(p) ? 4 : 3} className={inR(p) ? (p.wrong ? "plot-hot" : "plot-point") : "brush-dim"} />)}
        </Chart>
        <Chart v={HV} label="Histogram of confidence, with the selected range shaded" xticks={[0, 0.5, 1]} yticks={[]}>
          <rect x={h.X(a)} y={0} width={h.X(b) - h.X(a)} height={HV.h} className="ml-r1" />
          {counts.map((c, k) => <rect key={k} x={h.X(k / BINS) + 1} y={h.Y(c / top)} width={HV.w / BINS - 2} height={HV.h - h.Y(c / top)} style={{ fill: "var(--text-faint)" }} />)}
        </Chart>
      </div>
      <div className="viz-sliders">
        <label>from {a.toFixed(2)}<input type="range" min={0} max={1} step={0.01} value={lo} onChange={(e) => setLo(Number(e.target.value))} /></label>
        <label>to {b.toFixed(2)}<input type="range" min={0} max={1} step={0.01} value={hi} onChange={(e) => setHi(Number(e.target.value))} /></label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        {sel.length} examples have confidence between {a.toFixed(2)} and {b.toFixed(2)}; {(errRate * 100).toFixed(0)}% of them are errors, shown in red. Selecting in one view highlights the same examples in the other, so you can see that the low-confidence examples are mostly the long inputs, something neither chart shows alone.
      </figcaption>
    </figure>
  );
}
