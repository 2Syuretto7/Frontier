import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CleanViz } from "@/components/viz/CleanViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e1.7.2",
  minutes: 50,
  links: {
    requires: ["e1.7.1"],
    revisits: ["e0.5.2", "e0.5.3"],
    parallels: ["l1.7.1"],
    foreshadows: ["e11.4.1"],
  },

  puzzle: (
    <>
      <p>
        A file of seven orders arrives from the branch offices. Loaded as it is, the amounts total ₹1,400 and there are six
        different cities. In fact the company has branches in four cities, and one of the orders alone was ₹1,200.
      </p>
      <p>What went wrong, and what is the right total?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Every summary is only as good as the table under it. Step through the cleaning below and watch the number of rows,
        the number of distinct cities and the total change. Each step fixes one kind of mess, and the last step makes a
        decision that must be reported, not hidden.
      </p>
      <CleanViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the usual problems">
        <p>
          Inconsistent text (spaces, capitals, spellings), numbers stored as text with symbols or commas, several date
          formats, typos that make a value unreadable, duplicated records, missing values written in many ways (<C>N/A</C>,{" "}
          <C>-</C>, an empty cell, <C>0</C>, <C>999</C>), and values that parse but are impossible, such as a negative age.
        </p>
      </Definition>

      <Example title="a cleaning script">
        <Code>{`df = pd.read_csv("orders.csv", dtype=str, na_values=["N/A", ""])
df["city"] = df["city"].str.strip().str.title()
df["amount"] = pd.to_numeric(df["amount"].str.replace(r"[₹,]", "", regex=True),
                             errors="coerce")          # unreadable -> NaN
df["date"] = pd.to_datetime(df["date"], format="mixed", dayfirst=True)
before = len(df)
df = df.drop_duplicates()
missing = df["amount"].isna().sum()
df = df.dropna(subset=["amount"])
print(f"dropped {before - len(df)} rows, {missing} with no amount")`}</Code>
        <p>
          Reading everything as text first (<C>dtype=str</C>) stops the library from guessing types silently.{" "}
          <C>errors=&quot;coerce&quot;</C> turns unreadable values into <C>NaN</C> instead of crashing, so you can count
          them.
        </p>
      </Example>

      <Definition title="missing values">
        <p>
          A missing value means &ldquo;unknown&rdquo;, not zero. You can drop the rows, fill them (impute) with a typical
          value such as the median, or keep them and let each analysis decide. Each choice changes the results, so say which
          one you made and how many rows it touched.
        </p>
      </Definition>

      <Remark title="order matters and so does reproducibility">
        <p>
          Tidy the text before removing duplicates, or <C>&quot;Delhi &quot;</C> and <C>&quot;DELHI&quot;</C> will not
          match. Keep the cleaning in a script that reads the raw file and writes a clean one, never edit the data by hand,
          and add assertions such as <C>assert df[&quot;amount&quot;].ge(0).all()</C> so that the next file with a new kind of
          mess fails loudly. Data for training large models goes through the same steps at a far larger scale.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "na",
      rung: "check",
      prompt: <p>A numeric column contains the text <C>N/A</C>. What should it become when parsed?</p>,
      answer: { kind: "choice", options: ["A missing value (NaN)", "Zero", "The column mean"], correct: [0] },
    },
    {
      key: "date",
      rung: "check",
      prompt: <p>Why is the date <C>01/11/2026</C> a problem in a file that also contains <C>2026-11-01</C>?</p>,
      answer: {
        kind: "choice",
        options: [
          "It could be 1 November or 11 January, so the format must be confirmed",
          "Slashes cannot be stored in CSV",
          "It is in the future",
        ],
        correct: [0],
      },
    },
    {
      key: "cities",
      rung: "apply",
      prompt: (
        <p>
          The raw city column holds <C>&quot; Pune&quot;</C>, <C>&quot;pune&quot;</C>, <C>&quot;Delhi &quot;</C>,{" "}
          <C>&quot;DELHI&quot;</C>, <C>&quot;DELHI&quot;</C>, <C>&quot;Chennai&quot;</C> and <C>&quot;Mumbai&quot;</C>. After{" "}
          <C>.str.strip().str.title()</C>, how many distinct values remain?
        </p>
      ),
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "total",
      rung: "apply",
      prompt: <p>After all six steps in the chart above, what is the total of the amounts?</p>,
      answer: { kind: "numeric", value: 2750 },
    },
    {
      key: "zeros",
      rung: "apply",
      prompt: (
        <p>
          After removing the duplicate, there are six rows, two of them with missing amounts. If you filled the two missing
          amounts with 0 instead of dropping those rows, what would the mean amount be? Give two decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 458.33, tolerance: 0.0001 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import pandas as pd
import numpy as np
s = pd.Series(["12", "n/a", "7", None, "7"])
x = pd.to_numeric(s, errors="coerce")
print(x.isna().sum(), x.dropna().drop_duplicates().sum())`}</Code>
          <p>Coercing messy text to numbers. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["2 19.0", "1 26.0", "2 26.0", "An error"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>clean(df)</C> for a DataFrame with text columns <C>name</C> and <C>age</C>: strip whitespace from names and title-case them, convert age to numbers (bad values become missing), drop rows with a missing age, drop duplicate rows, and return the result with a fresh index.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import pandas as pd

def clean(df):
    return df
`,
        solution: `import pandas as pd

def clean(df):
    d = df.copy()
    d['name'] = d['name'].str.strip().str.title()
    d['age'] = pd.to_numeric(d['age'], errors='coerce')
    d = d.dropna(subset=['age']).drop_duplicates()
    return d.reset_index(drop=True)
`,
        tests: [
          { name: "clean", code: `import pandas as pd
raw = pd.DataFrame({'name': [' asha', 'Ravi ', 'ASHA', 'zoya'], 'age': ['31', 'unknown', '31', '27']})
out = clean(raw)
assert list(out['name']) == ['Asha', 'Zoya'] and list(out['age']) == [31, 27] and list(out.index) == [0, 1], 'Normalise names before dropping duplicates, and reset the index.'` },
          { name: "types", code: `import pandas as pd
raw = pd.DataFrame({'name': ['a ', ' b'], 'age': ['1', '2.5']})
out = clean(raw)
assert out['age'].dtype.kind == 'f' and list(out['age']) == [1.0, 2.5] and list(raw['name']) == ['a ', ' b'], 'Ages become numbers, and the input DataFrame is left unchanged.'` },
        ],
      },
    },
    {
      key: "script",
      rung: "prove",
      prompt: (
        <p>
          Explain why the cleaning should be a script run on the raw file rather than edits made by hand in a spreadsheet. Then
          give an example showing that removing duplicates before tidying text gives a different result from tidying first.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Says a script can be rerun on new or corrected raw data and produces the same output every time.",
          "Says a script records every decision, so others can review it, and the raw file is never lost.",
          "Gives two records that differ only in spacing or capitals, which deduplication misses if run first.",
          "Concludes that after tidying they become identical, so tidying first removes the duplicate.",
        ],
      },
    },
    {
      key: "pairs",
      rung: "stretch",
      prompt: (
        <p>
          To find duplicates among a million rows by comparing every pair, how many comparisons are needed? (A hash of each row
          needs only a million lookups.)
        </p>
      ),
      answer: { kind: "numeric", value: 499999500000, tolerance: 0.000001 },
    },
  ],

  teachBack:
    "Explain to a friend the common ways a data file is messy, how to clean it with a script, and why a missing value is not a zero.",

  glimpse: (
    <p>
      Next, SQL: the language that databases have spoken for fifty years, in which the same filters, groups and joins are
      written as one declarative query.
    </p>
  ),
};
