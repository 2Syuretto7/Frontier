import katex from "katex";

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function tex(src: string, display: boolean) {
  try {
    return katex.renderToString(src, { displayMode: display, throwOnError: true, strict: "ignore", trust: false });
  } catch {
    return `<code>${escape(src)}</code>`;
  }
}

function inline(text: string): string {
  // Split out inline maths first so emphasis markers inside TeX are left alone.
  const parts = text.split(/(\$[^$\n]+\$)/g);
  return parts
    .map((part) => {
      if (/^\$[^$\n]+\$$/.test(part)) return tex(part.slice(1, -1), false);
      return escape(part)
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/(^|[\s(])\*([^*\s][^*]*?)\*(?=[\s).,;:!?]|$)/g, "$1<em>$2</em>")
        .replace(/`([^`]+)`/g, "<code>$1</code>");
    })
    .join("");
}

/**
 * Renders Parton's replies: paragraphs, bullet and numbered lists, bold, italics,
 * inline maths in $...$ and display maths in $$...$$. Everything else is escaped.
 */
export function renderParton(text: string): string {
  const out: string[] = [];
  const blocks = text.replace(/\r\n/g, "\n").split(/\$\$([\s\S]+?)\$\$/g);
  blocks.forEach((chunk, i) => {
    if (i % 2 === 1) { out.push(tex(chunk.trim(), true)); return; }
    for (const para of chunk.split(/\n{2,}/)) {
      const lines = para.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) continue;
      if (lines.every((l) => /^[-*] /.test(l))) {
        out.push(`<ul>${lines.map((l) => `<li>${inline(l.slice(2))}</li>`).join("")}</ul>`);
      } else if (lines.every((l) => /^\d+[.)] /.test(l))) {
        out.push(`<ol>${lines.map((l) => `<li>${inline(l.replace(/^\d+[.)] /, ""))}</li>`).join("")}</ol>`);
      } else {
        out.push(`<p>${lines.map(inline).join("<br>")}</p>`);
      }
    }
  });
  return out.join("");
}
