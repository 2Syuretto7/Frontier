import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LengthShareViz } from "@/components/viz/LengthShareViz";
import type { LessonContent } from "@/lib/types";

const LATEX = `import re

def strip_comments(tex):
    return re.sub(r"(?<!\\\\)%.*", "", tex)         # an unescaped % comments out the rest of its line

def expand_macros(tex):
    body = r"\\{((?:[^{}]|\\{[^{}]*\\})*)\\}"              # braces may nest one level deep
    defs = dict(re.findall(r"\\\\newcommand\\{\\\\([a-zA-Z]+)\\}" + body, tex))
    tex = re.sub(r"\\\\newcommand\\{\\\\[a-zA-Z]+\\}" + body + r"\\n?", "", tex)
    for _ in range(10):                           # a macro body may use other macros
        new = re.sub(r"\\\\([a-zA-Z]+)", lambda m: defs.get(m.group(1), m.group(0)), tex)
        if new == tex:
            break
        tex = new
    return tex

def extract_body(tex):
    m = re.search(r"\\\\begin\\{document\\}(.*?)\\\\end\\{document\\}", tex, re.S)
    body = m.group(1) if m else tex
    body = re.sub(r"\\\\begin\\{thebibliography\\}.*?\\\\end\\{thebibliography\\}", "", body, flags=re.S)
    return body.strip()`;

const BOOKS = `def strip_gutenberg(text):
    lines = text.splitlines()
    start = next((i for i, l in enumerate(lines) if l.startswith("*** START OF")), -1)
    end = next((i for i, l in enumerate(lines) if l.startswith("*** END OF")), len(lines))
    return "\\n".join(lines[start + 1:end]).strip()   # the licence header and footer are not the book

def public_domain(death_years, year, term=70):
    if not death_years or None in death_years:
        return False                              # an unknown author cannot be cleared
    return max(death_years) + term < year         # protection runs to the end of the term's last year

def chunk(tokens, ctx, overlap=0):
    step = ctx - overlap
    return [tokens[i:i + ctx] for i in range(0, max(len(tokens) - overlap, 1), step)]`;

export const lesson: LessonContent = {
  id: "e11.1.3",
  minutes: 45,
  links: {
    requires: ["e11.1.1", "l8.1.3"],
    revisits: ["e1.7.2", "l8.1.2"],
    foreshadows: ["e11.2.2", "e11.6.1"],
  },

  puzzle: (
    <>
      <p>
        A corpus has a billion web pages and a hundred thousand books. A teammate says the books hardly matter, being a ten-thousandth
        of the documents. Another says they are among the most valuable text available: long, edited, coherent across hundreds of
        pages. Both are looking at the same numbers. Who is right, and what does it take to turn a book or a paper into clean
        training text?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A model trains on tokens, not documents, so a source&apos;s weight is its document count times its typical length. Books and
        papers are short lists of very long documents. Their value is in the long-range structure: arguments, proofs and plots that
        develop over thousands of tokens. Getting clean text needs format-specific work. For papers, the LaTeX source is better than the
        PDF: strip comments, expand the author&apos;s macros, keep the body and drop the bibliography. For books, the question is first
        whether the text may be used at all, and then removing the archive&apos;s own header and footer.
      </p>
      <LengthShareViz />
    </>
  ),

  theory: (
    <>
      <Definition title="cleaning LaTeX">
        <p>
          <C>strip_comments</C> removes from each unescaped <C>%</C> to the end of its line. <C>expand_macros</C> reads argument-free
          definitions <C>\newcommand{"{\\name}{body}"}</C>, removes them and substitutes bodies until nothing changes, so macros defined
          through other macros expand fully. <C>extract_body</C> keeps the text between the document markers and drops the
          bibliography environment.
        </p>
        <Code>{LATEX}</Code>
      </Definition>

      <Definition title="books, rights and windows">
        <p>
          <C>strip_gutenberg</C> keeps the lines between an archive&apos;s start and end markers. Under a life-plus-70 rule, a work
          enters the public domain on 1 January after 70 full years have passed since the death of its last surviving author;{" "}
          <C>public_domain</C> treats an unknown death year as not cleared. Other countries use other terms, and the United States
          also has rules based on the year of publication. <C>chunk</C> cuts a long token sequence into windows of length ctx, each
          sharing overlap tokens with the one before.
        </p>
        <Code>{BOOKS}</Code>
      </Definition>

      <Theorem title="token share">
        <p>
          If source s has <M>{"n_s"}</M> documents of mean length <M>{"\\bar\\ell_s"}</M>, its share of tokens is{" "}
          <M>{"n_s \\bar\\ell_s / \\sum_t n_t \\bar\\ell_t"}</M>, which is its share of documents times{" "}
          <M>{"\\bar\\ell_s / \\bar\\ell"}</M>, where <M>{"\\bar\\ell"}</M> is the mean length over the whole corpus.
        </p>
      </Theorem>
      <Proof>
        <p>
          The source holds <M>{"n_s \\bar\\ell_s"}</M> tokens out of <M>{"\\sum_t n_t \\bar\\ell_t = N\\bar\\ell"}</M>, with N the total
          number of documents. Dividing, the token share is <M>{"(n_s/N)(\\bar\\ell_s/\\bar\\ell)"}</M>.
        </p>
      </Proof>

      <Theorem title="how many windows">
        <p>
          For a sequence of n tokens with n &gt; o, <C>chunk</C> with window c and overlap o, where o &lt; c, returns{" "}
          <M>{"\\lceil (n - o)/(c - o) \\rceil"}</M> windows, covers every token, and consecutive windows share o tokens, except that the
          last window may be shorter.
        </p>
      </Theorem>
      <Proof>
        <p>
          Windows start at <M>{"0, s, 2s, \\dots"}</M> with stride <M>{"s = c - o"}</M>, for every start below n − o. That is{" "}
          <M>{"\\lceil (n - o)/s \\rceil"}</M> starts. Window k covers <M>{"[ks, ks + c)"}</M> and window k + 1 starts at{" "}
          <M>{"ks + s = ks + c - o"}</M>, inside window k, so they overlap in o positions and leave no gap. The last start is at least{" "}
          <M>{"n - o - s = n - c"}</M>, so the last window reaches position n.
        </p>
      </Proof>

      <Remark title="sources in practice">
        <p>
          arXiv provides LaTeX source for most of its papers, which keeps equations as text a model can learn to write; PDFs need the
          extraction methods of e11.2.2. Project Gutenberg offers tens of thousands of public-domain books. Collections of in-copyright
          books have been the subject of lawsuits, and the rights question shapes which books any corpus can contain. Because long
          documents are a large share of tokens, mixture weights (e11.6.1) are set in tokens, and long sources are often repeated
          fewer times than their quality would suggest, to stay within the repetition limits of l8.1.3.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          Both are right about different quantities. A book of a hundred thousand tokens weighs as much as a couple of hundred web
          pages, so a hundred thousand books can rival a much larger web crawl in tokens. Their worth is in their length and coherence,
          which is also why they need careful cleaning and a clear right to use them.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "windows",
      rung: "check",
      prompt: <p>A book of 100,000 tokens is cut into windows of 4096 tokens with no overlap. How many windows are there?</p>,
      answer: { kind: "numeric", value: 25, tolerance: 0 },
    },
    {
      key: "share",
      rung: "check",
      prompt: (
        <p>
          A corpus has 1000 web pages of mean length 500 tokens and 10 books of mean length 100,000 tokens. What share of its tokens
          come from books? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.667, tolerance: 0.001 },
    },
    {
      key: "source",
      rung: "apply",
      prompt: <p>Why do corpus builders prefer a paper&apos;s LaTeX source to its PDF?</p>,
      answer: {
        kind: "choice",
        options: [
          "The source keeps equations and structure as text, while a PDF must be reconstructed from positioned glyphs",
          "The source is always shorter than the PDF",
          "PDFs cannot contain mathematics",
          "LaTeX source carries no copyright",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import re

def strip_comments(tex):
    return re.sub(r"(?<!\\\\)%.*", "", tex)         # an unescaped % comments out the rest of its line

def expand_macros(tex):
    body = r"\\{((?:[^{}]|\\{[^{}]*\\})*)\\}"              # braces may nest one level deep
    defs = dict(re.findall(r"\\\\newcommand\\{\\\\([a-zA-Z]+)\\}" + body, tex))
    tex = re.sub(r"\\\\newcommand\\{\\\\[a-zA-Z]+\\}" + body + r"\\n?", "", tex)
    for _ in range(10):                           # a macro body may use other macros
        new = re.sub(r"\\\\([a-zA-Z]+)", lambda m: defs.get(m.group(1), m.group(0)), tex)
        if new == tex:
            break
        tex = new
    return tex

def extract_body(tex):
    m = re.search(r"\\\\begin\\{document\\}(.*?)\\\\end\\{document\\}", tex, re.S)
    body = m.group(1) if m else tex
    body = re.sub(r"\\\\begin\\{thebibliography\\}.*?\\\\end\\{thebibliography\\}", "", body, flags=re.S)
    return body.strip()

t = "\\\\newcommand{\\\\R}{\\\\mathbb{R}}\\n\\\\newcommand{\\\\Rn}{\\\\R^n}\\n\\\\begin{document}\\nLet $x \\\\in \\\\Rn$. % 50\\\\% done\\n\\\\end{document}"
print(extract_body(expand_macros(strip_comments(t))))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "Let $x \\in \\mathbb{R}^n$.",
          "Let $x \\in \\Rn$.",
          "Let $x \\in \\R^n$.",
          "Let $x \\in \\mathbb{R}^n$. 50\\% done",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def strip_gutenberg(text):
    lines = text.splitlines()
    start = next((i for i, l in enumerate(lines) if l.startswith("*** START OF")), -1)
    end = next((i for i, l in enumerate(lines) if l.startswith("*** END OF")), len(lines))
    return "\\n".join(lines[start + 1:end]).strip()   # the licence header and footer are not the book

def public_domain(death_years, year, term=70):
    if not death_years or None in death_years:
        return False                              # an unknown author cannot be cleared
    return max(death_years) + term < year         # protection runs to the end of the term's last year

def chunk(tokens, ctx, overlap=0):
    step = ctx - overlap
    return [tokens[i:i + ctx] for i in range(0, max(len(tokens) - overlap, 1), step)]

print(public_domain([1950, 1956], 2026), public_domain([1955], 2026), [len(c) for c in chunk(list(range(10)), 4, 2)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["False True [4, 4, 4, 4]", "True True [4, 4, 4, 4]", "False False [4, 4, 4, 4]", "False True [4, 4, 4, 2]"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>strip_comments(tex)</C>; <C>expand_macros(tex)</C> for argument-free <C>\newcommand</C> definitions whose bodies
          nest braces at most one level deep; and <C>extract_body(tex)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import re

def strip_comments(tex):
    return tex

def expand_macros(tex):
    return tex

def extract_body(tex):
    return tex.strip()
`,
        solution: LATEX,
        tests: [
          { name: "clean", code: `assert strip_comments("a % b\\nc \\\\% d % e") == "a \\nc \\\\% d "\nt = "\\\\newcommand{\\\\eps}{\\\\varepsilon}\\n\\\\newcommand{\\\\E}{\\\\mathbf{E}_{\\\\eps}}\\n$\\\\E \\\\eps \\\\alpha$"\nassert expand_macros(t) == "$\\\\mathbf{E}_{\\\\varepsilon} \\\\varepsilon \\\\alpha$"` },
          { name: "body", code: `t = "x\\\\begin{document} Hi \\\\begin{thebibliography}{9} refs \\\\end{thebibliography} bye \\\\end{document}y"\nassert extract_body(t) == "Hi  bye" and extract_body(" plain ") == "plain"` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>strip_gutenberg(text)</C>, keeping the stripped text strictly between the line starting &quot;*** START OF&quot; and
          the line starting &quot;*** END OF&quot;; <C>public_domain(death_years, year, term=70)</C>; and{" "}
          <C>chunk(tokens, ctx, overlap=0)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def strip_gutenberg(text):
    return text

def public_domain(death_years, year, term=70):
    return True

def chunk(tokens, ctx, overlap=0):
    return [tokens]
`,
        solution: BOOKS,
        tests: [
          { name: "book", code: `t = "Licence\\n*** START OF THE BOOK ***\\n\\nCall me Ishmael.\\n*** END OF THE BOOK ***\\nmore licence"\nassert strip_gutenberg(t) == "Call me Ishmael." and strip_gutenberg(" body ") == "body"\nassert public_domain([1900], 1971) and not public_domain([1900], 1970) and not public_domain([1800, None], 2000) and not public_domain([], 2000)` },
          { name: "chunk", code: `assert chunk(list(range(7)), 3) == [[0, 1, 2], [3, 4, 5], [6]]\nassert chunk(list(range(7)), 4, 1) == [[0, 1, 2, 3], [3, 4, 5, 6]] and chunk([1, 2], 5, 2) == [[1, 2]]` },
        ],
      },
    },
    {
      key: "overlap",
      rung: "stretch",
      prompt: (
        <p>
          A paper of 10,000 tokens is cut into windows of 2048 tokens, each sharing 512 tokens with the one before. How many windows are
          there?
        </p>
      ),
      answer: { kind: "numeric", value: 7, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Web, code, books and papers are all text that people wrote. The last source lesson looks at data bought under licence and data
        generated by models.
      </p>
    </>
  ),
};
