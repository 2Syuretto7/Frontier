import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SuffixArrayViz } from "@/components/viz/SuffixArrayViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e2.8.2",
  minutes: 60,
  links: {
    requires: ["e2.8.1", "e2.5.2"],
    revisits: ["e2.5.1", "e2.4.4"],
    foreshadows: ["e2.8.3"],
  },

  puzzle: (
    <>
      <p>
        The human genome is about three billion letters. A sequencing machine produces hundreds of millions of short reads,
        each perhaps 150 letters, and every one must be located in the genome. Running KMP once per read would scan the genome
        hundreds of millions of times. What can you build from the genome once so that each read is found in time that
        depends on the read&rsquo;s length, and barely on the genome&rsquo;s?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Every occurrence of a pattern is the start of some suffix of the text: &ldquo;ssi&rdquo; occurs in mississippi exactly
        where a suffix begins with &ldquo;ssi&rdquo;. Sort all the suffixes. The ones beginning with the pattern then sit
        together in one block, and two binary searches find its ends. Storing the suffixes themselves would take n² space,
        so store only their starting positions in sorted order: the <strong>suffix array</strong>. Neighbouring suffixes
        often share a long start; recording that length, the LCP, answers questions about repeats.
      </p>
      <SuffixArrayViz />
    </>
  ),

  theory: (
    <>
      <Definition title="suffix array and LCP array">
        <p>
          For a string s of length n, the suffix array SA lists 0, &hellip;, n − 1 ordered so that s[SA[0]:] &lt; s[SA[1]:]
          &lt; &hellip;. The LCP array has LCP[r] = the length of the longest common prefix of the suffixes of ranks r − 1 and
          r, with LCP[0] = 0. For <C>banana</C>, SA = [5, 3, 1, 0, 4, 2] (a, ana, anana, banana, na, nana) and LCP = [0, 1, 3,
          0, 0, 2].
        </p>
      </Definition>

      <Example title="building it by prefix doubling">
        <p>
          Sorting the suffixes as strings costs up to O(n² log n), since comparisons can be long. Instead, rank suffixes by
          their first k characters, then by their first 2k: the first 2k characters of suffix i are its first k followed by
          the first k of suffix i + k, so the pair (rank[i], rank[i + k]) is a sort key made of two integers. Start with k = 1
          (the characters) and double until all ranks differ, at most ⌈log₂ n⌉ rounds.
        </p>
        <Code>{`def suffix_array(s):
    n, k = len(s), 1
    rank, sa = [ord(c) for c in s], list(range(n))
    while True:
        key = lambda i: (rank[i], rank[i + k] if i + k < n else -1)
        sa.sort(key=key)
        new = [0] * n
        for a, b in zip(sa, sa[1:]):
            new[b] = new[a] + (key(a) != key(b))
        rank = new
        if not n or rank[sa[-1]] == n - 1:
            return sa
        k *= 2`}</Code>
        <p>
          Each round is a sort, so this is O(n log² n); radix sorting the pairs makes it O(n log n), and the SA-IS algorithm
          used in practice is O(n).
        </p>
      </Example>

      <Theorem title="Kasai's LCP algorithm">
        <p>
          Process suffixes in text order i = 0, 1, &hellip;, comparing each with the suffix just before it in SA. If the LCP
          found for suffix i is h &gt; 0, the LCP for suffix i + 1 is at least h − 1. So the whole LCP array takes O(n) time.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let j be the suffix before i in sorted order, sharing h ≥ 1 characters. Remove the first character from both: suffix
          j + 1 is smaller than suffix i + 1 and shares h − 1 characters with it. Every suffix sorted between j + 1 and i + 1,
          in particular the one immediately before i + 1, lies between them and so shares at least those h − 1 characters with
          i + 1. Hence starting the comparison at h − 1 is safe. The counter h falls by at most 1 per step and never exceeds
          n, so over the whole run it rises at most 2n times; each successful comparison raises it by 1, and each step has one
          failing comparison, so the total is O(n).
        </p>
      </Proof>

      <Example title="what they answer">
        <p>
          <strong>Search:</strong> all occurrences of p in O(m log n) by two binary searches over SA, comparing p with the first
          m characters of a suffix. <strong>Longest repeated substring:</strong> the largest LCP value, since a repeated
          substring is a common prefix of two suffixes, and the longest common prefix of any two suffixes is attained by a pair
          adjacent in sorted order. <strong>Distinct substrings:</strong> each suffix contributes its prefixes, but the first
          LCP[r] of them were already counted by the suffix above, giving{" "}
          <M>{"\\tfrac{n(n+1)}{2} - \\sum_r \\text{LCP}[r]"}</M>.
        </p>
      </Example>

      <Remark title="genomes and compression">
        <p>
          The Burrows–Wheeler transform is read straight off the suffix array: the character before each sorted suffix. It
          groups similar contexts together, which is why bzip2 compresses well, and the FM-index built on it lets read
          aligners such as BWA and Bowtie search a compressed human genome in a few gigabytes of memory. Suffix trees store
          the same information as a trie of all suffixes with linear-time construction, but use several times more memory, so
          suffix arrays usually win in practice.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "space",
      rung: "check",
      prompt: <p>What does a suffix array store for a text of length n?</p>,
      answer: { kind: "choice", options: ["The n starting positions of the suffixes, in sorted order of the suffixes", "All n suffixes as strings, sorted", "A trie of every substring", "The rank of each character in the alphabet"], correct: [0] },
    },
    {
      key: "distinct",
      rung: "apply",
      prompt: <p>A string of length 6 has LCP array [0, 1, 3, 0, 0, 2]. How many distinct non-empty substrings does it have?</p>,
      answer: { kind: "numeric", value: 15 },
    },
    {
      key: "rounds",
      rung: "apply",
      prompt: <p>Prefix doubling on a string of length 1,000,000 compares prefixes of length 1, 2, 4, &hellip;. At most how many rounds does it need before every prefix compared is at least the whole string&rsquo;s length?</p>,
      answer: { kind: "numeric", value: 21 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`s = "banana"
sa = sorted(range(len(s)), key=lambda i: s[i:])

def common(a, b):
    k = 0
    while a + k < len(s) and b + k < len(s) and s[a + k] == s[b + k]:
        k += 1
    return k

lcp = [0] + [common(a, b) for a, b in zip(sa, sa[1:])]
print(sa, lcp, len(s) * (len(s) + 1) // 2 - sum(lcp))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[5, 3, 1, 0, 4, 2] [0, 1, 3, 0, 0, 2] 15", "[5, 3, 1, 0, 4, 2] [0, 1, 3, 0, 0, 2] 21", "[5, 1, 3, 0, 2, 4] [0, 1, 3, 0, 0, 2] 15", "[5, 3, 1, 0, 4, 2] [0, 1, 2, 0, 0, 2] 16"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from bisect import bisect_left, bisect_right

s = "mississippi"
suffixes = sorted(s[i:] for i in range(len(s)))

def count(p):
    lo = bisect_left(suffixes, p)
    hi = bisect_right(suffixes, p + chr(0x10FFFF))
    return hi - lo

print(count("ss"), count("i"), count("issi"), count("sip"), suffixes[0], suffixes[-1])`}</Code>
          <p>Counting occurrences with two binary searches over sorted suffixes. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["2 4 2 1 i ssissippi", "2 4 1 1 i ssissippi", "2 3 2 1 i ssissippi", "2 4 2 1 ippi ssissippi"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>suffix_array(s)</C> by prefix doubling, without sorting the suffixes as strings (a string of 20,000
            characters must be quick, and <C>&apos;a&apos; * 20000</C> must not use gigabytes), and{" "}
            <C>lcp_array(s, sa)</C> by Kasai&rsquo;s method in O(n), with LCP[0] = 0.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def suffix_array(s):
    return list(range(len(s)))

def lcp_array(s, sa):
    return [0] * len(s)
`,
        solution: `def suffix_array(s):
    n = len(s)
    if n == 0:
        return []
    rank = [ord(c) for c in s]
    sa = list(range(n))
    k = 1
    while True:
        key = lambda i: (rank[i], rank[i + k] if i + k < n else -1)
        sa.sort(key=key)
        new = [0] * n
        for a, b in zip(sa, sa[1:]):
            new[b] = new[a] + (key(a) != key(b))
        rank = new
        if rank[sa[-1]] == n - 1:
            return sa
        k *= 2

def lcp_array(s, sa):
    n = len(s)
    rank = [0] * n
    for r, i in enumerate(sa):
        rank[i] = r
    lcp, h = [0] * n, 0
    for i in range(n):
        if rank[i] > 0:
            j = sa[rank[i] - 1]
            while i + h < n and j + h < n and s[i + h] == s[j + h]:
                h += 1
            lcp[rank[i]] = h
            if h:
                h -= 1
        else:
            h = 0
    return lcp
`,
        tests: [
          { name: "suffix array", code: `import random, time
assert suffix_array('banana') == [5, 3, 1, 0, 4, 2]
assert suffix_array('') == [] and suffix_array('a') == [0] and suffix_array('aaaa') == [3, 2, 1, 0]
assert suffix_array('mississippi') == [10, 7, 4, 1, 0, 9, 8, 6, 3, 5, 2]
rng = random.Random(42)
for _ in range(300):
    s = ''.join(rng.choice('abc') for _ in range(rng.randint(1, 30)))
    assert suffix_array(s) == sorted(range(len(s)), key=lambda i: s[i:]), s
s = ''.join(rng.choice('ab') for _ in range(20000))
start = time.perf_counter()
sa = suffix_array(s)
assert time.perf_counter() - start < 20, 'Too slow: double the compared length each round.'
assert all(s[a:a + 50] <= s[b:b + 50] for a, b in zip(sa, sa[1:]))
sa = suffix_array('a' * 20000)
assert sa[:3] == [19999, 19998, 19997]` },
          { name: "LCP", code: `import random, time
s = 'banana'
assert lcp_array(s, [5, 3, 1, 0, 4, 2]) == [0, 1, 3, 0, 0, 2]
assert lcp_array('', []) == [] and lcp_array('aaaa', [3, 2, 1, 0]) == [0, 1, 2, 3]
rng = random.Random(43)
for _ in range(300):
    s = ''.join(rng.choice('ab') for _ in range(rng.randint(1, 25)))
    sa = sorted(range(len(s)), key=lambda i: s[i:])
    want = [0]
    for a, b in zip(sa, sa[1:]):
        k = 0
        while a + k < len(s) and b + k < len(s) and s[a + k] == s[b + k]:
            k += 1
        want.append(k)
    assert lcp_array(s, sa) == want, s
n = 30000
s = 'a' * n
start = time.perf_counter()
lcp = lcp_array(s, list(range(n - 1, -1, -1)))
assert lcp[-1] == n - 1 and lcp[1] == 1
assert time.perf_counter() - start < 5, 'Too slow: reuse h - 1 from the previous suffix (Kasai).'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Working <C>suffix_array</C> and <C>lcp_array</C> are provided. Write <C>find_all(s, sa, p)</C>, the sorted start
            positions of p in s, with two binary searches over sa (every position for an empty pattern);{" "}
            <C>longest_repeated(s)</C>, a longest substring that occurs at least twice (possibly overlapping), or{" "}
            <C>&apos;&apos;</C>; and <C>distinct_substrings(s)</C>, the number of distinct non-empty substrings.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        setup: `def suffix_array(s):
    n = len(s)
    if n == 0:
        return []
    rank = [ord(c) for c in s]
    sa = list(range(n))
    k = 1
    while True:
        key = lambda i: (rank[i], rank[i + k] if i + k < n else -1)
        sa.sort(key=key)
        new = [0] * n
        for a, b in zip(sa, sa[1:]):
            new[b] = new[a] + (key(a) != key(b))
        rank = new
        if rank[sa[-1]] == n - 1:
            return sa
        k *= 2

def lcp_array(s, sa):
    n = len(s)
    rank = [0] * n
    for r, i in enumerate(sa):
        rank[i] = r
    lcp, h = [0] * n, 0
    for i in range(n):
        if rank[i] > 0:
            j = sa[rank[i] - 1]
            while i + h < n and j + h < n and s[i + h] == s[j + h]:
                h += 1
            lcp[rank[i]] = h
            if h:
                h -= 1
        else:
            h = 0
    return lcp`,
        starter: `def find_all(s, sa, p):
    i = s.find(p)
    return [i] if i >= 0 else []

def longest_repeated(s):
    return ''

def distinct_substrings(s):
    return len(set(s))
`,
        solution: `def find_all(s, sa, p):
    m = len(p)
    lo, hi = 0, len(sa)
    while lo < hi:                                  # first suffix with prefix >= p
        mid = (lo + hi) // 2
        if s[sa[mid]:sa[mid] + m] < p:
            lo = mid + 1
        else:
            hi = mid
    start, hi = lo, len(sa)
    while lo < hi:                                  # first suffix with prefix > p
        mid = (lo + hi) // 2
        if s[sa[mid]:sa[mid] + m] <= p:
            lo = mid + 1
        else:
            hi = mid
    return sorted(sa[start:lo])

def longest_repeated(s):
    sa = suffix_array(s)
    lcp = lcp_array(s, sa)
    best = max(range(len(lcp)), key=lambda r: lcp[r], default=None)
    if best is None or lcp[best] == 0:
        return ''
    return s[sa[best]:sa[best] + lcp[best]]

def distinct_substrings(s):
    n = len(s)
    return n * (n + 1) // 2 - sum(lcp_array(s, suffix_array(s)))
`,
        tests: [
          { name: "search", code: `import random
s = 'mississippi'
sa = suffix_array(s)
assert find_all(s, sa, 'issi') == [1, 4] and find_all(s, sa, 'ss') == [2, 5] and find_all(s, sa, 'i') == [1, 4, 7, 10]
assert find_all(s, sa, 'x') == [] and find_all(s, sa, 'mississippix') == [] and find_all(s, sa, '') == list(range(11))
rng = random.Random(44)
for _ in range(300):
    s = ''.join(rng.choice('ab') for _ in range(rng.randint(1, 25)))
    p = ''.join(rng.choice('ab') for _ in range(rng.randint(1, 4)))
    assert find_all(s, suffix_array(s), p) == [i for i in range(len(s)) if s.startswith(p, i)], (s, p)
s = ''.join(rng.choice('acgt') for _ in range(20000))
sa = suffix_array(s)
p = s[5000:5012]
got = find_all(s, sa, p)
assert 5000 in got and all(s.startswith(p, i) for i in got)` },
          { name: "repeats and counts", code: `import random, itertools
assert longest_repeated('banana') == 'ana'
assert longest_repeated('abcd') == '' and longest_repeated('') == '' and longest_repeated('aaaa') == 'aaa'
assert longest_repeated('mississippi') == 'issi'
assert distinct_substrings('banana') == 15 and distinct_substrings('aaaa') == 4 and distinct_substrings('') == 0
assert distinct_substrings('abc') == 6
rng = random.Random(45)
for _ in range(200):
    s = ''.join(rng.choice('ab') for _ in range(rng.randint(1, 18)))
    subs = {s[i:j] for i in range(len(s)) for j in range(i + 1, len(s) + 1)}
    assert distinct_substrings(s) == len(subs), s
    reps = [t for t in subs if sum(s.startswith(t, i) for i in range(len(s))) >= 2]
    L = max(map(len, reps), default=0)
    got = longest_repeated(s)
    assert len(got) == L and (L == 0 or sum(s.startswith(got, i) for i in range(len(s))) >= 2), (s, got)
s = ''.join(rng.choice('ab') for _ in range(20000))
assert distinct_substrings(s) > 10 ** 8` },
        ],
      },
    },
    {
      key: "adjacent",
      rung: "prove",
      prompt: <p>Prove that the longest common prefix of any two suffixes is at most the LCP of some pair adjacent in the suffix array, so the longest repeated substring has length max LCP[r].</p>,
      answer: {
        kind: "written",
        rubric: [
          "Takes suffixes of ranks a < b with common prefix of length L.",
          "Argues every suffix ranked between them, being sorted between two strings that start with the same L characters, also starts with them.",
          "So each adjacent pair from rank a to rank b shares those L characters, and LCP[a + 1] ≥ L in particular.",
          "Concludes that a substring occurring twice (a common prefix of two suffixes) has length at most max LCP, and that the maximum is attained.",
        ],
      },
    },
    {
      key: "bwt",
      rung: "stretch",
      prompt: <p>Define the Burrows–Wheeler transform of s + &quot;$&quot; using the suffix array, compute it for banana$, and explain why it tends to put equal characters next to each other.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Defines BWT[r] as the character before suffix SA[r] (the last character, $, for the suffix starting at 0), with $ smallest.",
          "Computes the suffix array of banana$ as [6, 5, 3, 1, 0, 4, 2] and the transform annb$aa.",
          "Explains that suffixes are grouped by what follows each position, so the preceding characters come from similar contexts.",
          "Notes that in text, a given context is usually preceded by few different characters, producing runs that compress well.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend how sorting all the suffixes of a text turns finding any word in it into a binary search.",

  glimpse: (
    <p>
      Suffix arrays find exact matches. Real reads contain sequencing errors and real words contain typos; the last lesson
      measures how far apart two strings are, and the measure is a dynamic programme.
    </p>
  ),
};
