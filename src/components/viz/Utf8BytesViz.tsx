"use client";

import { useState } from "react";

const SAMPLES: [string, string][] = [["English", "data"], ["French", "déjà"], ["Hindi", "डेटा"], ["Chinese", "数据"], ["emoji", "🙂👍"]];

/** UTF-8 bytes of each character of a string, as [character, code point, bytes]. */
export function encode(s: string): [string, number, number[]][] {
  return Array.from(s).map((ch) => {
    const cp = ch.codePointAt(0)!;
    return [ch, cp, Array.from(new TextEncoder().encode(ch))];
  });
}

export function Utf8BytesViz() {
  const [si, setSi] = useState(2);
  const chars = encode(SAMPLES[si][1]);
  const nBytes = chars.reduce((a, c) => a + c[2].length, 0);
  const BW = 34, BH = 22, GAP = 8, W = 330;
  let xPos = 4;
  const layout = chars.map((c) => { const x0 = xPos; xPos += c[2].length * BW + GAP; return x0; });
  const scale = Math.min(1, (W - 8) / Math.max(xPos - GAP, 1));
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap" }}>
        <div className="segmented" role="group" aria-label="Sample text">
          {SAMPLES.map(([n], j) => <button key={n} type="button" className="seg" aria-pressed={si === j} onClick={() => setSi(j)}>{n}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${86 * scale}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="UTF-8 bytes of each character">
        <g transform={`scale(${scale})`}>
          {chars.map(([ch, cp, bs], i) => (
            <g key={i}>
              <text x={layout[i] + (bs.length * BW) / 2} y={16} textAnchor="middle" style={{ fontSize: 15, fill: "var(--text)" }}>{ch}</text>
              <text x={layout[i] + (bs.length * BW) / 2} y={30} textAnchor="middle" className="viz-label">{`U+${cp.toString(16).toUpperCase().padStart(4, "0")}`}</text>
              {bs.map((b, j) => (
                <g key={j}>
                  <rect x={layout[i] + j * BW} y={38} width={BW - 3} height={BH} style={{ fill: j === 0 ? "var(--accent)" : "var(--text-muted)" }} opacity={j === 0 ? 0.8 : 0.35} />
                  <text x={layout[i] + j * BW + (BW - 3) / 2} y={53} textAnchor="middle" className="mono" style={{ fontSize: 11, fill: "var(--text)" }}>{b.toString(16).toUpperCase().padStart(2, "0")}</text>
                  <text x={layout[i] + j * BW + (BW - 3) / 2} y={74} textAnchor="middle" className="mono" style={{ fontSize: 8, fill: "var(--text-muted)" }}>{b.toString(2).padStart(8, "0").slice(0, j === 0 ? bs.length + 1 : 2)}…</text>
                </g>
              ))}
            </g>
          ))}
        </g>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        {chars.length} code points, {nBytes} bytes: {(nBytes / chars.length).toFixed(1)} bytes per code point
      </div>
      <figcaption className="viz-caption">
        Each character&apos;s code point and its UTF-8 bytes in hexadecimal. The first byte, in colour, starts with as many 1 bits as the
        character has bytes (or a 0 for one byte); every following byte starts with 10. Latin letters take one byte, accented ones two,
        Devanagari and Chinese three, and emoji four. Hindi vowel signs are code points of their own, drawn on a placeholder circle.
      </figcaption>
    </figure>
  );
}
