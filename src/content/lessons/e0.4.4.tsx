import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SetViz } from "@/components/viz/SetViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e0.4.4",
  minutes: 45,
  links: {
    revisits: ["e0.4.1", "e0.4.2"],
    parallels: ["m0.6.1"],
    foreshadows: ["e2.3.1", "e1.3.5"],
  },

  puzzle: (
    <>
      <p>
        A website records the name of every visitor, once per visit, in a list. By evening the list has 50,000 entries, but
        many people visited several times.
      </p>
      <p>
        How would you count the number of <em>different</em> visitors? How would you find the people who visited both today
        and yesterday? Describe a method, and think about how much work it takes as the lists grow.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        What you want is a collection in which each value can appear only once, and which can tell quickly whether a value
        is in it. Python&rsquo;s <strong>set</strong> is that collection: <C>len(set(visits))</C> counts different visitors,
        and <C>today &amp; yesterday</C> gives the people in both.
      </p>
      <p>
        Here are two clubs as sets. Try each operation and see who is in the result.
      </p>
      <SetViz />
    </>
  ),

  theory: (
    <>
      <Definition title="tuple">
        <p>
          A <strong>tuple</strong> is an ordered sequence, like a list, but <strong>immutable</strong>: once made it
          cannot be changed. It is written with round brackets, <C>(3, 4)</C>, and indexed and sliced like a list. A
          one-item tuple needs a comma, <C>(5,)</C>, because <C>(5)</C> is just the number 5 in brackets. Use a tuple for a
          fixed group of values that belong together, such as a point <C>(x, y)</C> or a date <C>(2026, 11, 10)</C>.
        </p>
      </Definition>

      <Definition title="packing and unpacking">
        <p>
          Writing values separated by commas <strong>packs</strong> them into a tuple, and assigning a tuple to several
          names <strong>unpacks</strong> it:
        </p>
        <Code>{`
point = 3, 4          # the tuple (3, 4)
x, y = point          # x is 3, y is 4
a, b = b, a           # swaps a and b in one line

def min_max(xs):
    return min(xs), max(xs)

lo, hi = min_max([4, 9, 1, 7])   # lo is 1, hi is 9
`}</Code>
        <p>
          The right side is worked out completely before any name is assigned, which is why the swap works. Returning a
          tuple is how a function gives back several values.
        </p>
      </Definition>

      <Definition title="set">
        <p>
          A <strong>set</strong> is an unordered collection of distinct values, written <C>{"{"}1, 2, 3{"}"}</C>. Adding
          a value that is already there changes nothing, so <C>len({"{"}1, 2, 2, 3{"}"})</C> is 3. The empty set is{" "}
          <C>set()</C>, because <C>{"{}"}</C> is an empty dictionary. <C>s.add(x)</C> adds a value, <C>x in s</C> tests
          membership, and <C>set(xs)</C> builds a set from any sequence. Sets have no indices, since they have no order.
        </p>
        <p>
          The operators <C>|</C> (union), <C>&amp;</C> (intersection), <C>-</C> (difference) and <C>^</C> (symmetric
          difference) combine two sets, as in the visualisation.
        </p>
      </Definition>

      <Example title="tuples as keys">
        <p>
          Because tuples cannot change, they can be dictionary keys and set members, which lists cannot. A board game might
          store its squares as <C>{"{"}(0, 0): &quot;start&quot;, (2, 3): &quot;goal&quot;{"}"}</C>, so that{" "}
          <C>grid[(2, 3)]</C> is <C>&quot;goal&quot;</C>.
        </p>
      </Example>

      <Remark title="choosing a collection">
        <p>
          Use a <strong>list</strong> for an ordered sequence that may change or contain repeats; a{" "}
          <strong>tuple</strong> for a fixed record of a few values; a <strong>set</strong> for membership and uniqueness;
          and a <strong>dict</strong> to look values up by key. Testing <C>x in s</C> on a set is fast for the same reason
          dictionary look-up is fast, whereas <C>x in xs</C> on a list checks the items one by one. Choosing the right
          collection is often the difference between a program that takes a second and one that takes an hour.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "immut",
      rung: "check",
      prompt: <p>Which of these cannot be changed after it is created?</p>,
      answer: { kind: "choice", options: ["A tuple", "A list", "A set", "A dictionary"], correct: [0] },
    },
    {
      key: "distinct",
      rung: "check",
      prompt: <p>What is <C>len({"{"}1, 2, 2, 3, 3, 3{"}"})</C>?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "swap",
      rung: "apply",
      prompt: (
        <>
          <p>What does this program print?</p>
          <Code>{`
a, b = 3, 8
a, b = b, a + b
print(a * b)
`}</Code>
        </>
      ),
      answer: { kind: "numeric", value: 88 },
    },
    {
      key: "both",
      rung: "apply",
      prompt: <p>In the visualisation, how many members has <C>chess &amp; music</C>?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "unpack",
      rung: "apply",
      prompt: (
        <>
          <p>What does this program print?</p>
          <Code>{`
def min_max(xs):
    return min(xs), max(xs)

lo, hi = min_max([4, 9, 1, 7])
print(hi - lo)
`}</Code>
        </>
      ),
      answer: { kind: "numeric", value: 8 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`a = {1, 2, 3, 4}
b = {3, 4, 5}
point = (2, 7)
x, y = point
print(a & b, len(a | b), x + y)`}</Code>
          <p>Set operations and tuple unpacking. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["{3, 4} 5 9", "{3, 4} 7 9", "{1, 2, 5} 5 9", "{3, 4} 5 (2, 7)"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`point = (3, 4)
x, y = point
s = {3, 1, 3, 2}
t = s | {5}
print(x * y, len(s), sorted(t), 2 in s, (1, 2) + (3,))`}</Code>
          <p>Unpacking a tuple, and set union and membership. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["12 3 [1, 2, 3, 5] True (1, 2, 3)", "12 4 [1, 2, 3, 3, 5] True (1, 2, 3)", "7 3 [1, 2, 3, 5] True (1, 2, 3)", "12 3 [1, 2, 3, 5] False (1, 2, (3,))"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>common_and_unique(a, b)</C> for two lists, returning a tuple (sorted list of items in both, number of distinct items across both), using sets.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def common_and_unique(a, b):
    return (a, len(a) + len(b))
`,
        solution: `def common_and_unique(a, b):
    A, B = set(a), set(b)
    return (sorted(A & B), len(A | B))
`,
        tests: [
          { name: "example", code: `assert common_and_unique([1, 2, 2, 3], [2, 3, 4]) == ([2, 3], 4), 'Turn each list into a set; duplicates disappear.'` },
          { name: "edges", code: `assert common_and_unique([], []) == ([], 0) and common_and_unique(['b', 'a'], ['a', 'b', 'b']) == (['a', 'b'], 2), 'Empty lists, and repeated items.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>unique_in_order(xs)</C>, the list without repeats, keeping first occurrences, using a set of seen items; <C>anagram_groups(words)</C>, the groups of two or more words that are anagrams of each other (use the tuple of sorted letters as a dictionary key), each group sorted, and the groups sorted by their first word; and <C>pairs_with_sum(xs, target)</C>, the sorted list of distinct tuples (a, b) with a ≤ b, taken from different positions of xs, where a + b = target, in one pass with a set.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def unique_in_order(xs):
    return list(set(xs))

def anagram_groups(words):
    return []

def pairs_with_sum(xs, target):
    return []
`,
        solution: `def unique_in_order(xs):
    seen, out = set(), []
    for x in xs:
        if x not in seen:
            seen.add(x)
            out.append(x)
    return out

def anagram_groups(words):
    groups = {}
    for w in words:
        groups.setdefault(tuple(sorted(w)), []).append(w)
    return sorted(sorted(g) for g in groups.values() if len(g) >= 2)

def pairs_with_sum(xs, target):
    seen, found = set(), set()
    for x in xs:
        if target - x in seen:
            found.add((min(x, target - x), max(x, target - x)))
        seen.add(x)
    return sorted(found)
`,
        tests: [
          { name: "unique", code: `assert unique_in_order([3, 1, 3, 2, 1, 5]) == [3, 1, 2, 5] and unique_in_order('banana') == ['b', 'a', 'n'] and unique_in_order([]) == []` },
          { name: "anagrams", code: `assert anagram_groups(['listen', 'enlist', 'google', 'silent', 'cat', 'act', 'dog']) == [['act', 'cat'], ['enlist', 'listen', 'silent']] and anagram_groups(['a', 'b']) == []` },
          { name: "pairs", code: `assert pairs_with_sum([1, 5, 3, 3, 7, 2, 4], 6) == [(1, 5), (2, 4), (3, 3)] and pairs_with_sum([3], 6) == [] and pairs_with_sum([2, 2, 2], 4) == [(2, 2)], 'A number pairs with itself only if it appears twice.'
import random
random.seed(3)
xs = [random.randint(-20, 20) for _ in range(60)]
want = sorted({(min(xs[i], xs[j]), max(xs[i], xs[j])) for i in range(60) for j in range(i + 1, 60) if xs[i] + xs[j] == 5})
assert pairs_with_sum(xs, 5) == want` },
        ],
      },
    },
    {
      key: "choose",
      rung: "prove",
      prompt: (
        <p>
          For each of these, choose a list, tuple, set or dictionary and justify the choice: the order of runners as they
          cross a finish line; the latitude and longitude of a city; the distinct words used in a book; each student&rsquo;s
          roll number mapped to their name.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Finish order: a list, because order matters and it grows as runners finish.",
          "Latitude and longitude: a tuple, because it is a fixed pair of values that belong together.",
          "Distinct words: a set, because each word should appear once and membership tests should be fast.",
          "Roll numbers to names: a dictionary, because names are looked up by roll number.",
        ],
      },
    },
    {
      key: "letters",
      rung: "stretch",
      prompt: <p>What is <C>len(set(&quot;mississippi&quot;) | set(&quot;missouri&quot;))</C>?</p>,
      answer: { kind: "numeric", value: 7 },
    },
  ],

  teachBack:
    "Explain to a friend what tuples and sets are, how unpacking lets a function return several values, and how to choose between a list, tuple, set and dictionary.",

  glimpse: (
    <p>
      This completes Data structures. Next, programs that read and write files, so that data outlives a single run. In Data
      Structures and Algorithms you will see how sets and dictionaries are built from hash tables, and in Python, NumPy and the
      Command Line you will meet dataclasses, named records that improve on plain tuples.
    </p>
  ),
};
