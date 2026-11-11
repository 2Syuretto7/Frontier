import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SqlViz } from "@/components/viz/SqlViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e1.7.3",
  minutes: 50,
  links: {
    requires: ["e1.7.1"],
    revisits: ["e1.7.2"],
    foreshadows: ["e2.3.1", "e2.4.2"],
  },

  puzzle: (
    <>
      <p>This query runs, and returns one row per city:</p>
      <Code>{`SELECT c.city, SUM(o.amount) AS total
FROM orders AS o JOIN customers AS c ON o.customer_id = c.id
GROUP BY c.city
ORDER BY total DESC;`}</Code>
      <p>
        But move the condition <C>total &gt; 1000</C> into a <C>WHERE</C> clause and the database refuses, saying that{" "}
        <C>total</C> does not exist. Yet <C>ORDER BY</C> used <C>total</C> without complaint. Why can one clause see the name
        and the other not?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A query is written in one order and evaluated in another. <C>FROM</C> and <C>JOIN</C> come first, then{" "}
        <C>WHERE</C>, <C>GROUP BY</C>, <C>HAVING</C>, <C>SELECT</C>, <C>ORDER BY</C> and <C>LIMIT</C>. A clause can only use
        what earlier clauses have made. Step through the query below and watch the table after each clause.
      </p>
      <SqlViz />
    </>
  ),

  theory: (
    <>
      <Definition title="relational tables">
        <p>
          A relational database stores tables with fixed, typed columns. A <strong>primary key</strong> identifies each row,
          such as <C>customers.id</C>. A <strong>foreign key</strong>, such as <C>orders.customer_id</C>, refers to a row of
          another table. Information is stored once and combined at query time by joins.
        </p>
      </Definition>

      <Definition title="the clauses, in evaluation order">
        <p>
          <C>FROM</C>/<C>JOIN</C> builds the rows; <C>WHERE</C> keeps rows that satisfy a condition; <C>GROUP BY</C> forms
          groups; <C>HAVING</C> keeps groups, using aggregates such as <C>COUNT(*)</C> or <C>SUM(x)</C>; <C>SELECT</C>{" "}
          computes the output columns and names them; <C>ORDER BY</C> sorts; <C>LIMIT</C> keeps the first rows. After{" "}
          <C>GROUP BY</C>, <C>SELECT</C> may only use the grouping columns and aggregates.
        </p>
      </Definition>

      <Example title="joins">
        <Code>{`-- inner join: only orders whose customer exists
SELECT o.id, c.name FROM orders o JOIN customers c ON o.customer_id = c.id;

-- left join: every customer, with NULLs where there is no order
SELECT c.name, COUNT(o.id) AS n
FROM customers c LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.name;`}</Code>
        <p>
          <C>COUNT(o.id)</C> counts non-null values, so a customer with no orders gets 0, while <C>COUNT(*)</C> would count
          the single row of NULLs and give 1.
        </p>
      </Example>

      <Example title="SQL from Python">
        <Code>{`import sqlite3
con = sqlite3.connect("shop.db")
rows = con.execute(
    "SELECT name FROM customers WHERE city = ?", (city,)
).fetchall()`}</Code>
        <p>
          The <C>?</C> is a parameter. Never build a query by pasting user input into the string: input such as{" "}
          <C>&apos;; DROP TABLE customers; --</C> would become part of the query. This attack is called SQL injection.
        </p>
      </Example>

      <Remark title="declarative">
        <p>
          SQL says what result you want, not how to compute it. The database&rsquo;s planner chooses how: which table to scan
          first, whether to use an <strong>index</strong> (a sorted tree over a column that finds matching rows without reading
          every row) and whether to join by hashing or by sorting. The same group-by and join you wrote in pandas are here,
          planned for you.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "order",
      rung: "check",
      prompt: <p>Which clause is evaluated first?</p>,
      answer: { kind: "choice", options: ["WHERE", "GROUP BY", "SELECT", "ORDER BY"], correct: [0] },
    },
    {
      key: "having",
      rung: "check",
      prompt: <p>What is the difference between WHERE and HAVING?</p>,
      answer: {
        kind: "choice",
        options: [
          "WHERE filters rows before grouping; HAVING filters groups after",
          "They are synonyms",
          "HAVING filters rows; WHERE filters groups",
        ],
        correct: [0],
      },
    },
    {
      key: "delhi",
      rung: "apply",
      prompt: <p>In the query in the chart above, what is the total for Delhi after GROUP BY?</p>,
      answer: { kind: "numeric", value: 970 },
    },
    {
      key: "pune",
      rung: "apply",
      prompt: (
        <p>
          Using the same tables, how many rows does this return?{" "}
          <C>SELECT o.id FROM orders o JOIN customers c ON o.customer_id = c.id WHERE c.city = &apos;Pune&apos;;</C>
        </p>
      ),
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "left",
      rung: "apply",
      prompt: (
        <p>
          A fifth customer, Zoya, is added with no orders. How many rows does{" "}
          <C>SELECT * FROM customers c LEFT JOIN orders o ON o.customer_id = c.id</C> now return, given the eight orders?
        </p>
      ),
      answer: { kind: "numeric", value: 9 },
    },
    {
      key: "alias",
      rung: "prove",
      prompt: (
        <p>
          Using the evaluation order, explain why <C>WHERE total &gt; 1000</C> fails while <C>ORDER BY total</C> works, and
          why <C>WHERE SUM(o.amount) &gt; 1000</C> also fails. Then rewrite the condition so that the query returns only cities
          whose total exceeds 1000.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Explains that WHERE runs before SELECT, so the alias total does not exist yet, while ORDER BY runs after SELECT.",
          "Explains that WHERE acts on single rows before grouping, so an aggregate has nothing to aggregate there.",
          "Rewrites the condition as HAVING SUM(o.amount) > 1000 after GROUP BY.",
          "Notes that some databases also accept the alias in HAVING, but the aggregate form is portable.",
        ],
      },
    },
    {
      key: "cross",
      rung: "stretch",
      prompt: (
        <p>
          The eight orders total 3,310. You forget the <C>ON</C> condition, so every order is paired with each of the original four customers.
          What does <C>SELECT SUM(o.amount)</C> over that result return?
        </p>
      ),
      answer: { kind: "numeric", value: 13240 },
    },
  ],

  teachBack:
    "Explain to a friend the order in which a SQL query is evaluated, the difference between WHERE and HAVING, and what a join does.",

  glimpse: (
    <p>
      That completes Python, NumPy and the Command Line. Data Structures and Algorithms comes next: the hash tables behind
      every group-by and join, and the balanced trees behind every database index.
    </p>
  ),
};
