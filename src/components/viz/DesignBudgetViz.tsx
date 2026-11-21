"use client";

import { useState } from "react";

const VOCAB = 32768;
const CTX = 4096;

function stats(d: number, layers: number, kv: number) {
  const heads = d / 64;
  const ffn = Math.round((8 * d) / 3 / 128) * 128;
  const attn = 2 * d * d + 2 * d * kv * 64;
  const body = layers * (attn + 3 * d * ffn + 2 * d) + d;
  const embed = VOCAB * d;
  const total = body + embed;
  const flops = 3 * (2 * body + 2 * VOCAB * d + 4 * layers * CTX * d);
  const kvMiB = (2 * layers * kv * 64 * CTX * 2) / 2 ** 20;
  const trainGB = (16 * total) / 1e9;
  return { heads, ffn, total, flops, kvMiB, trainGB };
}

export function DesignBudgetViz() {
  const [d, setD] = useState(768);
  const [layers, setLayers] = useState(12);
  const [kv, setKv] = useState(4);
  const kvMax = 2 ** Math.floor(Math.log2(d / 64));
  const k = Math.min(kv, kvMax);
  const s = stats(d, layers, k);
  const bars: [string, number, number, string][] = [
    ["training state (GB)", s.trainGB, 24, "one 24 GB GPU"],
    ["KV cache per 4k sequence (MiB)", s.kvMiB, 512, "512 MiB"],
  ];
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 12 }}
      >
        <label className="viz-label">
          width d: {d}{" "}
          <input
            type="range"
            min={512}
            max={2560}
            step={128}
            value={d}
            onChange={(e) => setD(+e.target.value)}
          />
        </label>
        <label className="viz-label">
          layers: {layers}{" "}
          <input
            type="range"
            min={4}
            max={40}
            step={2}
            value={layers}
            onChange={(e) => setLayers(+e.target.value)}
          />
        </label>
        <label className="viz-label">
          KV heads: {k}{" "}
          <input
            type="range"
            min={0}
            max={Math.log2(kvMax)}
            step={1}
            value={Math.log2(k)}
            onChange={(e) => setKv(2 ** +e.target.value)}
          />
        </label>
      </div>
      <p className="viz-label" style={{ textAlign: "center" }}>
        {s.heads} query heads of width 64, FFN width {s.ffn};{" "}
        {(s.total / 1e6).toFixed(1)}M parameters; {(s.flops / 1e9).toFixed(2)}{" "}
        GFLOP per training token at context {CTX}
      </p>
      {bars.map(([label, v, cap, capLabel]) => (
        <div key={label} style={{ margin: "10px 0" }}>
          <div className="viz-label">
            {label}: {v.toFixed(1)} (limit {capLabel})
          </div>
          <div
            style={{
              height: 14,
              background: "var(--bg-subtle)",
              border: "1px solid var(--border)",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${Math.min(100, (100 * v) / cap)}%`,
                height: "100%",
                background: v > cap ? "var(--danger)" : "var(--accent)",
              }}
            />
          </div>
        </div>
      ))}
      <figcaption className="viz-caption">
        A design document fixes the shape of the model before any code runs.
        Width and depth set the parameter count and the training cost per token;
        the number of key-value heads sets the cache each sequence needs when
        serving. Training state is counted at 16 bytes per parameter, for bf16
        weights and gradients with fp32 master weights and Adam moments. Bars
        turn red when a design breaks its limit.
      </figcaption>
    </figure>
  );
}
