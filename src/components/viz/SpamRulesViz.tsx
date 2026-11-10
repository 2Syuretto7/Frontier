"use client";

import { useState } from "react";

type Msg = { text: string; spam: boolean };

const MESSAGES: Msg[] = [
  { text: "WIN a FREE phone now!!!", spam: true },
  { text: "Your parcel is held, pay ₹25 fee at this link", spam: true },
  { text: "Congratulations, you are selected for a cash prize", spam: true },
  { text: "Limited offer: free gift card, click here", spam: true },
  { text: "Urgent: verify your bank account today", spam: true },
  { text: "Are we still meeting at 6?", spam: false },
  { text: "FREE tonight? Dinner at mine!", spam: false },
  { text: "Mum says the parcel came, thanks!!!", spam: false },
  { text: "Here are the notes from today's lecture", spam: false },
  { text: "Click the link I sent for the match tickets", spam: false },
];

type Rule = { key: string; label: string; test: (t: string) => boolean };
const RULES: Rule[] = [
  { key: "free", label: "mentions “free”", test: (t) => /free/i.test(t) },
  { key: "bang", label: "has “!!!”", test: (t) => t.includes("!!!") },
  { key: "link", label: "mentions a link", test: (t) => /link|click/i.test(t) },
  { key: "money", label: "mentions money (₹, cash, bank, prize)", test: (t) => /₹|cash|bank|prize|fee/i.test(t) },
  { key: "caps", label: "has a word in capitals", test: (t) => /\b[A-Z]{3,}\b/.test(t) },
];

/** Hand-written rules for spam: each new rule catches some spam and wrongly flags some real messages. */
export function SpamRulesViz() {
  const [on, setOn] = useState<Record<string, boolean>>({ free: true });
  const active = RULES.filter((r) => on[r.key]);
  const flagged = (m: Msg) => active.some((r) => r.test(m.text));
  const caught = MESSAGES.filter((m) => m.spam && flagged(m)).length;
  const falseAlarms = MESSAGES.filter((m) => !m.spam && flagged(m)).length;
  const missed = MESSAGES.filter((m) => m.spam && !flagged(m)).length;

  return (
    <figure className="viz">
      <p className="viz-caption" style={{ marginTop: 0 }}>Mark a message as spam if it matches <em>any</em> rule you switch on:</p>
      <div className="viz-controls">
        {RULES.map((r) => (
          <button key={r.key} type="button" className={on[r.key] ? "btn btn-primary" : "btn"} aria-pressed={!!on[r.key]} onClick={() => setOn({ ...on, [r.key]: !on[r.key] })}>
            {r.label}
          </button>
        ))}
      </div>
      <ul className="tagger">
        {MESSAGES.map((m) => {
          const f = flagged(m);
          const right = f === m.spam;
          return (
            <li key={m.text} className={`tagger-row ${right ? "is-right" : "is-wrong"}`}>
              <p className="tagger-text" style={{ marginBottom: 4 }}>{m.text}</p>
              <p className="tagger-why" style={{ marginTop: 0 }}>
                {m.spam ? "Really spam" : "Really fine"} · your rules say {f ? "spam" : "fine"}{right ? "" : " ✗"}
              </p>
            </li>
          );
        })}
      </ul>
      <figcaption className="viz-caption" aria-live="polite">
        Caught {caught} of 5 spam messages, missed {missed}, and wrongly flagged {falseAlarms} of 5 real ones. Try to get all
        ten right with these rules. Every rule that catches more spam also hits some real messages, because real people
        say &ldquo;free&rdquo;, send links and use exclamation marks too.
      </figcaption>
    </figure>
  );
}
