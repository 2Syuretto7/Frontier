import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TreeInsertViz } from "@/components/viz/TreeInsertViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e2.4.1",
  minutes: 60,
  links: {
    requires: ["e2.3.1"],
    revisits: ["m4.3.3", "m1.5.4"],
    foreshadows: ["e2.4.2", "e2.5.1"],
  },

  puzzle: (
    <>
      <p>
        A dict finds a key in O(1), but ask it for the smallest key, or the next appointment after 3 pm, or every price between
        ₹200 and ₹500, and it must look at every key. A sorted list answers those quickly with binary search, but inserting into
        it is O(n). Is there a structure that keeps keys in order, finds and inserts in about log n steps, and answers
        &ldquo;what comes next?&rdquo;
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Binary search on a sorted list compares with the middle, then the middle of one half, and so on. Freeze that sequence of
        comparisons into a tree: each node holds a key, everything smaller lives in its left subtree and everything larger in
        its right. Searching walks one path from the root, and inserting walks the same path and hangs a new leaf at the end,
        with no shifting. The catch is shape. The tree is only as short as the insertion order allows; insert keys in sorted
        order and it degenerates into a linked list.
      </p>
      <TreeInsertViz />
    </>
  ),

  theory: (
    <>
      <Definition title="binary search tree">
        <p>
          A <strong>binary search tree</strong> (BST) is a binary tree with a key at each node such that, for every node x,
          every key in x&rsquo;s left subtree is less than x&rsquo;s key and every key in its right subtree is greater. The{" "}
          <strong>height</strong> h is the number of edges on the longest path from the root to a leaf (−1 for the empty tree).
        </p>
      </Definition>

      <Theorem title="operations in O(h)">
        <ul>
          <li><strong>Search:</strong> compare with the node, go left or right; stop at the key or at None.</li>
          <li><strong>Insert:</strong> search, and attach a new leaf where the search fell off the tree.</li>
          <li><strong>Minimum and maximum:</strong> keep going left (or right).</li>
          <li>
            <strong>Successor of k</strong> (smallest key greater than k): walk down from the root, remembering the last node
            where you went left; that node is the answer.
          </li>
          <li>
            <strong>Delete:</strong> a leaf is removed; a node with one child is replaced by that child; a node with two children
            takes its successor&rsquo;s key (the minimum of its right subtree, which has no left child), and the successor is
            deleted from the right subtree instead.
          </li>
        </ul>
        <p>Each follows one root-to-leaf path, so each costs O(h).</p>
      </Theorem>

      <Theorem title="in-order traversal sorts">
        <p>Visiting the left subtree, then the node, then the right subtree lists the keys in increasing order.</p>
      </Theorem>
      <Proof>
        <p>
          By induction on the size of the tree. The empty tree lists nothing. Otherwise, by induction the left subtree&rsquo;s keys
          come out sorted, all are less than the root&rsquo;s key, which comes next, and the right subtree&rsquo;s keys come out
          sorted and all are greater. The concatenation is sorted.
        </p>
      </Proof>

      <Example title="range queries">
        <p>
          To list every key in [lo, hi], descend from the root, skipping a left subtree when the node&rsquo;s key is below lo and
          a right subtree when it is above hi. The cost is O(h + m) for m keys reported, which a hash table cannot match.
        </p>
      </Example>

      <Theorem title="height depends on the order of insertion">
        <p>
          Inserting n keys in sorted order gives height n − 1. Inserting them in uniformly random order gives an expected depth
          for a node of about <M>{"2\\ln n \\approx 1.39\\log_2 n"}</M>, and the expected height is also O(log n).
        </p>
      </Theorem>
      <Proof>
        <p>
          Number the keys 1 to n in sorted order. Key i is an ancestor of key j exactly when i is inserted first among the keys
          between i and j inclusive: before that, nothing separates them, and the first of that range to arrive splits the rest.
          In random order this has probability <M>{"1/(|i - j| + 1)"}</M>. Summing over i ≠ j gives an expected depth of j at
          most <M>{"2(H_n - 1) \\approx 2 \\ln n"}</M>. This is the same calculation as for the comparisons of randomised
          quicksort, met in chapter 5.
        </p>
      </Proof>

      <Remark title="recursion and deep trees">
        <p>
          Recursive BST code is short, but a degenerate tree of 5000 nodes is 5000 levels deep, beyond Python&rsquo;s default
          recursion limit of about 1000. Production code writes the walks as loops, using an explicit stack for traversal.
        </p>
        <Code>{`def inorder(root):
    stack, node = [], root
    while stack or node:
        while node:
            stack.append(node)
            node = node.left
        node = stack.pop()
        yield node.key
        node = node.right`}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "inorder",
      rung: "check",
      prompt: <p>What does an in-order traversal of a binary search tree produce?</p>,
      answer: { kind: "choice", options: ["The keys in increasing order", "The keys level by level", "The keys in insertion order", "The root first, then the leaves"], correct: [0] },
    },
    {
      key: "sorted",
      rung: "check",
      prompt: <p>The keys 1, 2, …, 7 are inserted in that order into an empty BST. What is its height?</p>,
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "balanced-order",
      rung: "apply",
      prompt: <p>Insert 4, 2, 6, 1, 3, 5, 7 in that order. What is the height of the tree?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "two-children",
      rung: "apply",
      prompt: <p>To delete a node with two children, which key can safely take its place?</p>,
      answer: { kind: "choice", options: ["Its successor, the minimum of its right subtree", "Its right child's key", "The root's key", "Any leaf's key"], correct: [0] },
    },
    {
      key: "shapes",
      rung: "apply",
      prompt: <p>How many differently shaped binary search trees hold the three keys 1, 2, 3?</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`class Node:
    def __init__(self, key):
        self.key, self.left, self.right = key, None, None

def insert(t, k):
    if t is None:
        return Node(k)
    if k < t.key:
        t.left = insert(t.left, k)
    elif k > t.key:
        t.right = insert(t.right, k)
    return t

def pre(t):
    return [] if t is None else [t.key] + pre(t.left) + pre(t.right)

def height(t):
    return -1 if t is None else 1 + max(height(t.left), height(t.right))

def successor(t, k):
    best = None
    while t:
        if k < t.key:
            best, t = t.key, t.left
        else:
            t = t.right
    return best

root = None
for k in [50, 30, 70, 20, 40, 60, 80, 35]:
    root = insert(root, k)
print(pre(root), height(root), successor(root, 40), successor(root, 80))`}</Code>
          <p>Draw the tree. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[50, 30, 20, 40, 35, 70, 60, 80] 3 50 None",
          "[50, 30, 20, 40, 35, 70, 60, 80] 4 50 None",
          "[20, 30, 35, 40, 50, 60, 70, 80] 3 50 None",
          "[50, 30, 20, 40, 35, 70, 60, 80] 3 35 80",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`class Node:
    def __init__(self, key, left=None, right=None):
        self.key, self.left, self.right = key, left, right

def delete(t, k):
    if t is None:
        return None
    if k < t.key:
        t.left = delete(t.left, k)
    elif k > t.key:
        t.right = delete(t.right, k)
    elif t.left is None:
        return t.right
    elif t.right is None:
        return t.left
    else:
        s = t.right
        while s.left:
            s = s.left
        t.key = s.key
        t.right = delete(t.right, s.key)
    return t

def pre(t):
    return [] if t is None else [t.key] + pre(t.left) + pre(t.right)

root = Node(50, Node(30, Node(20), Node(40, Node(35))), Node(70, Node(60, None, Node(65)), Node(80)))
root = delete(root, 30)
a = pre(root)
root = delete(root, 50)
print(a, pre(root))`}</Code>
          <p>Two deletions of nodes with two children. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[50, 35, 20, 40, 70, 60, 65, 80] [60, 35, 20, 40, 70, 65, 80]",
          "[50, 40, 20, 35, 70, 60, 65, 80] [60, 40, 20, 35, 70, 65, 80]",
          "[50, 35, 20, 40, 70, 60, 65, 80] [40, 35, 20, 70, 60, 65, 80]",
          "[50, 20, 40, 35, 70, 60, 65, 80] [60, 20, 40, 35, 70, 65, 80]",
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
            Write binary search tree functions using loops, not recursion, so that degenerate trees thousands of nodes deep
            work. Nodes are the starter&rsquo;s <C>Node</C> objects, with <C>key</C>, <C>left</C> and <C>right</C>. Write{" "}
            <C>insert(root, k)</C>, which adds k (ignoring duplicates) and returns the root, a new node if the tree was empty;{" "}
            <C>floor(root, k)</C>, the largest key ≤ k or <C>None</C>, in O(h); and <C>in_order(root)</C>, the list of keys in
            increasing order, using your own stack.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `class Node:
    def __init__(self, key):
        self.key, self.left, self.right = key, None, None

def insert(root, k):
    return root

def floor(root, k):
    return None

def in_order(root):
    return []
`,
        solution: `class Node:
    def __init__(self, key):
        self.key, self.left, self.right = key, None, None

def insert(root, k):
    if root is None:
        return Node(k)
    n = root
    while n.key != k:
        if k < n.key:
            if n.left is None:
                n.left = Node(k)
            n = n.left
        else:
            if n.right is None:
                n.right = Node(k)
            n = n.right
    return root

def floor(root, k):
    best, n = None, root
    while n is not None:
        if n.key <= k:
            best, n = n.key, n.right
        else:
            n = n.left
    return best

def in_order(root):
    out, stack, n = [], [], root
    while stack or n is not None:
        while n is not None:
            stack.append(n)
            n = n.left
        n = stack.pop()
        out.append(n.key)
        n = n.right
    return out
`,
        tests: [
          { name: "basics", code: `t = None
for k in [50, 30, 70, 20, 40, 60, 80, 35, 40]:
    t = insert(t, k)
assert t.key == 50 and t.left.right.left.key == 35, 'Each key goes left if smaller, right if larger.'
assert in_order(t) == [20, 30, 35, 40, 50, 60, 70, 80] and in_order(None) == [], 'Duplicates are ignored.'
assert (floor(t, 36), floor(t, 19), floor(t, 50), floor(t, 999), floor(None, 5)) == (35, None, 50, 80, None)` },
          { name: "random", code: `import random
rng = random.Random(5)
t, ref = None, set()
for _ in range(2000):
    k = rng.randrange(500)
    t = insert(t, k); ref.add(k)
s = sorted(ref)
assert in_order(t) == s
for q in range(-3, 503, 7):
    assert floor(t, q) == max((x for x in s if x <= q), default=None), q` },
          { name: "deep", code: `t = None
for k in range(3000):
    t = insert(t, k)
assert floor(t, 10 ** 9) == 2999 and in_order(t) == list(range(3000)), 'A path 3000 deep must not hit the recursion limit.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Trees often arrive from elsewhere. With nodes having <C>key</C>, <C>left</C> and <C>right</C>, write{" "}
            <C>is_bst(root)</C>, which checks the BST property properly (every key in a subtree, not just the children, must be
            on the right side; keys are distinct), <C>kth_smallest(root, k)</C> for k from 1 (raising <C>IndexError</C> if
            there are fewer than k keys), and <C>from_sorted(keys)</C>, which builds a BST of minimum possible height from a
            sorted list by taking the middle element (index <C>len // 2</C>) as the root, recursively.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        setup: `class Node:
    def __init__(self, key, left=None, right=None):
        self.key, self.left, self.right = key, left, right
`,
        starter: `# Node(key, left=None, right=None) is already defined.

def is_bst(root):
    if root is None:
        return True
    if root.left and root.left.key > root.key:
        return False
    if root.right and root.right.key < root.key:
        return False
    return is_bst(root.left) and is_bst(root.right)

def kth_smallest(root, k):
    return root.key

def from_sorted(keys):
    root = None
    return root
`,
        solution: `# Node(key, left=None, right=None) is already defined.

def is_bst(root):
    stack = [(root, None, None)]
    while stack:
        t, lo, hi = stack.pop()
        if t is None:
            continue
        if (lo is not None and t.key <= lo) or (hi is not None and t.key >= hi):
            return False
        stack.append((t.left, lo, t.key))
        stack.append((t.right, t.key, hi))
    return True

def kth_smallest(root, k):
    stack, node, seen = [], root, 0
    while stack or node is not None:
        while node is not None:
            stack.append(node)
            node = node.left
        node = stack.pop()
        seen += 1
        if seen == k:
            return node.key
        node = node.right
    raise IndexError(k)

def from_sorted(keys):
    if not keys:
        return None
    mid = len(keys) // 2
    return Node(keys[mid], from_sorted(keys[:mid]), from_sorted(keys[mid + 1:]))
`,
        tests: [
          { name: "validate", code: `good = Node(8, Node(3, Node(1), Node(6, Node(4), Node(7))), Node(10, None, Node(14, Node(13))))
assert is_bst(good) and is_bst(None)
sneaky = Node(8, Node(3, Node(1), Node(9)), Node(10))
assert not is_bst(sneaky), '9 sits in the left subtree of 8.'
assert not is_bst(Node(5, Node(5))), 'Keys are distinct.'
assert not is_bst(Node(10, None, Node(15, Node(6), Node(20))))` },
          { name: "kth", code: `t = Node(8, Node(3, Node(1), Node(6, Node(4), Node(7))), Node(10, None, Node(14, Node(13))))
assert [kth_smallest(t, k) for k in range(1, 10)] == [1, 3, 4, 6, 7, 8, 10, 13, 14]
try:
    kth_smallest(t, 10)
    assert False, 'k beyond the size raises IndexError.'
except IndexError:
    pass` },
          { name: "build", code: `import math
def height(t):
    return -1 if t is None else 1 + max(height(t.left), height(t.right))
def keys(t):
    return [] if t is None else keys(t.left) + [t.key] + keys(t.right)
for n in [0, 1, 2, 3, 7, 8, 100, 1000]:
    t = from_sorted(list(range(n)))
    assert keys(t) == list(range(n)) and is_bst(t)
    assert height(t) == (math.floor(math.log2(n)) if n else -1), f'n={n}: height {height(t)}'
t = from_sorted([1, 2, 3, 4])
assert t.key == 3 and t.left.key == 2` },
        ],
      },
    },
    {
      key: "successor",
      rung: "prove",
      prompt: (
        <p>
          Prove that the <C>successor</C> function in the first reading exercise is correct: it returns the smallest key greater
          than k, or None if there is none. (Hint: what is true of every key in the subtree still to be searched?)
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Invariant: every key greater than k that is smaller than best (or every key greater than k, if best is None) lies in the current subtree t.",
          "Going left at a node with key > k: that key is a candidate, smaller than the previous best, and every smaller candidate is in the left subtree.",
          "Going right at a node with key ≤ k: the node and its left subtree are all ≤ k, so no candidate is lost.",
          "When t is None, no key between k and best remains, so best is the smallest key greater than k (or None if none was ever found).",
        ],
      },
    },
    {
      key: "depth",
      rung: "stretch",
      prompt: (
        <p>
          Keys 1, …, n are inserted into an empty BST in uniformly random order. Prove that key i is an ancestor of key j (i ≠ j)
          with probability 1/(|i − j| + 1), and deduce that the expected depth of key j is at most 2 ln n + O(1).
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Shows i is an ancestor of j exactly when i is the first of the keys between i and j inclusive to be inserted.",
          "Each of these |i − j| + 1 keys is equally likely to be first, giving probability 1/(|i − j| + 1).",
          "Writes the depth of j as the number of its ancestors and sums by linearity of expectation.",
          "Bounds the sum by two harmonic sums, 2(H_n − 1) ≤ 2 ln n.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend how a binary search tree answers 'what is the next key after this one?', and why inserting sorted keys ruins it.",

  glimpse: (
    <p>
      The next lesson fixes the shape problem with balanced trees, which restore O(log n) worst-case height by rotating as they go.
      Heaps relax the ordering to just &ldquo;parent before children&rdquo; and gain speed for priority queues; tries organise
      strings by their prefixes. The random-insertion analysis here is the same as that of quicksort in chapter 5.
    </p>
  ),
};
