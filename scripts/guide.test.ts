import { expect, test } from "vite-plus/test";
import { mkdtemp, cp, appendFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { checkGuide, buildGuide } from "./guide.mjs";
import guide from "../apps/web/server/mcp/guide.generated.json";

test("committed MCP resources match the guide source", async () => {
  await checkGuide("docs/agent-guide", "apps/web/server/mcp/guide.generated.json");
});

test("the Lesson workflow discloses the complete Block example as a Markdown resource", () => {
  const lesson = guide.find((section) => section.id === "lessons-and-blocks")!;
  const uri = /\]\((startodel:\/\/guide\/references\/[^)]+)\)/.exec(lesson.body)?.[1];
  expect(uri).toBe("startodel://guide/references/browser-tasks");
  expect(lesson.body).toContain("resources/read");
  for (const field of [
    "markdown",
    "language",
    "variant",
    "url",
    "questions",
    "correctIndex",
    "solution",
  ])
    expect(lesson.body).toContain("`" + field + "`");
  expect(lesson.body).not.toContain("```json");
  const reference = guide.find((document) => document.uri === uri);
  expect(reference?.body).toContain("```json");
});

test("the MCP guide index explains how to read resources", () => {
  const index = workflow("index");
  expect(index).toContain("resources/read");
  expect(index).not.toMatch(/installable skills|copy.*folder|recursively/i);
});

test("changing a guide section makes the generated resource stale until rebuilt", async () => {
  const root = await mkdtemp(join(process.cwd(), ".guide-test-"));
  try {
    const source = join(root, "guide");
    const output = join(root, "guide.json");
    await cp("docs/agent-guide", source, { recursive: true });
    await buildGuide(source, output);
    await checkGuide(source, output);
    await appendFile(join(source, "references/browser-tasks.md"), "\nA second example.\n");
    await expect(checkGuide(source, output)).rejects.toThrow("stale");
    await buildGuide(source, output);
    await checkGuide(source, output);
    await appendFile(join(source, "09-review-loop.md"), "\nRead the learner’s evidence.\n");
    await expect(checkGuide(source, output)).rejects.toThrow("stale");
    await buildGuide(source, output);
    await checkGuide(source, output);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("a guide can omit references until a workflow links to one", async () => {
  const source = await mkdtemp(join(process.cwd(), ".guide-test-"));
  try {
    const section = join(source, "01-platform.md");
    const output = join(source, "guide.json");
    await cp("docs/agent-guide/01-platform.md", section);
    await buildGuide(source, output);
    await appendFile(section, "\n[Example](references/example.md)\n");
    await expect(buildGuide(source, output)).rejects.toThrow(
      "Unknown guide link references/example.md",
    );
  } finally {
    await rm(source, { recursive: true, force: true });
  }
});

function workflow(id: string) {
  const section = guide.find((entry) => entry.id === id);
  if (!section) throw new Error("Missing workflow " + id);
  return section.body;
}

test("personalization sets depth and pace while preserving the requested technology and foundations", () => {
  const rules = workflow("rules");
  expect(rules).toMatch(/`get_profile`.*Onboarding Questionnaire.*already know/i);
  for (const detail of [
    "stack",
    "experience",
    "current project",
    "preferred language",
    "starting Topic",
    "depth",
    "pace",
    "prerequisites",
    "examples",
  ])
    expect(rules).toContain(detail);
  expect(rules).toMatch(/uncertain.*confirm/i);
  expect(rules).toMatch(/analogy.*project|project.*analogy/i);
  for (const body of [rules, workflow("build-track-technology")]) {
    expect(body).toMatch(/from scratch.*foundations/i);
    expect(body).toMatch(
      /leave out another framework’s code, (?:terms|terminology).*side-by-side comparisons.*unless the learner explicitly asks.*compar/i,
    );
  }
  for (const id of ["build-track-technology", "build-track-from-repo"]) {
    expect(workflow(id)).toMatch(/comparison mode.{0,50}only when the learner explicitly asks/i);
  }
});

test("Track design and Lesson writing require checked primary sources before authoring", () => {
  for (const id of ["build-track-technology", "lessons-and-blocks"]) {
    const body = workflow(id);
    expect(body).toMatch(/before (designing|writing).*own web and repository tools/i);
    expect(body).toMatch(/current.*primary source/i);
    expect(body).toMatch(/version or date/i);
  }
  expect(workflow("build-track-technology")).toContain("Track Sources");
  expect(workflow("lessons-and-blocks")).toMatch(/Link Block or Video Block/);
  expect(workflow("build-track-from-repo")).toMatch(/revision.*permalink/is);
});

test("Track modes lead to different demonstrations of understanding", () => {
  const plan = workflow("build-track-technology");
  expect(plan).toMatch(
    /Comparison mode.*mental model.*architecture.*tradeoffs.*decision criteria.*scenario.*Quiz/is,
  );
  expect(plan).toMatch(/Deep-dive mode.*mental model.*setup.*internals.*production.*Exercise/is);
  expect(workflow("build-track-from-repo")).toMatch(/comparison mode.*deep-dive mode/i);
});

test("a complete Lesson explains, demonstrates, cautions, cites and tests transfer", () => {
  const lesson = workflow("lessons-and-blocks");
  for (const criterion of [
    /mechanism/i,
    /minimal runnable or traceable example/i,
    /Callout Block/,
    /`production`/,
    /`gotcha`/,
    /`tip`/,
    /primary source/i,
    /Quiz.*diagnos/i,
    /transfer Exercise/i,
    /stable IDs/i,
    /read the Lesson back/i,
  ])
    expect(lesson).toMatch(criterion);
});

test("Lesson authors show the example before the prediction and explain one idea at a time", () => {
  const lesson = workflow("lessons-and-blocks");
  expect(lesson).toMatch(/5–10 lines.*`code`.*concrete scenario/i);
  expect(lesson).toMatch(/show the example before asking.*prediction/i);
  expect(lesson).toMatch(/answer.*later `theory` Block/i);
  expect(lesson).toMatch(/one idea per `theory` Block/i);
  expect(lesson).toMatch(/60–100 words.*(?:one or two|1–2) short paragraphs/i);
});

test("the Topic sets Lesson depth and Block count while each Theory Block carries one idea", () => {
  for (const id of ["lessons-and-blocks", "rules"]) {
    const body = workflow(id);
    expect(body).toMatch(/depth and (?:number of Blocks|Block count) the Topic needs/i);
    expect(body).toMatch(
      /no (?:writing )?target for (?:overall )?Lesson length or (?:total )?Block count/i,
    );
    expect(body).not.toMatch(
      /keep (?:each |the |a )?Lessons? (?:short|brief)|aim for \d+(?:–\d+)? (?:Blocks|minutes)/i,
    );
    expect(body).toMatch(/one idea per `theory` Block/i);
    expect(body).toMatch(/avoid one-line (?:`theory` )?stubs/i);
  }
  expect(workflow("lessons-and-blocks")).toMatch(/schema accepts up to 200 ordered Blocks/i);
});

test("the Good vs Bad opening models a prediction the learner can actually make", () => {
  const opening = workflow("lessons-and-blocks").split("## Good vs Bad Lesson opening")[1];
  expect(opening).toMatch(/\*\*Bad\*\*.*`theory`/);
  const good = opening.split("**Good**")[1].split("## Block checklist")[0];
  expect(good).toMatch(/```js\n.+?```.*`quiz`[^\n]+\?.*`theory`/s);
  expect(good).not.toMatch(/`callout`[^\n]*\?/i);
});

test("the Lesson workflow separates scored and reflective prompts from substantive Callouts", () => {
  const lesson = workflow("lessons-and-blocks");
  expect(lesson).toMatch(/prediction in a `quiz`.*unscored.*`theory`/i);
  expect(lesson).toMatch(/reserve it for a tip, gotcha, production caveat or takeaway/i);
  expect(lesson).toMatch(/non-obvious condition.*detect or address/i);
  expect(lesson).toMatch(
    /never put (?:a )?prediction questions?, Quiz prompts? or Exercise prompts? in a Callout/i,
  );
});

test("authors can label major Blocks for the sticky Lesson contents sidebar", () => {
  const lesson = workflow("lessons-and-blocks");
  expect(lesson).toMatch(
    /sticky Lesson contents sidebar.*short.*`title`.*major.*Theory, Callout and Exercise/i,
  );
  expect(lesson).toMatch(/filename.*Code Block.*timers\.cjs/i);
  expect(lesson).toMatch(/optional.*120 characters/i);
  expect(lesson).toMatch(/falls back.*body.*code explanation.*first line of code/i);
  expect(lesson).toMatch(/Quiz.*question count.*ignores.*`title`/i);
});

test("Lesson prose defines terms, labels sources and sounds like a colleague at a whiteboard", () => {
  const lesson = workflow("lessons-and-blocks");
  expect(lesson).toMatch(/jargon.*plain language.*first use/i);
  expect(lesson).toMatch(/Markdown link.*publisher.*title/i);
  expect(lesson).toMatch(/background reading.*Track Sources/i);
  expect(lesson).toMatch(/unlinked parenthetical/i);
  expect(lesson).toMatch(/colleague at a whiteboard/i);
  expect(lesson).toMatch(/short, direct sentences/i);
  expect(lesson).toMatch(/filler.*stock introductions.*em dashes/i);
  expect(workflow("rules")).toMatch(/every Lesson.*jargon.*first use/i);
});

test("free-text assessment uses the learner's level, quoted evidence and the Mastery rubric", () => {
  for (const id of ["grill-session", "review-loop"]) {
    const body = workflow(id);
    expect(body).toMatch(/recall.*application.*explanation/i);
    expect(body).toMatch(/quote.*answer/i);
  }
  expect(workflow("rules")).toMatch(/Mastery 3.*mechanism.*4.*internals/i);
});
