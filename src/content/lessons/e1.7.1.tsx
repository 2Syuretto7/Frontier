import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { GroupByViz } from "@/components/viz/GroupByViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e1.7.1",
  minutes: 50,
  links: {
    requires: ["e1.5.2", "e1.5.4"],
    revisits: ["e0.5.2"],
    foreshadows: ["e1.7.3", "e2.3.1"],
  },

  puzzle: (
    <>
      <p>
        A shop has a table of eight orders, each with a city, a product and an amount in rupees. Your manager asks for the
        total spent in each city, then the average order size for each product, then the number of orders per city.
      </p>
      <p>
        With plain Python lists you could write three loops with three dictionaries. Is there one idea that covers all three
        questions, and every question like them?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        There is: <strong>split, apply, combine</strong>. Split the rows into groups by a key, apply a summary to each group,
        and combine the answers into a new table. Change the key and the summary below and watch the same three steps
        produce each answer.
      </p>
      <GroupByViz />
    </>
  ),

  theory: (
    <>
      <Definition title="dataframe">
        <p>
          A <strong>dataframe</strong> is a table of named columns. Each column is a typed array (in pandas, a{" "}
          <C>Series</C> backed by NumPy or Arrow), and all columns share one <strong>index</strong> of row labels. Because
          columns are arrays, column operations are vectorised, as in NumPy.
        </p>
      </Definition>

      <Example title="the basic operations">
        <Code>{`import pandas as pd

df = pd.read_csv("orders.csv")
df.head()                          # first rows
df.dtypes                          # type of each column
df["amount"].sum()                 # a column is a Series
df[df["amount"] > 300]             # filter rows with a boolean mask
df.assign(gst=df["amount"] * 0.18) # add a column, returning a new frame
df.sort_values("amount", ascending=False)
df.groupby("city")["amount"].agg(["sum", "mean", "size"])`}</Code>
      </Example>

      <Definition title="group-by">
        <p>
          <C>df.groupby(key)</C> splits the rows by the values of <C>key</C>. An aggregation such as <C>sum</C>,{" "}
          <C>mean</C> or <C>size</C> then reduces each group to one value, and the results form a new frame indexed by the
          key. Inside, the library uses a hash table from key to group, so a group-by takes one pass over the rows.
        </p>
      </Definition>

      <Example title="joining two tables">
        <Code>{`customers = pd.DataFrame({"city": ["Pune", "Delhi"], "region": ["West", "North"]})
df.merge(customers, on="city", how="left")   # every order, with its region if known`}</Code>
        <p>
          A <strong>merge</strong> (a join) matches rows of two frames on a shared key. With <C>how=&quot;left&quot;</C>,
          orders from cities missing from <C>customers</C> are kept, with a missing region.
        </p>
      </Example>

      <Remark title="stay vectorised">
        <p>
          <C>df.apply(f, axis=1)</C> calls a Python function once per row and is as slow as a Python loop. Prefer column
          arithmetic, masks and built-in aggregations, which run in compiled code. Libraries such as Polars go further and plan
          a whole chain of operations before running it.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "column",
      rung: "check",
      prompt: <p>What is a column of a pandas dataframe?</p>,
      answer: {
        kind: "choice",
        options: ["A typed array sharing the frame's index", "A Python list of objects", "A dictionary from row number to value"],
        correct: [0],
      },
    },
    {
      key: "steps",
      rung: "check",
      prompt: <p>What are the three steps of a group-by?</p>,
      answer: { kind: "choice", options: ["Split, apply, combine", "Sort, scan, merge", "Map, filter, reduce"], correct: [0] },
    },
    {
      key: "pune",
      rung: "apply",
      prompt: (
        <p>
          Using the eight orders in the chart above, what is <C>df.groupby(&quot;city&quot;)[&quot;amount&quot;].sum()</C> for
          Pune?
        </p>
      ),
      answer: { kind: "numeric", value: 1480 },
    },
    {
      key: "bag",
      rung: "apply",
      prompt: <p>Using the same orders, what is the mean amount for the product bag? Give two decimal places.</p>,
      answer: { kind: "numeric", value: 766.67, tolerance: 0.0001 },
    },
    {
      key: "mask",
      rung: "apply",
      prompt: <p>Using the same orders, how many rows does <C>df[df[&quot;amount&quot;] &gt; 300]</C> have?</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import pandas as pd
df = pd.DataFrame({"city": ["Pune", "Pune", "Delhi"], "sales": [10, 30, 25]})
print(df.groupby("city")["sales"].sum().to_dict())`}</Code>
          <p>Group by a column and sum. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["{'Delhi': 25, 'Pune': 40}", "{'Pune': 40, 'Delhi': 25}", "{'Delhi': 25, 'Pune': 30}", "{'Pune': 10, 'Delhi': 25}"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import pandas as pd
df = pd.DataFrame({"a": [1, 2, 3, 4], "b": ["x", "y", "x", "y"]})
s = df[df["a"] > 1].groupby("b")["a"].agg(["sum", "count"])
print(s.to_dict("index"), df.loc[2, "b"], df.iloc[-1]["a"])`}</Code>
          <p>Filtering, grouping with two aggregates, and label versus position indexing. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["{'x': {'sum': 3, 'count': 1}, 'y': {'sum': 6, 'count': 2}} x 4", "{'x': {'sum': 4, 'count': 2}, 'y': {'sum': 6, 'count': 2}} x 4", "{'x': {'sum': 3, 'count': 1}, 'y': {'sum': 6, 'count': 2}} y 4", "{'x': {'sum': 3, 'count': 1}, 'y': {'sum': 6, 'count': 2}} x 3"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>top_products(df, n)</C> for a DataFrame with columns <C>product</C>, <C>qty</C> and <C>price</C>: add a <C>revenue</C> column (qty × price) to a copy, total it by product, and return a Series of the n products with the highest revenue, largest first.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import pandas as pd

def top_products(df, n):
    return df.head(n)
`,
        solution: `import pandas as pd

def top_products(df, n):
    d = df.assign(revenue=df['qty'] * df['price'])
    return d.groupby('product')['revenue'].sum().sort_values(ascending=False).head(n)
`,
        tests: [
          { name: "top", code: `import pandas as pd
df = pd.DataFrame({'product': ['pen', 'book', 'pen', 'bag'], 'qty': [10, 2, 5, 1], 'price': [10, 300, 10, 500]})
r = top_products(df, 2)
assert list(r.index) == ['book', 'bag'] and list(r.values) == [600, 500], 'book: 600, bag: 500, pen: 150.'` },
          { name: "unchanged", code: `import pandas as pd
df = pd.DataFrame({'product': ['a'], 'qty': [1], 'price': [2]})
top_products(df, 1)
assert 'revenue' not in df.columns, 'Do not add columns to the caller’s DataFrame.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            A sales DataFrame has columns <C>region</C>, <C>month</C> (strings like <C>"2026-01"</C>) and <C>revenue</C>. Write <C>pivot(df)</C>, a table with regions as rows and months as columns (both sorted) holding total revenue, with 0 where there were no sales; <C>best_region(df)</C>, a Series indexed by month giving the region with the highest total that month (the alphabetically first on ties); and <C>growth(df)</C>, the month-on-month percentage change of each region&rsquo;s total as a table like <C>pivot</C> (the first month is NaN).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import pandas as pd

def pivot(df):
    return df

def best_region(df):
    return pd.Series(dtype=object)

def growth(df):
    return df
`,
        solution: `import pandas as pd

def pivot(df):
    return df.pivot_table(index='region', columns='month', values='revenue', aggfunc='sum', fill_value=0).sort_index().sort_index(axis=1)

def best_region(df):
    p = pivot(df)
    return pd.Series({m: p[m][p[m] == p[m].max()].index.min() for m in p.columns})

def growth(df):
    p = pivot(df).astype(float)
    return p.pct_change(axis=1) * 100
`,
        tests: [
          { name: "pivot", code: `import pandas as pd
df = pd.DataFrame({'region': ['N', 'S', 'N', 'E', 'S', 'N'], 'month': ['2026-02', '2026-01', '2026-01', '2026-02', '2026-02', '2026-02'], 'revenue': [10, 5, 20, 30, 15, 5]})
p = pivot(df)
assert list(p.index) == ['E', 'N', 'S'] and list(p.columns) == ['2026-01', '2026-02'] and p.values.tolist() == [[0, 30], [20, 15], [5, 15]], 'Sum per cell; 0 where nothing was sold.'` },
          { name: "best", code: `import pandas as pd
df = pd.DataFrame({'region': ['N', 'S', 'N', 'E', 'S', 'N'], 'month': ['2026-02', '2026-01', '2026-01', '2026-02', '2026-02', '2026-02'], 'revenue': [10, 5, 20, 30, 15, 5]})
b = best_region(df)
assert b.to_dict() == {'2026-01': 'N', '2026-02': 'E'}
tie = pd.DataFrame({'region': ['B', 'A'], 'month': ['m', 'm'], 'revenue': [1, 1]})
assert best_region(tie).to_dict() == {'m': 'A'}` },
          { name: "growth", code: `import numpy as np
import pandas as pd, numpy as np
df = pd.DataFrame({'region': ['N', 'N', 'N', 'S', 'S'], 'month': ['01', '02', '03', '01', '03'], 'revenue': [100, 150, 75, 40, 60]})
g = growth(df)
assert np.isnan(g.loc['N', '01']) and g.loc['N', '02'] == 50 and g.loc['N', '03'] == -50 and g.loc['S', '02'] == -100` },
        ],
      },
    },
    {
      key: "hash",
      rung: "prove",
      prompt: (
        <p>
          Describe how to compute a group-by sum over <C>n</C> rows in one pass using a dictionary, and state its running time.
          Then explain why <C>df.apply(f, axis=1)</C> is much slower than the equivalent column arithmetic, even though both
          touch every row once.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Describes keeping a dictionary from key to running total and adding each row's amount to its key's entry.",
          "States the time is O(n), assuming dictionary operations take constant time on average.",
          "Explains that apply calls a Python function per row, paying interpreter overhead and boxing each value.",
          "Explains that column arithmetic runs one compiled loop over a contiguous typed array.",
        ],
      },
    },
    {
      key: "meanofmeans",
      rung: "stretch",
      prompt: (
        <p>
          Using the same orders, compute the mean over cities of each city&rsquo;s mean amount. The overall mean is 493.75, and it
          is worth asking why the two differ. Give your answer to two decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 579.17, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what a dataframe is, what split, apply, combine means, and why column operations are faster than row-by-row functions.",

  glimpse: (
    <p>
      Next, the step that comes before any of this: real files arrive with stray spaces, mixed date formats, typos and
      duplicates, and the totals are wrong until they are cleaned.
    </p>
  ),
};
