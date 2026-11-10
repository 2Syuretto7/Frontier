import type { ReactNode } from "react";

/** A block of program text, shown exactly as written. */
export function Code({ children }: { children: string }) {
  return (
    <pre className="code-block">
      <code>{children.replace(/^\n/, "").replace(/\s+$/, "")}</code>
    </pre>
  );
}

/** A piece of code inside a sentence. */
export function C({ children }: { children: ReactNode }) {
  return <code className="code-inline">{children}</code>;
}
