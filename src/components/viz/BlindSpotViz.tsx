"use client";

import { useState } from "react";

const R = 11, Cn = 17, TR = 9, TC = 8, LS = [1, 2, 3, 5, 8];

/** Mask offsets of a 3x3 masked convolution: type A excludes the centre, type B includes it. */
const offsets = (kind: "A" | "B") => [[-1, -1], [-1, 0], [-1, 1], [0, -1], ...(kind === "B" ? [[0, 0]] : [])];

/** Input pixels that can influence the output at (r, c) after a stack of masked convolutions (A first, then B). */
export function pixelcnnField(r: number, c: number, layers: number) {
  let seen = new Set([`${r},${c}`]);
  const kinds: ("A" | "B")[] = [...Array(layers - 1).fill("B"), "A"];
  for (const k of kinds) {
    const next = new Set<string>();
    for (const key of seen) { const [p, q] = key.split(",").map(Number); for (const [dr, dc] of offsets(k)) next.add(`${p + dr},${q + dc}`); }
    seen = next;
  }
  return seen;
}

/** Idealised field of the gated PixelCNN: a vertical stack covering a cone of rows above and a horizontal stack covering the row to the left. */
export function gatedField(r: number, c: number, layers: number) {
  const s = new Set<string>();
  for (let p = r - layers; p < r; p++) for (let q = c - layers; q <= c + layers; q++) s.add(`${p},${q}`);
  for (let q = c - layers; q < c; q++) s.add(`${r},${q}`);
  return s;
}

export function BlindSpotViz() {
  const [li, setLi] = useState(3), [gated, setGated] = useState(false);
  const L = LS[li];
  const field = gated ? gatedField(TR, TC, L) : pixelcnnField(TR, TC, L);
  const inGrid = (k: string) => { const [p, q] = k.split(",").map(Number); return p >= 0 && p < R && q >= 0 && q < Cn; };
  const seen = [...field].filter(inGrid).length;
  let win = 0;
  for (let p = TR - L; p <= TR; p++) for (let q = TC - L; q <= TC + L; q++) if ((p < TR || q < TC) && p >= 0 && q >= 0 && q < Cn) win++;
  const missed = [...Array(R * Cn).keys()].filter((i) => {
    const p = Math.floor(i / Cn), q = i % Cn;
    return p >= TR - L && Math.abs(q - TC) <= L && (p < TR || (p === TR && q < TC)) && !field.has(`${p},${q}`);
  }).length;
  const S = 18, W = Cn * S, H = R * S;
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <span className="viz-label">layers</span>
        <div className="segmented" role="group" aria-label="Number of layers">
          {LS.map((l, i) => <button key={l} type="button" className="seg" aria-pressed={li === i} onClick={() => setLi(i)}>{l}</button>)}
        </div>
        <div className="segmented" role="group" aria-label="Architecture">
          <button type="button" className="seg" aria-pressed={!gated} onClick={() => setGated(false)}>PixelCNN</button>
          <button type="button" className="seg" aria-pressed={gated} onClick={() => setGated(true)}>two stacks</button>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 420, display: "block", margin: "0 auto" }} role="img" aria-label="Receptive field of a pixel">
        {Array.from({ length: R * Cn }, (_, i) => {
          const p = Math.floor(i / Cn), q = i % Cn, key = `${p},${q}`;
          const earlier = p < TR || (p === TR && q < TC);
          const inWin = earlier && p >= TR - L && Math.abs(q - TC) <= L;
          const target = p === TR && q === TC, sn = field.has(key);
          const fill = target || sn ? "var(--accent)" : inWin ? "var(--danger)" : earlier ? "var(--bg-subtle)" : "var(--surface)";
          return <rect key={i} x={q * S + 1} y={p * S + 1} width={S - 2} height={S - 2} fill={fill} fillOpacity={target ? 1 : sn ? 0.35 : inWin ? 0.45 : 1} stroke="var(--border)" />;
        })}
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "center", fontSize: 13 }}>
        <span><span style={{ color: "var(--accent)" }}>■</span> pixel being predicted</span>
        <span><span style={{ color: "var(--accent)", opacity: 0.35 }}>■</span> seen</span>
        <span><span style={{ color: "var(--danger)", opacity: 0.45 }}>■</span> earlier but unseen</span>
      </div>
      <div className="mono" style={{ fontSize: 13, margin: "6px 0" }} aria-live="polite">
        {`sees ${seen} earlier pixels; ${missed} earlier pixels within reach are hidden (window holds ${win})`}
      </div>
      <figcaption className="viz-caption">
        Stacking 3 by 3 masked convolutions grows the region a pixel can see, but never into a wedge above and to the right:
        the only kernel position that reaches right also reaches up, so a pixel b columns to the right is visible only if it is
        at least b rows above. The hidden wedge holds 10 pixels after 5 layers and 28 after 8. The gated PixelCNN splits the
        network into a vertical stack that sees whole rows above and a horizontal stack that sees the current row to the left,
        removing the blind spot.
      </figcaption>
    </figure>
  );
}
