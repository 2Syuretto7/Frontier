"use client";

import { useState } from "react";
import { makeNormal, makeRng } from "./ml";

const BASE = ["embed", "block1", "block2", "head"];
const WITH_NORM = ["embed", "norm", "block1", "block2", "head"];
const PER = 8;

/** A string hash, standing in for folding a layer's name into a key. */
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Initial weights per layer: from one generator shared in order, or from a key derived from the layer's name. */
export function initWeights(layers: string[], keyed: boolean) {
  const shared = makeNormal(makeRng(0));
  const out: Record<string, number[]> = {};
  for (const name of layers) {
    const draw = keyed ? makeNormal(makeRng(hash(`0:${name}`))) : shared;
    out[name] = Array.from({ length: PER }, () => draw());
  }
  return out;
}

export function changedLayers(keyed: boolean) {
  const a = initWeights(BASE, keyed), b = initWeights(WITH_NORM, keyed);
  return BASE.filter((n) => a[n].some((v, i) => v !== b[n][i]));
}

export function KeyedInitViz() {
  const [keyed, setKeyed] = useState(false);
  const [insert, setInsert] = useState(true);
  const layers = insert ? WITH_NORM : BASE;
  const w = initWeights(layers, keyed), ref = initWeights(BASE, keyed);
  const changed = changedLayers(keyed);
  const W = 320, X0 = 54, CW = (W - X0 - 8) / PER, RH = 24;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <button type="button" className="seg" aria-pressed={!keyed} onClick={() => setKeyed(false)}>one shared generator</button>
        <button type="button" className="seg" aria-pressed={keyed} onClick={() => setKeyed(true)}>a key per layer</button>
      </div>
      <div className="viz-controls" style={{ marginTop: 4, flexWrap: "wrap", gap: 8 }}>
        <button type="button" className="seg" aria-pressed={!insert} onClick={() => setInsert(false)}>original model</button>
        <button type="button" className="seg" aria-pressed={insert} onClick={() => setInsert(true)}>insert a norm layer</button>
      </div>
      <svg viewBox={`0 0 ${W} ${layers.length * RH + 6}`} style={{ width: "100%", maxWidth: 400, display: "block", margin: "0 auto" }} role="img" aria-label="Initial weights of each layer, marking those that changed when a layer was inserted">
        {layers.map((name, r) => (
          <g key={name}>
            <text x={X0 - 6} y={r * RH + 17} textAnchor="end" className="viz-label">{name}</text>
            {w[name].map((v, i) => {
              const diff = ref[name] !== undefined && ref[name][i] !== v;
              return (
                <rect key={i} x={X0 + i * CW + 1} y={r * RH + 4} width={CW - 2} height={RH - 6} rx={2}
                  fill={v >= 0 ? "var(--accent)" : "var(--text-muted)"} fillOpacity={Math.min(Math.abs(v) / 2, 1) * 0.8 + 0.1}
                  stroke={diff ? "var(--danger)" : "none"} strokeWidth={2} />
              );
            })}
          </g>
        ))}
      </svg>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }}>
        {insert ? `layers whose weights changed: ${changed.length ? changed.join(", ") : "none"}` : "the reference initialisation"}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Eight initial weights per layer, coloured by sign and size. With one shared generator, each layer draws whatever
        numbers come next, so inserting a norm layer early shifts the stream and every later layer gets different weights
        (outlined in red). Deriving each layer&apos;s key from a root key and the layer&apos;s name, as JAX programs do with
        explicit keys, makes each layer&apos;s numbers depend only on its own key, so the other layers are untouched.
      </figcaption>
    </figure>
  );
}
