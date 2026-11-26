import { expect, test } from "vite-plus/test";
import { mkdtemp, cp, appendFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { checkGuide, buildGuide } from "./guide.mjs";
import guide from "../apps/web/server/mcp/guide.generated.json";

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
