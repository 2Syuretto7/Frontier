"use client";

import { useState } from "react";
import { Axes, scales, type View } from "./Plot";

const V: View = { xmin: 0, xmax: 10, ymin: 0, ymax: 10, w: 400, h: 400 };
// Films described by two scores: action (x) and romance (y). Liked (true) or not by one viewer.
const D: { p: [number, number]; liked: boolean }[] = [
  { p: [1.5, 7.5], liked: true }, { p: [2.5, 8.5], liked: true }, { p: [2, 6], liked: true }, { p: [3.5, 7], liked: true },
  { p: [1, 9], liked: true }, { p: [4.2, 5.4], liked: true }, { p: [6, 6.8], liked: true },
  { p: [7, 2], liked: false }, { p: [8, 3.5], liked: false }, { p: [8.8, 1.5], liked: false }, { p: [6.5, 3.2], liked: false },
  { p: [7.8, 5], liked: false }, { p: [5.4, 1.6], liked: false }, { p: [3.6, 4.2], liked: false },
];

/** k nearest neighbours: to judge a new film, find the k most similar films already rated and take a vote. */
export function KnnViz() {
  const [qx, setQx] = useState(4.8), [qy, setQy] = useState(5);
  const [k, setK] = useState(3);
  const { X, Y } = scales(V);
  const sorted = D.map((d) => ({ ...d, dist: Math.hypot(d.p[0] - qx, d.p[1] - qy) })).sort((a, b) => a.dist - b.dist);
  const near = sorted.slice(0, k);
  const yes = near.filter((d) => d.liked).length;
  const radius = near[near.length - 1].dist;

  return (
    <figure className="viz">
      <Axes v={V} label={`New film at (${qx}, ${qy}); ${yes} of ${k} nearest were liked`}>
        <circle cx={X(qx)} cy={Y(qy)} r={(X(radius) - X(0))} className="viz-region" style={{ opacity: 0.25 }} />
        {near.map((d, i) => <line key={`l${i}`} x1={X(qx)} y1={Y(qy)} x2={X(d.p[0])} y2={Y(d.p[1])} className="plot-mirror" />)}
        {D.map((d, i) => d.liked
          ? <circle key={i} cx={X(d.p[0])} cy={Y(d.p[1])} r={6} className="plot-point" />
          : <rect key={i} x={X(d.p[0]) - 5.5} y={Y(d.p[1]) - 5.5} width={11} height={11} className="plot-hot" />)}
        <path d={`M${X(qx)} ${Y(qy) - 10} L${X(qx) + 9} ${Y(qy) + 7} L${X(qx) - 9} ${Y(qy) + 7} Z`} style={{ fill: "var(--text)" }} />
      </Axes>
      <div className="viz-sliders">
        <label><span>Action score <span className="mono">{qx}</span></span><input type="range" min={0.5} max={9.5} step={0.1} value={qx} onChange={(e) => setQx(Number(e.target.value))} /></label>
        <label><span>Romance score <span className="mono">{qy}</span></span><input type="range" min={0.5} max={9.5} step={0.1} value={qy} onChange={(e) => setQy(Number(e.target.value))} /></label>
      </div>
      <div className="viz-controls">
        {[1, 3, 5, 7].map((kk) => <button key={kk} type="button" className={k === kk ? "btn btn-primary" : "btn"} aria-pressed={k === kk} onClick={() => setK(kk)}>k = {kk}</button>)}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Circles are films the viewer liked; squares, films they did not. The triangle is a new film. Of its {k} nearest neighbours,{" "}
        {yes} {yes === 1 ? "was" : "were"} liked and {k - yes} {k - yes === 1 ? "was" : "were"} not, so the prediction is{" "}
        <strong>{yes * 2 > k ? "will like it" : "will not like it"}</strong>. Move the film near the border and change <span className="mono">k</span>.
      </figcaption>
    </figure>
  );
}
