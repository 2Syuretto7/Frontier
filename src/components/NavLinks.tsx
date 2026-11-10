"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home", match: (p: string) => p === "/" },
  { href: "/map", label: "Map", match: (p: string) => p.startsWith("/map") },
  { href: "/review", label: "Review", match: (p: string) => p.startsWith("/review") },
];

export function NavLinks({ variant = "bar" }: { variant?: "bar" | "menu" }) {
  const path = usePathname() ?? "/";
  return (
    <>
      {LINKS.map((l) => {
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
