/**
 * A heading that develops into place one character at a time.
 * Screen readers get the plain text; the animated letters are hidden from them.
 * Pure CSS, so it runs on the server and respects reduced motion.
 */
export function RevealText({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <>
      <span className="sr-only">{text}</span>
      <span className="burn" aria-hidden="true" style={{ "--burn-delay": `${delay}ms` } as React.CSSProperties}>
        {[...text].map((ch, i) => (
          <span key={i} className="burn-char" style={{ "--i": i } as React.CSSProperties}>
            {ch === " " ? " " : ch}
          </span>
        ))}
      </span>
    </>
  );
}
