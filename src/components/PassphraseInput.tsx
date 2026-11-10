"use client";

import { useState } from "react";

type Props = {
  id: string;
  name: string;
  label: string;
  value?: string;
  onChange?: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  autoFocus?: boolean;
  action?: React.ReactNode;
};

export function PassphraseInput({ id, name, label, value, onChange, autoComplete, autoFocus, action }: Props) {
  const [shown, setShown] = useState(false);
  return (
    <div className="field">
      <div className="label-row">
        <label htmlFor={id}>{label}</label>
        {action}
      </div>
      <div className="input-wrap">
        <input
          className="input"
          id={id}
          name={name}
          type={shown ? "text" : "password"}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoFocus={autoFocus}
          required
          value={value}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        />
        <button type="button" className="reveal" onClick={() => setShown((s) => !s)} aria-pressed={shown}>
          {shown ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}
