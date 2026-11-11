"use client";

import { useMemo, useState } from "react";
import { Chart } from "./Chart";
import { scales, type View } from "./Plot";
import { makeNormal, makeRng } from "./ml";

const V: View = { xmin: -3, xmax: 3, ymin: -3, ymax: 3, w: 320, h: 320 };
const A: View = { xmin: 0, xmax: 180, ymin: 0, ymax: 3, w: 440, h: 150 };

/** Correlated two-dimensional data, centred. */
function makeData() {
  const r = makeRng(17), g = makeNormal(r);
  const raw = Array.from({ length: 60 }, () => {
    const a = 1.4 * g(), b = 0.45 * g();
    const c = Math.cos(Math.PI / 6), s = Math.sin(Math.PI / 6);
    return { x: c * a - s * b, y: s * a + c * b };
  });
  const mx = raw.reduce((t, p) => t + p.x, 0) / raw.length, my = raw.reduce((t, p) => t + p.y, 0) / raw.length;
  return raw.map((p) => ({ x: p.x - mx, y: p.y - my }));
}

/** Choosing a direction to project onto, and the variance each direction keeps. */
export function PcaViz() {
  const [deg, setDeg] = useState(90);
  const pts = useMemo(makeData, []);
  const n = pts.length;
  const sxx = pts.reduce((t, p) => t + p.x * p.x, 0) / n, syy = pts.reduce((t, p) => t + p.y * p.y, 0) / n, sxy = pts.reduce((t, p) => t + p.x * p.y, 0) / n;
  const varAt = (d: number) => {
    const c = Math.cos((d * Math.PI) / 180), s = Math.sin((d * Math.PI) / 180);
    return c * c * sxx + 2 * c * s * sxy + s * s * syy;
  };
  const tr = sxx + syy, det = sxx * syy - sxy * sxy;
  const l1 = tr / 2 + Math.sqrt((tr * tr) / 4 - det), l2 = tr - l1;
  const best = ((((Math.atan2(2 * sxy, sxx - syy) / 2) * 180) / Math.PI) + 180) % 180;
  const th = (deg * Math.PI) / 180, u = { x: Math.cos(th), y: Math.sin(th) };
  const { X, Y } = scales(V);
  const a = scales(A);
  const v = varAt(deg);
  const curve = Array.from({ length: 91 }, (_, i) => `${i ? "L" : "M"}${a.X(i * 2).toFixed(1)} ${a.Y(varAt(i * 2)).toFixed(1)}`).join(" ");
  return (
    <figure className="viz">
      <div style={{ maxWidth: 380, margin: "0 auto" }}>
        <Chart v={V} label={`Data projected onto the direction at ${deg} degrees`} xticks={[-2, 0, 2]} yticks={[-2, 0, 2]}>
          <line x1={X(-4 * u.x)} y1={Y(-4 * u.y)} x2={X(4 * u.x)} y2={Y(4 * u.y)} className="plot-curve" />
          {pts.map((p, i) => {
            const t = p.x * u.x + p.y * u.y;
            return <line key={`l${i}`} x1={X(p.x)} y1={Y(p.y)} x2={X(t * u.x)} y2={Y(t * u.y)} className="plot-mirror" />;
          })}
          {pts.map((p, i) => {
            const t = p.x * u.x + p.y * u.y;
            return <circle key={`p${i}`} cx={X(t * u.x)} cy={Y(t * u.y)} r={3} className="plot-hot" />;
          })}
          {pts.map((p, i) => <circle key={i} cx={X(p.x)} cy={Y(p.y)} r={4} className="ml-c0" />)}
        </Chart>
      </div>
      <Chart v={A} label="Variance of the projections against the direction" xticks={[0, 45, 90, 135, 180]} xfmt={(x) => `${x}°`} yticks={[0, 1, 2, 3]} xlabel="direction" ylabel="variance">
        <path d={curve} className="plot-curve" />
        <line x1={a.X(deg)} x2={a.X(deg)} y1={0} y2={A.h} className="plot-mirror" />
        <circle cx={a.X(deg)} cy={a.Y(v)} r={5} className="plot-hot" />
      </Chart>
      <div className="ml-stats">
        <div className="ml-stat"><b>{v.toFixed(2)}</b><span>variance kept by this direction</span></div>
        <div className="ml-stat"><b>{((100 * v) / tr).toFixed(0)}%</b><span>share of the total variance {tr.toFixed(2)}</span></div>
        <div className="ml-stat"><b>{best.toFixed(0)}°</b><span>first principal direction</span></div>
      </div>
      <div className="viz-sliders">
        <label>
          direction = {deg}°
          <input type="range" min={0} max={180} value={deg} onChange={(e) => setDeg(Number(e.target.value))} />
        </label>
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each point drops onto the line, and the red dots are what a one-number summary would keep.{" "}
        {Math.abs(deg - best) <= 3 || Math.abs(deg - best) >= 177
          ? `This is the first principal direction: it keeps the most variance, ${l1.toFixed(2)} of ${tr.toFixed(2)}, and the lost dashes are as short as they can be.`
          : `The best direction keeps ${l1.toFixed(2)}; the worst, at right angles to it, keeps only ${l2.toFixed(2)}.`}
      </figcaption>
    </figure>
  );
}
