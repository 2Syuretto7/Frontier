"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SectionId } from "@/lib/sections";
import { Lock } from "@/components/ui/Icons";

const LINKS: { href: string; label: string; match: (p: string) => boolean; section?: SectionId }[] = [
  { href: "/", label: "Home", match: (p) => p === "/" },
  { href: "/map", label: "Map", match: (p) => p.startsWith("/map") },
  { href: "/drills", label: "Drills", match: (p) => p.startsWith("/drills"), section: "drills" },
  { href: "/gym", label: "Gym", match: (p) => p.startsWith("/gym"), section: "gym" },
  { href: "/interview", label: "Interview", match: (p) => p.startsWith("/interview"), section: "interview" },
  { href: "/projects", label: "Projects", match: (p) => p.startsWith("/projects"), section: "projects" },
  { href: "/readiness", label: "Readiness", match: (p) => p.startsWith("/readiness"), section: "readiness" },
];

/** Drills, the gym, Interview, Projects and Readiness always show, marked locked until open. */
export function NavLinks({ variant = "bar", open }: { variant?: "bar" | "menu"; open: readonly SectionId[] }) {
  const path = usePathname() ?? "/";
  return (
    <>
      {LINKS.map((l) => {
        const on = l.match(path);
        const locked = l.section !== undefined && !open.includes(l.section);
        return (
          <Link key={l.href} href={l.href} aria-current={on ? "page" : undefined}
            aria-label={locked ? `${l.label}, locked` : undefined} title={locked ? "Locked" : undefined}
            className={`${variant === "bar" ? `topnav-link${on ? " is-on" : ""}` : "menu-item"}${locked ? " is-locked" : ""}`}>
            {l.label}
            {locked && <Lock size={12} />}
          </Link>
        );
      })}
    </>
  );
}
