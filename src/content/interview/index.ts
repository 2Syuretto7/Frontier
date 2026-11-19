import type { InterviewMode, InterviewQuestion } from "./types";

/**
 * The question bank. Add a question by appending it here; the tests check that its lessons exist, that every idea
 * and piece of Python it uses is taught by the lessons it waits for, and that each criterion points only at
 * lessons that open in time.
 */

const coding: InterviewQuestion[] = [
  {
    id: "c-layernorm",
    mode: "coding",
    prompt:
      "Write layer_norm(x, gamma, beta, eps=1e-5) in NumPy. x has shape (..., d) with any number of leading dimensions; normalise each row over its last axis, then scale by gamma and shift by beta, both of shape (d,). Talk me through how you would check it is right.",
    lessons: ["l3.5.2", "e1.5.3"],
    minutes: 15,
    rubric: [
      { id: "axis", text: "Normalises over the last axis only, keeping dimensions so the mean and spread broadcast back.", lessons: ["e1.5.3"] },
      { id: "eps", text: "Puts eps inside the square root and says why it is there.", lessons: ["l3.5.2"] },
      { id: "affine", text: "Applies gamma and beta after normalising, and knows they are learnt per feature.", lessons: ["l3.5.2"] },
      { id: "testing", text: "Proposes concrete checks: zero mean and unit spread per row, shapes with extra leading dimensions, a constant row.", lessons: [] },
      { id: "clarity", text: "Explains the approach clearly before and while writing the code.", lessons: [] },
    ],
    notes: "Mean and variance over axis=-1 with keepdims=True; (x - mean) / sqrt(var + eps) * gamma + beta. A constant row must not divide by zero. Contrast with batch norm, which normalises over the batch.",
    starter: `import numpy as np


def layer_norm(x, gamma, beta, eps=1e-5):
    raise NotImplementedError
`,
    solution: `import numpy as np


def layer_norm(x, gamma, beta, eps=1e-5):
    mean = x.mean(axis=-1, keepdims=True)
    var = x.var(axis=-1, keepdims=True)
    return (x - mean) / np.sqrt(var + eps) * gamma + beta
`,
    checks: [
      {
        name: "each row has mean 0 and spread 1 when gamma is 1 and beta is 0",
        code: `import numpy as np
x = np.random.default_rng(0).normal(3, 5, size=(4, 6))
y = layer_norm(x, np.ones(6), np.zeros(6))
assert y.shape == x.shape, "the output should keep the input's shape"
assert np.allclose(y.mean(axis=-1), 0, atol=1e-6), "each row should have mean zero"
assert np.allclose(y.std(axis=-1), 1, atol=1e-3), "each row should have spread one"`,
      },
      {
        name: "works with extra leading dimensions",
        code: `import numpy as np
x = np.random.default_rng(1).normal(size=(2, 3, 5))
y = layer_norm(x, np.ones(5), np.zeros(5))
assert y.shape == (2, 3, 5), "extra leading dimensions should be kept"
assert np.allclose(y.mean(axis=-1), 0, atol=1e-6), "normalise over the last axis only"`,
      },
      {
        name: "gamma scales and beta shifts each feature",
        code: `import numpy as np
x = np.random.default_rng(2).normal(size=(3, 4))
g = np.array([1.0, 2.0, 3.0, 4.0]); b = np.array([0.5, -1.0, 0.0, 2.0])
base = layer_norm(x, np.ones(4), np.zeros(4))
assert np.allclose(layer_norm(x, g, b), base * g + b), "apply gamma and beta after normalising"`,
      },
      {
        name: "a constant row stays finite",
        code: `import numpy as np
y = layer_norm(np.full((2, 4), 7.0), np.ones(4), np.zeros(4))
assert np.all(np.isfinite(y)), "a constant row should not divide by zero"`,
      },
    ],
  },
  {
    id: "c-top-p",
    mode: "coding",
    prompt:
      "Write top_p_filter(logits, p) for a 1-D NumPy array of logits. Return probabilities where only the smallest set of most likely tokens whose total probability reaches p keeps its mass, renormalised to sum to one; every other token gets zero. Then tell me how temperature would fit in.",
    lessons: ["l5.5.2", "e1.5.2", "l3.3.2"],
    minutes: 15,
    rubric: [
      { id: "softmax", text: "Turns logits into probabilities with a stable softmax, subtracting the maximum first.", lessons: ["l3.3.2"] },
      { id: "cutoff", text: "Sorts by probability and keeps tokens up to and including the one that reaches p.", lessons: ["l5.5.2"] },
      { id: "renorm", text: "Renormalises the kept mass and zeroes the rest, in the original token order.", lessons: ["l5.5.2"] },
      { id: "temperature", text: "Places temperature correctly: dividing the logits before the softmax, and says what high and low values do.", lessons: ["l5.5.2"] },
      { id: "vectorised", text: "Uses vectorised NumPy (argsort, cumsum) rather than a Python loop over the vocabulary.", lessons: ["e1.5.2"] },
    ],
    notes: "probs = softmax(logits); order = argsort(-probs); cum = cumsum(probs[order]); keep the first k where k is the first index with cum >= p (inclusive). Ties and p = 1 keep everything. Temperature divides logits before softmax.",
    starter: `import numpy as np


def top_p_filter(logits, p):
    raise NotImplementedError
`,
    solution: `import numpy as np


def top_p_filter(logits, p):
    z = logits - logits.max()
    probs = np.exp(z) / np.exp(z).sum()
    order = np.argsort(-probs)
    cum = np.cumsum(probs[order])
    k = int(np.searchsorted(cum, p) + 1)
    keep = order[:k]
    out = np.zeros_like(probs)
    out[keep] = probs[keep]
    return out / out.sum()
`,
    checks: [
      {
        name: "keeps the smallest set that reaches p",
        code: `import numpy as np
logits = np.log(np.array([0.5, 0.3, 0.15, 0.05]))
out = top_p_filter(logits, 0.7)
assert np.allclose(out, [0.625, 0.375, 0, 0]), "with p = 0.7 only the two most likely tokens should keep mass"`,
      },
      {
        name: "sums to one and keeps the original order",
        code: `import numpy as np
logits = np.log(np.array([0.05, 0.15, 0.3, 0.5]))
out = top_p_filter(logits, 0.9)
assert abs(out.sum() - 1) < 1e-9, "the result should sum to one"
assert out[0] == 0 and out[3] > out[2] > out[1] > 0, "zero the tail, keep the others where they were"`,
      },
      {
        name: "stays finite for large logits",
        code: `import numpy as np
out = top_p_filter(np.array([1000.0, 999.0, 0.0]), 0.5)
assert np.all(np.isfinite(out)) and abs(out.sum() - 1) < 1e-9, "use a stable softmax"`,
      },
    ],
  },
  {
    id: "c-lru",
    mode: "coding",
    prompt:
      "Implement an LRUCache class with a fixed capacity, get(key) that returns the value or None, and put(key, value). When the cache is full, put evicts the least recently used key. Both operations should take constant time on average. Explain the data structures you choose.",
    lessons: ["e2.3.1", "e2.2.2", "e1.3.3"],
    minutes: 20,
    rubric: [
      { id: "structures", text: "Pairs a hash table for lookup with an ordered structure (a linked list or an ordered dictionary) for recency.", lessons: ["e2.3.1", "e2.2.2"] },
      { id: "recency", text: "Marks a key as most recently used on both get and put, including when put overwrites a key.", lessons: ["e2.2.2"] },
      { id: "eviction", text: "Evicts exactly the least recently used key, only when a new key would exceed capacity.", lessons: ["e2.2.2"] },
      { id: "complexity", text: "States and justifies constant average time for both operations.", lessons: ["e2.3.1"] },
      { id: "clarity", text: "Explains the design before coding and tests a small sequence of calls aloud.", lessons: [] },
    ],
    notes: "dict + doubly linked list with sentinel nodes, or collections.OrderedDict with move_to_end and popitem(last=False). Overwriting an existing key must not evict. Capacity 1 is a good edge case.",
    starter: `class LRUCache:
    def __init__(self, capacity):
        raise NotImplementedError

    def get(self, key):
        raise NotImplementedError

    def put(self, key, value):
        raise NotImplementedError
`,
    solution: `class Node:
    def __init__(self, key, value):
        self.key = key
        self.value = value
        self.prev = None
        self.next = None


class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.nodes = {}
        self.head = Node(None, None)
        self.tail = Node(None, None)
        self.head.next = self.tail
        self.tail.prev = self.head

    def _unlink(self, node):
        node.prev.next = node.next
        node.next.prev = node.prev

    def _push_front(self, node):
        node.next = self.head.next
        node.prev = self.head
        self.head.next.prev = node
        self.head.next = node

    def get(self, key):
        node = self.nodes.get(key)
        if node is None:
            return None
        self._unlink(node)
        self._push_front(node)
        return node.value

    def put(self, key, value):
        node = self.nodes.get(key)
        if node is not None:
            node.value = value
            self._unlink(node)
            self._push_front(node)
            return
        if len(self.nodes) == self.capacity:
            old = self.tail.prev
            self._unlink(old)
            del self.nodes[old.key]
        node = Node(key, value)
        self.nodes[key] = node
        self._push_front(node)
`,
    checks: [
      {
        name: "evicts the least recently used key",
        code: `c = LRUCache(2)
c.put("a", 1); c.put("b", 2); c.get("a"); c.put("c", 3)
assert c.get("b") is None, "b was least recently used, so it should be gone"
assert c.get("a") == 1 and c.get("c") == 3, "a and c should still be there"`,
      },
      {
        name: "overwriting a key refreshes it without evicting",
        code: `c = LRUCache(2)
c.put("a", 1); c.put("b", 2); c.put("a", 10); c.put("c", 3)
assert c.get("a") == 10, "a was just written, so it should stay with its new value"
assert c.get("b") is None, "b should be the one evicted"`,
      },
      {
        name: "a missing key returns None",
        code: `c = LRUCache(1)
assert c.get("x") is None, "get on a missing key should return None"`,
      },
    ],
  },
  {
    id: "c-top-k-stream",
    mode: "coding",
    prompt:
      "Write top_k(stream, k) that returns the k largest numbers from an iterable too large to hold in memory, in descending order. What is its running time and memory, and when would you sort instead?",
    lessons: ["e2.4.3", "e2.5.3"],
    minutes: 15,
    rubric: [
      { id: "heap", text: "Keeps a min-heap of size k and replaces its smallest element when a larger one arrives.", lessons: ["e2.4.3"] },
      { id: "complexity", text: "Gives O(n log k) time and O(k) memory, and compares with sorting at O(n log n) time and O(n) memory.", lessons: ["e2.5.3"] },
      { id: "edges", text: "Handles fewer than k items, duplicates and k of zero.", lessons: [] },
      { id: "clarity", text: "Explains the idea before coding and walks a small example through it.", lessons: [] },
    ],
    notes: "heapq.heappush until size k, then heapq.heappushpop or heapreplace when x > heap[0]; return sorted(heap, reverse=True). Quickselect is fine when everything fits in memory.",
    starter: `def top_k(stream, k):
    raise NotImplementedError
`,
    solution: `import heapq


def top_k(stream, k):
    if k <= 0:
        return []
    heap = []
    for x in stream:
        if len(heap) < k:
            heapq.heappush(heap, x)
        elif x > heap[0]:
            heapq.heapreplace(heap, x)
    return sorted(heap, reverse=True)
`,
    checks: [
      {
        name: "returns the k largest in descending order",
        code: `assert top_k(iter([5, 1, 9, 3, 7, 9, 2]), 3) == [9, 9, 7], "expected [9, 9, 7]"`,
      },
      {
        name: "handles short streams and k of zero",
        code: `assert top_k(iter([4, 2]), 5) == [4, 2], "fewer than k items: return them all, largest first"
assert top_k(iter([1, 2, 3]), 0) == [], "k of zero should return an empty list"`,
      },
    ],
  },
  {
    id: "c-edit-distance",
    mode: "coding",
    prompt:
      "Write edit_distance(a, b): the fewest single-character insertions, deletions and substitutions that turn string a into string b. Explain the recurrence before you code it, then its time and memory, and how you could cut the memory.",
    lessons: ["e2.8.3", "e2.7.3"],
    minutes: 20,
    rubric: [
      { id: "recurrence", text: "States the recurrence over prefixes with the right base cases.", lessons: ["e2.7.3", "e2.8.3"] },
      { id: "code", text: "Fills the table in an order where every entry's dependencies are ready.", lessons: ["e2.7.3"] },
      { id: "complexity", text: "Gives O(len(a) * len(b)) time and reduces memory to two rows.", lessons: ["e2.7.3"] },
      { id: "clarity", text: "Checks the answer on a small example such as kitten and sitting.", lessons: [] },
    ],
    notes: "D[i][j] = min(D[i-1][j] + 1, D[i][j-1] + 1, D[i-1][j-1] + (a[i-1] != b[j-1])), D[i][0] = i, D[0][j] = j. kitten to sitting is 3.",
    starter: `def edit_distance(a, b):
    raise NotImplementedError
`,
    solution: `def edit_distance(a, b):
    prev = list(range(len(b) + 1))
    for i in range(1, len(a) + 1):
        cur = [i] + [0] * len(b)
        for j in range(1, len(b) + 1):
            cur[j] = min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] != b[j - 1]))
        prev = cur
    return prev[-1]
`,
    checks: [
      { name: "kitten to sitting is 3", code: `assert edit_distance("kitten", "sitting") == 3, "kitten to sitting needs three edits"` },
      {
        name: "empty strings and identical strings",
        code: `assert edit_distance("", "abc") == 3, "from an empty string, insert every character"
assert edit_distance("abc", "") == 3, "to an empty string, delete every character"
assert edit_distance("same", "same") == 0, "identical strings need no edits"`,
      },
    ],
  },
];

const fundamentals: InterviewQuestion[] = [
  {
    id: "f-prenorm",
    mode: "fundamentals",
    prompt: "Why does a pre-norm transformer train more stably than a post-norm one, especially when it is deep? What do you give up?",
    lessons: ["l5.2.5", "l3.5.3", "l3.5.1"],
    minutes: 5,
    rubric: [
      { id: "placement", text: "Says exactly where the normalisation sits in each design: inside the residual branch before the sublayer, or after the residual sum.", lessons: ["l5.2.5"] },
      { id: "identity", text: "Explains that pre-norm keeps a clean identity path through the residual stream from output to input.", lessons: ["l3.5.3"] },
      { id: "gradients", text: "Connects this to gradients at initialisation: post-norm gradients near the output grow with depth, so it needs warmup and care.", lessons: ["l3.5.1", "l5.2.5"] },
      { id: "tradeoff", text: "Names the cost: the residual stream grows with depth, a final normalisation is needed, and post-norm can reach slightly better quality when it trains.", lessons: ["l5.2.5"] },
    ],
    notes: "Post-norm: x = LN(x + F(x)). Pre-norm: x = x + F(LN(x)), plus a final LN. Pre-norm's identity path means the gradient reaches every layer without passing through a chain of normalisations; post-norm's expected gradients near the output are large at initialisation, hence warmup. Pre-norm's residual stream norm grows with depth so later layers contribute relatively less.",
  },
  {
    id: "f-attention-scale",
    mode: "fundamentals",
    prompt: "In attention, why do we divide the query-key dot products by the square root of the head dimension? What goes wrong without it?",
    lessons: ["l5.2.1", "l3.4.1", "l3.3.2"],
    minutes: 4,
    rubric: [
      { id: "variance", text: "Shows that with unit-variance entries the dot product's variance grows in proportion to the dimension.", lessons: ["l3.4.1", "l5.2.1"] },
      { id: "saturation", text: "Explains that large logits saturate the softmax into a near one-hot distribution.", lessons: ["l3.3.2"] },
      { id: "gradients", text: "Connects saturation to vanishing gradients through the softmax, slowing or stalling learning.", lessons: ["l3.3.2", "l5.2.1"] },
      { id: "clarity", text: "Gives a crisp, ordered argument rather than a list of facts.", lessons: [] },
    ],
    notes: "q·k = sum of d products each with variance 1 (independent, zero mean), so variance d and spread sqrt(d). Dividing by sqrt(d) restores unit variance. Without it, softmax is peaked and its Jacobian is near zero.",
  },
  {
    id: "f-adamw",
    mode: "fundamentals",
    prompt: "What is the difference between adding an L2 penalty to the loss and using decoupled weight decay, when the optimiser is Adam? Why does it matter?",
    lessons: ["m14.2.4", "l3.7.1", "l3.6.2"],
    minutes: 5,
    rubric: [
      { id: "sgd", text: "Notes that for plain SGD the two are the same up to a rescaling of the coefficient.", lessons: ["l3.7.1"] },
      { id: "adaptive", text: "Explains that with Adam the L2 gradient is divided by the adaptive scale, so heavily updated weights are barely decayed.", lessons: ["m14.2.4", "l3.6.2"] },
      { id: "decoupled", text: "Describes AdamW: shrinking weights directly, outside the adaptive update, so every weight decays at the same rate.", lessons: ["m14.2.4"] },
      { id: "practice", text: "Mentions practical consequences: decay tied to the learning rate, and which parameters are usually excluded, such as biases and norm gains.", lessons: ["l3.6.2"] },
    ],
    notes: "L2 adds lambda*w to g before m and v, so the decay term is divided by sqrt(v). AdamW: w -= lr*lambda*w separately. Usually no decay on biases, normalisation gains and often embeddings.",
  },
  {
    id: "f-warmup",
    mode: "fundamentals",
    prompt: "Why do large transformers usually need a learning-rate warmup? What would you expect to see if you removed it?",
    lessons: ["m14.4.1", "l3.6.3", "m14.2.3"],
    minutes: 5,
    rubric: [
      { id: "adam-early", text: "Explains that Adam's second-moment estimates are noisy early on, making the first updates unreliable in size.", lessons: ["m14.2.3", "m14.4.1"] },
      { id: "curvature", text: "Explains that early in training the loss is sharp, so a large step overshoots, and warmup lets the model reach flatter regions first.", lessons: ["m14.4.1"] },
      { id: "symptoms", text: "Predicts symptoms: early loss spikes, divergence or a run that settles worse.", lessons: ["l3.6.3"] },
      { id: "practice", text: "Says how warmup length is chosen and how it combines with the decay that follows.", lessons: ["l3.6.3"] },
    ],
    notes: "Two stories: variance of Adam's early estimates (RAdam) and sharpness reduction (warmup lets the network move to regions that tolerate the target rate). Post-norm networks are especially sensitive. Typical: a few hundred to a few thousand steps, then cosine or a stable phase with a final decay.",
  },
  {
    id: "f-cross-entropy",
    mode: "fundamentals",
    prompt: "Derive the gradient of softmax cross-entropy with respect to the logits. Why do frameworks fuse the two into one operation?",
    lessons: ["l3.3.2", "l3.2.3"],
    minutes: 6,
    rubric: [
      { id: "derivation", text: "Derives that the gradient is the softmax probabilities minus the one-hot target.", lessons: ["l3.3.2"] },
      { id: "batch", text: "Handles many examples at once, dividing the gradient by their number when the loss is a mean.", lessons: ["l3.2.3"] },
      { id: "stability", text: "Explains the fused version's stability: subtracting the maximum logit and computing the log-sum-exp without forming tiny probabilities.", lessons: ["l3.3.2"] },
      { id: "clarity", text: "Lays out the derivation step by step so it could be checked on a whiteboard.", lessons: [] },
    ],
    notes: "L = -z_y + logsumexp(z); dL/dz_i = softmax(z)_i - [i = y]. Fused log-softmax avoids log(0) and overflow, and the backward pass needs only the probabilities.",
  },
  {
    id: "f-leakage",
    mode: "fundamentals",
    prompt: "Your model scores far better on the validation set than it later does in production. Walk me through the likely causes and how you would tell them apart.",
    lessons: ["l1.7.2", "l1.1.4", "l1.5.2"],
    minutes: 6,
    rubric: [
      { id: "leakage", text: "Names leakage: duplicates or near-duplicates across splits, features computed with future or target information, preprocessing fitted on all the data.", lessons: ["l1.7.2"] },
      { id: "reuse", text: "Names overfitting to the validation set through repeated tuning, and the role of an untouched test set.", lessons: ["l1.1.4", "l1.5.2"] },
      { id: "shift", text: "Names distribution shift between the collected data and production.", lessons: ["l1.1.4"] },
      { id: "diagnosis", text: "Proposes concrete checks that separate the causes, such as splitting by time or by user, and deduplicating.", lessons: ["l1.7.2"] },
    ],
    notes: "Split by group or time, fit preprocessing on train only, deduplicate, hold out a final test, compare feature distributions between validation and production.",
  },
  {
    id: "f-kv-cache",
    mode: "fundamentals",
    prompt: "What does the KV cache store during generation, why does it make decoding faster, and what does it cost?",
    lessons: ["l5.3.4", "l5.2.2"],
    minutes: 5,
    rubric: [
      { id: "what", text: "Says it stores each layer's keys and values for every earlier position.", lessons: ["l5.3.4"] },
      { id: "why", text: "Explains that with causal masking earlier positions never change, so recomputing them each step is wasted work.", lessons: ["l5.2.2", "l5.3.4"] },
      { id: "cost", text: "Estimates its memory: two tensors per layer, growing with sequence length and batch size.", lessons: ["l5.3.4"] },
      { id: "clarity", text: "Keeps the explanation concrete, for example with the shapes involved.", lessons: [] },
    ],
    notes: "Per token: 2 * n_layers * n_heads * head_dim values. Each decode step computes q, k, v for one new token and attends over the cache. Memory grows linearly with context length and batch, which limits batch size at inference.",
  },
  {
    id: "f-loss-spikes",
    mode: "fundamentals",
    prompt: "Halfway through a large training run the loss suddenly spikes and then partly recovers, again and again. What might be happening, and what would you try?",
    lessons: ["m14.6.2", "m14.6.1", "m14.6.3"],
    minutes: 7,
    rubric: [
      { id: "mechanism", text: "Gives a plausible mechanism: the learning rate exceeds what the local sharpness allows, or Adam's second moment lags a sudden rare large gradient.", lessons: ["m14.6.2"] },
      { id: "logits", text: "Names logit growth in attention or the output layer, and z-loss or normalisation as a remedy.", lessons: ["m14.6.3"] },
      { id: "fixes", text: "Proposes measured fixes: gradient clipping, a lower peak rate or longer warmup, skipping bad batches, rolling back to a checkpoint.", lessons: ["m14.6.1"] },
      { id: "diagnosis", text: "Says what to log to tell the causes apart: gradient norms, update sizes, logit magnitudes, the data at the spike.", lessons: ["m14.6.2"] },
    ],
    notes: "Mechanisms: edge-of-stability style instability, Adam epsilon and beta2 interplay with rare large gradients, attention logit growth. Fixes: clipping, QK-norm or z-loss, lower beta2, rollback and skip data.",
  },
];

const research: InterviewQuestion[] = [
  {
    id: "r-walkthrough",
    mode: "research",
    prompt: "Walk me through your project. What question did you ask, why did it matter, what did you do, and what did you find?",
    lessons: ["l3.8.4", "e4.3.4"],
    needs: [{ kind: "project" }],
    minutes: 10,
    rubric: [
      { id: "question", text: "States a sharp question and why its answer matters, in a sentence or two.", lessons: [] },
      { id: "method", text: "Explains the method with its baselines and controls, so the reader knows what was compared with what.", lessons: ["l3.8.4"] },
      { id: "evidence", text: "Reports results with their uncertainty and separates what was shown from what was hoped.", lessons: ["e4.3.4"] },
      { id: "ownership", text: "Is clear about which decisions were theirs and why they made them.", lessons: [] },
      { id: "story", text: "Tells it as a story a busy researcher can follow, at the right level of detail.", lessons: [] },
    ],
    notes: "The interviewer has the project's question, plan, experiments and notebook. Probe for a specific number, a surprising result, a decision that turned out wrong, and what a sceptic would say.",
  },
  {
    id: "r-next",
    mode: "research",
    prompt: "Suppose you had ten times the compute and three more months for your project. What would you do next, and why that before anything else?",
    lessons: ["l3.8.4", "e4.3.3"],
    needs: [{ kind: "project" }],
    minutes: 7,
    rubric: [
      { id: "priority", text: "Picks the next experiment by what would most change their belief, not by what is easiest.", lessons: ["l3.8.4"] },
      { id: "risk", text: "Names the main threat to the current result and how the next step would test it.", lessons: ["l3.8.4"] },
      { id: "scale", text: "Says what more compute buys: more seeds, larger scale, broader sweeps, and which is worth it.", lessons: ["e4.3.3"] },
      { id: "kill", text: "Sets in advance what result would make them stop.", lessons: [] },
    ],
    notes: "Good answers rank options by expected information, mention seeds and error bars, and a clear stopping rule.",
  },
  {
    id: "r-claim",
    mode: "research",
    prompt: "A paper claims that a new activation function lowers language-model loss by two per cent. How would you check whether to believe it?",
    lessons: ["l3.8.4", "l3.1.3", "e4.3.1"],
    minutes: 7,
    rubric: [
      { id: "baseline", text: "Asks whether the baseline was tuned as carefully as the new method, including the learning rate.", lessons: ["l3.8.4"] },
      { id: "noise", text: "Asks how large seed-to-seed noise is compared with two per cent, and reruns with several seeds.", lessons: ["e4.3.1"] },
      { id: "confounds", text: "Checks confounds such as parameter count and compute, for example SwiGLU's extra matrix.", lessons: ["l3.1.3"] },
      { id: "scale", text: "Asks whether the gain holds across model sizes and training lengths.", lessons: ["l3.8.4"] },
    ],
    notes: "Equal-parameter and equal-FLOP comparisons, tuned baselines, multiple seeds, several scales, and a held-out evaluation.",
  },
  {
    id: "r-overfit-curve",
    mode: "research",
    prompt: "Training loss keeps falling, but validation loss starts rising after two thousand steps. Walk me through how you would investigate before changing anything.",
    lessons: ["l3.8.2", "l1.1.3", "l3.7.4"],
    minutes: 6,
    rubric: [
      { id: "overfit", text: "Recognises overfitting as the default reading and says what would confirm it.", lessons: ["l1.1.3", "l3.8.2"] },
      { id: "alternatives", text: "Rules out alternatives: a validation set from a different distribution, leakage the other way, a bug in evaluation mode.", lessons: ["l3.8.2"] },
      { id: "remedies", text: "Lists remedies in a sensible order: more data or augmentation, regularisation, early stopping on the right checkpoint.", lessons: ["l3.7.4"] },
      { id: "method", text: "Changes one thing at a time and says what result would settle each question.", lessons: [] },
    ],
    notes: "Check dataset sizes, duplicates, eval-mode differences such as dropout, compare on a held-out slice of training data. Early stopping keeps the best validation checkpoint.",
  },
];

const design: InterviewQuestion[] = [
  {
    id: "d-training-memory",
    mode: "design",
    prompt:
      "You need to train a seven-billion-parameter transformer on GPUs with 80 GB of memory each. Estimate the memory for weights, gradients, optimiser state and activations, then tell me how you would make it fit.",
    lessons: ["e7.6.2", "e6.4.1", "e6.4.3", "e6.5.4"],
    minutes: 15,
    rubric: [
      { id: "states", text: "Counts bytes per parameter for weights, gradients and Adam's two moments in mixed precision, about 16 bytes, so over 100 GB.", lessons: ["e7.6.2", "e6.4.1"] },
      { id: "activations", text: "Estimates activation memory and how it grows with batch, sequence length and layers.", lessons: ["e7.6.2"] },
      { id: "checkpointing", text: "Uses activation checkpointing and says what it trades: recomputation for memory.", lessons: ["e6.4.3"] },
      { id: "sharding", text: "Shards parameters, gradients and optimiser state across devices and explains the communication this adds.", lessons: ["e6.5.4"] },
      { id: "numbers", text: "Works with real numbers throughout and checks the totals against the budget.", lessons: [] },
    ],
    notes: "bf16 weights 2 B, fp32 master 4 B, grads 2-4 B, Adam m and v 8 B: about 16 B per parameter, 112 GB for 7B. Shard across 8 GPUs (ZeRO-style), checkpoint activations, smaller micro-batches with accumulation.",
  },
  {
    id: "d-inference-serving",
    mode: "design",
    prompt:
      "Design a service that serves a large chat model to many users at once with low latency. Where does the time go for each request, and how would you raise throughput without hurting latency too much?",
    lessons: ["e7.6.3", "l5.3.4", "e7.4.3", "e3.6.3"],
    minutes: 15,
    rubric: [
      { id: "phases", text: "Separates processing the prompt, which is compute-bound, from generating tokens one at a time, which is memory-bandwidth-bound.", lessons: ["e7.4.3", "l5.3.4"] },
      { id: "kv-memory", text: "Estimates KV cache memory per request and shows how it limits the batch size.", lessons: ["e7.6.3"] },
      { id: "batching", text: "Batches requests to raise arithmetic intensity, and explains the latency cost of waiting to fill a batch.", lessons: ["e7.4.3"] },
      { id: "service", text: "Covers the service around the model: request queueing, streaming responses, timeouts and load balancing.", lessons: ["e3.6.3"] },
      { id: "tradeoffs", text: "Names the trade-off between time to first token, tokens per second per user and cost.", lessons: [] },
    ],
    notes: "Prefill vs decode; decode reads all weights per step so batch to amortise; KV cache bounds concurrency; continuous batching; streaming over HTTP; quantisation and speculative decoding are bonus.",
  },
  {
    id: "d-mfu",
    mode: "design",
    prompt: "Your training run reaches only 25 per cent model FLOPs utilisation. How would you find out why, and what would you change?",
    lessons: ["e7.4.4", "e6.4.5", "e6.3.2", "e7.4.3"],
    minutes: 12,
    rubric: [
      { id: "definition", text: "Defines model FLOPs utilisation and computes the expected FLOPs per step.", lessons: ["e7.4.4"] },
      { id: "profile", text: "Profiles before guessing, and reads where time goes: kernels, data loading, communication, host overhead.", lessons: ["e6.4.5"] },
      { id: "data", text: "Checks whether the GPUs wait for data and how to fix the loader.", lessons: ["e6.3.2"] },
      { id: "kernels", text: "Uses the roofline to tell memory-bound from compute-bound operations and suggests fusion or larger matrices.", lessons: ["e7.4.3"] },
    ],
    notes: "MFU = achieved model FLOPs / peak. 6N FLOPs per token for training. Profile; fix input pipeline (workers, prefetch); fuse small ops; increase micro-batch; overlap communication.",
  },
  {
    id: "d-checkpointing",
    mode: "design",
    prompt: "Design checkpointing and recovery for a training run on a thousand GPUs, where some machine fails a few times a day. How often do you save, what do you save, and how do you resume exactly?",
    lessons: ["e6.3.3", "e4.3.1", "e3.4.3"],
    minutes: 12,
    rubric: [
      { id: "contents", text: "Saves everything needed for an exact resume: weights, optimiser state, schedule step, data loader position and random states.", lessons: ["e6.3.3", "e4.3.1"] },
      { id: "frequency", text: "Chooses the interval by balancing save cost against work lost per failure, with numbers.", lessons: [] },
      { id: "io", text: "Writes asynchronously and in parallel shards, so saving does not stall training, and verifies a checkpoint before trusting it.", lessons: ["e3.4.3"] },
      { id: "recovery", text: "Describes detecting a failure, replacing the machine and resuming without repeating or skipping data.", lessons: ["e6.3.3"] },
    ],
    notes: "Young's formula: interval about sqrt(2 * save_time * mean_time_between_failures). Async save to local disk then upload; atomic rename; keep the last few.",
  },
  {
    id: "d-parallelism",
    mode: "design",
    prompt: "Compare data, tensor and pipeline parallelism for training a model too large for one machine. How would you combine them on a cluster of nodes with eight GPUs each?",
    lessons: ["e10.2.1", "e10.4.1", "e10.5.2", "e10.7.2"],
    minutes: 15,
    rubric: [
      { id: "data", text: "Explains data parallelism and its all-reduce of gradients.", lessons: ["e10.2.1"] },
      { id: "tensor", text: "Explains tensor parallelism and why it belongs inside a node, on the fastest links.", lessons: ["e10.4.1"] },
      { id: "pipeline", text: "Explains pipeline parallelism, its bubble, and how micro-batching shrinks it.", lessons: ["e10.5.2"] },
      { id: "mesh", text: "Combines them into a device mesh matched to the network, with a worked example.", lessons: ["e10.7.2"] },
    ],
    notes: "TP within a node over NVLink, PP across nodes, DP (or FSDP) outermost. Bubble fraction about (p - 1) / m.",
  },
];

const values: InterviewQuestion[] = [
  {
    id: "v-why-lab",
    mode: "values",
    prompt: "Why do you want to work at this lab, in this role, rather than somewhere else?",
    lessons: [],
    needs: [{ kind: "readiness" }],
    minutes: 4,
    rubric: [
      { id: "specific", text: "Names something specific about the lab's work or approach, not praise that fits any lab.", lessons: [] },
      { id: "fit", text: "Connects their own skills and evidence to what the role actually asks for.", lessons: [] },
      { id: "honest", text: "Sounds honest and considered, including what they still need to learn.", lessons: [] },
    ],
    notes: "The interviewer has the target role and the labs from the learner's Readiness postings. Probe for specifics and for what would make them leave.",
  },
  {
    id: "v-wrong",
    mode: "values",
    prompt: "Tell me about a time your experiment showed you were wrong. What did you believe, what changed your mind, and what did you do next?",
    lessons: ["e4.3.4"],
    needs: [{ kind: "project" }],
    minutes: 5,
    rubric: [
      { id: "real", text: "Describes a real, specific case with what they expected and what happened.", lessons: [] },
      { id: "update", text: "Shows they updated on evidence rather than explaining it away.", lessons: ["e4.3.4"] },
      { id: "action", text: "Says what they changed as a result, in the work and in how they work.", lessons: [] },
    ],
    notes: "Use the learner's project experiments and notebook to ask for details. Look for intellectual honesty.",
  },
  {
    id: "v-feedback",
    mode: "values",
    prompt: "Tell me about a time you disagreed with feedback on your work, such as a code review. How did you handle it?",
    lessons: ["e4.4.3"],
    minutes: 5,
    rubric: [
      { id: "listen", text: "Shows they took the feedback seriously and tried to understand its reason.", lessons: ["e4.4.3"] },
      { id: "resolve", text: "Resolved it with evidence or a quick test rather than authority or stubbornness.", lessons: [] },
      { id: "reflect", text: "Reflects on what they learnt, including where they were wrong.", lessons: [] },
    ],
    notes: "STAR structure. Probe whether they would act differently now.",
  },
  {
    id: "v-safety-tradeoff",
    mode: "values",
    prompt: "What do you see as the most serious risks from frontier AI systems, and how should a lab weigh them against the pressure to ship?",
    lessons: ["l14.1.1", "l14.5.1"],
    minutes: 6,
    rubric: [
      { id: "risks", text: "Names concrete risks and the mechanisms behind them, not slogans.", lessons: ["l14.1.1"] },
      { id: "practice", text: "Knows how labs actually manage them, such as responsible scaling policies and capability thresholds.", lessons: ["l14.5.1"] },
      { id: "judgement", text: "Weighs the trade-off honestly and says where they would draw a line.", lessons: [] },
    ],
    notes: "Specification gaming, misuse, loss of oversight; RSPs, evals before deployment, safety cases.",
  },
];

/** Every question, in the order the Interview page lists them. */
export const QUESTIONS: InterviewQuestion[] = [...coding, ...fundamentals, ...research, ...design, ...values];

export const QUESTION_BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]));

export const questionsIn = (mode: InterviewMode) => QUESTIONS.filter((q) => q.mode === mode);
