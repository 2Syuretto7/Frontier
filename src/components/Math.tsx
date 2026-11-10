import katex from "katex";

/** Inline mathematics, rendered to HTML on the server. */
export function M({ children }: { children: string }) {
  return <span dangerouslySetInnerHTML={{ __html: katex.renderToString(children, { throwOnError: true }) }} />;
}

/** Display mathematics on its own line. */
export function MD({ children }: { children: string }) {
  return (
    <div
      className="math-display"
      dangerouslySetInnerHTML={{ __html: katex.renderToString(children, { displayMode: true, throwOnError: true }) }}
    />
  );
}
