"use client";

import { useState } from "react";

type Layer = ["conv", number, number, number, number] | ["pool", number, number] | ["fc", number];

const VGG_BLOCK = (o: number, n: number): Layer[] => [...Array.from({ length: n }, (): Layer => ["conv", o, 3, 1, 1]), ["pool", 2, 2]];
const ARCHS: Record<string, { input: [number, number, number]; spec: Layer[] }> = {
  "LeNet-5": { input: [1, 32, 32], spec: [["conv", 6, 5, 1, 0], ["pool", 2, 2], ["conv", 16, 5, 1, 0], ["pool", 2, 2], ["fc", 120], ["fc", 84], ["fc", 10]] },
  AlexNet: {
    input: [3, 227, 227],
    spec: [["conv", 96, 11, 4, 0], ["pool", 3, 2], ["conv", 256, 5, 1, 2], ["pool", 3, 2], ["conv", 384, 3, 1, 1], ["conv", 384, 3, 1, 1], ["conv", 256, 3, 1, 1], ["pool", 3, 2], ["fc", 4096], ["fc", 4096], ["fc", 1000]],
  },
  "VGG-16": {
    input: [3, 224, 224],
    spec: [...VGG_BLOCK(64, 2), ...VGG_BLOCK(128, 2), ...VGG_BLOCK(256, 3), ...VGG_BLOCK(512, 3), ...VGG_BLOCK(512, 3), ["fc", 4096], ["fc", 4096], ["fc", 1000]],
  },
};

/** Output shape, parameters and multiply-accumulates of each layer. */
export function layerStats(spec: Layer[], input: [number, number, number]) {
  let [C, H, W] = input;
  return spec.map((l) => {
    let params = 0, macs = 0;
    if (l[0] === "conv") {
      const [, O, k, s, p] = l;
      H = Math.floor((H + 2 * p - k) / s) + 1; W = Math.floor((W + 2 * p - k) / s) + 1;
      params = O * (C * k * k + 1); macs = O * H * W * C * k * k; C = O;
    } else if (l[0] === "pool") {
      const [, k, s] = l;
      H = Math.floor((H - k) / s) + 1; W = Math.floor((W - k) / s) + 1;
    } else {
      const nIn = C * H * W, O = l[1];
      params = O * (nIn + 1); macs = O * nIn; C = O; H = 1; W = 1;
    }
    return { kind: l[0], shape: [C, H, W], params, macs };
  });
}

const fmt = (v: number) => (v >= 1e9 ? `${(v / 1e9).toFixed(2)}G` : v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(1)}k` : `${v}`);

export function ArchBudgetViz() {
  const [arch, setArch] = useState("AlexNet");
  const { input, spec } = ARCHS[arch];
  const rows = layerStats(spec, input).filter((r) => r.kind !== "pool");
  const P = rows.reduce((a, r) => a + r.params, 0), Mc = rows.reduce((a, r) => a + r.macs, 0);
  const fcP = rows.filter((r) => r.kind === "fc").reduce((a, r) => a + r.params, 0);
  const convM = rows.filter((r) => r.kind === "conv").reduce((a, r) => a + r.macs, 0);
  const RH = 14, W = 330, LX = 70, BW = (W - LX - 8) / 2, H = rows.length * RH + 20;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {Object.keys(ARCHS).map((a) => (
          <button key={a} type="button" className="seg" aria-pressed={a === arch} onClick={() => setArch(a)}>{a}</button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Share of parameters and of computation in each layer">
        <text x={LX} y={11} className="viz-label">parameters</text>
        <text x={LX + BW + 4} y={11} className="viz-label">multiply-adds</text>
        {rows.map((r, i) => {
          const y = 16 + i * RH;
          return (
            <g key={i}>
              <text x={LX - 4} y={y + 10} textAnchor="end" className="viz-label">{r.kind} {r.shape[0]}</text>
              <rect x={LX} y={y + 2} width={Math.max(0.5, (r.params / P) * (BW - 4))} height={RH - 4} fill="var(--accent)" />
              <rect x={LX + BW + 4} y={y + 2} width={Math.max(0.5, (r.macs / Mc) * (BW - 4))} height={RH - 4} fill="var(--text-muted)" />
            </g>
          );
        })}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {`${fmt(P)} parameters, ${(100 * fcP / P).toFixed(0)}% in fully connected layers; ${fmt(Mc)} multiply-adds, ${(100 * convM / Mc).toFixed(0)}% in convolutions`}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Each row is a layer, with bar lengths showing its share of the network&apos;s parameters (colour) and of the
        multiply-adds in one forward pass (grey). In the classic designs the fully connected head holds most of the weights,
        while the convolutions, applied at every position, do most of the arithmetic. Later architectures replaced the big
        head with global average pooling for exactly this reason.
      </figcaption>
    </figure>
  );
}
