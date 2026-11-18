"use client";

import { useState } from "react";

type Entry = { name: string; shape: number[]; kind: "param" | "buffer" | "transient"; tiedTo?: string };

/** A small language model: embedding tied to the output head, two blocks, a batch-norm and a rotary cache. */
export const ENTRIES: Entry[] = [
  { name: "embed.weight", shape: [1000, 64], kind: "param" },
  { name: "blocks.0.ff.weight", shape: [64, 64], kind: "param" },
  { name: "blocks.0.ff.bias", shape: [64], kind: "param" },
  { name: "blocks.1.ff.weight", shape: [64, 64], kind: "param" },
  { name: "blocks.1.ff.bias", shape: [64], kind: "param" },
  { name: "norm.weight", shape: [64], kind: "param" },
  { name: "norm.running_mean", shape: [64], kind: "buffer" },
  { name: "norm.running_var", shape: [64], kind: "buffer" },
  { name: "norm.num_batches_tracked", shape: [], kind: "buffer" },
  { name: "rope.cos", shape: [128, 32], kind: "transient" },
  { name: "head.weight", shape: [1000, 64], kind: "param", tiedTo: "embed.weight" },
];

const VIEWS = ["named_parameters", "trainable after freezing embed", "named_buffers", "state_dict"] as const;
type View = (typeof VIEWS)[number];

export const size = (s: number[]) => s.reduce((a, b) => a * b, 1);

/** Whether an entry appears in the view; parameters tied to an earlier one are yielded once, as PyTorch does. */
export function included(e: Entry, view: View) {
  if (view === "state_dict") return e.kind !== "transient";
  if (view === "named_buffers") return e.kind !== "param";
  if (e.kind !== "param" || e.tiedTo) return false;
  return view === "named_parameters" || !e.name.startsWith("embed.");
}

export function total(view: View) {
  return ENTRIES.filter((e) => included(e, view)).reduce((s, e) => s + size(e.shape), 0);
}

export function StateDictViz() {
  const [view, setView] = useState<View>("state_dict");
  return (
    <figure className="viz">
      <div className="viz-controls" style={{ marginTop: 0, flexWrap: "wrap", gap: 8 }}>
        {VIEWS.map((v) => (
          <button key={v} type="button" className="seg" aria-pressed={view === v} onClick={() => setView(v)}>{v}</button>
        ))}
      </div>
      <div className="mono" style={{ fontSize: 13, lineHeight: 1.6, overflowX: "auto" }}>
        {ENTRIES.map((e) => {
          const on = included(e, view);
          return (
            <div key={e.name} style={{ display: "flex", gap: 8, color: on ? "var(--text)" : "var(--text-muted)", opacity: on ? 1 : 0.55 }}>
              <span style={{ color: on ? "var(--accent)" : "var(--text-muted)", width: 12 }}>{on ? "●" : "○"}</span>
              <span style={{ flex: "1 1 auto", minWidth: 0, overflowWrap: "anywhere" }}>{e.name}</span>
              <span style={{ whiteSpace: "nowrap" }}>({e.shape.join(", ")})</span>
              <span style={{ whiteSpace: "nowrap", width: 64, textAlign: "right", color: e.tiedTo ? "var(--danger)" : undefined }}>
                {e.tiedTo ? "tied" : e.kind === "param" ? "param" : e.kind === "buffer" ? "buffer" : "no save"}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mono" style={{ fontSize: 13, margin: "8px 0" }}>{`${ENTRIES.filter((e) => included(e, view)).length} entries, ${total(view).toLocaleString("en-IN")} numbers`}</div>
      <figcaption className="viz-caption" aria-live="polite">
        One model seen through four of nn.Module&apos;s views. Parameters are what the optimiser updates; the tied output head
        shares the embedding&apos;s tensor, so named_parameters yields it once while state_dict stores both keys. Buffers such
        as batch-norm statistics are saved but not trained, and a buffer registered with persistent=False, like a rotary
        cache that can be recomputed, is neither trained nor saved. Freezing sets requires_grad to False, which removes the
        embedding (and with it the tied head) from what the optimiser should be given.
      </figcaption>
    </figure>
  );
}
