"use client";

import { useState } from "react";

const T: Record<string, string[]> = {
  "tosa.matmul": ["linalg.fill", "linalg.matmul"],
  "tosa.relu": ["linalg.generic"],
  "linalg.fill": ["scf.for", "memref.store"],
  "linalg.matmul": [
    "scf.for",
    "scf.for",
    "scf.for",
    "memref.load",
    "memref.load",
    "memref.load",
    "arith.mulf",
    "arith.addf",
    "memref.store",
  ],
  "linalg.generic": [
    "scf.for",
    "memref.load",
    "arith.maximumf",
    "memref.store",
  ],
  "scf.for": ["cf.br", "cf.cond_br", "arith.cmpi", "arith.addi"],
  "memref.load": ["llvm.getelementptr", "llvm.load"],
  "memref.store": ["llvm.getelementptr", "llvm.store"],
  "arith.mulf": ["llvm.fmul"],
  "arith.addf": ["llvm.fadd"],
  "arith.maximumf": ["llvm.maxnum"],
  "arith.cmpi": ["llvm.icmp"],
  "arith.addi": ["llvm.add"],
  "cf.br": ["llvm.br"],
  "cf.cond_br": ["llvm.cond_br"],
};
const STAGES: [string, string[]][] = [
  ["tosa", ["tosa"]],
  ["linalg", ["linalg"]],
  ["loops", ["scf", "memref", "arith"]],
  ["branches", ["cf", "memref", "arith"]],
  ["llvm", ["llvm"]],
];
const COLOUR: Record<string, string> = {
  tosa: "var(--danger)",
  linalg: "var(--accent)",
  scf: "var(--success)",
  memref: "var(--code-function)",
  arith: "var(--code-string)",
  cf: "var(--code-number)",
  llvm: "var(--text-muted)",
};
const d = (op: string) => op.split(".")[0];

function lower(ops: string[], legal: string[]) {
  let rounds = 0;
  while (ops.some((o) => !legal.includes(d(o)))) {
    ops = ops.flatMap((o) => (legal.includes(d(o)) ? [o] : (T[o] ?? [o])));
    rounds++;
  }
  return { ops, rounds };
}

export function MlirLoweringViz() {
  const [stage, setStage] = useState(0);
  const { ops, rounds } = lower(["tosa.matmul", "tosa.relu"], STAGES[stage][1]);
  const counts: Record<string, number> = {};
  ops.forEach((o) => (counts[d(o)] = (counts[d(o)] ?? 0) + 1));
  return (
    <figure className="viz">
      <div
        className="viz-controls"
        style={{ marginTop: 0, flexWrap: "wrap", gap: 6 }}
        role="group"
        aria-label="Lowering stage"
      >
        {STAGES.map(([name], i) => (
          <button
            key={name}
            type="button"
            className={i === stage ? "btn btn-primary" : "btn"}
            aria-pressed={i === stage}
            onClick={() => setStage(i)}
          >
            {name}
          </button>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          marginTop: 10,
          minHeight: 60,
          alignItems: "flex-start",
          alignContent: "flex-start",
        }}
      >
        {ops.map((o, i) => (
          <span
            key={i}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              padding: "2px 6px",
              border: "1px solid var(--border)",
              borderLeft: `4px solid ${COLOUR[d(o)]}`,
              borderRadius: 4,
              background: "var(--surface)",
              color: "var(--text)",
            }}
          >
            {o}
          </span>
        ))}
      </div>
      <p className="viz-label" style={{ textAlign: "center" }}>
        {ops.length} ops after {rounds} rounds of lowering:{" "}
        {Object.entries(counts)
          .map(([k, v]) => `${v} ${k}`)
          .join(", ")}
      </p>
      <figcaption className="viz-caption">
        A matrix product followed by a ReLU, lowered stage by stage. Each stage
        declares which dialects are legal and rewrites every illegal operation
        with its pattern, repeating until none is left. Operations already legal
        pass through unchanged, so arithmetic stays in the arith dialect until
        the final conversion to LLVM.
      </figcaption>
    </figure>
  );
}
