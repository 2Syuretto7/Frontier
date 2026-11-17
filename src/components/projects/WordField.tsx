"use client";

import { useState } from "react";

/** A labelled text area that counts words against the minimum the stage asks for. */
export function WordField({
  name,
  label,
  hint,
  min,
  defaultValue = "",
  rows = 4,
  placeholder,
}: {
  name: string;
  label: string;
  hint?: string;
  min?: number;
  defaultValue?: string;
  rows?: number;
  placeholder?: string;
}) {
  const [words, setWords] = useState(() => count(defaultValue));
  const id = `pp-${name}`;
  return (
    <div className="field">
      <div className="label-row">
        <label htmlFor={id}>{label}</label>
        {min ? (
          <span className={`mono-meta${words >= min ? " pp-enough" : ""}`} aria-live="polite">
            {words} / {min} words
          </span>
        ) : null}
      </div>
      {hint && <p className="hint">{hint}</p>}
      <textarea
        id={id}
        name={name}
        className="input pp-textarea"
        rows={rows}
        defaultValue={defaultValue}
        placeholder={placeholder}
        onChange={(e) => setWords(count(e.target.value))}
      />
    </div>
  );
}

function count(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
