import type { ReactNode } from "react";

type BlockProps = { title?: string; children: ReactNode };

function Block({ kind, label, title, children }: BlockProps & { kind: string; label: string }) {
  return (
    <div className={`block block-${kind}`}>
      <p className="block-head"><span className="block-label">{label}</span>{title && <span className="block-title"> ({title})</span>}</p>
      <div className="block-body">{children}</div>
    </div>
  );
}

export const Definition = (p: BlockProps) => <Block kind="definition" label="Definition" {...p} />;
export const Axiom = (p: BlockProps) => <Block kind="definition" label="Axioms" {...p} />;
export const Theorem = (p: BlockProps) => <Block kind="theorem" label="Theorem" {...p} />;
export const Proposition = (p: BlockProps) => <Block kind="theorem" label="Proposition" {...p} />;
export const Example = (p: BlockProps) => <Block kind="example" label="Example" {...p} />;
export const Remark = (p: BlockProps) => <Block kind="remark" label="Remark" {...p} />;

export function Proof({ children }: { children: ReactNode }) {
  return (
    <div className="proof">
      <p className="proof-head">Proof</p>
      {children}
      <p className="qed" aria-label="End of proof">∎</p>
    </div>
  );
}

export function Quote({ children, source }: { children: ReactNode; source: ReactNode }) {
  return (
    <blockquote className="quote">
      {children}
      <footer>{source}</footer>
    </blockquote>
  );
}
