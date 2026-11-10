import { Check, Clock, Lock, Pen } from "./Icons";

export type PillTone = "success" | "accent" | "neutral" | "muted" | "danger";

/** A status chip: the only rounded element in the system. */
export function Pill({ tone, children, icon }: { tone: PillTone; children: React.ReactNode; icon?: "check" | "clock" | "lock" | "pen" | "dot" | "spin" }) {
  const glyph =
    icon === "check" ? <Check size={12} /> :
    icon === "clock" ? <Clock size={12} /> :
    icon === "lock" ? <Lock size={12} /> :
    icon === "pen" ? <Pen size={12} /> :
    icon === "dot" ? <span className="pill-dot" /> :
    icon === "spin" ? <span className="pill-spin" /> : null;
  return <span className={`pill pill-${tone}`}>{glyph}{children}</span>;
}
