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
  expect(uri).toBeDefined();
  expect(lesson.body).not.toContain("```json");
  const reference = guide.find((document) => document.uri === uri);
  expect(reference?.body).toContain("```json");
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

test("personalization combines the questionnaire with prior knowledge and resolves uncertainty", () => {
  const rules = workflow("rules");
  expect(rules).toMatch(/`get_profile`.*Onboarding Questionnaire.*already know/i);
  for (const detail of [
    "stack",
    "experience",
    "current project",
    "preferred language",
    "starting Topic",
    "depth",
    "examples",
  ])
    expect(rules).toContain(detail);
  expect(rules).toMatch(/uncertain.*confirm/i);
  expect(rules).toMatch(/foundations.*analogy.*jargon/i);
  expect(rules).toMatch(/experienced.*familiar.*mechanism.*tradeoffs/i);
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
  ])
    expect(lesson).toMatch(criterion);
});

test("free-text assessment uses the learner's level, quoted evidence and the Mastery rubric", () => {
  for (const id of ["grill-session", "review-loop"]) {
    const body = workflow(id);
    expect(body).toMatch(/recall.*application.*explanation/i);
    expect(body).toMatch(/quote.*answer/i);
  }
  expect(workflow("rules")).toMatch(/Mastery 3.*mechanism.*4.*internals/i);
});
