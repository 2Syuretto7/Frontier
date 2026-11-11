import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TreeInsertViz } from "@/components/viz/TreeInsertViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e2.4.2",
  minutes: 65,
  links: {
    requires: ["e2.4.1"],
    revisits: ["m4.2.2", "m0.4.3"],
    foreshadows: ["e3.4.2", "e3.4.3"],
  },

  puzzle: (
    <>
      <p>
        A trading system keeps open orders in a binary search tree keyed by price. Orders arrive with steadily rising prices, so
        each new key is the largest yet, and the tree becomes a path: every operation now costs O(n). You cannot control the
        order of arrival. Can the tree repair its own shape as it goes, cheaply enough that every operation stays O(log n) in
        the worst case?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A <strong>rotation</strong> rearranges three links so that a child moves up and its parent moves down, while keeping the
        in-order sequence of keys, and therefore the search property, intact. It costs O(1). A balanced tree keeps a cheap
        invariant that guarantees logarithmic height, checks it on the way back up after each insertion or deletion, and rotates
        where it is violated. AVL trees insist that at every node the two subtrees differ in height by at most one. Insert the
        sorted keys below and watch the rotations keep the height near log₂ n.
      </p>
      <TreeInsertViz balanced />
    </>
  ),

  theory: (
    <>
      <Definition title="rotations">
        <p>
          A <strong>right rotation</strong> at node y with left child x makes x the root of the subtree, y its right child, and
          x&rsquo;s old right subtree y&rsquo;s new left subtree. A <strong>left rotation</strong> is the mirror image. Both
          preserve the in-order sequence, because the subtree between x and y stays between them.
        </p>
        <Code>{`def rot_right(y):
    x = y.left
    y.left, x.right = x.right, y
    return x          # (after updating the heights of y, then x)`}</Code>
      </Definition>

      <Definition title="AVL tree">
        <p>
          An <strong>AVL tree</strong> is a BST in which, at every node, the heights of the left and right subtrees differ by at
          most 1. Each node stores its height. After an insertion or deletion, walk back up the search path recomputing heights;
          at the first node whose subtrees differ by 2:
        </p>
        <ul>
          <li>if the taller child leans the same way (left-left or right-right), one rotation at that node fixes it;</li>
          <li>if it leans the other way (left-right or right-left), first rotate the child, then the node: a double rotation.</li>
        </ul>
        <p>
          An insertion needs at most one single or double rotation; a deletion may need one at each level, O(log n) in all.
        </p>
      </Definition>

      <Theorem title="AVL trees are short">
        <p>An AVL tree with n nodes has height at most about <M>{"1.44 \\log_2 (n + 2)"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          Let N(h) be the fewest nodes an AVL tree of height h can have. The sparsest such tree has a root, one subtree of height
          h − 1 and one of height h − 2, each as sparse as possible, so <M>{"N(h) = 1 + N(h-1) + N(h-2)"}</M> with N(0) = 1 and
          N(1) = 2. Then N(h) + 1 satisfies the Fibonacci recurrence, so <M>{"N(h) + 1 = F_{h+3} \\ge \\varphi^{h+1}"}</M> roughly,
          where <M>{"\\varphi = (1 + \\sqrt5)/2"}</M>. Hence <M>{"n \\ge \\varphi^{h+1} - 1"}</M>, giving{" "}
          <M>{"h \\le \\log_\\varphi(n + 1) \\approx 1.44 \\log_2 (n + 1)"}</M>.
        </p>
      </Proof>

      <Definition title="red-black trees">
        <p>
          A <strong>red-black tree</strong> colours each node red or black so that the root and the empty leaves are black, a red
          node has black children, and every path from a node down to an empty leaf passes the same number of black nodes. The
          longest path is at most twice the shortest, so the height is at most <M>{"2\\log_2(n + 1)"}</M>. They are slightly
          less balanced than AVL trees but need fewer rotations on updates, which is why C++&rsquo;s <C>std::map</C>,
          Java&rsquo;s <C>TreeMap</C> and the Linux scheduler use them.
        </p>
      </Definition>

      <Example title="treaps: balance by randomness">
        <p>
          A <strong>treap</strong> gives each key a random priority and keeps the tree a BST by key and a heap by priority. The
          shape is then exactly the BST you would get by inserting the keys in random order of priority, so the expected height
          is O(log n) whatever order the keys actually arrive in. Treaps are easy to write with two operations,{" "}
          <strong>split</strong> (into keys below k and the rest) and <strong>merge</strong> (of two treaps whose keys do not
          interleave).
        </p>
      </Example>

      <Remark title="B-trees: balance for disks">
        <p>
          When a tree lives on disk or SSD, each node visit is a slow block read, so it pays to make nodes wide. A{" "}
          <strong>B-tree</strong> node holds hundreds of sorted keys and has one more child than keys; all leaves are at the
          same depth, and nodes split or merge to stay between half full and full. With 500 children per node, four levels hold
          over 60 billion keys. Every relational database index and most file systems are B-trees or close relatives.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "invariant",
      rung: "check",
      prompt: <p>What does an AVL tree require at every node?</p>,
      answer: { kind: "choice", options: ["The heights of its two subtrees differ by at most 1", "Its two subtrees have the same number of nodes", "It has exactly two children", "Its key is the median of its subtree"], correct: [0] },
    },
    {
      key: "sparse",
      rung: "check",
      prompt: <p>What is the fewest nodes an AVL tree of height 3 can have?</p>,
      answer: { kind: "numeric", value: 7 },
    },
    {
      key: "three",
      rung: "apply",
      prompt: <p>Insert 1, 2, 3 in that order into an empty AVL tree. Which key ends up at the root?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "btree",
      rung: "apply",
      prompt: <p>Each node of a B-tree has 500 children. How many levels are needed for the leaves to hold a billion keys, if each leaf holds 500?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "redblack",
      rung: "apply",
      prompt: <p>Why is the height of a red-black tree at most about twice the shortest root-to-leaf path?</p>,
      answer: {
        kind: "choice",
        options: [
          "All paths have the same number of black nodes and no two reds are adjacent, so a path is at most half red",
          "Red nodes are always leaves",
          "Rotations happen at every insertion",
          "Every red node has two red children",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`class Node:
    def __init__(self, key):
        self.key, self.left, self.right, self.h = key, None, None, 1

def h(t):
    return t.h if t else 0

def fix(t):
    t.h = 1 + max(h(t.left), h(t.right))
    return t

def rot_right(t):
    l = t.left
    t.left, l.right = l.right, t
    fix(t)
    return fix(l)

def rot_left(t):
    r = t.right
    t.right, r.left = r.left, t
    fix(t)
    return fix(r)

def insert(t, k):
    if t is None:
        return Node(k)
    if k < t.key:
        t.left = insert(t.left, k)
    else:
        t.right = insert(t.right, k)
    fix(t)
    if h(t.left) - h(t.right) == 2:
        if k > t.left.key:
            t.left = rot_left(t.left)
        return rot_right(t)
    if h(t.right) - h(t.left) == 2:
        if k < t.right.key:
            t.right = rot_right(t.right)
        return rot_left(t)
    return t

def pre(t):
    return [] if t is None else [t.key] + pre(t.left) + pre(t.right)

root = None
for k in [10, 20, 30, 40, 50, 25]:
    root = insert(root, k)
print(pre(root), root.h - 1)`}</Code>
          <p>The last insertion needs a double rotation. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[30, 20, 10, 25, 40, 50] 2", "[20, 10, 40, 30, 25, 50] 3", "[30, 20, 10, 25, 40, 50] 3", "[25, 20, 10, 40, 30, 50] 2"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`rotations = 0

class Node:
    def __init__(self, key):
        self.key, self.left, self.right, self.h = key, None, None, 1

def h(t):
    return t.h if t else 0

def fix(t):
    t.h = 1 + max(h(t.left), h(t.right))
    return t

def rot_left(t):
    global rotations
    rotations += 1
    r = t.right
    t.right, r.left = r.left, t
    fix(t)
    return fix(r)

def insert_largest(t, k):          # k is larger than every key in t
    if t is None:
        return Node(k)
    t.right = insert_largest(t.right, k)
    fix(t)
    return rot_left(t) if h(t.right) - h(t.left) == 2 else t

for n in (7, 15, 100):
    rotations, root = 0, None
    for k in range(n):
        root = insert_largest(root, k)
    print(n, rotations, root.h - 1, end="; ")`}</Code>
          <p>Sorted insertion into an AVL tree. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["7 4 2; 15 11 3; 100 93 6;", "7 6 2; 15 14 3; 100 99 6;", "7 4 2; 15 11 3; 100 93 9;", "7 3 2; 15 7 3; 100 50 6;"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write a class <C>AVL</C> with <C>insert(k)</C> (ignoring duplicates), <C>delete(k)</C> (raising <C>KeyError</C> if
            absent; a node with two children takes its successor&rsquo;s key), <C>k in t</C>, <C>len(t)</C>, iteration in
            order and <C>height()</C> (−1 when empty). Keep the root in <C>self.root</C>, with nodes having <C>key</C>,{" "}
            <C>left</C> and <C>right</C>, and count rotations in <C>self.rotations</C> (a double rotation counts as two). After
            every operation every node must satisfy the AVL condition.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `class AVL:
    def __init__(self):
        self.root = None
        self.rotations = 0
        self.keys = set()

    def insert(self, k):
        self.keys.add(k)

    def delete(self, k):
        self.keys.remove(k)

    def __contains__(self, k):
        return k in self.keys

    def __len__(self):
        return len(self.keys)

    def __iter__(self):
        return iter(sorted(self.keys))

    def height(self):
        return -1
`,
        solution: `class _N:
    __slots__ = ('key', 'left', 'right', 'h')

    def __init__(self, key):
        self.key, self.left, self.right, self.h = key, None, None, 1

def _h(t):
    return t.h if t else 0

class AVL:
    def __init__(self):
        self.root = None
        self.rotations = 0
        self.n = 0

    def _fix(self, t):
        t.h = 1 + max(_h(t.left), _h(t.right))
        return t

    def _rot_right(self, t):
        self.rotations += 1
        l = t.left
        t.left, l.right = l.right, t
        self._fix(t)
        return self._fix(l)

    def _rot_left(self, t):
        self.rotations += 1
        r = t.right
        t.right, r.left = r.left, t
        self._fix(t)
        return self._fix(r)

    def _balance(self, t):
        self._fix(t)
        b = _h(t.left) - _h(t.right)
        if b > 1:
            if _h(t.left.left) < _h(t.left.right):
                t.left = self._rot_left(t.left)
            return self._rot_right(t)
        if b < -1:
            if _h(t.right.right) < _h(t.right.left):
                t.right = self._rot_right(t.right)
            return self._rot_left(t)
        return t

    def _insert(self, t, k):
        if t is None:
            self.n += 1
            return _N(k)
        if k < t.key:
            t.left = self._insert(t.left, k)
        elif k > t.key:
            t.right = self._insert(t.right, k)
        else:
            return t
        return self._balance(t)

    def _delete(self, t, k):
        if t is None:
            raise KeyError(k)
        if k < t.key:
            t.left = self._delete(t.left, k)
        elif k > t.key:
            t.right = self._delete(t.right, k)
        elif t.left is None or t.right is None:
            self.n -= 1
            return t.left if t.left is not None else t.right
        else:
            s = t.right
            while s.left is not None:
                s = s.left
            t.key = s.key
            t.right = self._delete(t.right, s.key)
        return self._balance(t)

    def insert(self, k):
        self.root = self._insert(self.root, k)

    def delete(self, k):
        self.root = self._delete(self.root, k)

    def __contains__(self, k):
        t = self.root
        while t is not None and t.key != k:
            t = t.left if k < t.key else t.right
        return t is not None

    def __len__(self):
        return self.n

    def __iter__(self):
        stack, t = [], self.root
        while stack or t is not None:
            while t is not None:
                stack.append(t)
                t = t.left
            t = stack.pop()
            yield t.key
            t = t.right

    def height(self):
        return _h(self.root) - 1
`,
        tests: [
          { name: "sorted", code: `import math
t = AVL()
for k in range(1, 101):
    t.insert(k)
assert list(t) == list(range(1, 101)) and len(t) == 100 and t.rotations == 93 and t.height() == 6
t2 = AVL()
for k in [10, 20, 30, 40, 50, 25]:
    t2.insert(k)
assert t2.root.key == 30 and t2.root.left.key == 20 and t2.root.right.key == 40 and t2.rotations == 4` },
          { name: "invariant", code: `import random, math
def check(node, lo=None, hi=None):
    if node is None:
        return -1
    assert (lo is None or node.key > lo) and (hi is None or node.key < hi), 'BST order broken.'
    a, b = check(node.left, lo, node.key), check(node.right, node.key, hi)
    assert abs(a - b) <= 1, f'AVL condition broken at {node.key}'
    return 1 + max(a, b)
rng = random.Random(1)
t, ref = AVL(), set()
for i in range(3000):
    k = rng.randrange(400)
    if rng.random() < 0.55:
        t.insert(k); ref.add(k)
    elif k in ref:
        t.delete(k); ref.discard(k)
    else:
        try:
            t.delete(k)
            assert False, 'Deleting a missing key raises KeyError.'
        except KeyError:
            pass
    if i % 50 == 0:
        h = check(t.root)
        assert h == t.height() and list(t) == sorted(ref) and len(t) == len(ref)
        assert h <= 1.45 * math.log2(len(ref) + 2)` },
          { name: "large", code: `import time, math
t = AVL()
start = time.time()
for k in range(20000):
    t.insert(k)
for k in range(0, 20000, 2):
    t.delete(k)
assert len(t) == 10000 and t.height() <= 1.45 * math.log2(10002) and 19999 in t and 0 not in t
assert time.time() - start < 6` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write a <C>Treap(seed=0)</C>: each node has a key, a priority drawn from <C>random.Random(seed).random()</C>, and the
            size of its subtree; keys obey the BST order and priorities a max-heap order. Write module-level{" "}
            <C>split(t, k)</C>, returning the treaps of keys less than k and of keys at least k, and <C>merge(a, b)</C> for
            treaps with every key of a below every key of b. Build <C>insert(k)</C> (ignoring duplicates), <C>delete(k)</C>{" "}
            (<C>KeyError</C> if absent), <C>k in t</C>, <C>len(t)</C>, <C>kth(i)</C> (the i-th smallest from 0, using sizes;{" "}
            <C>IndexError</C> if out of range), <C>rank(k)</C> (how many keys are below k) and <C>height()</C> from them. Keep
            the root in <C>self.root</C> with node fields <C>key</C>, <C>prio</C>, <C>left</C>, <C>right</C>, <C>size</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import random

def split(t, k):
    return t, None

def merge(a, b):
    return a or b

class Treap:
    def __init__(self, seed=0):
        self.root = None
        self.keys = []

    def insert(self, k):
        self.keys.append(k)

    def delete(self, k):
        self.keys.remove(k)

    def __contains__(self, k):
        return k in self.keys

    def __len__(self):
        return len(self.keys)

    def kth(self, i):
        return self.keys[i]

    def rank(self, k):
        return 0

    def height(self):
        return -1
`,
        solution: `import random

class _T:
    __slots__ = ('key', 'prio', 'left', 'right', 'size')

    def __init__(self, key, prio):
        self.key, self.prio = key, prio
        self.left = self.right = None
        self.size = 1

def _size(t):
    return t.size if t else 0

def _upd(t):
    t.size = 1 + _size(t.left) + _size(t.right)
    return t

def split(t, k):
    if t is None:
        return None, None
    if t.key < k:
        a, b = split(t.right, k)
        t.right = a
        return _upd(t), b
    a, b = split(t.left, k)
    t.left = b
    return a, _upd(t)

def merge(a, b):
    if a is None:
        return b
    if b is None:
        return a
    if a.prio > b.prio:
        a.right = merge(a.right, b)
        return _upd(a)
    b.left = merge(a, b.left)
    return _upd(b)

class Treap:
    def __init__(self, seed=0):
        self.rng = random.Random(seed)
        self.root = None

    def __contains__(self, k):
        t = self.root
        while t is not None and t.key != k:
            t = t.left if k < t.key else t.right
        return t is not None

    def insert(self, k):
        if k in self:
            return
        a, b = split(self.root, k)
        self.root = merge(merge(a, _T(k, self.rng.random())), b)

    def delete(self, k):
        if k not in self:
            raise KeyError(k)
        a, b = split(self.root, k)
        self.root = merge(a, self._drop_min(b))

    def _drop_min(self, t):
        if t.left is None:
            return t.right
        t.left = self._drop_min(t.left)
        return _upd(t)

    def __len__(self):
        return _size(self.root)

    def kth(self, i):
        if not 0 <= i < len(self):
            raise IndexError(i)
        t = self.root
        while True:
            ls = _size(t.left)
            if i < ls:
                t = t.left
            elif i == ls:
                return t.key
            else:
                i -= ls + 1
                t = t.right

    def rank(self, k):
        r, t = 0, self.root
        while t is not None:
            if t.key < k:
                r += _size(t.left) + 1
                t = t.right
            else:
                t = t.left
        return r

    def height(self):
        if self.root is None:
            return -1
        h, level = -1, [self.root]
        while level:
            h += 1
            level = [c for t in level for c in (t.left, t.right) if c is not None]
        return h
`,
        tests: [
          { name: "split and merge", code: `t = Treap(1)
for k in [5, 1, 9, 3, 7]:
    t.insert(k)
a, b = split(t.root, 6)
def keys(x):
    return [] if x is None else keys(x.left) + [x.key] + keys(x.right)
assert keys(a) == [1, 3, 5] and keys(b) == [7, 9] and a.size == 3 and b.size == 2
t.root = merge(a, b)
assert keys(t.root) == [1, 3, 5, 7, 9] and t.root.size == 5` },
          { name: "order statistics", code: `import random, bisect
rng = random.Random(3)
t, ref = Treap(7), []
for _ in range(3000):
    k = rng.randrange(500)
    i = bisect.bisect_left(ref, k)
    present = i < len(ref) and ref[i] == k
    if rng.random() < 0.6:
        t.insert(k)
        if not present:
            ref.insert(i, k)
    elif present:
        t.delete(k); ref.pop(i)
    assert len(t) == len(ref) and t.rank(k) == bisect.bisect_left(ref, k)
    if ref:
        j = rng.randrange(len(ref))
        assert t.kth(j) == ref[j]
try:
    t.kth(len(ref))
    assert False, 'kth out of range raises IndexError.'
except IndexError:
    pass` },
          { name: "heap and shape", code: `import math
def check(x, lo=None, hi=None):
    if x is None:
        return 0
    assert (lo is None or x.key > lo) and (hi is None or x.key < hi)
    for c in (x.left, x.right):
        assert c is None or c.prio <= x.prio, 'Priorities must form a max-heap.'
    s = 1 + check(x.left, lo, x.key) + check(x.right, x.key, hi)
    assert s == x.size, 'Sizes must be maintained.'
    return s
t = Treap(0)
for k in range(20000):
    t.insert(k)
assert check(t.root) == 20000 and t.height() <= 3 * math.log2(20000), f'height {t.height()}'
for k in range(0, 20000, 3):
    t.delete(k)
assert check(t.root) == len(t) == 13333` },
        ],
      },
    },
    {
      key: "avl-height",
      rung: "prove",
      prompt: <p>Let N(h) be the minimum number of nodes in an AVL tree of height h. Prove that N(h) = N(h − 1) + N(h − 2) + 1, and deduce that the height of an AVL tree with n nodes is O(log n).</p>,
      answer: {
        kind: "written",
        rubric: [
          "A tree of height h has a subtree of height h − 1; by the AVL condition the other has height at least h − 2.",
          "A minimal tree uses minimal subtrees of heights exactly h − 1 and h − 2, giving the recurrence (and both bounds).",
          "Shows N(h) + 1 follows the Fibonacci recurrence, so N(h) grows like φ^h, e.g. N(h) ≥ φ^h by induction.",
          "Concludes n ≥ N(h) ≥ φ^h, so h ≤ log_φ n ≈ 1.44 log₂ n.",
        ],
      },
    },
    {
      key: "rb-height",
      rung: "stretch",
      prompt: <p>Prove that a red-black tree with n internal nodes has height at most 2 log₂(n + 1).</p>,
      answer: {
        kind: "written",
        rubric: [
          "Defines the black-height bh(x): the number of black nodes on any path from x down to an empty leaf, not counting x.",
          "Proves by induction on height that the subtree at x contains at least 2^{bh(x)} − 1 internal nodes.",
          "Since a red node has black children, at least half the nodes on any root-to-leaf path are black, so bh(root) ≥ h/2.",
          "Combines: n ≥ 2^{h/2} − 1, so h ≤ 2 log₂(n + 1).",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend what a rotation does and why it keeps a tree a valid search tree, and how AVL trees use rotations to keep their height logarithmic.",

  glimpse: (
    <p>
      Balanced trees are the ordered maps of most standard libraries and the indexes of databases and file systems; Computer
      Systems meets B-trees again in file systems, and red-black trees in the Linux scheduler. Python has no balanced tree in its
      standard library; the popular <C>sortedcontainers</C> package gets the same bounds in practice from a list of short sorted
      lists, a reminder that constants and caches matter.
    </p>
  ),
};
