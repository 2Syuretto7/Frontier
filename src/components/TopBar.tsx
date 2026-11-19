import Link from "next/link";
import { LogoMark } from "@/components/ui/Logo";
import { NavLinks } from "@/components/NavLinks";
import { UserMenu } from "@/components/UserMenu";
import { sectionState } from "@/lib/sections-store";
import type { SectionId } from "@/lib/sections";

/** The top bar. Practice sections appear in it only once they have opened (see `src/lib/sections.ts`). */
export async function TopBar() {
  const open = await openNow();
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link href="/" className="brand" aria-label="Frontier home">
          <LogoMark />
          <span className="brand-name">Frontier</span>
        </Link>
        <nav className="topnav" aria-label="Primary">
          <NavLinks open={open} />
        </nav>
        <div className="topbar-end">
          <UserMenu open={open} />
        </div>
      </div>
    </header>
  );
}

async function openNow(): Promise<SectionId[]> {
  try {
    return [...(await sectionState()).open];
  } catch (error) {
    console.error("Open sections unavailable:", error);
    return [];
  }
}
