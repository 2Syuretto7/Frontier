import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BlocklistViz } from "@/components/viz/BlocklistViz";
import type { LessonContent } from "@/lib/types";

const PII = `import re

def luhn_ok(digits):
    total = 0
    for i, ch in enumerate(reversed(digits)):
        d = int(ch)
        if i % 2 == 1:                            # double every second digit from the right
            d = d * 2 - 9 if d > 4 else d * 2
        total += d
    return total % 10 == 0

def find_pii(text):
    found = [("EMAIL", m.start(), m.end()) for m in re.finditer(r"[\\w.+-]+@[\\w-]+(?:\\.[\\w-]+)+", text)]
    for m in re.finditer(r"\\b(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})\\b", text):
        if all(int(g) <= 255 for g in m.groups()):
            found.append(("IP", m.start(), m.end()))
    for m in re.finditer(r"\\b(?:\\d[ -]?){12,18}\\d\\b", text):
        if luhn_ok(re.sub(r"\\D", "", m.group())):   # a valid checksum makes a card number likely
            found.append(("CARD", m.start(), m.end()))
    return sorted(found, key=lambda f: f[1])

def redact(text):
    out, pos = [], 0
    for kind, a, b in find_pii(text):
        if a >= pos:                              # skip spans inside one already replaced
            out += [text[pos:a], f"<{kind}>"]
            pos = b
    return "".join(out) + text[pos:]`;

const BLOCK = `import re

def has_blocked(text, words):
    return any(w in words for w in re.findall(r"[a-z']+", text.lower()))

def removal_rates(docs, groups, words):
    rates = {}
    for g in sorted(set(groups)):
        mine = [d for d, h in zip(docs, groups) if h == g]
        rates[g] = sum(has_blocked(d, words) for d in mine) / len(mine)
    return rates

def disparity(rates):
    lo, hi = min(rates.values()), max(rates.values())
    return float("inf") if lo == 0 else hi / lo   # how many times more often one group is removed`;

export const lesson: LessonContent = {
  id: "e11.3.3",
  minutes: 45,
  links: {
    requires: ["e11.3.2", "e2.8.1"],
    revisits: ["e11.3.1", "e0.4.3"],
    foreshadows: ["e11.4.1", "e11.8.4"],
  },

  puzzle: (
    <>
      <p>
        A model trained on web text completes &quot;Contact me at&quot; with a real person&apos;s email address. Another team, to
        avoid toxic output, removed every page containing any word from a list of a few hundred offensive terms, and later found it had
        also removed much of the text written in some dialects and most medical pages about sexual health. What should be removed for
        privacy and safety, and how can the removal be done without these side effects?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Personal data has recognisable shapes: email addresses, phone numbers, IP addresses, card numbers with valid checksums. These
        can be found with patterns and replaced by placeholders, which keeps the surrounding text. Toxicity has no such shape. A word
        list is fast but blunt, because words that are offensive in one context are reclaimed, quoted or clinical in another, and
        which communities use them varies. Measuring removal rates per group exposes the bluntness; classifiers that read context, and
        thresholds chosen with those measurements, reduce it.
      </p>
      <BlocklistViz />
    </>
  ),

  theory: (
    <>
      <Definition title="finding and redacting personal data">
        <p>
          <C>find_pii</C> returns spans that look like email addresses, IPv4 addresses with every octet at most 255, and runs of 13 to
          19 digits, possibly separated by spaces or hyphens, that pass the Luhn checksum used by payment cards (<C>luhn_ok</C>).{" "}
          <C>redact</C> replaces each span with a placeholder such as <C>{"<EMAIL>"}</C>, skipping spans inside one already replaced.
        </p>
        <Code>{PII}</Code>
      </Definition>

      <Theorem title="what the Luhn check catches">
        <p>
          Changing any single digit of a number that passes the Luhn check makes it fail.
        </p>
      </Theorem>
      <Proof>
        <p>
          Undoubled digits contribute d. Doubled digits contribute f(d) = 2d for d ≤ 4 and 2d − 9 for d ≥ 5, which takes the values 0,
          2, 4, 6, 8, 1, 3, 5, 7, 9, all different. So in either kind of position, changing the digit changes its contribution to a
          different value in 0 to 9, which changes the total mod 10. The check also catches most swaps of adjacent digits, all except
          09 and 90.
        </p>
      </Proof>

      <Definition title="blocklists and their disparities">
        <p>
          <C>has_blocked</C> tests whether any word of a document, lower-cased, is on a list. <C>removal_rates</C> measures, for
          documents labelled with a group such as a dialect or topic, the fraction each group loses, and <C>disparity</C> is the ratio of
          the highest rate to the lowest.
        </p>
        <Code>{BLOCK}</Code>
      </Definition>

      <Theorem title="longer documents are removed more">
        <p>
          If each word of a document is on the list independently with probability q, a document of n words is removed with
          probability <M>{"1 - (1 - q)^n"}</M>, which grows with n and is about nq when nq is small.
        </p>
      </Theorem>
      <Proof>
        <p>
          The document survives only if all n words are unlisted, with probability <M>{"(1 - q)^n"}</M>. For small nq,{" "}
          <M>{"(1 - q)^n = e^{n \\log(1 - q)} \\approx e^{-nq} \\approx 1 - nq"}</M>. So a word rate a few times higher in one group&apos;s
          text becomes a removal rate a few times higher, and long documents, often the most valuable, are the most exposed.
        </p>
      </Proof>

      <Remark title="safety filtering in practice">
        <p>
          C4 removed pages containing any word from a public list of offensive words; an audit of C4 found that this removed text in
          African-American English and text about LGBTQ identities at much higher rates. Later pipelines prefer classifiers that read
          context, applied with thresholds set from measurements like <C>removal_rates</C>, and URL blocklists for adult sites. Some
          labs keep a small, labelled share of toxic text so that the model can recognise it. FineWeb replaced email and IP addresses
          with placeholders rather than removing documents. Regular expressions miss names and addresses in free text, so stronger
          redaction uses named-entity models, and all of it should be documented for users of the data (e11.8.4).
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          Pattern matching with checksums and placeholders removes most addresses and numbers while keeping the text around them. The
          blocklist removed whole documents for single words, at rates that differed several-fold between groups; measuring those rates
          before deciding on a filter, and using a context-aware classifier, would have shown and reduced the damage.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "luhn",
      rung: "check",
      prompt: <p>What final digit makes 7992739871_ pass the Luhn check?</p>,
      answer: { kind: "numeric", value: 3, tolerance: 0 },
    },
    {
      key: "removed",
      rung: "check",
      prompt: (
        <p>
          Each word of a 100-word document is on a blocklist independently with probability 0.001. What is the probability that the
          document is removed? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0952, tolerance: 0.0001 },
    },
    {
      key: "placeholder",
      rung: "apply",
      prompt: <p>Why replace an email address with a placeholder instead of dropping the document?</p>,
      answer: {
        kind: "choice",
        options: [
          "The rest of the document is usually fine to train on, and the placeholder keeps the sentence well formed",
          "Placeholders make the document shorter",
          "Dropping documents is not allowed by robots.txt",
          "The model needs placeholders to learn tokenisation",
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

def luhn_ok(digits):
    total = 0
    for i, ch in enumerate(reversed(digits)):
        d = int(ch)
        if i % 2 == 1:                            # double every second digit from the right
            d = d * 2 - 9 if d > 4 else d * 2
        total += d
    return total % 10 == 0

def find_pii(text):
    found = [("EMAIL", m.start(), m.end()) for m in re.finditer(r"[\\w.+-]+@[\\w-]+(?:\\.[\\w-]+)+", text)]
    for m in re.finditer(r"\\b(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})\\b", text):
        if all(int(g) <= 255 for g in m.groups()):
            found.append(("IP", m.start(), m.end()))
    for m in re.finditer(r"\\b(?:\\d[ -]?){12,18}\\d\\b", text):
        if luhn_ok(re.sub(r"\\D", "", m.group())):   # a valid checksum makes a card number likely
            found.append(("CARD", m.start(), m.end()))
    return sorted(found, key=lambda f: f[1])

def redact(text):
    out, pos = [], 0
    for kind, a, b in find_pii(text):
        if a >= pos:                              # skip spans inside one already replaced
            out += [text[pos:a], f"<{kind}>"]
            pos = b
    return "".join(out) + text[pos:]

t = "Mail ann.lee@uni.edu from 10.0.0.256 or 192.168.1.20, card 4111 1111 1111 1111."
print([k for k, _, _ in find_pii(t)], redact(t).count("<"), luhn_ok("4111111111111112"))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["['EMAIL', 'IP', 'CARD'] 3 False", "['EMAIL', 'IP', 'IP', 'CARD'] 4 False", "['EMAIL', 'IP', 'CARD'] 3 True", "['EMAIL', 'IP'] 2 False"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import re

def has_blocked(text, words):
    return any(w in words for w in re.findall(r"[a-z']+", text.lower()))

def removal_rates(docs, groups, words):
    rates = {}
    for g in sorted(set(groups)):
        mine = [d for d, h in zip(docs, groups) if h == g]
        rates[g] = sum(has_blocked(d, words) for d in mine) / len(mine)
    return rates

def disparity(rates):
    lo, hi = min(rates.values()), max(rates.values())
    return float("inf") if lo == 0 else hi / lo   # how many times more often one group is removed

r = removal_rates(["Damn, it rained", "a lovely day", "DAMN!", "oh, damn it"], ["x", "x", "y", "y"], {"damn"})
print(r, disparity(r), has_blocked("damnation", {"damn"}))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{'x': 0.5, 'y': 1.0} 2.0 False",
          "{'x': 0.5, 'y': 1.0} 2.0 True",
          "{'x': 0.5, 'y': 0.5} 1.0 False",
          "{'x': 0.5, 'y': 1.0} 0.5 False",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>luhn_ok(digits)</C>; <C>find_pii(text)</C>, returning (kind, start, end) triples sorted by start; and{" "}
          <C>redact(text)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import re

def luhn_ok(digits):
    return True

def find_pii(text):
    return []

def redact(text):
    return text
`,
        solution: PII,
        tests: [
          { name: "luhn", code: `assert luhn_ok("79927398713") and not luhn_ok("79927398710") and luhn_ok("0") and not luhn_ok("19")\nassert find_pii("ip 300.1.1.1 and 8.8.8.8") == [("IP", 17, 24)]` },
          { name: "redact", code: `t = "x a.b@c.org y 5500-0000-0000-0004 z 5500-0000-0000-0005"\nassert [k for k, _, _ in find_pii(t)] == ["EMAIL", "CARD"]\nassert redact(t) == "x <EMAIL> y <CARD> z 5500-0000-0000-0005" and redact("none") == "none"` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>has_blocked(text, words)</C> over lower-cased runs of letters and apostrophes; <C>removal_rates(docs, groups,
          words)</C>, keyed by group; and <C>disparity(rates)</C>, infinite when the lowest rate is zero.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import re

def has_blocked(text, words):
    return any(w in text for w in words)

def removal_rates(docs, groups, words):
    return {}

def disparity(rates):
    return 1.0
`,
        solution: BLOCK,
        tests: [
          { name: "blocked", code: `assert has_blocked("You're BAD.", {"bad"}) and not has_blocked("badly", {"bad"}) and has_blocked("it's", {"it's"})` },
          { name: "rates", code: `r = removal_rates(["bad", "ok", "ok", "bad", "bad", "ok"], ["a", "a", "a", "b", "b", "b"], {"bad"})\nassert r == {"a": 1 / 3, "b": 2 / 3} and abs(disparity(r) - 2.0) < 1e-12 and disparity({"a": 0.0, "b": 0.1}) == float("inf")` },
        ],
      },
    },
    {
      key: "ratio",
      rung: "stretch",
      prompt: (
        <p>
          Words in group A&apos;s documents are listed with probability 0.0001 and in group B&apos;s with probability 0.0005,
          independently. For 400-word documents, how many times as often is a B document removed as an A document? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 4.62, tolerance: 0.01 },
    },
  ],

  glimpse: (
    <>
      <p>
        Filtering decides which documents are worth keeping. Many of those that remain are copies of each other, exact or nearly so.
        The next chapter removes them, starting with exact duplicates found by hashing.
      </p>
    </>
  ),
};
