"use client";

import { useState } from "react";

const ORDER = ["bool", "int32", "int64", "float16", "float32", "float64"];
const DTYPES = ["int32", "float16", "float32", "float64"];
const KERNELS = new Set([
  "add/cpu/int32", "add/cpu/float32", "add/cpu/float64", "add/gpu/float16", "add/gpu/float32",
  "matmul/cpu/float32", "matmul/cpu/float64", "matmul/gpu/float16", "matmul/gpu/float32",
]);

function Pick({ label, value, options, set }: { label: string; value: string; options: string[]; set: (v: string) => void }) {
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center", marginBottom: 4 }}>
      <span className="mono" style={{ fontSize: 13, width: 64 }}>{label}</span>
      {options.map((o) => (
        <button key={o} type="button" className="seg" aria-pressed={value === o} onClick={() => set(o)}>{o}</button>
      ))}
    </div>
  );
}

/** How a call is routed: check devices, promote dtypes, then look up (op, device, dtype) in a kernel table. */
export function DispatchViz() {
  const [op, setOp] = useState("add");
  const [da, setDa] = useState("int32"), [db, setDb] = useState("float32");
  const [va, setVa] = useState("cpu"), [vb, setVb] = useState("cpu");
  const sameDevice = va === vb;
  const dtype = ORDER.indexOf(da) >= ORDER.indexOf(db) ? da : db;
  const key = `${op}/${va}/${dtype}`;
  const found = KERNELS.has(key);
  return (
    <figure className="viz">
      <div style={{ margin: "4px 0 8px" }}>
        <Pick label="op" value={op} options={["add", "matmul"]} set={setOp} />
        <Pick label="a dtype" value={da} options={DTYPES} set={setDa} />
        <Pick label="b dtype" value={db} options={DTYPES} set={setDb} />
        <Pick label="a device" value={va} options={["cpu", "gpu"]} set={setVa} />
        <Pick label="b device" value={vb} options={["cpu", "gpu"]} set={setVb} />
      </div>
      <ol className="mono" style={{ fontSize: 13, margin: "6px 0", paddingLeft: 22, lineHeight: 1.7 }}>
        <li style={{ color: sameDevice ? "var(--text)" : "var(--danger)" }}>devices: {va}, {vb} {sameDevice ? "(same)" : "→ RuntimeError: different devices"}</li>
        {sameDevice && <li>promote: {da} with {db} → {dtype}</li>}
        {sameDevice && (
          <li style={{ color: found ? "var(--accent)" : "var(--danger)" }}>
            look up ({op}, {va}, {dtype}) → {found ? `kernel ${op}_${va}_${dtype}` : "no kernel: NotImplementedError"}
          </li>
        )}
      </ol>
      <div className="mono" style={{ fontSize: 12, color: "var(--text-muted)", overflowX: "auto" }}>
        registered: {[...KERNELS].map((k) => k.replaceAll("/", " ")).join("; ")}
      </div>
      <figcaption className="viz-caption" aria-live="polite">
        Dispatch never guesses across devices: moving data between CPU and GPU is slow and must be asked for. Within a device,
        mixed dtypes are first promoted to a common one, and only then is a kernel chosen.{" "}
        {sameDevice && !found ? `Here no kernel is registered for (${op}, ${va}, ${dtype}), so the call fails, as float16 matmul on a CPU does in many builds.` : ""}
      </figcaption>
    </figure>
  );
}
