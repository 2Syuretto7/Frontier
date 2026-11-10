"use client";

import { useActionState } from "react";
import { changePassphraseAction } from "@/app/actions";
import { PassphraseInput } from "./PassphraseInput";
import { SubmitButton } from "./SubmitButton";

export function ChangePassphraseForm() {
  const [state, action] = useActionState(changePassphraseAction, undefined);
  return (
    <form action={action} key={state?.done}>
      {state?.error && <p className="error" role="alert">{state.error}</p>}
      {state?.done && <p className="success" role="status">{state.done}</p>}
      <PassphraseInput id="current" name="current" label="Current passphrase" autoComplete="current-password" />
      <PassphraseInput id="next" name="next" label="New passphrase" autoComplete="new-password" />
      <PassphraseInput id="confirm" name="confirm" label="Type the new one again" autoComplete="new-password" />
      <SubmitButton pendingText="Saving…" className="btn">Change passphrase</SubmitButton>
    </form>
  );
}
