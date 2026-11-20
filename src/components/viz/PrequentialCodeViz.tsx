"use client";

import { useMemo, useState } from "react";

const TEXT =
  "the model reads the text one character at a time and before each character it states how likely every possible " +
  "next character is. the coder then spends minus log two of that probability in bits. when the model is confident " +
  "and right the cost is small, when it is surprised the cost is large. the model then updates its counts and moves on, " +
  "so the same pass that trains the model also compresses the text, and the total number of bits is the sum of the " +
  "losses along the way. a model that predicts the next character well is a model that compresses the text well, and " +
  "the reverse is also true, which is why the training loss of a language model is a compression rate in disguise.";

const ALPHA = Array.from(new Set(TEXT.split(""))).sort();

/** Cumulative code length in bits of an adaptive order-k character model with add-α counts. */
export function prequentialBits(text: string, k: number, alpha: number) {
  const A = ALPHA.length;
  const table = new Map<string, Map<string, number>>();
  const totals = new Map<string, number>();
  const cum: number[] = [];
  let bits = 0;
  for (let i = 0; i < text.length; i++) {
    const ctx = text.slice(Math.max(0, i - k), i);
    const row = table.get(ctx) ?? new Map<string, number>();
    const tot = totals.get(ctx) ?? 0;
    const c = row.get(text[i]) ?? 0;
    bits += -Math.log2((c + alpha) / (tot + alpha * A));
    cum.push(bits);
    row.set(text[i], c + 1);
    table.set(ctx, row);
    totals.set(ctx, tot + 1);
  }
  return cum;
}

const ORDERS = [0, 1, 2, 3, 4];
const COLOURS = ["var(--text-muted)", "var(--code-string)", "var(--code-function)", "var(--accent)", "var(--code-keyword)"];

export function PrequentialCodeViz() {
  const [k, setK] = useState(2);
  const [alpha, setAlpha] = useState(0.5);
  const curves = useMemo(() => ORDERS.map((o) => prequentialBits(TEXT, o, alpha)), [alpha]);
  const n = TEXT.length;
  const uni = Math.log2(ALPHA.length);
  const W = 330, H = 170, X0 = 30, PW = 290, Y0 = 10, PH = 125, YMIN = 3, YMAX = 5.2;
  const px = (i: number) => X0 + (i / (n - 1)) * PW;
  const py = (v: number) => Y0 + PH - ((Math.max(YMIN, Math.min(v, YMAX)) - YMIN) / (YMAX - YMIN)) * PH;
  const sel = curves[ORDERS.indexOf(k)];
  const total = sel[n - 1];
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        <div className="segmented" role="group" aria-label="Context length">
          {ORDERS.map((o) => (
            <button key={o} className="seg" aria-pressed={k === o} onClick={() => setK(o)}>order {o}</button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Smoothing alpha">
          {[0.05, 0.5, 1].map((a) => (
            <button key={a} className="seg" aria-pressed={alpha === a} onClick={() => setAlpha(a)}>α = {a}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: 460, display: "block", margin: "0 auto" }} role="img" aria-label="Running bits per character of adaptive character models of different orders">
        {[3, 3.5, 4, 4.5, 5].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X0 + PW} y1={py(v)} y2={py(v)} stroke="var(--border)" strokeWidth={0.5} />
            <text x={X0 - 4} y={py(v) + 3} textAnchor="end" className="viz-label">{v}</text>
          </g>
        ))}
        <line x1={X0} x2={X0 + PW} y1={py(uni)} y2={py(uni)} stroke="var(--text-muted)" strokeDasharray="3 3" />
        {curves.map((cum, j) => {
          const step = 4;
          const pts: string[] = [];
          for (let i = 9; i < n; i += step) pts.push(`${px(i).toFixed(1)},${py(cum[i] / (i + 1)).toFixed(1)}`);
          return (
            <polyline key={j} points={pts.join(" ")} fill="none" stroke={COLOURS[j]} strokeWidth={ORDERS[j] === k ? 2.4 : 1} opacity={ORDERS[j] === k ? 1 : 0.45} />
          );
        })}
        <text x={X0 + PW} y={Y0 + PH + 12} textAnchor="end" className="viz-label">characters read →</text>
        <text x={X0} y={H - 2} className="viz-label">running bits per character; dashed: uniform code</text>
      </svg>
      <div className="mono" style={{ fontSize: 12, margin: "6px 0" }} aria-live="polite">
        order {k}, α = {alpha}: {total.toFixed(0)} bits for {n} characters, {(total / n).toFixed(3)} bits per character
        (uniform over {ALPHA.length} symbols: {uni.toFixed(3)}; plain ASCII: 8)
      </div>
      <figcaption className="viz-caption">
        Each model starts knowing nothing, predicts the next character from counts of what followed the last k characters,
        pays −log₂ p bits for the character that actually comes, and then updates its counts. The running cost per character
        is the model&apos;s average training loss so far, in bits. Longer contexts start worse, because every context is new, and
        pay off only once they have seen enough text; on a passage this short the longest never do, and which order wins
        depends on α. Smaller α trusts the counts sooner, which helps the longer contexts most.
      </figcaption>
    </figure>
  );
}
