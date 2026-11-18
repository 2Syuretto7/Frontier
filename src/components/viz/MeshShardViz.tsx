"use client";

import { useState } from "react";

/** A mesh of 2 × 4 devices with axes data and model, and an 8 × 8 array. */
export const MESH: Record<string, number> = { data: 2, model: 4 };
const N = 8;
type Entry = null | string | string[];

const SPECS: { label: string; spec: [Entry, Entry] }[] = [
  { label: "P()", spec: [null, null] },
  { label: "P('data')", spec: ["data", null] },
  { label: "P(None, 'model')", spec: [null, "model"] },
  { label: "P('data', 'model')", spec: ["data", "model"] },
  { label: "P(('data', 'model'))", spec: [["data", "model"], null] },
];

const axes = (e: Entry) => (e === null ? [] : Array.isArray(e) ? e : [e]);

/** Row and column ranges held by the device at mesh coordinates (d, m). */
export function block(spec: [Entry, Entry], d: number, m: number) {
  const c: Record<string, number> = { data: d, model: m };
  return spec.map((e) => {
    const k = axes(e).reduce((p, a) => p * MESH[a], 1), size = N / k;
    const i = axes(e).reduce((p, a) => p * MESH[a] + c[a], 0);
    return [i * size, (i + 1) * size];
  });
}

export function copies(spec: [Entry, Entry]) {
  const used = new Set(spec.flatMap(axes));
  return Object.keys(MESH).filter((a) => !used.has(a)).reduce((p, a) => p * MESH[a], 1);
}

export function MeshShardViz() {
  const [s, setS] = useState(3);
  const [dev, setDev] = useState<[number, number]>([1, 2]);
  const spec = SPECS[s].spec;
  const [[r0, r1], [c0, c1]] = block(spec, dev[0], dev[1]);
  const CS = 22, X0 = 4;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {SPECS.map((x, i) => (
          <button key={x.label} type="button" className="seg mono" aria-pressed={s === i} onClick={() => setS(i)}>{x.label}</button>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center", alignItems: "center", marginTop: 8 }}>
        <div>
          <div className="viz-label" style={{ marginBottom: 4 }}>mesh: data × model</div>
          {[0, 1].map((d) => (
            <div key={d} style={{ display: "flex", gap: 4, marginBottom: 4 }}>
              {[0, 1, 2, 3].map((m) => (
                <button key={m} type="button" className="seg mono" aria-pressed={dev[0] === d && dev[1] === m} onClick={() => setDev([d, m])}>{`${d},${m}`}</button>
              ))}
            </div>
          ))}
        </div>
        <svg viewBox={`0 0 ${N * CS + 2 * X0} ${N * CS + 2 * X0}`} style={{ width: 190, maxWidth: "100%" }} role="img" aria-label="The array, with the block held by the selected device highlighted">
          {Array.from({ length: N * N }, (_, k) => {
            const r = Math.floor(k / N), c = k % N, mine = r >= r0 && r < r1 && c >= c0 && c < c1;
            return <rect key={k} x={X0 + c * CS + 1} y={X0 + r * CS + 1} width={CS - 2} height={CS - 2} rx={2} fill={mine ? "var(--accent)" : "var(--text-muted)"} fillOpacity={mine ? 0.85 : 0.18} />;
          })}
        </svg>
      </div>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`device (${dev[0]},${dev[1]}) holds rows ${r0}:${r1}, columns ${c0}:${c1}: ${(r1 - r0) * (c1 - c0)} of 64 elements; each element is stored on ${copies(spec)} device${copies(spec) > 1 ? "s" : ""}`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Eight devices arranged as a 2 × 4 mesh with named axes data and model, and an 8 × 8 array laid out by a partition
        spec that names a mesh axis, several axes, or None for each array dimension. Choose a device to see its block. A
        dimension split over an axis is divided among the devices along it; mesh axes the spec does not mention hold
        copies, so P() replicates the array on all eight and P(&apos;data&apos;, &apos;model&apos;) stores each element
        exactly once.
      </figcaption>
    </figure>
  );
}
