"use client";

import { useEffect, useState } from "react";

/** Section rail with a live marker for the section being read, plus a hairline reading-progress bar. */
export function LessonRail({ sections }: { sections: { id: string; label: string }[] }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => !!e);
    const bar = document.querySelector<HTMLElement>(".reading-progress");
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.3;
      let current = els[0]?.id;
      for (const el of els) if (el.getBoundingClientRect().top <= line) current = el.id;
      setActive(current);
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      bar?.style.setProperty("--p", String(max > 0 ? Math.min(1, window.scrollY / max) : 0));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(frame); };
  }, [sections]);

  useEffect(() => {
    // Keep the active chip in view in the phone and tablet bar without moving the page.
    const bar = document.querySelector<HTMLElement>(".rail-mobile");
    const chip = bar?.querySelector<HTMLElement>(`a[href="#${active}"]`);
    if (!bar || !chip || bar.offsetParent === null) return;
    const left = chip.getBoundingClientRect().left - bar.getBoundingClientRect().left + bar.scrollLeft;
    if (left < bar.scrollLeft || left + chip.offsetWidth > bar.scrollLeft + bar.clientWidth) {
      bar.scrollTo({ left: Math.max(0, left - 16), behavior: "smooth" });
    }
  }, [active]);

  const links = (cls?: string) => sections.map((s, i) => (
    <a key={s.id} href={`#${s.id}`} className={active === s.id ? "is-on" : cls} aria-current={active === s.id ? "location" : undefined}>
      <span className="mono-meta">{String(i + 1).padStart(2, "0")}</span>{s.label}
    </a>
  ));

  return (
    <>
    <nav className="rail-mobile" aria-label="Lesson sections">{links()}</nav>
    <nav className="rail" aria-label="Lesson sections">
      <p className="eyebrow">On this page</p>
      <ol>
        {links().map((a) => <li key={a.key}>{a}</li>)}
      </ol>
      <div className="rail-meta">
        <span>Stuck? Press <kbd className="mono-tag">/</kbd> for Parton</span>
      </div>
    </nav>
    </>
  );
}
