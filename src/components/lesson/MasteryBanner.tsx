"use client";

import { useEffect, useState } from "react";
import { learnAction } from "@/app/actions";
import { Pill } from "@/components/ui/Pill";
import { ChevronRight } from "@/components/ui/Icons";

export function MasteryBanner({ initiallyMastered }: { initiallyMastered: boolean }) {
  const [mastered, setMastered] = useState(initiallyMastered);
  // Floats into view only at the moment of mastery; on later visits it sits quietly at the end.
  const [justNow, setJustNow] = useState(false);
  useEffect(() => {
    const on = () => { setMastered(true); setJustNow(true); };
    window.addEventListener("frontier:mastered", on);
    return () => window.removeEventListener("frontier:mastered", on);
  }, []);
  if (!mastered) return null;
  return (
    <div className={justNow ? "mastered is-floating" : "mastered"} role="status">
      <div>
        <p className="mastered-title"><Pill tone="success" icon="check">Mastered</Pill>This lesson is yours</p>
        <p className="mastered-text">Its questions will return for review just before you would forget them.</p>
      </div>
      <form action={learnAction}>
        <button type="submit" className="btn btn-primary">Learn next <span className="chev"><ChevronRight /></span></button>
      </form>
    </div>
  );
}
