"use client";

import { useActionState } from "react";
import { signInAction } from "@/app/actions";
import { PassphraseInput } from "./PassphraseInput";
import { SubmitButton } from "./SubmitButton";

export function SignInForm() {
  const [state, action] = useActionState(signInAction, undefined);
  return (
    <form action={action}>
      {state?.error && <p className="error" role="alert">{state.error}</p>}
      <PassphraseInput id="passphrase" name="passphrase" label="Passphrase" autoComplete="current-password" autoFocus />
      <SubmitButton pendingText="Signing in…">Sign in</SubmitButton>
    </form>
  );
}
