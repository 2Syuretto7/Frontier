"use client";

import { CodeRunner } from "./CodeRunner";

const tidy = (code: string) => code.replace(/^\n/, "").replace(/\s+$/, "") + "\n";

/**
 * A runnable, editable Python example inside a lesson. Runs entirely in the browser.
 * Use <Code> instead when the learner should read the code without running it.
 */
export function Playground({ code, setup, files, label = "Python example" }: {
  code: string;
  setup?: string;
  files?: Record<string, string>;
  label?: string;
}) {
  const start = tidy(code);
  return (
    <div className="playground">
      <CodeRunner initial={start} original={start} setup={setup} files={files} label={label} />
    </div>
  );
}
