"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/actions";
import { Menu } from "@/components/ui/Icons";
import { NavLinks } from "@/components/NavLinks";

/** The account menu. Closes on Escape, on a click outside and on navigation. */
export function UserMenu() {
  const ref = useRef<HTMLDetailsElement>(null);
  const path = usePathname();

  useEffect(() => { if (ref.current) ref.current.open = false; }, [path]);

  useEffect(() => {
    const close = (focus: boolean) => {
      const el = ref.current;
      if (!el?.open) return;
      el.open = false;
      if (focus) el.querySelector("summary")?.focus();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(true); };
    const onClick = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) close(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("click", onClick); };
  }, []);

  return (
    <details className="menu" ref={ref}>
      <summary className="btn btn-ghost btn-icon" aria-label="Menu">
        <Menu />
      </summary>
      <div className="menu-panel">
        <div className="menu-mobile">
          <NavLinks variant="menu" />
          <div className="menu-sep" />
        </div>
        <Link href="/settings" className="menu-item">Settings</Link>
        <form action={signOutAction}>
          <button type="submit" className="menu-item">Sign out</button>
        </form>
      </div>
    </details>
  );
}
