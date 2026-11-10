import { isValidElement, type ReactNode } from "react";
import { M, MD } from "@/components/Math";

const BLOCK = new Set(["p", "div", "section", "blockquote", "h1", "h2", "h3", "h4", "ul", "ol", "table", "tr", "figure", "footer"]);
const CLIENT_REFERENCE = Symbol.for("react.client.reference");
const VISUAL = "[an interactive visualisation]";

/**
 * Turns authored lesson content into plain text with TeX in dollar signs, so Parton reads
 * exactly what the learner reads. Interactive visualisations become a placeholder.
 */
export function toPlainText(node: ReactNode): string {
  return tidy(walk(node));
}

function walk(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number" || typeof node === "bigint") return String(node);
  if (Array.isArray(node)) return node.map(walk).join("");
  if (!isValidElement(node)) return "";
  const { type } = node;
  const props = (node.props ?? {}) as Record<string, unknown> & { children?: ReactNode };

  if (type === M) return `$${String(props.children)}$`;
  if (type === MD) return `\n$$${String(props.children)}$$\n`;
  if (typeof type === "string") {
    const inner = walk(props.children);
    if (type === "br") return "\n";
    if (type === "li") return `\n- ${inner.trim()}`;
    if (type === "td" || type === "th") return ` ${inner.trim()} |`;
    if (type === "tr") return `\n|${inner}`;
    if (type === "em" || type === "i") return `*${inner}*`;
    if (type === "strong" || type === "b") return `**${inner}**`;
    return BLOCK.has(type) ? `\n${inner}\n` : inner;
  }
  if (isClientReference(type)) return `\n${VISUAL}\n`;
  if (typeof type === "function") {
    try {
      const out = (type as (p: unknown) => ReactNode)(props);
      if (out instanceof Promise) return walk(props.children);
      return walk(out);
    } catch {
      // A client component with hooks cannot be called outside React; it is a visualisation.
      return `\n${VISUAL}\n`;
    }
  }
  // Fragments, providers and anything else: read the children.
  return walk(props.children);
}

function isClientReference(type: unknown) {
  return (typeof type === "function" || (typeof type === "object" && type !== null)) &&
    (type as { $$typeof?: symbol }).$$typeof === CLIENT_REFERENCE;
}

function tidy(s: string) {
  return s
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
