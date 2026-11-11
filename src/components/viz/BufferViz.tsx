"use client";

import { useState } from "react";

/** Two adjacent C buffers, char name[8] then char role[8]: strcpy into name with a long input overwrites role. */
export function BufferViz() {
  const [text, setText] = useState("guest");
  const [safe, setSafe] = useState(false);
  const mem: (number | null)[] = Array(16).fill(null);
  const role = "user";
  for (let i = 0; i < role.length; i++) mem[8 + i] = role.charCodeAt(i);
  mem[8 + role.length] = 0;
  for (let i = role.length + 9; i < 16; i++) mem[i] = 0;
  const src = [...text].map((c) => c.charCodeAt(0) & 0x7f);
  const n = safe ? Math.min(src.length, 7) : src.length;
  for (let i = 0; i < n && i < 16; i++) mem[i] = src[i];
  if (n < 16) mem[n] = 0;
  for (let i = n + 1; i < 8; i++) if (mem[i] === null) mem[i] = 0;
  const readStr = (start: number) => {
    let s = "";
    for (let i = start; i < 16 && mem[i] !== 0 && mem[i] !== null; i++) s += String.fromCharCode(mem[i]!);
    return s;
  };
  const overflow = !safe && src.length >= 8;
  const C = 34, W = 16 * C + 10;
  return (
    <figure className="viz">
      <div className="segmented" role="group" aria-label="Copy">
        <button type="button" className="seg mono" aria-pressed={!safe} onClick={() => setSafe(false)}>strcpy(name, input)</button>
        <button type="button" className="seg mono" aria-pressed={safe} onClick={() => setSafe(true)}>snprintf(name, 8, &quot;%s&quot;, input)</button>
      </div>
      <div className="viz-sliders">
        <label><span>Input</span><input className="input mono" value={text} maxLength={15} onChange={(e) => setText(e.target.value)} aria-label="Text to copy into name" /></label>
      </div>
      <svg viewBox={`0 0 ${W} 86`} role="img" aria-label={`Memory: name holds ${readStr(0)}, role holds ${readStr(8)}`}>
        <text x={5 + 4 * C} y={12} textAnchor="middle" className="plot-tick">char name[8]</text>
        <text x={5 + 12 * C} y={12} textAnchor="middle" className="plot-tick">char role[8]</text>
        {mem.map((b, i) => (
          <g key={i}>
            <rect x={5 + i * C + 1} y={20} width={C - 2} height={C - 2} rx={4} className={i < 8 ? "viz-cell is-on" : "viz-cell"} style={i >= 8 && overflow && i < src.length + 1 ? { stroke: "var(--danger)", strokeWidth: 2.5 } : undefined} />
            <text x={5 + i * C + C / 2} y={20 + C / 2 + 3} textAnchor="middle" className="viz-label" style={{ fontSize: 12 }}>{b === 0 ? "\\0" : String.fromCharCode(b ?? 32)}</text>
            <text x={5 + i * C + C / 2} y={70} textAnchor="middle" className="plot-tick" style={{ fontSize: 9 }}>{i}</text>
          </g>
        ))}
      </svg>
      <figcaption className="viz-caption" aria-live="polite">
        name reads as <span className="mono">&quot;{readStr(0)}&quot;</span> and role as <span className="mono">&quot;{readStr(8)}&quot;</span>.{" "}
        {overflow
          ? "strcpy copied past the end of name, because C arrays do not know their length: role has been overwritten. With the right input an attacker chooses what lands there."
          : safe && src.length >= 8
            ? "snprintf copied at most 7 characters and the terminating zero, so the string was cut short but role is untouched."
            : "The string fits: its characters, then a zero byte that marks the end."}
      </figcaption>
    </figure>
  );
}
