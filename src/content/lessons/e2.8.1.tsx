import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { KmpViz } from "@/components/viz/KmpViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e2.8.1",
  minutes: 55,
  links: {
    requires: ["e2.1.1", "e2.7.3"],
    revisits: ["m4.4.4"],
    foreshadows: ["e2.8.2", "e2.8.3"],
  },

  puzzle: (
    <>
      <p>
        Searching for a pattern of m characters in a text of n by trying every starting position can take n × m steps. On
        ordinary English the inner loop fails fast and nobody notices, but on DNA, or on a log full of repeated lines, the
        same search can crawl. In 1970 Knuth, Morris and Pratt found a way that never looks at a text character more than
        twice. What information does the naive search throw away each time it gives up and moves on by one?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Suppose the pattern <C>ababc</C> has matched <C>abab</C> and then fails. The naive search slides the pattern by one
        and starts again, re-reading text it has already seen. But we know what that text was: <C>abab</C>. Its longest
        proper prefix that is also a suffix is <C>ab</C>, so slide the pattern until its first <C>ab</C> sits under the last
        two characters we read, and carry on from there, with the text pointer exactly where it was. The table of these
        longest borders depends only on the pattern, and is computed once.
      </p>
      <KmpViz />
    </>
  ),

  theory: (
    <>
      <Definition title="borders and the prefix function">
        <p>
          A <strong>border</strong> of a string is a proper prefix that is also a suffix: <C>aba</C> has border <C>a</C>,{" "}
          <C>abab</C> has <C>ab</C>. The <strong>prefix function</strong> of p is π[i] = the length of the longest border of
          p[0 : i + 1]. For <C>abacaba</C> it is [0, 0, 1, 0, 1, 2, 3].
        </p>
        <Code>{`def prefix_function(p):
    pi, k = [0] * len(p), 0
    for i in range(1, len(p)):
        while k and p[i] != p[k]:
            k = pi[k - 1]          # try the next shorter border
        if p[i] == p[k]:
            k += 1
        pi[i] = k
    return pi`}</Code>
        <p>
          The borders of a string are its longest border, the longest border of that, and so on, which is why the loop
          falls back through <C>pi[k - 1]</C>.
        </p>
      </Definition>

      <Theorem title="KMP runs in linear time">
        <p>
          The prefix function of p takes O(m) time, and searching a text of length n for all occurrences of p takes O(n) more,
          with at most 2n character comparisons.
        </p>
      </Theorem>
      <Proof>
        <p>
          Matching keeps k, the length of the current partial match. Each comparison either advances the text pointer i (a
          match, or a mismatch with k = 0) or decreases k (a fallback). The pointer i advances at most n times. Since k grows
          only when i advances, by 1 each time, and never goes below 0, the total decrease is at most n. So there are at most
          2n comparisons. The same argument applied to p itself bounds the prefix function by 2m. Correctness: if the text
          ending at i − 1 matches p[0 : k] and then fails, any later alignment that could still match must align a border of
          p[0 : k] with the end of that text, and the longest one is tried first, so no occurrence is skipped.
        </p>
      </Proof>

      <Example title="the Z-array">
        <p>
          Another linear-time tool: z[i] is the length of the longest common prefix of s and s[i:]. Keep the window [l, r) of
          the rightmost match found so far; inside it, z[i] starts from z[i − l] (capped at r − i), and only characters beyond r
          are compared afresh. To search for p in t, compute the Z-array of <C>p + &quot;#&quot; + t</C>, with a separator
          that occurs in neither: positions where z equals len(p) are matches. The smallest period of s, the least p with
          s[i] = s[i + p] wherever both exist, is the first p with p + z[p] = len(s), and also len(s) − π[len(s) − 1].
        </p>
      </Example>

      <Remark title="in practice">
        <p>
          Rabin–Karp (M4) hashes windows and is the natural choice for many patterns at once, or for plagiarism detection by
          fingerprints. Python&rsquo;s <C>str.find</C> uses a fast search derived from Boyer–Moore and Horspool, which compares
          from the end of the pattern and often skips whole pattern lengths, plus, since Python 3.10, the Crochemore–Perrin
          two-way algorithm for long patterns, so it is linear in the worst case. Aho–Corasick extends KMP&rsquo;s fallback
          links to a trie of many patterns, and is how <C>grep -F</C> with a word list, and some tokenisers, match many
          strings in one pass.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "naive",
      rung: "check",
      prompt: <p>What is the worst-case number of character comparisons for the naive search of a pattern of length m in a text of length n?</p>,
      answer: { kind: "choice", options: ["Θ(nm)", "Θ(n + m)", "Θ(n log m)", "Θ(m²)"], correct: [0] },
    },
    {
      key: "border",
      rung: "apply",
      prompt: <p>What is the length of the longest border of <C>abcabcab</C>?</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "period",
      rung: "apply",
      prompt: <p>The string <C>abaababaab</C> has prefix function ending in π[9] = 5. What is its smallest period?</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def prefix_function(p):
    pi = [0] * len(p)
    k = 0
    for i in range(1, len(p)):
        while k and p[i] != p[k]:
            k = pi[k - 1]
        if p[i] == p[k]:
            k += 1
        pi[i] = k
    return pi

print(prefix_function("abacaba"), prefix_function("aaaa"), prefix_function("abcab")[-1])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[0, 0, 1, 0, 1, 2, 3] [0, 1, 2, 3] 2", "[0, 0, 1, 0, 1, 2, 3] [0, 1, 2, 3] 0", "[0, 0, 1, 0, 1, 2, 1] [0, 1, 2, 3] 2", "[0, 0, 1, 0, 1, 2, 3] [1, 2, 3, 4] 2"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def naive(text, pattern):
    found, comparisons = [], 0
    for i in range(len(text) - len(pattern) + 1):
        j = 0
        while j < len(pattern):
            comparisons += 1
            if text[i + j] != pattern[j]:
                break
            j += 1
        if j == len(pattern):
            found.append(i)
    return found, comparisons

print(naive("aaaaaa", "aab"), naive("abcabcab", "cab"))`}</Code>
          <p>The naive search, counting character comparisons. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["([], 12) ([2, 5], 10)", "([], 18) ([2, 5], 10)", "([], 12) ([2], 10)", "([], 12) ([2, 5], 8)"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>prefix_function(p)</C> and <C>kmp_search(text, pattern)</C>, returning the start of every occurrence,
            overlapping ones included, in O(n + m); an empty pattern occurs at every position from 0 to len(text). The tests
            count how many characters of the text you read, so do not slice or re-read it.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def prefix_function(p):
    return [0] * len(p)

def kmp_search(text, pattern):
    found, i = [], text.find(pattern)
    while i != -1 and pattern:
        found.append(i)
        i = text.find(pattern, i + len(pattern))
    return found
`,
        solution: `def prefix_function(p):
    pi = [0] * len(p)
    k = 0
    for i in range(1, len(p)):
        while k and p[i] != p[k]:
            k = pi[k - 1]
        if p[i] == p[k]:
            k += 1
        pi[i] = k
    return pi

def kmp_search(text, pattern):
    m = len(pattern)
    if m == 0:
        return list(range(len(text) + 1))
    pi, found, k = prefix_function(pattern), [], 0
    for i, ch in enumerate(text):
        while k and ch != pattern[k]:
            k = pi[k - 1]
        if ch == pattern[k]:
            k += 1
        if k == m:
            found.append(i - m + 1)
            k = pi[k - 1]
    return found
`,
        tests: [
          { name: "prefix function", code: `assert prefix_function('abacaba') == [0, 0, 1, 0, 1, 2, 3]
assert prefix_function('') == [] and prefix_function('aaaa') == [0, 1, 2, 3] and prefix_function('aabaaab') == [0, 1, 0, 1, 2, 2, 3]
import random
rng = random.Random(38)
for _ in range(400):
    p = ''.join(rng.choice('ab') for _ in range(rng.randint(1, 15)))
    want = [max(k for k in range(i + 1) if p[:k] == p[i + 1 - k:i + 1] and k <= i) for i in range(len(p))]
    assert prefix_function(p) == want, p` },
          { name: "search", code: `import random, time
assert kmp_search('abababa', 'aba') == [0, 2, 4], 'Report overlapping matches.'
assert kmp_search('hello', 'xyz') == [] and kmp_search('aaa', 'aaaa') == [] and kmp_search('ab', '') == [0, 1, 2]
rng = random.Random(39)
for _ in range(400):
    t = ''.join(rng.choice('ab') for _ in range(rng.randint(0, 30)))
    p = ''.join(rng.choice('ab') for _ in range(rng.randint(1, 4)))
    assert kmp_search(t, p) == [i for i in range(len(t) - len(p) + 1) if t[i:i + len(p)] == p], (t, p)
class Spy(str):
    reads = 0
    def __getitem__(self, i):
        out = str.__getitem__(self, i)
        Spy.reads += len(out)
        return out
    def __iter__(self):
        for i in range(len(self)):
            yield self[i]
text = Spy('a' * 5000)
pattern = 'a' * 300 + 'b'
assert kmp_search(text, pattern) == []
assert Spy.reads <= 3 * len(text), f'{Spy.reads} reads of a 5,000-character text: KMP never moves backwards in the text.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>z_array(s)</C> in linear time, with z[0] = len(s), using the [l, r) window; and{" "}
            <C>smallest_period(s)</C>, the least p ≥ 1 with s[i] = s[i + p] for every valid i (len(s) if there is no smaller
            one, 0 for the empty string), using your Z-array.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def z_array(s):
    return [len(s)] + [0] * (len(s) - 1) if s else []

def smallest_period(s):
    return len(s)
`,
        solution: `def z_array(s):
    n = len(s)
    z = [0] * n
    if n:
        z[0] = n
    l = r = 0
    for i in range(1, n):
        if i < r:
            z[i] = min(r - i, z[i - l])
        while i + z[i] < n and s[z[i]] == s[i + z[i]]:
            z[i] += 1
        if i + z[i] > r:
            l, r = i, i + z[i]
    return z

def smallest_period(s):
    n = len(s)
    if n == 0:
        return 0
    z = z_array(s)
    for p in range(1, n):
        if p + z[p] == n:
            return p
    return n
`,
        tests: [
          { name: "Z-array", code: `import random, time
assert z_array('aabcaabxaaz') == [11, 1, 0, 0, 3, 1, 0, 0, 2, 1, 0]
assert z_array('') == [] and z_array('aaaa') == [4, 3, 2, 1]
rng = random.Random(40)
for _ in range(300):
    s = ''.join(rng.choice('ab') for _ in range(rng.randint(1, 20)))
    want = [next((k for k in range(len(s) - i, -1, -1) if s[:k] == s[i:i + k])) for i in range(len(s))]
    assert z_array(s) == want, s
s = 'a' * 100000
start = time.perf_counter()
z = z_array(s)
assert z[1] == 99999 and z[-1] == 1
assert time.perf_counter() - start < 5, 'Too slow: reuse the [l, r) window so the total work is linear.'` },
          { name: "period", code: `assert smallest_period('abcabcab') == 3 and smallest_period('aaaa') == 1 and smallest_period('abcd') == 4
assert smallest_period('abaab') == 3 and smallest_period('') == 0 and smallest_period('x') == 1
import random
rng = random.Random(41)
for _ in range(400):
    s = ''.join(rng.choice('ab') for _ in range(rng.randint(1, 20)))
    want = next(p for p in range(1, len(s) + 1) if all(s[i] == s[i + p] for i in range(len(s) - p)))
    assert smallest_period(s) == want, s
s = 'ab' * 50000 + 'a'
assert smallest_period(s) == 2` },
        ],
      },
    },
    {
      key: "borders",
      rung: "prove",
      prompt: <p>Prove that if b is the longest border of a string s, then every other border of s is a border of b. Explain why this justifies the fallback k = π[k − 1].</p>,
      answer: {
        kind: "written",
        rubric: [
          "Takes a shorter border c of s; c is a prefix of s, so a prefix of b (as |c| < |b| and b is also a prefix of s).",
          "c is a suffix of s and b is a suffix of s, so c is a suffix of b.",
          "Being a proper prefix and a suffix of b, c is a border of b.",
          "So the borders of p[0 : k] in decreasing length are π[k − 1], then π[π[k − 1] − 1], and so on, which is what the fallback loop visits.",
        ],
      },
    },
    {
      key: "zlinear",
      rung: "stretch",
      prompt: <p>Prove that the Z-algorithm runs in O(n) time.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Separates comparisons into those that fail (at most one per i, so at most n) and those that succeed.",
          "Shows each successful comparison at position i examines a character at index ≥ r, because the starting value from z[i − l] is already known to match inside the window.",
          "After the extension r moves to i + z[i], so each successful comparison increases r by 1.",
          "Since r never decreases and is at most n, there are at most n successful comparisons, giving O(n) in total.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend how KMP avoids re-reading text after a mismatch, using the pattern ababc as an example.",

  glimpse: (
    <p>
      KMP preprocesses the pattern. When the text is fixed and the patterns keep coming, as in a genome or a search index,
      preprocess the text instead: sort all its suffixes, and every search becomes a binary search.
    </p>
  ),
};
