"use client";

import { useEffect } from "react";

/** Drafts of removed features: teach-back explanations and written proofs or arguments. */
const REMOVED_PREFIXES = ["frontier:teach:", "frontier:written:"];

/** Deletes any unsent drafts of removed features left in this browser. */
export function ClearRemovedDrafts() {
  useEffect(() => {
    try {
      const keys = Object.keys(window.localStorage).filter((k) => REMOVED_PREFIXES.some((p) => k.startsWith(p)));
      for (const k of keys) window.localStorage.removeItem(k);
    } catch { /* storage unavailable: nothing to clear */ }
  }, []);
  return null;
}
