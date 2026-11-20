"use client";

import { useState } from "react";

type Step = { id: "base" | "cuda" | "apt" | "reqs" | "pip" | "code"; label: string; mb: number };
const STEPS: Record<Step["id"], Step> = {
  base: { id: "base", label: "FROM ubuntu", mb: 80 },
  cuda: { id: "cuda", label: "install CUDA libraries", mb: 3200 },
  apt: { id: "apt", label: "apt-get system packages", mb: 300 },
  reqs: { id: "reqs", label: "COPY requirements.txt", mb: 0.01 },
  pip: { id: "pip", label: "pip install requirements", mb: 2600 },
  code: { id: "code", label: "COPY training code", mb: 5 },
};
const ORDERS: { name: string; ids: Step["id"][] }[] = [
  { name: "dependencies first", ids: ["base", "cuda", "apt", "reqs", "pip", "code"] },
  { name: "code first", ids: ["base", "code", "cuda", "apt", "reqs", "pip"] },
];
const CHANGES = [{ name: "training code", id: "code" }, { name: "requirements", id: "reqs" }] as const;

/** Layers rebuilt (and their size in MB) when one input changes: every layer from the first changed step onwards. */
export function rebuild(order: number, change: number) {
  const ids = ORDERS[order].ids, first = ids.indexOf(CHANGES[change].id);
  const rebuilt = ids.map((_, i) => i >= first);
  return { ids, rebuilt, mb: ids.reduce((a, id, i) => a + (rebuilt[i] ? STEPS[id].mb : 0), 0) };
}

export function ContainerLayersViz() {
  const [oi, setOi] = useState(0), [ci, setCi] = useState(0);
  const { ids, rebuilt, mb } = rebuild(oi, ci);
  const W = 330, rowH = 24, H = 8 + ids.length * rowH, X0 = 4, BX = 168, BW = W - BX - 52, MAXMB = 3200;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">Dockerfile</span>
        <div className="segmented" role="group" aria-label="Order of steps">
          {ORDERS.map((o, i) => <button key={o.name} type="button" className="seg" aria-pressed={oi === i} onClick={() => setOi(i)}>{o.name}</button>)}
        </div>
        <span className="viz-label">edit</span>
        <div className="segmented" role="group" aria-label="Which input changes">
          {CHANGES.map((c, i) => <button key={c.name} type="button" className="seg" aria-pressed={ci === i} onClick={() => setCi(i)}>{c.name}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 440, display: "block", margin: "0 auto" }} role="img" aria-label="Image layers from bottom to top, rebuilt layers highlighted">
        {ids.map((id, i) => {
          const y = H - (i + 1) * rowH, s = STEPS[id], w = Math.max(2, (Math.log10(1 + s.mb) / Math.log10(1 + MAXMB)) * BW);
          return (
            <g key={id}>
              <rect x={X0} y={y + 2} width={BX - 10} height={rowH - 4} rx={3} fill={rebuilt[i] ? "var(--danger-soft)" : "var(--success-soft)"} stroke={rebuilt[i] ? "var(--danger)" : "var(--success)"} />
              <text x={X0 + 6} y={y + 16} className="viz-label" style={{ fill: "var(--text)" }}>{s.label}</text>
              <rect x={BX} y={y + 6} width={w} height={rowH - 12} fill={rebuilt[i] ? "var(--danger)" : "var(--success)"} />
              <text x={BX + w + 4} y={y + 16} className="viz-label">{s.mb >= 1000 ? `${(s.mb / 1000).toFixed(1)} GB` : s.mb >= 1 ? `${s.mb} MB` : "< 1 MB"}</text>
            </g>
          );
        })}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`${rebuilt.filter(Boolean).length} of ${ids.length} layers rebuilt; ${mb >= 1000 ? `${(mb / 1000).toFixed(1)} GB` : `${mb.toFixed(0)} MB`} to push to every node`}
      </div>
      <figcaption className="viz-caption">
        An image is a stack of layers, one per build step, bottom to top. A layer can be reused from the cache only if its step
        and every step below it are unchanged, so an edit rebuilds its own layer and everything above it (red). With the
        dependencies installed first, editing the training code rebuilds one 5 MB layer; copying the code first means the
        same edit reinstalls CUDA and every Python package, 6.1 GB that every node in the cluster must then download again.
      </figcaption>
    </figure>
  );
}
