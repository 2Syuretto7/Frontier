"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SectionId } from "@/lib/sections";

const LINKS: { href: string; label: string; match: (p: string) => boolean; section?: SectionId }[] = [
  { href: "/", label: "Home", match: (p) => p === "/" },
  { href: "/map", label: "Map", match: (p) => p.startsWith("/map") },
  { href: "/review", label: "Review", match: (p) => p.startsWith("/review") },
  { href: "/drills", label: "Drills", match: (p) => p.startsWith("/drills"), section: "drills" },
  { href: "/gym", label: "Gym", match: (p) => p.startsWith("/gym"), section: "gym" },
  { href: "/interview", label: "Interview", match: (p) => p.startsWith("/interview"), section: "interview" },
  { href: "/projects", label: "Projects", match: (p) => p.startsWith("/projects"), section: "projects" },
  { href: "/readiness", label: "Readiness", match: (p) => p.startsWith("/readiness"), section: "readiness" },
];

/** Drills, the gym, Interview, Projects and Readiness show only once open. */
export function NavLinks({ variant = "bar", open }: { variant?: "bar" | "menu"; open: readonly SectionId[] }) {
  const path = usePathname() ?? "/";
  return (
    <>
      {LINKS.filter((l) => !l.section || open.includes(l.section)).map((l) => {
        const on = l.match(path);
        return (
          <Link key={l.href} href={l.href} aria-current={on ? "page" : undefined}
            className={variant === "bar" ? `topnav-link${on ? " is-on" : ""}` : "menu-item"}>
            {l.label}
          </Link>
        );
      })}
    </>
  );
}
