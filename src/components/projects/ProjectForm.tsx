"use client";

import { useState, useTransition } from "react";
import { projectAction, type ProjectFormState } from "@/app/projects/actions";

/**
 * A form for one project change. Submits without React's automatic reset, so a rejected submission (a stage
 * that isn't finished, a post-mortem that is too short) keeps everything that was typed.
 */
export function ProjectForm({
  op,
  projectId,
  children,
  className,
  resetOnDone = false,
  extra,
}: {
  op?: string;
  projectId?: number;
  children: React.ReactNode;
  className?: string;
  resetOnDone?: boolean;
  extra?: Record<string, string | number>;
}) {
  const [state, setState] = useState<ProjectFormState>();
  const [pending, start] = useTransition();
  return (
    <form
      className={className}
      aria-busy={pending}
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        const data = new FormData(form, submitter);
        if (!data.has("op") && op) data.set("op", op);
        if (projectId !== undefined) data.set("projectId", String(projectId));
        for (const [k, v] of Object.entries(extra ?? {})) data.set(k, String(v));
        start(async () => {
          const result = await projectAction(data);
          setState(result);
          if (result?.ok && resetOnDone) form.reset();
        });
      }}
    >
      {state?.error && <p className="error" role="alert">{state.error}</p>}
      {state?.done && !pending && <p className="success" role="status">{state.done}</p>}
      <fieldset disabled={pending} className="pp-fieldset">{children}</fieldset>
    </form>
  );
}
