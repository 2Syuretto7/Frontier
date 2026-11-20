import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PrefixCacheViz } from "@/components/viz/PrefixCacheViz";
import type { LessonContent } from "@/lib/types";

const PREFIX = `def block_keys(tokens, bs):
    return [tuple(tokens[:end]) for end in range(bs, len(tokens) + 1, bs)]   # a full block is named by its whole prefix

def cached_prefix_len(tokens, cache, bs):
    n = 0
    for key in block_keys(tokens, bs):
        if key not in cache:
            break                                   # reuse stops at the first block not in the cache
        n += bs
    return n

def insert(cache, tokens, bs):
    new = [k for k in block_keys(tokens, bs) if k not in cache]
    cache.update(new)
    return len(new)`;

const EVICT = `def lru_access(order, key, capacity):
    hit = key in order
    if hit:
        order.remove(key)
    order.append(key)                               # most recently used goes last
    if len(order) > capacity:
        order.pop(0)                                # evict the least recently used
    return hit

def hit_rate(accesses, capacity):
    order = []
    return sum(lru_access(order, k, capacity) for k in accesses) / len(accesses)

def prefill_saved(prompt_lens, cached_lens):
    return sum(cached_lens) / sum(prompt_lens)`;

export const lesson: LessonContent = {
  id: "e12.2.3",
  minutes: 50,
  links: {
    requires: ["e12.2.2", "e3.3.1"],
    revisits: ["e2.4.4", "e11.4.1"],
    foreshadows: ["e12.2.4"],
  },

  puzzle: (
    <>
      <p>
        An assistant prepends the same 3,000-token system prompt to every request, and in a chat, every turn resends the whole
        conversation so far. The server dutifully runs prefill over all of it, every time, so the tenth turn of a chat re-reads nine
        turns it has already processed. Time to first token grows with the length of the conversation. How can a server recognise
        that it has seen most of a prompt before, and is it safe to reuse the earlier work?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        In a causal model the keys and values at a position depend only on the tokens up to that position. So if a new prompt starts
        with exactly the same tokens as one already processed, the cached keys and values for that shared prefix are exactly what
        prefill would compute again. With paged attention the cache is already in blocks, so a server can name each full block by the
        prefix it ends, keep finished requests&apos; blocks in memory, and on a new request look up its blocks in order, reusing them
        until the first miss. Evicting least recently used blocks keeps the cache within memory.
      </p>
      <PrefixCacheViz />
    </>
  ),

  theory: (
    <>
      <Definition title="naming and finding prefix blocks">
        <p>
          <C>block_keys</C> names each full block of a token list by the tuple of all tokens up to the end of that block; real systems
          use a hash chained from the previous block&apos;s hash, which identifies the same prefix more cheaply. <C>cached_prefix_len</C>{" "}
          counts the tokens covered by leading blocks found in the cache, and <C>insert</C> adds a token list&apos;s block keys, returning
          how many were new.
        </p>
        <Code>{PREFIX}</Code>
      </Definition>

      <Theorem title="prefix reuse is exact">
        <p>
          In a causal transformer, the keys and values at position p in every layer are functions of tokens <M>{"x_1, \\dots, x_p"}</M>{" "}
          only. Hence two prompts that agree on their first p tokens have identical caches for those positions.
        </p>
      </Theorem>
      <Proof>
        <p>
          By induction on layers. At the input, position p&apos;s vector depends only on <M>{"x_p"}</M> and p. If in layer l every
          position&apos;s hidden state depends only on tokens up to that position, then in layer l + 1 position p attends only to
          positions <M>{"\\le p"}</M> by the causal mask, so its keys, values and output depend only on <M>{"x_1, \\dots, x_p"}</M>. Thus
          a matching prefix gives an identical cache. Reuse must stop at the first difference: a later block depends on the differing
          token even if its own tokens match, which is why each block is named by its whole prefix, as in a trie (e2.4.4).
        </p>
      </Proof>

      <Definition title="eviction and savings">
        <p>
          <C>lru_access</C> updates a recency list, moving a hit to the end, appending a miss and evicting the oldest key when over
          capacity, and reports whether it was a hit. <C>hit_rate</C> replays a sequence of accesses from an empty cache.{" "}
          <C>prefill_saved</C> is the fraction of prompt tokens served from the cache.
        </p>
        <Code>{EVICT}</Code>
      </Definition>

      <Theorem title="a cycle defeats LRU">
        <p>
          If accesses cycle through k + 1 distinct keys and the cache holds k, least-recently-used eviction never hits.
        </p>
      </Theorem>
      <Proof>
        <p>
          Before any access to a key x in the cycle, the k + 1 accesses since x was last used have touched all k other keys, which are
          now more recent than x. If x were still present, the cache would hold k + 1 keys, too many; so x was the least recently used
          and has been evicted, and the access misses. An optimal policy, evicting the key used furthest in future, would hit on most
          accesses, so eviction policy matters (e3.3.1). Serving systems therefore also prefer to keep blocks shared by many requests,
          such as system prompts.
        </p>
      </Proof>

      <Remark title="prefix caching in practice">
        <p>
          Serving engines organise cached blocks as a radix tree or a hash table of chained block hashes, so that a lookup walks down the
          shared prefix. Many API providers cache prompt prefixes automatically or on request and charge less for cached input tokens.
          Routers send requests with the same prefix to the same replica, since the cache lives in that replica&apos;s memory. Exact
          matching matters: a timestamp at the start of a system prompt, or a different tokenisation, breaks reuse for everything after
          it, much as a single changed byte changes an exact-duplicate hash (e11.4.1).
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          The system prompt&apos;s blocks are computed once and then found in the cache by every request; each chat turn finds all
          earlier turns cached, since its prompt extends the previous one, and runs prefill only on the new message. Reuse is exact by the
          theorem, so outputs are unchanged, and time to first token no longer grows with conversation length.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "partial",
      rung: "check",
      prompt: (
        <p>
          A 3,000-token system prompt is cached in blocks of 16 tokens; only full blocks are cached. A request sends that system prompt
          followed by 500 new tokens. How many tokens must prefill compute?
        </p>
      ),
      answer: { kind: "numeric", value: 508, tolerance: 0 },
    },
    {
      key: "lru",
      rung: "check",
      prompt: (
        <p>
          An LRU cache of capacity 3, initially empty, sees the accesses a, b, c, a, b, c, a, b, c. What is its hit rate? Give three
          decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.667, tolerance: 0.001 },
    },
    {
      key: "routing",
      rung: "apply",
      prompt: <p>Why do routers in front of several serving replicas try to send requests with the same prefix to the same replica?</p>,
      answer: {
        kind: "choice",
        options: [
          "The prefix cache lives in each replica's own memory, so only that replica can reuse the blocks",
          "Replicas can only run one system prompt each",
          "It balances load evenly across replicas",
          "Prefix caching changes the model's outputs",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def block_keys(tokens, bs):
    return [tuple(tokens[:end]) for end in range(bs, len(tokens) + 1, bs)]   # a full block is named by its whole prefix

def cached_prefix_len(tokens, cache, bs):
    n = 0
    for key in block_keys(tokens, bs):
        if key not in cache:
            break                                   # reuse stops at the first block not in the cache
        n += bs
    return n

def insert(cache, tokens, bs):
    new = [k for k in block_keys(tokens, bs) if k not in cache]
    cache.update(new)
    return len(new)

cache = set(); n = insert(cache, [1, 2, 3, 4, 5, 6, 7], 2)
print(n, cached_prefix_len([1, 2, 3, 4, 9, 9], cache, 2), cached_prefix_len([1, 2, 3, 4, 5, 6, 8], cache, 2), insert(cache, [1, 2, 3, 9], 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["3 4 6 1", "3 4 6 2", "4 4 6 1", "3 2 6 1"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def lru_access(order, key, capacity):
    hit = key in order
    if hit:
        order.remove(key)
    order.append(key)                               # most recently used goes last
    if len(order) > capacity:
        order.pop(0)                                # evict the least recently used
    return hit

def hit_rate(accesses, capacity):
    order = []
    return sum(lru_access(order, k, capacity) for k in accesses) / len(accesses)

def prefill_saved(prompt_lens, cached_lens):
    return sum(cached_lens) / sum(prompt_lens)

acc = ["a", "b", "a", "c", "b", "a"]
print(round(hit_rate(acc, 2), 2), hit_rate(acc, 3), prefill_saved([100, 300], [50, 250]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.17 0.5 0.75", "0.33 0.5 0.75", "0.17 0.33 0.75", "0.17 0.5 0.6"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>block_keys(tokens, bs)</C>, ignoring a final partial block; <C>cached_prefix_len(tokens, cache, bs)</C>; and{" "}
          <C>insert(cache, tokens, bs)</C>, where <C>cache</C> is a set.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def block_keys(tokens, bs):
    return [tuple(tokens[i:i + bs]) for i in range(0, len(tokens), bs)]

def cached_prefix_len(tokens, cache, bs):
    return 0

def insert(cache, tokens, bs):
    return 0
`,
        solution: PREFIX,
        tests: [
          { name: "keys", code: `assert block_keys([5, 6, 7, 8, 9], 2) == [(5, 6), (5, 6, 7, 8)] and block_keys([1], 2) == []` },
          { name: "lookup", code: `c = set()\nassert insert(c, [1, 1, 2, 2], 2) == 2 and insert(c, [1, 1, 2, 2], 2) == 0\nassert cached_prefix_len([1, 1, 2, 2, 3, 3], c, 2) == 4 and cached_prefix_len([2, 2, 2, 2], c, 2) == 0\nc.add((1, 1, 9, 9, 3, 3))\nassert cached_prefix_len([1, 1, 9, 9, 3, 3], c, 2) == 2` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>lru_access(order, key, capacity)</C>, which updates the list <C>order</C> in place; <C>hit_rate(accesses,
          capacity)</C>; and <C>prefill_saved(prompt_lens, cached_lens)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def lru_access(order, key, capacity):
    order.append(key)
    return False

def hit_rate(accesses, capacity):
    return 0.0

def prefill_saved(prompt_lens, cached_lens):
    return 0.0
`,
        solution: EVICT,
        tests: [
          { name: "lru", code: `o = ["x", "y"]\nassert lru_access(o, "x", 2) and o == ["y", "x"]\nassert not lru_access(o, "z", 2) and o == ["x", "z"]` },
          { name: "rate", code: `assert hit_rate(["p", "p", "p", "p"], 1) == 0.75 and hit_rate(["p", "q", "r", "p"], 2) == 0.0\nassert prefill_saved([10, 30], [0, 10]) == 0.25` },
        ],
      },
    },
    {
      key: "chat",
      rung: "stretch",
      prompt: (
        <p>
          A chat has ten turns. Each turn adds 200 user tokens, and each reply is 300 tokens; every turn&apos;s prompt is the whole
          conversation so far plus the new user message. Without prefix caching, how many prompt tokens does prefill process over the ten
          turns?
        </p>
      ),
      answer: { kind: "numeric", value: 24500, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Even with caching, a long new prompt needs a long prefill, and while it runs, the decode steps of every other sequence in the
        batch wait. The next lesson splits prefill into chunks, or moves it to separate machines altogether.
      </p>
    </>
  ),
};
