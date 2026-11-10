"use client";

import { useActionState, useState } from "react";
import { signUpAction } from "@/app/actions";
import { checkStrength, suggestPassphrase } from "@/lib/passphrase";
import { PassphraseInput } from "./PassphraseInput";
import { SubmitButton } from "./SubmitButton";

function secureRandomInt(max: number): number {
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  do crypto.getRandomValues(buf);
  while (buf[0] >= limit);
  return buf[0] % max;
}

export function SignUpForm() {
  const [state, action] = useActionState(signUpAction, undefined);
  const [passphrase, setPassphrase] = useState("");
  const [confirm, setConfirm] = useState("");
  const strength = checkStrength(passphrase);

  const suggest = () => {
    const s = suggestPassphrase(secureRandomInt);
    setPassphrase(s);
    setConfirm("");
  };

  return (
    <form action={action}>
      {state?.error && <p className="error" role="alert">{state.error}</p>}
      <PassphraseInput
        id="passphrase"
        name="passphrase"
        label="Passphrase"
        autoComplete="new-password"
        autoFocus
        value={passphrase}
        onChange={setPassphrase}
        action={<button type="button" className="link-btn" onClick={suggest}>Suggest one</button>}
      />
      <p className="hint" style={{ marginTop: -8, marginBottom: 16 }}>
        {passphrase.length === 0
          ? "Four or more everyday words you can picture. Spaces and capitals don't matter."
          : strength.ok
            ? "Strong enough. Write it somewhere safe before you continue."
            : strength.reason}
      </p>
      <PassphraseInput
        id="confirm"
        name="confirm"
        label="Type it again"
        autoComplete="new-password"
        value={confirm}
        onChange={setConfirm}
      />
      <SubmitButton pendingText="Creating…">Create Frontier</SubmitButton>
    </form>
  );
}
