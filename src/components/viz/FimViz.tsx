"use client";

import { useState } from "react";

const DOC = `def mean(xs):
    total = 0
    for x in xs:
        total += x
    return total / len(xs)
`;

type Piece = { text: string; kind: "sentinel" | "prefix" | "middle" | "suffix" };

/** Reorder a document for fill-in-the-middle training in prefix-suffix-middle or suffix-prefix-middle order. */
export function fimPieces(doc: string, i: number, j: number, mode: "PSM" | "SPM"): Piece[] {
  const prefix = doc.slice(0, i), middle = doc.slice(i, j), suffix = doc.slice(j);
  if (mode === "PSM")
    return [
      { text: "<PRE>", kind: "sentinel" }, { text: prefix, kind: "prefix" },
      { text: "<SUF>", kind: "sentinel" }, { text: suffix, kind: "suffix" },
      { text: "<MID>", kind: "sentinel" }, { text: middle, kind: "middle" },
    ];
  return [
    { text: "<PRE><SUF>", kind: "sentinel" }, { text: suffix, kind: "suffix" },
    { text: "<MID>", kind: "sentinel" }, { text: prefix, kind: "prefix" }, { text: middle, kind: "middle" },
  ];
}

const COL: Record<Piece["kind"], string> = {
  sentinel: "var(--text-muted)",
  prefix: "var(--code-string)",
  middle: "var(--accent)",
  suffix: "var(--code-function)",
};

function Render({ pieces }: { pieces: Piece[] }) {
  return (
    <pre className="mono" style={{ fontSize: 12, lineHeight: 1.45, margin: 0, padding: 8, whiteSpace: "pre-wrap", wordBreak: "break-all", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, minHeight: 120 }}>
      {pieces.map((p, k) => (
        <span key={k} style={{ color: COL[p.kind], fontWeight: p.kind === "middle" ? 700 : 400, textDecoration: p.kind === "middle" ? "underline" : "none" }}>{p.text}</span>
      ))}
    </pre>
  );
}

export function FimViz() {
  const [i, setI] = useState(36);
  const [len, setLen] = useState(20);
  const [mode, setMode] = useState<"PSM" | "SPM">("PSM");
  const n = DOC.length;
  const a = Math.min(i, n), b = Math.min(n, a + len);
  const original = fimPieces(DOC, a, b, "PSM");
  const inOrder: Piece[] = [original[1], original[5], original[3]];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <label className="viz-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          start {a}
          <input type="range" min={0} max={n} value={i} onChange={(e) => setI(Number(e.target.value))} aria-label="Start of the middle span" />
        </label>
        <label className="viz-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          length {b - a}
          <input type="range" min={0} max={60} value={len} onChange={(e) => setLen(Number(e.target.value))} aria-label="Length of the middle span" />
        </label>
        <div className="segmented" role="group" aria-label="Ordering">
          {(["PSM", "SPM"] as const).map((m) => (
            <button key={m} className="seg" aria-pressed={mode === m} onClick={() => setMode(m)}>{m}</button>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
        <div>
          <div className="viz-label" style={{ marginBottom: 4 }}>document as written</div>
          <Render pieces={inOrder} />
        </div>
        <div>
          <div className="viz-label" style={{ marginBottom: 4 }}>training sequence ({mode})</div>
          <Render pieces={fimPieces(DOC, a, b, mode)} />
        </div>
      </div>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        prefix {a} chars, middle {b - a} (underlined), suffix {n - b}; the middle is predicted after the model has read both sides
      </div>
      <figcaption className="viz-caption">
        Fill-in-the-middle cuts a document into prefix, middle and suffix, then moves the middle to the end behind sentinel
        tokens. The model is still trained left to right on the whole reordered sequence, but when it reaches the middle it
        has already seen the code that comes after it, which is exactly the situation of an editor completing code at the
        cursor. In SPM order the prefix sits directly before the middle, so the text flows naturally into it.
      </figcaption>
    </figure>
  );
}
