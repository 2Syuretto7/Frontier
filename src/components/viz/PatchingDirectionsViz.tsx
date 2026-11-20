"use client";

import { useState } from "react";

/**
 * Three toy circuits over components c1, c2 and c3, each 1 on the clean input and 0 on the corrupted one. The metric depends on the
 * components as shown; c3 never affects it. In the serial circuit c2 is computed from c1, so patching c1 also changes c2.
 */
type Circuit = { name: string; serial: boolean; metric: (c: number[]) => number; grad: (c: number[]) => number[] };
const CIRCUITS: Circuit[] = [
  { name: "in series", serial: true, metric: (c) => c[1], grad: () => [1, 1, 0] },
  { name: "either suffices", serial: false, metric: (c) => 1 - (1 - c[0]) * (1 - c[1]), grad: (c) => [1 - c[1], 1 - c[0], 0] },
  { name: "both needed", serial: false, metric: (c) => c[0] * c[1], grad: (c) => [c[1], c[0], 0] },
  { name: "curved", serial: false, metric: (c) => ((c[0] + c[1]) / 2) ** 2, grad: (c) => [(c[0] + c[1]) / 2, (c[0] + c[1]) / 2, 0] },
];

/** Values of the three components when c1 (and anything computed from it) comes from x, with patches applied. */
function run(circ: Circuit, x: number, patch: Record<number, number>) {
  const c = [x, x, x];
  if (0 in patch) c[0] = patch[0];
  if (circ.serial) c[1] = c[0];
  if (1 in patch) c[1] = patch[1];
  if (2 in patch) c[2] = patch[2];
  return c;
}

export function patchingTable(circ: Circuit) {
  const clean = circ.metric(run(circ, 1, {})), corrupt = circ.metric(run(circ, 0, {}));
  const span = clean - corrupt;
  const g = circ.grad(run(circ, 0, {}));
  return [0, 1, 2].map((k) => ({
    denoise: (circ.metric(run(circ, 0, { [k]: 1 })) - corrupt) / span,
    noise: (clean - circ.metric(run(circ, 1, { [k]: 0 }))) / span,
    attrib: g[k] / span,
  }));
}

const COLS: { key: "denoise" | "noise" | "attrib"; name: string }[] = [
  { key: "denoise", name: "denoising" },
  { key: "noise", name: "noising" },
  { key: "attrib", name: "attribution" },
];

export function PatchingDirectionsViz() {
  const [k, setK] = useState(1);
  const rows = patchingTable(CIRCUITS[k]);
  const W = 330, H = 150, X0 = 44, CW = 92, RH = 36;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0 }}>
        <div className="segmented" role="group" aria-label="How c1 and c2 combine">
          {CIRCUITS.map((c, i) => <button key={c.name} type="button" className="seg" aria-pressed={k === i} onClick={() => setK(i)}>{c.name}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Effect of patching each component, by three methods">
        {COLS.map((c, j) => <text key={c.key} x={X0 + j * CW + CW / 2} y={14} textAnchor="middle" className="viz-label">{c.name}</text>)}
        {rows.map((r, i) => (
          <g key={i}>
            <text x={X0 - 8} y={24 + i * RH + 20} textAnchor="end" className="viz-label">c{i + 1}</text>
            {COLS.map((c, j) => {
              const v = r[c.key];
              return (
                <g key={c.key}>
                  <rect x={X0 + j * CW + 4} y={24 + i * RH + 4} width={CW - 8} height={RH - 8} style={{ fill: "var(--accent)" }} opacity={0.12 + 0.88 * Math.min(1, Math.abs(v))} />
                  <text x={X0 + j * CW + CW / 2} y={24 + i * RH + 22} textAnchor="middle" className="viz-label" style={{ fill: Math.abs(v) > 0.5 ? "var(--bg-subtle)" : "var(--text)" }}>{v.toFixed(2)}</text>
                </g>
              );
            })}
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {["metric = c2, where c2 is computed from c1", "metric = 1 − (1 − c1)(1 − c2)", "metric = c1 × c2", "metric = ((c1 + c2) / 2)²"][k]}; c3 is unused
      </div>
      <figcaption className="viz-caption">
        Each component is 1 on the clean input and 0 on the corrupted one, and every score is a fraction of the clean-minus-corrupted
        gap. Denoising patches one clean activation into the corrupted run and asks whether it is sufficient; noising patches one
        corrupted activation into the clean run and asks whether it is necessary. When two components are redundant, noising misses
        both; when both are needed, denoising misses both. Attribution patching, a gradient estimate of denoising taken at the corrupted
        run, matches it when the metric is linear in each component, and can be badly off when the metric curves.
      </figcaption>
    </figure>
  );
}
