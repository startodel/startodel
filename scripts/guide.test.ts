import { expect, test } from "vite-plus/test";
import { mkdtemp, cp, appendFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { checkGuide, buildGuide } from "./guide.mjs";

test("changing a guide section makes the generated resource stale until rebuilt", async () => {
  const root = await mkdtemp(join(process.cwd(), ".guide-test-"));
  try {
    const source = join(root, "guide");
    const output = join(root, "guide.json");
    await cp("docs/agent-guide", source, { recursive: true });
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
