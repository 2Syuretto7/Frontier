import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BoilerplateViz } from "@/components/viz/BoilerplateViz";
import type { LessonContent } from "@/lib/types";

const EXTRACT = `import re

BLOCK = {"p", "div", "li", "h1", "h2", "h3", "br", "tr", "td", "section", "article", "header", "footer", "nav"}
SKIP = {"script", "style"}

def blocks(html):
    out, text, link, in_a, skip = [], "", 0, 0, 0
    for close, tag, chunk in re.findall(r"<(/?)(\\w+)[^>]*>|([^<]+)", html):
        tag = tag.lower()
        if chunk:
            if not skip:
                words = " ".join(chunk.split())
                if words:
                    text += (" " if text else "") + words
                    link += len(words) if in_a else 0   # characters of text inside links
        elif tag in SKIP:
            skip += -1 if close else 1
        elif tag == "a":
            in_a += -1 if close else 1
        elif tag in BLOCK and text:               # a block tag ends the current block
            out.append((text, link)); text, link = "", 0
    if text:
        out.append((text, link))
    return out

def link_density(block):
    text, link = block
    return link / len(text)

def extract(html, min_words=5, max_ld=0.3):
    keep = [t for t, l in blocks(html) if len(t.split()) >= min_words and link_density((t, l)) <= max_ld]
    return "\\n".join(keep)`;

const CLEAN = `import html
from collections import Counter

def normalize_ws(text):
    lines = (" ".join(l.split()) for l in html.unescape(text).splitlines())
    return "\\n".join(l for l in lines if l)

def extraction_f1(pred, gold):
    p, g = Counter(pred.split()), Counter(gold.split())
    hit = sum((p & g).values())                   # words in common, counted with multiplicity
    if hit == 0:
        return 0.0
    precision, recall = hit / sum(p.values()), hit / sum(g.values())
    return 2 * precision * recall / (precision + recall)

def boilerplate_lines(pages, min_frac=0.5):
    c = Counter(l for page in pages for l in set(page.splitlines()))
    return {l for l, n in c.items() if n >= min_frac * len(pages)}   # lines repeated across a site`;

export const lesson: LessonContent = {
  id: "e11.2.1",
  minutes: 45,
  links: {
    requires: ["e11.1.1", "e1.7.2"],
    revisits: ["e11.1.4", "l8.1.2"],
    foreshadows: ["e11.2.3", "e11.3.1"],
  },

  puzzle: (
    <>
      <p>
        Two teams build corpora from the same web archive snapshots, with the same filters and deduplication. One uses the archive&apos;s
        ready-made plain text; the other downloads the raw HTML and extracts text itself. Small models trained on the second corpus
        score noticeably better. The pages are identical. What differs is which parts of each page became training text. What does a
        good extractor keep, and how is that measured?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A web page is mostly not its article: menus, related links, cookie notices, share buttons and footers often outnumber the words
        of the content. These parts are repeated across pages and carry little language worth learning. Two cheap signals separate them.
        Boilerplate blocks are short or mostly links, while article paragraphs are long and mostly plain text. And lines that recur on
        many pages of the same site are boilerplate by definition.
      </p>
      <BoilerplateViz />
    </>
  ),

  theory: (
    <>
      <Definition title="blocks and link density">
        <p>
          <C>blocks</C> walks the tags and text of a page, skipping scripts and styles, and starts a new block at each block-level tag.
          For each block it records the text, with whitespace collapsed, and how many of its characters lie inside links. The link
          density of a block is that count divided by its length (<C>link_density</C>). <C>extract</C> keeps blocks with at least a
          minimum number of words and link density at most a threshold.
        </p>
        <Code>{EXTRACT}</Code>
      </Definition>

      <Definition title="cleaning and evaluation">
        <p>
          <C>normalize_ws</C> decodes HTML entities and collapses whitespace, dropping empty lines. Extractors are evaluated against
          hand-marked article text with word-level F1 (<C>extraction_f1</C>): with P the multiset of extracted words, G the gold words
          and h the size of their multiset intersection, precision is <M>{"h/|P|"}</M> and recall <M>{"h/|G|"}</M>.{" "}
          <C>boilerplate_lines</C> finds lines that appear on at least a given fraction of a site&apos;s pages.
        </p>
        <Code>{CLEAN}</Code>
      </Definition>

      <Theorem title="what removing a block does to F1">
        <p>
          <M>{"F_1 = 2h/(|P| + |G|)"}</M>. Removing an extracted block that contains no gold words never lowers it; removing a block of
          a &gt; 0 words that are all matched gold words always lowers it.
        </p>
      </Theorem>
      <Proof>
        <p>
          The harmonic mean of <M>{"h/|P|"}</M> and <M>{"h/|G|"}</M> is <M>{"2h/(|P| + |G|)"}</M>. Removing b words outside the gold
          leaves h fixed and shrinks the denominator. Removing a matched gold words gives <M>{"2(h - a)/(|P| + |G| - a)"}</M>, which is
          smaller than <M>{"2h/(|P| + |G|)"}</M> exactly when <M>{"h < |P| + |G|"}</M>, true since <M>{"h \\le |P|"}</M> and{" "}
          <M>{"|G| > 0"}</M>.
        </p>
      </Proof>

      <Remark title="extractors in practice">
        <p>
          Production extractors such as trafilatura, jusText and resiliparse combine these signals with the page&apos;s structure and
          site-specific rules. The FineWeb ablations found that extracting from raw HTML with trafilatura beat the archive&apos;s
          plain-text files, and DCLM used resiliparse for speed. Extraction also decides what happens to mathematics, code blocks and
          tables, which naive extraction flattens or drops; sets built for mathematics handle rendered equations specially. What remains
          after extraction still needs language identification (e11.2.3) and quality filtering (e11.3.1).
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          The ready-made text kept menus, link lists and notices from every page, so a large share of its tokens were boilerplate seen
          thousands of times. Extracting from HTML with block-level signals and site-level line counts removed most of it, and the model
          spent its tokens on article text instead.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "f1",
      rung: "check",
      prompt: (
        <p>
          An extractor outputs 120 words, 90 of which match the article; the article has 100 words. What is the word-level F1? Give
          three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.818, tolerance: 0.001 },
    },
    {
      key: "lines",
      rung: "check",
      prompt: (
        <p>
          A site has 40 pages. With <C>min_frac=0.8</C>, on at least how many of its pages must a line appear to be treated as
          boilerplate?
        </p>
      ),
      answer: { kind: "numeric", value: 32, tolerance: 0 },
    },
    {
      key: "density",
      rung: "apply",
      prompt: <p>Why is link density a good signal for boilerplate?</p>,
      answer: {
        kind: "choice",
        options: [
          "Menus, related stories and footers consist mostly of links, while article paragraphs are mostly plain text",
          "Links are always shorter than words",
          "Search engines remove links before indexing",
          "Pages with links cannot be tokenised",
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

BLOCK = {"p", "div", "li", "h1", "h2", "h3", "br", "tr", "td", "section", "article", "header", "footer", "nav"}
SKIP = {"script", "style"}

def blocks(html):
    out, text, link, in_a, skip = [], "", 0, 0, 0
    for close, tag, chunk in re.findall(r"<(/?)(\\w+)[^>]*>|([^<]+)", html):
        tag = tag.lower()
        if chunk:
            if not skip:
                words = " ".join(chunk.split())
                if words:
                    text += (" " if text else "") + words
                    link += len(words) if in_a else 0   # characters of text inside links
        elif tag in SKIP:
            skip += -1 if close else 1
        elif tag == "a":
            in_a += -1 if close else 1
        elif tag in BLOCK and text:               # a block tag ends the current block
            out.append((text, link)); text, link = "", 0
    if text:
        out.append((text, link))
    return out

def link_density(block):
    text, link = block
    return link / len(text)

def extract(html, min_words=5, max_ld=0.3):
    keep = [t for t, l in blocks(html) if len(t.split()) >= min_words and link_density((t, l)) <= max_ld]
    return "\\n".join(keep)

h = "<nav><a href=/>Home</a> <a href=/x>News</a></nav><p>Rain is <a href=/r>likely</a> today in the hills.</p><script>var x = 1;</script><p>Short</p>"
print(blocks(h)[0], round(link_density(blocks(h)[1]), 2), extract(h, 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "('Home News', 8) 0.18 Rain is likely today in the hills.",
          "('Home News', 9) 0.18 Rain is likely today in the hills.",
          "('Home News', 8) 0.21 Rain is likely today in the hills.",
          "('Home News', 8) 0.18 Rain is today in the hills.",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import html
from collections import Counter

def normalize_ws(text):
    lines = (" ".join(l.split()) for l in html.unescape(text).splitlines())
    return "\\n".join(l for l in lines if l)

def extraction_f1(pred, gold):
    p, g = Counter(pred.split()), Counter(gold.split())
    hit = sum((p & g).values())                   # words in common, counted with multiplicity
    if hit == 0:
        return 0.0
    precision, recall = hit / sum(p.values()), hit / sum(g.values())
    return 2 * precision * recall / (precision + recall)

def boilerplate_lines(pages, min_frac=0.5):
    c = Counter(l for page in pages for l in set(page.splitlines()))
    return {l for l, n in c.items() if n >= min_frac * len(pages)}   # lines repeated across a site

pages = ["Menu\\nStory one\\nFooter", "Menu\\nStory two\\nFooter", "Story three"]
print(normalize_ws(" a&amp;b \\n\\n  c  d ").split("\\n"), round(extraction_f1("a b b c", "b c d"), 2), sorted(boilerplate_lines(pages, 0.6)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "['a&b', 'c d'] 0.57 ['Footer', 'Menu']",
          "['a&amp;b', 'c d'] 0.57 ['Footer', 'Menu']",
          "['a&b', '', 'c d'] 0.57 ['Footer', 'Menu']",
          "['a&b', 'c d'] 0.67 ['Footer', 'Menu']",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>blocks(html)</C>, returning (text, link_chars) pairs as described, using the tag sets BLOCK and SKIP;{" "}
          <C>link_density(block)</C>; and <C>extract(html, min_words=5, max_ld=0.3)</C>, joining kept blocks with newlines.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import re

BLOCK = {"p", "div", "li", "h1", "h2", "h3", "br", "tr", "td", "section", "article", "header", "footer", "nav"}
SKIP = {"script", "style"}

def blocks(html):
    return [(re.sub(r"<[^>]+>", " ", html), 0)]

def link_density(block):
    return 0.0

def extract(html, min_words=5, max_ld=0.3):
    return html
`,
        solution: EXTRACT,
        tests: [
          { name: "blocks", code: `h = "<div>One <a>two</a>\\n three</div><style>p {}</style><li><A href=1>four five</A></li>tail"\nassert blocks(h) == [("One two three", 3), ("four five", 9), ("tail", 0)]\nassert abs(link_density(("abcd", 1)) - 0.25) < 1e-12` },
          { name: "extract", code: `h = "<p>a b c d e</p><p><a>f g h i j</a></p><p>k l m n</p><p>o p q <a>r</a> s t u v</p>"\nassert extract(h) == "a b c d e\\no p q r s t u v" and extract(h, 4, 1.0) == "a b c d e\\nf g h i j\\nk l m n\\no p q r s t u v"` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>normalize_ws(text)</C>; <C>extraction_f1(pred, gold)</C>, returning 0.0 when nothing matches; and{" "}
          <C>boilerplate_lines(pages, min_frac=0.5)</C>, counting each line at most once per page.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import html
from collections import Counter

def normalize_ws(text):
    return text

def extraction_f1(pred, gold):
    return 1.0

def boilerplate_lines(pages, min_frac=0.5):
    return set()
`,
        solution: CLEAN,
        tests: [
          { name: "clean", code: `assert normalize_ws("\\t x  &lt;y&gt;\\n \\n z") == "x <y>\\nz"\nassert extraction_f1("", "a") == 0.0 and abs(extraction_f1("a a b", "a b b c") - 4 / 7) < 1e-12` },
          { name: "lines", code: `p = ["x\\nx\\ny", "y\\nz", "w"]\nassert boilerplate_lines(p, 0.5) == {"y"} and boilerplate_lines(p, 0.3) == {"x", "y", "z", "w"}` },
        ],
      },
    },
    {
      key: "drop",
      rung: "stretch",
      prompt: (
        <p>
          An extraction has 150 words, 90 of them matched against a 100-word article. A 30-word block with no article words and a 10-word
          block of matched article words are then removed. What is the new F1? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.762, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        HTML at least marks its structure with tags. PDFs place glyphs at coordinates, and scanned documents are images; the next lesson
        recovers reading order and text from them.
      </p>
    </>
  ),
};
