import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { IntervalGreedyViz } from "@/components/viz/IntervalGreedyViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e2.7.2",
  minutes: 55,
  links: {
    requires: ["e2.6.4", "e2.4.3"],
    revisits: ["m4.3.5", "e2.6.3"],
    foreshadows: ["e2.7.3", "e2.7.4", "l5.5.1"],
  },

  puzzle: (
    <>
      <p>
        A conference has one hall and fifty talk proposals, each with fixed times. To fit in as many talks as possible, should
        you favour the talks that start earliest, the shortest ones, or those with the fewest clashes? Each sounds sensible, and
        all but one can be beaten by a small example. Greedy algorithms are fast and simple, and often wrong. How do you tell,
        and how do you prove it when they are right?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A greedy algorithm makes the choice that looks best now and never takes it back. For talks, choose the one that{" "}
        <em>finishes</em> first: whatever an optimal schedule does first, swapping in the earliest-finishing talk cannot hurt,
        because it leaves the hall free at least as early. That swap is the <strong>exchange argument</strong>, the standard
        way to prove a greedy rule. Try the three rules below; only one of them is always optimal.
      </p>
      <IntervalGreedyViz />
    </>
  ),

  theory: (
    <>
      <Definition title="interval scheduling">
        <p>
          Given half-open intervals [s, e), choose as many as possible that are pairwise disjoint. The greedy rule: sort by
          finishing time, then take each interval that starts no earlier than the last one taken ends. O(n log n).
        </p>
        <Code>{`def max_meetings(intervals):
    chosen, free_at = [], float("-inf")
    for start, end in sorted(intervals, key=lambda iv: iv[1]):
        if start >= free_at:
            chosen.append((start, end))
            free_at = end
    return chosen`}</Code>
      </Definition>

      <Theorem title="earliest finish is optimal">
        <p>The greedy rule above chooses the largest possible number of pairwise disjoint intervals.</p>
      </Theorem>
      <Proof>
        <p>
          Let the greedy choices be <M>{"g_1, g_2, \\dots, g_k"}</M> and an optimal solution be{" "}
          <M>{"o_1, o_2, \\dots, o_m"}</M>, both sorted by finishing time. Claim: <M>{"e(g_i) \\le e(o_i)"}</M> for every i ≤
          k (greedy &ldquo;stays ahead&rdquo;). For i = 1 the greedy choice finishes first of all. If{" "}
          <M>{"e(g_{i-1}) \\le e(o_{i-1})"}</M>, then <M>{"o_i"}</M> starts after <M>{"o_{i-1}"}</M> ends, so after{" "}
          <M>{"g_{i-1}"}</M> ends; it was available to greedy, which picked something finishing no later. Now if m &gt; k,
          the interval <M>{"o_{k+1}"}</M> starts after <M>{"o_k"}</M>, hence after <M>{"g_k"}</M>, so greedy would not have
          stopped. Hence k = m.
        </p>
      </Proof>

      <Example title="Huffman coding">
        <p>
          To give symbols binary code words, none a prefix of another, minimising the total length{" "}
          <M>{"\\sum_s f_s \\, |\\text{code}(s)|"}</M>: repeatedly merge the two least frequent symbols (or subtrees) into one
          whose frequency is their sum, with a heap, in O(n log n). The exchange argument: in some optimal tree the two rarest
          symbols are siblings at the deepest level, since swapping a rarer symbol deeper never increases the cost. Merging them
          leaves a smaller problem of the same kind. Huffman codes sit inside gzip, PNG and JPEG; tokenisers&rsquo; byte-pair
          encoding is a greedy merge procedure too, though not an optimal one.
        </p>
      </Example>

      <Example title="when greed fails">
        <p>
          Making change with the fewest coins by always taking the largest coin that fits works for Indian coins (1, 2, 5, 10,
          &hellip;) but not for coins 1, 3 and 4: greedy pays 6 as 4 + 1 + 1, while 3 + 3 uses two. The 0/1 knapsack (take or
          leave whole items) defeats every simple greedy rule; the fractional version, where items can be split, is solved by
          taking items in order of value per kilogram. When a greedy choice can be undone by a later better option, you need
          dynamic programming or search, the next two lessons.
        </p>
      </Example>

      <Remark title="greed in machine learning">
        <p>
          Greedy decoding picks the most probable next token each step; it is fast, but the best first word may lead to a poor
          sentence, which is why beam search keeps several candidates. Decision trees choose each split greedily by information
          gain. Forward feature selection adds the single most useful feature each round. None is guaranteed optimal; they are
          used because the optimal search is too expensive and greedy is usually good enough.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "rule",
      rung: "check",
      prompt: <p>Which greedy rule always schedules the most non-overlapping talks in one hall?</p>,
      answer: { kind: "choice", options: ["Take the talk that finishes earliest", "Take the talk that starts earliest", "Take the shortest talk", "Take the talk with the fewest clashes"], correct: [0] },
    },
    {
      key: "coins",
      rung: "apply",
      prompt: <p>With coins 1, 6 and 10, how many coins does the take-the-largest greedy rule use to pay 12?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "huff",
      rung: "apply",
      prompt: <p>Huffman coding with frequencies a: 1, b: 1, c: 2, d: 4. What is the total encoded length, Σ frequency × code length?</p>,
      answer: { kind: "numeric", value: 14 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`talks = [("a", 1, 4), ("b", 3, 5), ("c", 0, 6), ("d", 5, 7), ("e", 3, 9), ("f", 5, 9), ("g", 6, 10), ("h", 8, 11)]

def schedule(key):
    taken = []
    for name, start, end in sorted(talks, key=key):
        if all(end <= s or start >= e for _, s, e in taken):
            taken.append((name, start, end))
    return "".join(name for name, _, _ in taken)

print(schedule(lambda t: t[2]), schedule(lambda t: t[1]), schedule(lambda t: t[2] - t[1]))`}</Code>
          <p>Three greedy rules for the same talks. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["adh cg bdh", "adh adh adh", "adh cg bdah", "abdh cg bdh"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def greedy(coins, amount):
    used = []
    for c in sorted(coins, reverse=True):
        while amount >= c:
            amount -= c
            used.append(c)
    return used

print(greedy([1, 5, 10, 25], 63), greedy([1, 3, 4], 6), len(greedy([1, 7, 10], 14)))`}</Code>
          <p>Greedy change-making. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[25, 25, 10, 1, 1, 1] [4, 1, 1] 5", "[25, 25, 10, 1, 1, 1] [3, 3] 5", "[25, 25, 10, 1, 1, 1] [4, 1, 1] 2", "[25, 25, 5, 5, 1, 1, 1] [4, 1, 1] 5"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Intervals are half-open pairs <C>(start, end)</C>, so (1, 2) and (2, 3) do not overlap. Write{" "}
            <C>max_meetings(intervals)</C>, returning a largest set of pairwise disjoint intervals as a list, and{" "}
            <C>min_rooms(intervals)</C>, the fewest rooms that can host every meeting. For the second, sweep the meetings by start
            time with a min-heap of the end times of rooms in use; a room is free again when its end time is at most the new
            start.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def max_meetings(intervals):
    chosen = []
    for start, end in sorted(intervals):
        if not chosen or start >= chosen[-1][1]:
            chosen.append((start, end))
    return chosen

def min_rooms(intervals):
    return 1 if intervals else 0
`,
        solution: `import heapq

def max_meetings(intervals):
    chosen, free_at = [], float('-inf')
    for start, end in sorted(intervals, key=lambda iv: iv[1]):
        if start >= free_at:
            chosen.append((start, end))
            free_at = end
    return chosen

def min_rooms(intervals):
    ends, rooms = [], 0
    for start, end in sorted(intervals):
        if ends and ends[0] <= start:
            heapq.heapreplace(ends, end)
        else:
            heapq.heappush(ends, end)
        rooms = max(rooms, len(ends))
    return rooms
`,
        tests: [
          { name: "max meetings", code: `import random, itertools
def compatible(ivs):
    ivs = sorted(ivs)
    return all(a[1] <= b[0] for a, b in zip(ivs, ivs[1:]))
talks = [(1, 4), (3, 5), (0, 6), (5, 7), (3, 9), (5, 9), (6, 10), (8, 11)]
got = max_meetings(talks)
assert len(got) == 3 and compatible(got) and all(iv in talks for iv in got), got
assert max_meetings([]) == [] and len(max_meetings([(1, 2), (2, 3), (3, 4)])) == 3, 'Touching meetings are compatible.'
assert len(max_meetings([(0, 10), (1, 2), (3, 4), (5, 6)])) == 3, 'The earliest start is not the right rule.'
rng = random.Random(27)
for _ in range(200):
    ivs = []
    for _ in range(rng.randint(0, 9)):
        s = rng.randint(0, 15)
        ivs.append((s, s + rng.randint(1, 6)))
    best = 0
    for r in range(len(ivs), 0, -1):
        if any(compatible(c) for c in itertools.combinations(ivs, r)):
            best = r
            break
    got = max_meetings(ivs)
    assert len(got) == best and compatible(got), (ivs, got)
    left = list(ivs)
    for iv in got:
        left.remove(iv)` },
          { name: "min rooms", code: `import random
assert min_rooms([(0, 30), (5, 10), (15, 20)]) == 2
assert min_rooms([(1, 2), (2, 3)]) == 1 and min_rooms([]) == 0 and min_rooms([(1, 5)] * 4) == 4
rng = random.Random(28)
for _ in range(300):
    ivs = []
    for _ in range(rng.randint(0, 12)):
        s = rng.randint(0, 20)
        ivs.append((s, s + rng.randint(1, 8)))
    want = max((sum(s <= t < e for s, e in ivs) for t in range(0, 30)), default=0)
    assert min_rooms(ivs) == want, ivs
ivs = [(i, i + 1000) for i in range(100000)]
assert min_rooms(ivs) == 1000` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>A greedy that works and a test for one that may not:</p>
          <ul>
            <li>
              <C>huffman_code(freq)</C>: freq maps symbols to positive counts. Return a dict of prefix-free binary strings with
              the least total encoded length; a single symbol gets <C>&apos;0&apos;</C> and an empty dict gives an empty dict.
            </li>
            <li>
              <C>greedy_counterexample(coins, limit)</C>: the smallest amount up to limit for which take-the-largest uses more
              coins than the optimum, computed by dynamic programming on amounts, or <C>None</C>. Raise <C>ValueError</C> if
              1 is not a coin.
            </li>
          </ul>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def huffman_code(freq):
    width = max(1, (len(freq) - 1).bit_length())
    return {s: format(i, f'0{width}b') for i, s in enumerate(sorted(freq))}

def greedy_counterexample(coins, limit):
    return None
`,
        solution: `import heapq
from itertools import count

def huffman_code(freq):
    if not freq:
        return {}
    if len(freq) == 1:
        return {s: '0' for s in freq}
    tie = count()
    heap = [(f, next(tie), {s: ''}) for s, f in freq.items()]
    heapq.heapify(heap)
    while len(heap) > 1:
        f1, _, c1 = heapq.heappop(heap)
        f2, _, c2 = heapq.heappop(heap)
        merged = {s: '0' + b for s, b in c1.items()}
        merged.update({s: '1' + b for s, b in c2.items()})
        heapq.heappush(heap, (f1 + f2, next(tie), merged))
    return heap[0][2]

def greedy_counterexample(coins, limit):
    coins = sorted(coins, reverse=True)
    if coins[-1] != 1:
        raise ValueError('coins must include 1')
    best = [0] + [0] * limit
    for amount in range(1, limit + 1):
        best[amount] = 1 + min(best[amount - c] for c in coins if c <= amount)
        left, used = amount, 0
        for c in coins:
            used += left // c
            left %= c
        if used > best[amount]:
            return amount
    return None
`,
        tests: [
          { name: "Huffman", code: `import heapq, random
def check(freq, code):
    assert set(code) == set(freq), 'Give every symbol a code word.'
    words = sorted(code.values())
    assert all(w and set(w) <= {'0', '1'} for w in words), words
    assert all(not b.startswith(a) for a, b in zip(words, words[1:])), f'{code} is not prefix-free.'
    h = list(freq.values())
    heapq.heapify(h)
    best = 0
    while len(h) > 1:
        x = heapq.heappop(h) + heapq.heappop(h)
        best += x
        heapq.heappush(h, x)
    cost = sum(freq[s] * len(code[s]) for s in freq)
    assert cost == (best if len(freq) > 1 else freq[next(iter(freq))]), f'cost {cost}, but {best} is possible.'
freq = {'a': 45, 'b': 13, 'c': 12, 'd': 16, 'e': 9, 'f': 5}
code = huffman_code(freq)
check(freq, code)
assert len(code['a']) == 1 and len(code['f']) == 4
assert huffman_code({}) == {} and huffman_code({'x': 7}) == {'x': '0'}
rng = random.Random(29)
for _ in range(200):
    freq = {chr(97 + i): rng.randint(1, 50) for i in range(rng.randint(2, 12))}
    check(freq, huffman_code(freq))` },
          { name: "coin systems", code: `assert greedy_counterexample([1, 3, 4], 100) == 6
assert greedy_counterexample([1, 5, 10, 25], 1000) is None, 'Indian and US coin systems are canonical.'
assert greedy_counterexample([1, 2, 5, 10, 20, 50, 100], 1000) is None
assert greedy_counterexample([1, 7, 10], 100) == 14
assert greedy_counterexample([1, 3, 4], 5) is None, 'Only search up to the limit.'
try:
    greedy_counterexample([2, 5], 10)
    assert False, 'Without a 1-unit coin, raise ValueError.'
except ValueError:
    pass
import random
rng = random.Random(30)
for _ in range(100):
    coins = [1] + rng.sample(range(2, 30), rng.randint(1, 4))
    best = [0]
    want = None
    for a in range(1, 200):
        best.append(1 + min(best[a - c] for c in coins if c <= a))
        left, used = a, 0
        for c in sorted(coins, reverse=True):
            used += left // c
            left %= c
        if used > best[a]:
            want = a
            break
    assert greedy_counterexample(coins, 199) == want, coins` },
        ],
      },
    },
    {
      key: "rooms",
      rung: "prove",
      prompt: <p>Prove that the minimum number of rooms needed equals the largest number of meetings in progress at any single moment.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Lower bound: k meetings in progress at one moment pairwise overlap, so need k different rooms.",
          "Upper bound: the sweep by start time opens a new room only when every room in use is busy at that start time.",
          "So when the sweep opens its r-th room, r meetings are in progress at that moment.",
          "Hence the sweep uses at most the maximum overlap, and the two numbers are equal.",
        ],
      },
    },
    {
      key: "fractional",
      rung: "stretch",
      prompt: <p>Prove that for the fractional knapsack (items can be split, value proportional to the weight taken) taking items in decreasing order of value per unit weight is optimal, and give a small example showing the same rule fails for the 0/1 knapsack.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Exchange argument: if an optimal solution takes some weight of a lower-ratio item while a higher-ratio item is not fully taken, swapping equal weight increases or keeps the value.",
          "Repeating the swap turns any optimal solution into the greedy one without lowering the value.",
          "Gives a 0/1 counterexample, for example capacity 10 with items (weight 6, value 7) and two items (weight 5, value 5).",
          "Shows greedy by ratio takes the first item for value 7, while the two others give 10.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend why choosing the talk that finishes first always fits in the most talks, and give an example where a different greedy rule fails.",

  glimpse: (
    <p>
      Coin change with awkward coins needed a table of answers for every smaller amount. That table is dynamic programming, the
      most widely used design technique in this chapter, and next.
    </p>
  ),
};
