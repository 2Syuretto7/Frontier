"use client";

import { useEffect } from "react";

/** Teach it back was removed: deletes any unsent teach-back drafts left in this browser. */
export function ClearTeachBackDrafts() {
  useEffect(() => {
    try {
      const keys = Object.keys(window.localStorage).filter((k) => k.startsWith("frontier:teach:"));
      for (const k of keys) window.localStorage.removeItem(k);
    } catch { /* storage unavailable: nothing to clear */ }
  }, []);
  return null;
}
