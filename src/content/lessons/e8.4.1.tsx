import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MapReduceSkewViz } from "@/components/viz/MapReduceSkewViz";
import type { LessonContent } from "@/lib/types";

const ENGINE = `def shuffle(pairs, n_reducers, partition):
    parts = [{} for _ in range(n_reducers)]
    for k, v in pairs:
        parts[partition(k, n_reducers)].setdefault(k, []).append(v)
    return parts

def map_reduce(records, mapper, reducer, n_reducers, partition):
    pairs = [kv for rec in records for kv in mapper(rec)]
    out = {}
    for part in shuffle(pairs, n_reducers, partition):
        for k in sorted(part):
            out[k] = reducer(k, part[k])
    return out

def combine(pairs, reducer):
    groups = {}
    for k, v in pairs:
        groups.setdefault(k, []).append(v)
    return [(k, reducer(k, vs)) for k, vs in groups.items()]`;

const BALANCE = `def makespan(task_times, workers):
    free = [0] * workers
    for t in task_times:
        i = free.index(min(free))
        free[i] += t
    return max(free)

def reducer_loads(counts, n_reducers, partition):
    loads = [0] * n_reducers
    for k, c in counts.items():
        loads[partition(k, n_reducers)] += c
    return loads

def salt(counts, key, ways):
    out = {k: c for k, c in counts.items() if k != key}
    q, r = divmod(counts[key], ways)
    for i in range(ways):
        out[f'{key}#{i}'] = q + (1 if i < r else 0)
    return out`;

export const lesson: LessonContent = {
  id: "e8.4.1",
  minutes: 50,
  links: {
    requires: ["e8.2.3", "e8.3.3"],
    revisits: ["e8.1.3", "e8.3.1"],
    foreshadows: ["e8.4.2"],
  },

  puzzle: (
    <>
      <p>
        To count how often every word occurs in ten terabytes of web text, a single machine would need days just to read the
        data. A thousand machines could do it in minutes, but someone has to split the work, move the partial counts to the
        right places, and cope with the machines that crash or crawl halfway through. Is there a way to write only the
        counting and have a system handle the rest?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Express the job as two small functions. The <em>map</em> function looks at one record and emits key–value pairs, such
        as (word, 1) for every word in a line. The system then <em>shuffles</em>: it sends every pair with the same key to the
        same machine, an all-to-all. The <em>reduce</em> function receives one key with all of its values and combines them,
        here by summing. Because both functions are deterministic and work on independent pieces, the system can run them
        anywhere, as many times as needed, and simply rerun the piece of a machine that fails.
      </p>
      <MapReduceSkewViz />
    </>
  ),

  theory: (
    <>
      <Definition title="map-reduce">
        <p>
          (Dean and Ghemawat, 2004.) A job is a mapper, taking a record to a list of key–value pairs, and a reducer, taking a
          key and the list of its values to a result. The input is split among map tasks; their output is partitioned among R
          reduce tasks by a function of the key, typically a hash mod R (<C>shuffle</C>); each reduce task sorts its keys and
          applies the reducer to each (<C>map_reduce</C>).
        </p>
        <Code>{ENGINE}</Code>
      </Definition>

      <Theorem title="the result does not depend on the execution">
        <p>
          If the mapper and reducer are deterministic, the output of <C>map_reduce</C> is the same for every number of
          reducers and every partition function, and is unchanged if any task is re-executed.
        </p>
      </Theorem>
      <Proof>
        <p>
          The partition function sends every pair with key k to the same reducer, so that reducer receives all of k&apos;s values,
          in the order in which the mappers emitted them, which depends only on the records. The reducer is applied to exactly
          this list whatever the partition, so each key&apos;s result is fixed. Re-executing a deterministic map or reduce task
          on the same input produces the same output, so a system can recover from a crashed worker simply by running its tasks
          again elsewhere and discarding any duplicate output.
        </p>
      </Proof>

      <Definition title="combiners">
        <p>
          When the reducer folds its values with an associative and commutative operation, such as a sum, a count or a maximum,
          each map task can apply it to its own output first (<C>combine</C>), so that only one pair per key per map task is
          shuffled. Averages need care: the mean of per-mapper means is not the mean, so a combiner must emit sums and counts
          and let the reducer divide.
        </p>
      </Definition>

      <Definition title="stragglers and skew">
        <p>
          A job finishes when its last task does. A scheduler that gives each task, in order, to the worker that becomes free
          first produces the makespan computed by <C>makespan</C>. Two effects make the last task late. A <em>straggler</em> is a
          slow machine, handled by launching backup copies of the last running tasks and taking whichever finishes first.{" "}
          <em>Skew</em> is a key with far more values than the rest, which overloads one reducer (<C>reducer_loads</C>);{" "}
          <em>salting</em> splits a hot key into several sub-keys and combines their results in a second, small step (<C>salt</C>).
        </p>
        <Code>{BALANCE}</Code>
      </Definition>

      <Theorem title="list scheduling">
        <p>
          (Graham, 1966.) On m identical workers, greedy list scheduling in any order gives a makespan at most{" "}
          <M>{"(2 - 1/m)"}</M> times the optimum.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let the task that finishes last have length t and start at s. Until s every worker was busy, otherwise the task would
          have started earlier, so <M>{"ms \\le T - t"}</M>, where T is the total work. The makespan is{" "}
          <M>{"s + t \\le (T - t)/m + t = T/m + (1 - 1/m)t"}</M>. The optimum is at least T/m and at least t, so the makespan is at
          most <M>{"(2 - 1/m)"}</M> times the optimum. Ordering tasks longest first improves the bound to 4/3 − 1/(3m).
        </p>
      </Proof>

      <Remark title="map-reduce today">
        <p>
          Hadoop made the model widely available, and Spark generalised it to chains of transformations kept in memory, recovering
          lost partitions by recomputing them from their lineage. Preparing data for language models is largely this kind of
          work: counting n-grams, deduplicating documents, filtering and tokenising petabytes of text, one embarrassingly
          parallel map followed by a shuffle (e11).
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "graham",
      rung: "check",
      prompt: <p>By Graham&apos;s bound, at most how many times the optimal makespan can greedy list scheduling take on 4 workers?</p>,
      answer: { kind: "numeric", value: 1.75, tolerance: 0.0001 },
    },
    {
      key: "salt",
      rung: "check",
      prompt: <p>A key with 1000 values is salted into 3 sub-keys, the first taking any remainder. How many values does the largest sub-key hold?</p>,
      answer: { kind: "numeric", value: 334, tolerance: 0 },
    },
    {
      key: "comb",
      rung: "apply",
      prompt: <p>For which reducer can each map task safely apply the reducer itself as a combiner?</p>,
      answer: {
        kind: "choice",
        options: [
          "The maximum of the values",
          "The mean of the values",
          "The median of the values",
          "The number of distinct values, computed by counting the list",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def shuffle(pairs, n_reducers, partition):
    parts = [{} for _ in range(n_reducers)]
    for k, v in pairs:
        parts[partition(k, n_reducers)].setdefault(k, []).append(v)
    return parts

def map_reduce(records, mapper, reducer, n_reducers, partition):
    pairs = [kv for rec in records for kv in mapper(rec)]
    out = {}
    for part in shuffle(pairs, n_reducers, partition):
        for k in sorted(part):
            out[k] = reducer(k, part[k])
    return out

def combine(pairs, reducer):
    groups = {}
    for k, v in pairs:
        groups.setdefault(k, []).append(v)
    return [(k, reducer(k, vs)) for k, vs in groups.items()]

wc = lambda line: [(w, 1) for w in line.split()]; print(map_reduce(['a b a', 'c b a'], wc, lambda k, vs: sum(vs), 2, lambda k, n: ord(k) % n), shuffle([('x', 1), ('y', 2), ('x', 3)], 2, lambda k, n: ord(k) % n))
print(combine([('a', 1), ('b', 1), ('a', 1)], lambda k, vs: sum(vs)), map_reduce([3, 4], lambda x: [('even' if x % 2 == 0 else 'odd', x)], lambda k, vs: max(vs), 1, lambda k, n: 0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{'b': 2, 'a': 3, 'c': 1} [{'x': [1, 3]}, {'y': [2]}]\n[('a', 2), ('b', 1)] {'even': 4, 'odd': 3}",
          "{'a': 3, 'b': 2, 'c': 1} [{'x': [1, 3]}, {'y': [2]}]\n[('a', 2), ('b', 1)] {'even': 4, 'odd': 3}",
          "{'b': 2, 'a': 3, 'c': 1} [{'y': [2]}, {'x': [1, 3]}]\n[('a', 2), ('b', 1)] {'even': 4, 'odd': 3}",
          "{'b': 2, 'a': 3, 'c': 1} [{'x': [1, 3]}, {'y': [2]}]\n[('a', 1), ('b', 1), ('a', 1)] {'even': 4, 'odd': 3}",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def makespan(task_times, workers):
    free = [0] * workers
    for t in task_times:
        i = free.index(min(free))
        free[i] += t
    return max(free)

def reducer_loads(counts, n_reducers, partition):
    loads = [0] * n_reducers
    for k, c in counts.items():
        loads[partition(k, n_reducers)] += c
    return loads

def salt(counts, key, ways):
    out = {k: c for k, c in counts.items() if k != key}
    q, r = divmod(counts[key], ways)
    for i in range(ways):
        out[f'{key}#{i}'] = q + (1 if i < r else 0)
    return out

print(makespan([4, 3, 2, 2, 1], 2), makespan([5, 1, 1, 1], 3), reducer_loads({'a': 5, 'b': 2, 'c': 4}, 2, lambda k, n: ord(k) % n))
print(salt({'a': 10, 'b': 1}, 'a', 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "6 5 [2, 9]\n{'b': 1, 'a#0': 4, 'a#1': 3, 'a#2': 3}",
          "7 5 [2, 9]\n{'b': 1, 'a#0': 4, 'a#1': 3, 'a#2': 3}",
          "6 8 [2, 9]\n{'b': 1, 'a#0': 4, 'a#1': 3, 'a#2': 3}",
          "6 5 [9, 2]\n{'b': 1, 'a#0': 3, 'a#1': 3, 'a#2': 4}",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>shuffle(pairs, n_reducers, partition)</C>, returning one dictionary per reducer from key to its list of
          values; <C>map_reduce(records, mapper, reducer, n_reducers, partition)</C>, returning a dictionary from each key to
          its reduced result; and <C>combine(pairs, reducer)</C>, returning one <C>(key, result)</C> pair per key in order of
          first appearance.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def shuffle(pairs, n_reducers, partition):
    return [{} for _ in range(n_reducers)]

def map_reduce(records, mapper, reducer, n_reducers, partition):
    return {}

def combine(pairs, reducer):
    return list(pairs)
`,
        solution: ENGINE,
        tests: [
          { name: "shuffle", code: `p = lambda k, n: len(k) % n
assert shuffle([], 3, p) == [{}, {}, {}] and shuffle([('ab', 1), ('c', 2), ('ab', 3), ('de', 4)], 2, p) == [{'ab': [1, 3], 'de': [4]}, {'c': [2]}]
assert combine([], max) == [] and combine([('k', 3), ('j', 1), ('k', 5)], lambda k, vs: max(vs)) == [('k', 5), ('j', 1)]` },
          { name: "job", code: `wc = lambda s: [(w, 1) for w in s.split()]
total = lambda k, vs: sum(vs)
lines = ['the cat', 'the dog the', 'a cat']
want = {'the': 3, 'cat': 2, 'dog': 1, 'a': 1}
for n in (1, 2, 3, 5):
    assert map_reduce(lines, wc, total, n, lambda k, n: len(k) % n) == want
assert map_reduce([5, 2, 9], lambda x: [('v', x)], lambda k, vs: vs, 1, lambda k, n: 0) == {'v': [5, 2, 9]}` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>makespan(task_times, workers)</C> for greedy list scheduling (ties go to the lowest-numbered worker);{" "}
          <C>reducer_loads(counts, n_reducers, partition)</C>; and <C>salt(counts, key, ways)</C>, replacing the key by sub-keys{" "}
          <C>f&apos;&#123;key&#125;#&#123;i&#125;&apos;</C> whose counts differ by at most one, the first ones taking the remainder.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def makespan(task_times, workers):
    return sum(task_times) / workers

def reducer_loads(counts, n_reducers, partition):
    return [0] * n_reducers

def salt(counts, key, ways):
    return dict(counts)
`,
        solution: BALANCE,
        tests: [
          { name: "makespan", code: `assert makespan([], 2) == 0 and makespan([3], 4) == 3 and makespan([2, 2, 2], 1) == 6 and makespan([1, 1, 1, 1, 1, 1, 8], 3) == 10
assert makespan([7, 5, 4, 4, 3, 3, 2, 2], 3) == 10` },
          { name: "loads", code: `p = lambda k, n: len(k) % n
assert reducer_loads({}, 2, p) == [0, 0] and reducer_loads({'aa': 3, 'b': 4, 'cc': 1}, 2, p) == [4, 4]
assert salt({'x': 5}, 'x', 5) == {'x#0': 1, 'x#1': 1, 'x#2': 1, 'x#3': 1, 'x#4': 1}
assert salt({'x': 2, 'y': 7}, 'x', 3) == {'y': 7, 'x#0': 1, 'x#1': 1, 'x#2': 0}` },
        ],
      },
    },
    {
      key: "order",
      rung: "stretch",
      prompt: (
        <p>
          Tasks of lengths 2, 2, 3, 3, 4, 4, 5 and 7, in that order, are scheduled greedily on 3 workers. What is the makespan?
        </p>
      ),
      answer: { kind: "numeric", value: 13, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Map-reduce processes a fixed dataset in batches. Many sources never stop: logs, user events, metrics from a training
        run. The next lesson asks how to compute over an unbounded stream, where results must be produced continuously and
        events can arrive late.
      </p>
    </>
  ),
};
