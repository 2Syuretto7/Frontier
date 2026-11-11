import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TrieViz } from "@/components/viz/TrieViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e2.4.4",
  minutes: 55,
  links: {
    requires: ["e2.4.1", "e2.3.1"],
    revisits: ["e0.4.3"],
    foreshadows: ["e2.7.3", "e2.8.2", "l5.1.1", "e11.5.3"],
  },

  puzzle: (
    <>
      <p>
        A tokeniser has a vocabulary of 50 000 pieces of text and must split each word of a document into the longest pieces it
        knows, scanning from the left. At each position it could try every vocabulary entry, or every possible length, and look
        each candidate up in a hash table. Both waste work: if no vocabulary entry starts with &ldquo;qz&rdquo;, there is no
        point asking about &ldquo;qzx&rdquo;. What structure lets you stop the moment a prefix is hopeless?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Store the vocabulary as a tree of characters: from the root, one edge per possible first letter; from each of those, one
        edge per possible second letter; and so on, marking the nodes where a word ends. Every word is a path, and words that
        share a prefix share the start of their paths. Reading text, you walk down one edge per character and note each word
        end you pass. When there is no edge for the next character, no longer match exists and you stop. Type a prefix below.
      </p>
      <TrieViz />
    </>
  ),

  theory: (
    <>
      <Definition title="trie">
        <p>
          A <strong>trie</strong> (from re<em>trie</em>val, also called a prefix tree) for a set of strings is a rooted tree whose
          edges are labelled with characters, such that the children of each node have distinct labels, every string in the set
          spells a path from the root, and the node where each string ends is marked. A node&rsquo;s children are usually a dict
          from character to node.
        </p>
        <Code>{`class Node:
    def __init__(self):
        self.kids = {}       # character -> Node
        self.end = False     # does a word end here?

def insert(root, word):
    node = root
    for ch in word:
        node = node.kids.setdefault(ch, Node())
    node.end = True`}</Code>
      </Definition>

      <Theorem title="costs">
        <p>
          Insert, search and delete of a word of length L take O(L) dict operations, independent of how many words are stored.
          Listing the m words with a given prefix p takes O(|p| + the size of the subtree below p). The trie has at most{" "}
          <M>{"1 + \\sum_w |w|"}</M> nodes.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each operation follows at most one edge per character. Each node other than the root is created by one character of
          one inserted word, the first to need it, so there are at most as many as the total length of all words.
        </p>
      </Proof>

      <Example title="prefix counts">
        <p>
          Store at every node the number of words in its subtree, updated along the path on each insertion and deletion. Then
          &ldquo;how many words start with p?&rdquo; is answered in O(|p|), the core of autocomplete ranking. Storing a score
          instead of a count, and the best few completions at each node, makes top-k suggestions O(|p|) too.
        </p>
      </Example>

      <Example title="longest prefix match">
        <p>
          To find the longest stored word that is a prefix of a text, walk down the trie along the text and remember the last
          node marked as an end. Internet routers do this with IP addresses to choose the most specific route; tokenisers do it
          to choose the longest vocabulary piece. Greedy longest-match tokenisation (used by WordPiece) repeats it from wherever
          the previous piece ended.
        </p>
      </Example>

      <Remark title="greedy is not always best">
        <p>
          Longest-match tokenisation is fast, but not always sensible. If the vocabulary has &ldquo;unh&rdquo; but not
          &ldquo;app&rdquo;, then &ldquo;unhappiness&rdquo; may come out as <em>unh, a, p, p, i, ness</em> rather than{" "}
          <em>un, happi, ness</em>. Finding the segmentation with fewest pieces, or the most probable one, needs the dynamic
          programming of chapter 7, which a trie makes efficient by enumerating the words starting at each position.
        </p>
      </Remark>

      <Remark title="memory, and compressed tries">
        <p>
          A dict per node is heavy: millions of small objects. A <strong>radix tree</strong> merges chains of single-child nodes
          into one edge labelled with a string, so the node count is at most twice the number of words. Production tokenisers
          and search engines go further, packing the trie into flat arrays (double-array tries) or finite-state automata.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "nodes",
      rung: "check",
      prompt: <p>How many nodes, not counting the root, does a trie for <C>to, tea, ten, in, inn</C> have?</p>,
      answer: { kind: "numeric", value: 8 },
    },
    {
      key: "cost",
      rung: "check",
      prompt: <p>A trie holds n words. What does looking up a word of length L cost?</p>,
      answer: { kind: "choice", options: ["O(L), independent of n", "O(log n)", "O(L log n)", "O(n)"], correct: [0] },
    },
    {
      key: "prefix",
      rung: "apply",
      prompt: <p>In a trie of <C>tea, ten, tent, to, toe, in, inn, ink</C>, how many words start with <C>te</C>?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "depth",
      rung: "apply",
      prompt: <p>What is the depth of the deepest node in a trie (root at depth 0)?</p>,
      answer: { kind: "choice", options: ["The length of the longest word", "log₂ of the number of words", "The number of distinct first letters", "The number of words"], correct: [0] },
    },
    {
      key: "lpm",
      rung: "apply",
      prompt: <p>The trie holds <C>a, ab, abc, abd, b</C>. What is the length of the longest stored word that is a prefix of <C>abdicate</C>?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`class Node:
    def __init__(self):
        self.kids, self.end, self.count = {}, False, 0

def insert(root, w):
    node = root
    for ch in w:
        node = node.kids.setdefault(ch, Node())
        node.count += 1
    node.end = True

def complete(root, prefix):
    node = root
    for ch in prefix:
        if ch not in node.kids:
            return []
        node = node.kids[ch]
    out = []
    def walk(n, s):
        if n.end:
            out.append(s)
        for ch in sorted(n.kids):
            walk(n.kids[ch], s + ch)
    walk(node, prefix)
    return out

root = Node()
for w in ["tea", "ten", "to", "in", "inn", "tent"]:
    insert(root, w)
print(complete(root, "te"), root.kids["t"].count, root.kids["i"].kids["n"].count, complete(root, "x"))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["['tea', 'ten', 'tent'] 4 2 []", "['tea', 'ten'] 4 2 []", "['tea', 'ten', 'tent'] 3 1 []", "['ten', 'tent', 'tea'] 4 2 []"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def tokenize(text, vocab):
    out, i = [], 0
    while i < len(text):
        for j in range(len(text), i, -1):
            if text[i:j] in vocab:
                out.append(text[i:j])
                i = j
                break
        else:
            out.append("[UNK]")
            i += 1
    return out

vocab = {"un", "unh", "happ", "happi", "ness", "a", "h", "p", "i", "e", "s"}
print(tokenize("unhappiness", vocab), tokenize("unzip", vocab))`}</Code>
          <p>Greedy longest-match tokenisation. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "['unh', 'a', 'p', 'p', 'i', 'ness'] ['un', '[UNK]', 'i', 'p']",
          "['un', 'happi', 'ness'] ['un', '[UNK]', 'i', 'p']",
          "['unh', 'a', 'p', 'p', 'i', 'ness'] ['un', 'z', 'i', 'p']",
          "['unh', 'appi', 'ness'] ['un', '[UNK]', 'i', 'p']",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write a <C>Trie</C> for a set of words with <C>self.root</C>, whose nodes have <C>kids</C> (a dict),{" "}
            <C>end</C> (bool) and <C>count</C> (words ending in that node&rsquo;s subtree, including at it). Implement{" "}
            <C>insert(w)</C> (a word already present changes nothing), <C>w in t</C>, <C>len(t)</C>,{" "}
            <C>count_prefix(p)</C> in O(|p|), <C>delete(w)</C> (raising <C>KeyError</C> if absent, and removing nodes that no
            longer lead to any word), <C>complete(p, k)</C> (the first k words with prefix p in alphabetical order, visiting only
            the subtree below p and stopping once k are found), and <C>longest_prefix_of(text)</C> (the longest stored word that
            is a prefix of text, or <C>""</C>).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `class Trie:
    def __init__(self):
        self.words = set()

    def insert(self, w):
        self.words.add(w)

    def __contains__(self, w):
        return w in self.words

    def __len__(self):
        return len(self.words)

    def count_prefix(self, p):
        return 0

    def delete(self, w):
        self.words.remove(w)

    def complete(self, p, k):
        return []

    def longest_prefix_of(self, text):
        return ""
`,
        solution: `class _Node:
    __slots__ = ('kids', 'end', 'count')

    def __init__(self):
        self.kids, self.end, self.count = {}, False, 0

class Trie:
    def __init__(self):
        self.root = _Node()

    def _find(self, s):
        node = self.root
        for ch in s:
            node = node.kids.get(ch)
            if node is None:
                return None
        return node

    def insert(self, w):
        if w in self:
            return
        node = self.root
        node.count += 1
        for ch in w:
            node = node.kids.setdefault(ch, _Node())
            node.count += 1
        node.end = True

    def __contains__(self, w):
        node = self._find(w)
        return node is not None and node.end

    def __len__(self):
        return self.root.count

    def count_prefix(self, p):
        node = self._find(p)
        return node.count if node else 0

    def delete(self, w):
        if w not in self:
            raise KeyError(w)
        node = self.root
        node.count -= 1
        for ch in w:
            child = node.kids[ch]
            child.count -= 1
            if child.count == 0:
                del node.kids[ch]
                return
            node = child
        node.end = False

    def complete(self, p, k):
        node = self._find(p)
        out = []
        if node is None or k <= 0:
            return out
        stack = [(node, p)]
        while stack and len(out) < k:
            n, s = stack.pop()
            if n.end:
                out.append(s)
            for ch in sorted(n.kids, reverse=True):
                stack.append((n.kids[ch], s + ch))
        return out

    def longest_prefix_of(self, text):
        node, best = self.root, 0
        for i, ch in enumerate(text):
            node = node.kids.get(ch)
            if node is None:
                break
            if node.end:
                best = i + 1
        return text[:best]
`,
        tests: [
          { name: "basics", code: `t = Trie()
for w in ["tea", "ten", "tent", "to", "toe", "in", "inn", "ink", "ten"]:
    t.insert(w)
assert len(t) == 8 and "ten" in t and "te" not in t and "tents" not in t
assert t.count_prefix("te") == 3 and t.count_prefix("") == 8 and t.count_prefix("x") == 0
assert t.complete("t", 3) == ["tea", "ten", "tent"] and t.complete("in", 10) == ["in", "ink", "inn"] and t.complete("q", 2) == []
assert t.longest_prefix_of("tentacle") == "tent" and t.longest_prefix_of("inner") == "inn" and t.longest_prefix_of("xyz") == ""` },
          { name: "delete", code: `t = Trie()
for w in ["a", "ab", "abc", "b"]:
    t.insert(w)
t.delete("ab")
assert "ab" not in t and "abc" in t and t.count_prefix("ab") == 1
t.delete("abc")
assert t.root.kids["a"].kids == {}, 'Remove nodes that no longer lead to a word.'
try:
    t.delete("zz")
    assert False, 'Deleting a missing word raises KeyError.'
except KeyError:
    pass
t.delete("a"); t.delete("b")
assert t.root.kids == {} and len(t) == 0` },
          { name: "random", code: `import random
rng = random.Random(1)
t, ref = Trie(), set()
for _ in range(3000):
    w = ''.join(rng.choice('abc') for _ in range(rng.randint(0, 4)))
    if rng.random() < 0.6:
        t.insert(w); ref.add(w)
    elif w in ref:
        t.delete(w); ref.discard(w)
    p = ''.join(rng.choice('abc') for _ in range(rng.randint(0, 2)))
    assert t.count_prefix(p) == sum(x.startswith(p) for x in ref) and len(t) == len(ref)
    assert t.complete(p, 3) == sorted(x for x in ref if x.startswith(p))[:3]` },
          { name: "lazy completion", code: `t = Trie()
for i in range(20000):
    t.insert("w" + str(i))
import time
s = time.time()
for _ in range(2000):
    assert t.complete("w", 2) == ["w0", "w1"]
assert time.time() - s < 2, 'Stop as soon as k words are found.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>MaxMatch(vocab)</C>, building a trie of the vocabulary once, with two methods. <C>tokenize(text)</C> does
            greedy longest-match tokenisation exactly like the second reading exercise (an unmatched character becomes{" "}
            <C>"[UNK]"</C>), but finds each piece by walking the trie from position i, so the work per piece is at most the
            length of the longest vocabulary entry. <C>count_segmentations(text)</C> returns the number of ways to write text as
            a sequence of vocabulary entries (0 if none), by working backwards: the number of ways from position i is the sum,
            over the entries starting at i found by walking the trie, of the number of ways from where each ends.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `class MaxMatch:
    def __init__(self, vocab):
        self.vocab = set(vocab)

    def tokenize(self, text):
        return list(text)

    def count_segmentations(self, text):
        return 1
`,
        solution: `class MaxMatch:
    def __init__(self, vocab):
        self.root = {}
        for w in vocab:
            node = self.root
            for ch in w:
                node = node.setdefault(ch, {})
            node[None] = True

    def _ends(self, text, i):
        node, out = self.root, []
        for j in range(i, len(text)):
            node = node.get(text[j])
            if node is None:
                break
            if None in node:
                out.append(j + 1)
        return out

    def tokenize(self, text):
        out, i = [], 0
        while i < len(text):
            ends = self._ends(text, i)
            if ends:
                out.append(text[i:ends[-1]])
                i = ends[-1]
            else:
                out.append("[UNK]")
                i += 1
        return out

    def count_segmentations(self, text):
        n = len(text)
        ways = [0] * (n + 1)
        ways[n] = 1
        for i in range(n - 1, -1, -1):
            ways[i] = sum(ways[j] for j in self._ends(text, i))
        return ways[0]
`,
        tests: [
          { name: "tokenize", code: `vocab = {"un", "unh", "happ", "happi", "ness", "a", "h", "p", "i", "e", "s"}
m = MaxMatch(vocab)
assert m.tokenize("unhappiness") == ['unh', 'a', 'p', 'p', 'i', 'ness'] and m.tokenize("unzip") == ['un', '[UNK]', 'i', 'p'] and m.tokenize("") == []` },
          { name: "agrees", code: `import random
def ref(text, vocab):
    out, i = [], 0
    while i < len(text):
        for j in range(len(text), i, -1):
            if text[i:j] in vocab:
                out.append(text[i:j]); i = j; break
        else:
            out.append("[UNK]"); i += 1
    return out
rng = random.Random(3)
for _ in range(200):
    vocab = {''.join(rng.choice('abcd') for _ in range(rng.randint(1, 4))) for _ in range(rng.randint(1, 12))}
    text = ''.join(rng.choice('abcde') for _ in range(rng.randint(0, 15)))
    assert MaxMatch(vocab).tokenize(text) == ref(text, vocab), (vocab, text)` },
          { name: "count", code: `m = MaxMatch({"a", "aa", "aaa"})
assert [m.count_segmentations("a" * n) for n in range(7)] == [1, 1, 2, 4, 7, 13, 24], 'Tribonacci.'
assert MaxMatch({"ab", "c"}).count_segmentations("abd") == 0
m = MaxMatch({"pine", "apple", "pineapple", "pen", "applepen"})
assert m.count_segmentations("pineapplepenapple") == 3` },
          { name: "long text", code: `import time
m = MaxMatch({"ab", "abc", "cab", "b", "c", "a"})
text = "abcab" * 40000
t = time.time()
toks = m.tokenize(text)
assert ''.join(toks) == text and m.count_segmentations("ab" * 30) == 2 ** 30
assert time.time() - t < 4, 'Walk the trie; do not try every end position.'` },
        ],
      },
    },
    {
      key: "lpm-proof",
      rung: "prove",
      prompt: <p>Prove that walking the trie along the text and remembering the last word end passed finds the longest stored word that is a prefix of the text, and that the walk can stop at the first missing edge.</p>,
      answer: {
        kind: "written",
        rubric: [
          "The node reached after reading text[:i] spells exactly text[:i], so it is marked as an end if and only if text[:i] is a stored word.",
          "The walk visits these nodes for i = 1, 2, … in order, so the last marked one passed is the longest stored prefix among those visited.",
          "If there is no edge for text[i], no stored word starts with text[:i + 1], so no longer prefix of the text is stored, and stopping loses nothing.",
        ],
      },
    },
    {
      key: "fewest",
      rung: "stretch",
      prompt: (
        <p>
          Give a vocabulary and a word for which greedy longest-match tokenisation uses more pieces than necessary, and describe
          an algorithm using a trie that finds a segmentation with the fewest pieces in O(nL) time, where L is the length of the
          longest vocabulary entry.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Gives a valid counterexample, such as the vocabulary {a, abc, bcde, d, e} and the word abcde: greedy gives abc + d + e, three pieces, while a + bcde uses two.",
          "Defines best[i] = fewest pieces for text[i:], with best[n] = 0.",
          "Computes best[i] = 1 + min over entries text[i:j] found by walking the trie from i, which visits at most L nodes.",
          "Fills i from n − 1 down to 0 for O(nL) total, and recovers the pieces by storing the choice.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend how a trie finds every word with a given prefix without looking at the other words, and how a tokeniser uses one to find the longest known piece.",

  glimpse: (
    <p>
      The segmentation count above is a first dynamic program; chapter 7 develops the idea. Suffix arrays in chapter 8 index every
      suffix of a text, a close cousin of a trie of all suffixes. Byte-pair encoding, in the transformers course, builds the
      vocabulary that tokenisers walk.
    </p>
  ),
};
