"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const BUILD = process.env.FRONTIER_BUILD;
/** How often an open, visible page asks whether a new version is live. */
const CHECK_EVERY_MS = 5 * 60 * 1000;
const RELOADED_KEY = "frontier:update-reload";

/** Loads the newest version, at most once a minute, so a slow cache can never cause a reload loop. */
function reload() {
  try {
    const last = Number(window.sessionStorage.getItem(RELOADED_KEY) ?? 0);
    if (Date.now() - last < 60_000) return;
    window.sessionStorage.setItem(RELOADED_KEY, String(Date.now()));
  } catch { /* storage unavailable: reload anyway */ }
  window.location.reload();
}

/**
 * Brings every open tab, on every device, onto the newest deployment without a manual refresh or cache clearing.
 *
 * The page asks which version is live when it opens, when it comes back from the background (phones and tablets keep
 * tabs alive for days), and every few minutes while visible. Once a newer version is live it loads it:
 * - straight away if the page is in the background, or has just come back and nothing has been typed on it;
 * - otherwise on the next move to another page, so nothing half-typed is lost.
 */
export function UpdateOnDeploy() {
  const pathname = usePathname();
  const stale = useRef(false);
  const typed = useRef(false);
  const firstPath = useRef(pathname);

  // A move to another page loads the new version in full, rather than mixing old and new code.
  useEffect(() => {
    if (pathname === firstPath.current) return;
    firstPath.current = pathname;
    typed.current = false;
    if (stale.current) reload();
  }, [pathname]);

  useEffect(() => {
    if (!BUILD) return;
    let checking = false;

    const reloadIfSafe = (returning: boolean) => {
      if (document.visibilityState === "hidden" || (returning && !typed.current)) reload();
    };

    const check = async (returning: boolean) => {
      if (stale.current) return reloadIfSafe(returning);
      if (checking) return;
      checking = true;
      try {
        const response = await fetch("/api/version", { cache: "no-store" });
        if (!response.ok) return;
        const { build } = (await response.json()) as { build?: string };
        if (build && build !== BUILD) {
          stale.current = true;
          reloadIfSafe(returning);
        }
      } catch {
        /* offline or mid-deploy: ask again later */
      } finally {
        checking = false;
      }
    };

    const onInput = () => { typed.current = true; };
    const onVisibility = () => { void check(document.visibilityState === "visible"); };
    const onPageShow = (event: PageTransitionEvent) => { if (event.persisted) void check(true); };
    const onOnline = () => { void check(false); };
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void check(false);
    }, CHECK_EVERY_MS);

    document.addEventListener("input", onInput, true);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("online", onOnline);
    void check(true);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("input", onInput, true);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  return null;
}
