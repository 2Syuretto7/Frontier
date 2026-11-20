"use client";

import { useState } from "react";
import { rand } from "./RandomWalkMcViz";

const EPS = [0.0005, 0.002, 0.005, 0.02];
const CENTRES: [number, number, number][] = [[-0.6, 0.45, 0.05], [0.5, 0.5, 0.12], [0.0, -0.5, 0.22]];   // x, y, spread

/** Points on the unit sphere's front, from three topic clusters; tight clusters hold many near-paraphrases. */
export function points() {
  const rng = rand(53);
  const normal = () => Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng());
  const out: { v: [number, number, number]; c: number }[] = [];
  CENTRES.forEach(([cx, cy, s], c) => {
    for (let i = 0; i < 30; i++) {
      const x = cx + s * normal(), y = cy + s * normal(), z = 0.8;
      const n = Math.hypot(x, y, z);
      out.push({ v: [x / n, y / n, z / n], c });
    }
  });
  return out;
}

/** SemDeDup within each cluster: least typical points first, dropping any within cosine 1 - eps of a kept point. */
export function semdedup(eps: number) {
  const pts = points();
  const kept = new Array(pts.length).fill(false);
  const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  for (let c = 0; c < CENTRES.length; c++) {
    const idx = pts.map((_, i) => i).filter((i) => pts[i].c === c);
    const m = [0, 1, 2].map((d) => idx.reduce((a, i) => a + pts[i].v[d], 0));
    const mn = Math.hypot(...m);
    const cen = m.map((v) => v / mn);
    idx.sort((a, b) => dot(pts[a].v, cen) - dot(pts[b].v, cen));
    const ks: number[] = [];
    for (const i of idx) {
      if (ks.every((j) => dot(pts[i].v, pts[j].v) <= 1 - eps)) { ks.push(i); kept[i] = true; }
    }
  }
  return { pts, kept };
}

export function SemDedupViz() {
  const [ei, setEi] = useState(1);
  const { pts, kept } = semdedup(EPS[ei]);
  const W = 330, H = 200, S = 120;
  const sx = (v: number) => W / 2 + (v / 0.75) * S, sy = (v: number) => H / 2 - (v / 0.75) * S * 0.75;
  const perCluster = CENTRES.map((_, c) => pts.filter((p, i) => p.c === c && !kept[i]).length);
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <span className="viz-label">ε</span>
        <div className="segmented" role="group" aria-label="Duplicate threshold">
          {EPS.map((v, j) => <button key={v} type="button" className="seg" aria-pressed={ei === j} onClick={() => setEi(j)}>{v}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Embedded documents kept and removed by semantic deduplication">
        {pts.map((p, i) => (
          <circle key={i} cx={sx(p.v[0])} cy={sy(p.v[1])} r={kept[i] ? 3.4 : 2.6}
            style={{ fill: kept[i] ? "var(--accent)" : "none", stroke: kept[i] ? "none" : "var(--text-muted)" }} />
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        removed {pts.length - kept.filter(Boolean).length} of {pts.length}: {perCluster.join(", ")} from the tight, medium and loose clusters
      </div>
      <figcaption className="viz-caption">
        Embeddings of documents from three topics, projected to the page; filled points are kept and hollow ones removed as semantic
        duplicates of a kept point, with cosine similarity above 1 − ε. The tight cluster, upper left, stands for many paraphrases of
        the same content and loses most of its points first; the loose cluster keeps nearly all of its points until ε is large.
      </figcaption>
    </figure>
  );
}
