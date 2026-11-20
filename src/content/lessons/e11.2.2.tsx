import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ReadingOrderViz } from "@/components/viz/ReadingOrderViz";
import type { LessonContent } from "@/lib/types";

const LAYOUT = `def group_lines(words, tol=2):
    lines = []                                    # words are (x0, x1, y, text), y growing down the page
    for x0, x1, y, t in sorted(words, key=lambda w: (w[2], w[0])):
        if lines and abs(y - lines[-1][0]) <= tol:
            lines[-1][1].append((x0, t))          # same baseline, within tolerance
        else:
            lines.append((y, [(x0, t)]))
    return [" ".join(t for _, t in sorted(ws)) for _, ws in lines]

def find_gutter(words, lo, hi):
    spans = sorted((w[0], w[1]) for w in words)
    merged = [list(spans[0])]
    for a, b in spans[1:]:
        if a <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], b)
        else:
            merged.append([a, b])
    gaps = [(b2 - a1, (a1 + b2) / 2) for (_, a1), (b2, _) in zip(merged, merged[1:])]
    gaps = [g for g in gaps if lo <= g[1] <= hi]  # only gaps near the middle can separate columns
    return max(gaps)[1] if gaps else None

def reading_order(words, lo, hi, tol=2):
    g = find_gutter(words, lo, hi)
    if g is None:
        return group_lines(words, tol)
    left = [w for w in words if w[1] <= g]
    right = [w for w in words if w[0] >= g]
    return group_lines(left, tol) + group_lines(right, tol)   # the whole left column, then the right`;

const REPAIR = `def dehyphenate(lines):
    text = ""
    for line in lines:
        line = line.strip()
        if text.endswith("-") and line[:1].islower():
            text = text[:-1] + line               # a word broken across lines
        else:
            text += (" " if text else "") + line
    return text

def edit_distance(a, b):
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]

def cer(pred, ref):
    return edit_distance(pred, ref) / len(ref)   # character error rate`;

export const lesson: LessonContent = {
  id: "e11.2.2",
  minutes: 45,
  links: {
    requires: ["e11.2.1", "e2.8.3"],
    revisits: ["e2.7.3", "e11.1.3"],
    foreshadows: ["e11.2.3"],
  },

  puzzle: (
    <>
      <p>
        A team converts a million scientific PDFs to text. Spot checks show sentences that jump mid-phrase into unrelated topics, words
        such as &quot;prob- lem&quot; split in two, and in older scanned papers, &quot;rn&quot; read as &quot;m&quot;. The PDFs display
        perfectly. Why is their text so hard to get out, and how can the damage be measured and repaired?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A PDF is a set of drawing instructions: put this glyph at these coordinates. It stores no paragraphs, lines or reading order;
        an extractor has to infer them from geometry. Words with nearly the same height form a line, a vertical strip with no words
        separates columns, and a hyphen at the end of a line followed by a lower-case word is usually a word broken across lines.
        Scanned pages have no text at all, only an image, so they need optical character recognition, whose errors are counted in
        character edits.
      </p>
      <ReadingOrderViz />
    </>
  ),

  theory: (
    <>
      <Definition title="lines, gutters and reading order">
        <p>
          Words are boxes (x0, x1, y, text). <C>group_lines</C> sorts them by height and joins words within a tolerance of the
          line&apos;s first word into one line, ordered left to right. <C>find_gutter</C> merges the horizontal extents of all words
          and returns the middle of the widest gap whose middle lies between lo and hi. <C>reading_order</C> reads the column left of
          the gutter, then the column right of it.
        </p>
        <Code>{LAYOUT}</Code>
      </Definition>

      <Theorem title="where a gutter can be">
        <p>
          A vertical line x = g with min x0 &lt; g &lt; max x1 crosses no word exactly when g lies strictly inside a gap between
          consecutive merged intervals.
        </p>
      </Theorem>
      <Proof>
        <p>
          Merging overlapping intervals in order of their left ends produces disjoint intervals whose union is the union of the word
          extents: each new interval either overlaps the last merged one, and is absorbed, or starts after it. A point between the
          leftmost and rightmost word that is in no extent is therefore in no merged interval, so it falls strictly between two
          consecutive ones, and conversely.
        </p>
      </Proof>

      <Definition title="repairing and scoring text">
        <p>
          <C>dehyphenate</C> joins lines, removing a final hyphen when the next line starts with a lower-case letter. The edit distance
          between strings is the fewest single-character insertions, deletions and substitutions turning one into the other, computed
          by dynamic programming (e2.8.3) in <C>edit_distance</C>. The character error rate of OCR output is its edit distance from a
          reference divided by the reference length (<C>cer</C>).
        </p>
        <Code>{REPAIR}</Code>
      </Definition>

      <Theorem title="bounds on edit distance">
        <p>
          For strings a and b, <M>{"\\big||a| - |b|\\big| \\le d(a, b) \\le \\max(|a|, |b|)"}</M>. In particular the character error
          rate can exceed 1 when the output is longer than the reference.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each edit changes the length by at most one, so at least <M>{"\\big||a| - |b|\\big|"}</M> edits are needed. Conversely,
          substituting the first <M>{"\\min(|a|, |b|)"}</M> characters and then inserting or deleting the rest uses{" "}
          <M>{"\\max(|a|, |b|)"}</M> edits.
        </p>
      </Proof>

      <Remark title="extraction tools">
        <p>
          Rule-based PDF tools read glyph positions and apply heuristics like these, with more cases: headers and footers, full-width
          titles above two columns, footnotes, tables and figures. Learned models now read pages as images and emit markup directly,
          recovering equations as LaTeX; Nougat and its successors were trained on paired arXiv source and rendered pages, the source
          of e11.1.3. Dehyphenation has its own errors, as with words such as pre-training that keep their hyphen, which is why
          pipelines check candidate joins against a vocabulary. Character error rates are measured on a hand-transcribed sample, since
          they vary widely with scan quality.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          The jumping sentences came from reading two-column pages line by line across both columns; finding the gutter fixes the
          order. The split words were line-end hyphens, which dehyphenation rejoins. The rn-for-m errors were OCR on scanned pages,
          and character error rate on a sample tells the team which scans to re-process or drop.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "cer",
      rung: "check",
      prompt: (
        <p>
          OCR of a 1000-character page makes 12 substitutions, 5 insertions and 3 deletions, and these are the fewest edits. What is the
          character error rate? Give a decimal.
        </p>
      ),
      answer: { kind: "numeric", value: 0.02, tolerance: 0.0001 },
    },
    {
      key: "gutter",
      rung: "check",
      prompt: (
        <p>
          Words span x from 10 to 50, 40 to 90, 130 to 170 and 150 to 200. With lo = 60 and hi = 140, where does <C>find_gutter</C>{" "}
          place the gutter?
        </p>
      ),
      answer: { kind: "numeric", value: 110, tolerance: 0 },
    },
    {
      key: "order",
      rung: "apply",
      prompt: <p>Why does sorting all lines of a two-column PDF page by height scramble the text?</p>,
      answer: {
        kind: "choice",
        options: [
          "Lines at the same height in the two columns are interleaved, so the text alternates between columns",
          "PDFs store lines from bottom to top",
          "Sorting breaks words at hyphens",
          "The right column is always rendered in a different font",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def group_lines(words, tol=2):
    lines = []                                    # words are (x0, x1, y, text), y growing down the page
    for x0, x1, y, t in sorted(words, key=lambda w: (w[2], w[0])):
        if lines and abs(y - lines[-1][0]) <= tol:
            lines[-1][1].append((x0, t))          # same baseline, within tolerance
        else:
            lines.append((y, [(x0, t)]))
    return [" ".join(t for _, t in sorted(ws)) for _, ws in lines]

def find_gutter(words, lo, hi):
    spans = sorted((w[0], w[1]) for w in words)
    merged = [list(spans[0])]
    for a, b in spans[1:]:
        if a <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], b)
        else:
            merged.append([a, b])
    gaps = [(b2 - a1, (a1 + b2) / 2) for (_, a1), (b2, _) in zip(merged, merged[1:])]
    gaps = [g for g in gaps if lo <= g[1] <= hi]  # only gaps near the middle can separate columns
    return max(gaps)[1] if gaps else None

def reading_order(words, lo, hi, tol=2):
    g = find_gutter(words, lo, hi)
    if g is None:
        return group_lines(words, tol)
    left = [w for w in words if w[1] <= g]
    right = [w for w in words if w[0] >= g]
    return group_lines(left, tol) + group_lines(right, tol)   # the whole left column, then the right

w = [(10, 40, 100, "The"), (45, 80, 101, "model"), (120, 160, 100, "Results"), (10, 50, 112, "learns."), (120, 150, 112, "vary.")]
print(group_lines(w), find_gutter(w, 60, 140), reading_order(w, 60, 140))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "['The model Results', 'learns. vary.'] 100.0 ['The model', 'learns.', 'Results', 'vary.']",
          "['The model Results', 'learns. vary.'] 100.0 ['The model', 'Results', 'learns.', 'vary.']",
          "['The model Results', 'learns. vary.'] 85.0 ['The model', 'learns.', 'Results', 'vary.']",
          "['The', 'model Results', 'learns. vary.'] 100.0 ['The model', 'learns.', 'Results', 'vary.']",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def dehyphenate(lines):
    text = ""
    for line in lines:
        line = line.strip()
        if text.endswith("-") and line[:1].islower():
            text = text[:-1] + line               # a word broken across lines
        else:
            text += (" " if text else "") + line
    return text

def edit_distance(a, b):
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]

def cer(pred, ref):
    return edit_distance(pred, ref) / len(ref)   # character error rate

print(dehyphenate(["data pre-", "processing is well-", "Known"]), edit_distance("kitten", "sitting"), round(cer("hallo", "hello"), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "data preprocessing is well- Known 3 0.2",
          "data pre-processing is well- Known 3 0.2",
          "data preprocessing is wellKnown 3 0.2",
          "data preprocessing is well- Known 2 0.2",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>group_lines(words, tol=2)</C>; <C>find_gutter(words, lo, hi)</C>, returning None when no gap&apos;s middle lies in
          [lo, hi]; and <C>reading_order(words, lo, hi, tol=2)</C>, which falls back to <C>group_lines</C> when there is no gutter.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def group_lines(words, tol=2):
    return [w[3] for w in words]

def find_gutter(words, lo, hi):
    return None

def reading_order(words, lo, hi, tol=2):
    return group_lines(words, tol)
`,
        solution: LAYOUT,
        tests: [
          { name: "lines", code: `w = [(50, 60, 21, "b"), (0, 10, 20, "a"), (20, 30, 24, "c"), (0, 5, 30, "d")]\nassert group_lines(w) == ["a b", "c", "d"] and group_lines(w, 4) == ["a c b", "d"]\nassert find_gutter(w, 0, 100) == 40.0 and find_gutter(w, 0, 12) is None and find_gutter(w, 0, 20) == 15.0` },
          { name: "order", code: `w = [(0, 40, 0, "A1"), (60, 100, 0, "B1"), (0, 40, 10, "A2"), (60, 100, 10, "B2"), (0, 100, 30, "wide")]\nassert reading_order(w[:4], 30, 70) == ["A1", "A2", "B1", "B2"]\nassert reading_order(w, 30, 70) == ["A1 B1", "A2 B2", "wide"]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>dehyphenate(lines)</C>, joining stripped lines with spaces except across a broken word; <C>edit_distance(a, b)</C>;
          and <C>cer(pred, ref)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def dehyphenate(lines):
    return " ".join(lines)

def edit_distance(a, b):
    return abs(len(a) - len(b))

def cer(pred, ref):
    return 0.0
`,
        solution: REPAIR,
        tests: [
          { name: "hyphen", code: `assert dehyphenate([" ab-", "cd ", "e-", "F", "-", "g"]) == "abcd e- F g" and dehyphenate([]) == ""` },
          { name: "edits", code: `assert edit_distance("", "abc") == 3 and edit_distance("abc", "acb") == 2 and edit_distance("sunday", "saturday") == 3\nassert abs(cer("abcd", "ab") - 1.0) < 1e-12` },
        ],
      },
    },
    {
      key: "maxcer",
      rung: "stretch",
      prompt: <p>An OCR output has 30 characters and its reference has 10. What is the largest possible character error rate?</p>,
      answer: { kind: "numeric", value: 3, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Extracted text arrives in hundreds of languages, often several on one page. The next lesson identifies the language of each
        document, and of each line, so that the corpus can be balanced and filtered by language.
      </p>
    </>
  ),
};
