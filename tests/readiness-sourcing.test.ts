import { test } from "node:test";
import assert from "node:assert/strict";
import { BOARDS, acceptPicks, acceptSearch, candidates, htmlToText, parseBoard, pickRequest, type Opening } from "../src/lib/readiness/sourcing.ts";

const long = "Build and train large language models. ".repeat(12);
const gh = BOARDS.find((b) => b.kind === "greenhouse")!;
const ashby = BOARDS.find((b) => b.kind === "ashby")!;

test("posting HTML, escaped once more as Greenhouse sends it, becomes readable text", () => {
  const html = "&lt;h2&gt;&lt;strong&gt;About the role&lt;/strong&gt;&lt;/h2&gt;&lt;p&gt;You will train models &amp;amp; ship them.&lt;/p&gt;&lt;ul&gt;&lt;li&gt;PyTorch&lt;/li&gt;&lt;li&gt;JAX&lt;/li&gt;&lt;/ul&gt;";
  assert.equal(htmlToText(html), "About the role\nYou will train models & ship them.\n\n- PyTorch\n- JAX");
  assert.equal(htmlToText("<p>Plain&nbsp;HTML &#39;works&#39;</p>"), "Plain HTML 'works'");
});

test("Greenhouse and Ashby boards are read into openings", () => {
  const g = parseBoard(gh, { jobs: [{ id: 5, title: " Research Engineer ", absolute_url: "https://job-boards.greenhouse.io/x/jobs/5", content: "&lt;p&gt;Hi&lt;/p&gt;", location: { name: "London" }, departments: [{ name: "Pretraining" }] }] });
  assert.deepEqual(g, [{ key: `${gh.slug}:5`, lab: gh.lab, title: "Research Engineer", location: "London", team: "Pretraining", url: "https://job-boards.greenhouse.io/x/jobs/5", text: "Hi" }]);
  const a = parseBoard(ashby, { jobs: [
    { id: "a1", title: "Researcher", jobUrl: "https://jobs.ashbyhq.com/x/a1", descriptionPlain: "Text", location: "SF", department: "Research", team: "Post-training" },
    { id: "a2", title: "Hidden", isListed: false, descriptionPlain: "x" },
  ] });
  assert.equal(a.length, 1);
  assert.equal(a[0].team, "Research, Post-training");
  assert.deepEqual(parseBoard(gh, { nope: 1 }), []);
  assert.deepEqual(parseBoard(ashby, null), []);
});

test("non-technical, empty and repeated openings are dropped before Parton reads the list", () => {
  const o = (title: string, text = long, lab = "Anthropic"): Opening => ({ key: title + lab, lab, title, location: "", team: "", url: "https://x.y/z", text });
  const kept = candidates([
    o("Research Engineer, Pretraining"),
    o("Research Engineer, Pretraining"),
    o("Research Engineer, Pretraining", long, "OpenAI"),
    o("Account Executive, Startups"),
    o("Corporate Counsel"),
    o("Inference Engineer", "short"),
  ]);
  assert.deepEqual(kept.map((k) => `${k.lab}: ${k.title}`), ["Anthropic: Research Engineer, Pretraining", "OpenAI: Research Engineer, Pretraining"]);
});

test("Parton's picks are kept in order, without repeats or numbers out of range", () => {
  const list = ["a", "b", "c", "d"].map((t, i): Opening => ({ key: t, lab: i % 2 ? "OpenAI" : "Anthropic", title: t, location: "", team: "", url: "https://x.y", text: long }));
  assert.deepEqual(acceptPicks({ picks: [3, 3, 0, 9, 1, 2] }, list, 2).map((o) => o.title), ["c", "a"]);
  assert.match(pickRequest("Research Engineer", list, 16), /Target role: Research Engineer[\s\S]*1\. Anthropic: a[\s\S]*4\. OpenAI: d/);
});

test("postings found on the web need a real https link and real text", () => {
  const board = BOARDS.find((b) => b.lab === "Google DeepMind")!;
  const found = acceptSearch({ postings: [
    { title: "Research Engineer, Gemini", url: "https://job-boards.greenhouse.io/deepmind/jobs/1", text: long },
    { title: "Research Engineer, Gemini", url: "https://job-boards.greenhouse.io/deepmind/jobs/2", text: long },
    { title: "Made up", url: "not a url", text: long },
    { title: "Too short", url: "https://deepmind.google/careers/3", text: "Short." },
    { title: "Insecure", url: "http://deepmind.google/careers/4", text: long },
  ] }, board, 3);
  assert.deepEqual(found.map((f) => f.title), ["Research Engineer, Gemini"]);
  assert.equal(found[0].lab, "Google DeepMind");
});
