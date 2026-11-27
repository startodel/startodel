import { appendFile, cp, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, expect, test } from "vite-plus/test";
import { buildSkills, checkSkills } from "./skills.mjs";
import guide from "../apps/web/server/mcp/guide.generated.json";

const source = "docs/agent-guide";
const workflows = {
  "startodel-onboarding": ["Complete the Onboarding Questionnaire"],
  "startodel-build-track": ["Design and verify a Track", "Write a Lesson with Blocks"],
  "startodel-build-track-from-repo": [
    "Build a Track from a repository",
    "Design and verify a Track",
    "Write a Lesson with Blocks",
  ],
  "startodel-grill": ["Continue a GrillSession"],
  "startodel-review-loop": ["Review due Topics"],
};
const temporary: string[] = [];
async function outputDirectory() {
  const dir = await mkdtemp(join(process.cwd(), ".skills-test-"));
  temporary.push(dir);
  return dir;
}
afterEach(async () => {
  for (const dir of temporary.splice(0)) await rm(dir, { recursive: true, force: true });
});

test("installed skills stay current and teach the same workflows and shared rules as MCP", async () => {
  await checkSkills(source, "packages/skills/skills");
  const output = await outputDirectory();
  await buildSkills(source, output);
  expect((await readdir(output)).sort()).toEqual(Object.keys(workflows).sort());
  for (const [name, sections] of Object.entries(workflows)) {
    const skill = await readFile(join(output, name, "SKILL.md"), "utf8");
    expect([...skill.matchAll(/^# (.+)$/gm)].map((match) => match[1])).toEqual([
      ...sections,
      "Rules for external agents",
    ]);
    expect(skill).toContain("`get_guide`");
    expect(skill).toContain("Never pass User or Owner IDs");
    for (const title of [...sections, "Rules for external agents"]) {
      const resource = guide.find((entry) => entry.title === title)!;
      const localBody = resource.body.replaceAll(
        /\]\(startodel:\/\/guide\/(references\/[\w-]+)\)/g,
        "]($1.md)",
      );
      expect(skill).toContain(localBody.trimEnd());
    }
  }
});

test("skill files have valid front matter and identical bytes across builds and line endings", async () => {
  const first = await outputDirectory();
  const second = await outputDirectory();
  const crlf = await outputDirectory();
  await cp(source, crlf, { recursive: true });
  for (const file of await readdir(crlf, { recursive: true, withFileTypes: true })) {
    if (!file.isFile()) continue;
    const path = join(file.parentPath, file.name);
    await writeFile(path, (await readFile(path, "utf8")).replaceAll("\n", "\r\n"));
  }
  await buildSkills(source, first);
  await buildSkills(crlf, second);
  await checkSkills(source, second);
  for (const name of Object.keys(workflows)) {
    const file = join(name, "SKILL.md");
    const skill = await readFile(join(first, file), "utf8");
    expect(await readFile(join(second, file), "utf8")).toBe(skill);
    expect(skill).not.toContain("\r");
    expect(skill.endsWith("\n")).toBe(true);
    const metadata = /^---\nname: ([a-z0-9]+(?:-[a-z0-9]+)*)\ndescription: (.+)\n---\n/.exec(skill);
    expect(metadata?.[1]).toBe(name);
    expect(name.length).toBeLessThanOrEqual(64);
    const description = JSON.parse(metadata![2]!);
    expect(description.trim().length).toBeGreaterThan(0);
    expect(description.length).toBeLessThan(1024);
    if (name === "startodel-build-track") {
      expect(description).toMatch(/one technology.*compare technologies.*explicitly asks/i);
    }
  }
});

test("only Track skills install the linked browser tasks Lesson and check its contents", async () => {
  const output = await outputDirectory();
  await buildSkills(source, output);
  const file = "references/browser-tasks.md";
  const example = await readFile(join(source, file), "utf8");
  for (const name of Object.keys(workflows)) {
    const skill = await readFile(join(output, name, "SKILL.md"), "utf8");
    const references = [...skill.matchAll(/\]\((references\/[^)]+)\)/g)].map((match) => match[1]);
    if (!name.startsWith("startodel-build-track")) {
      expect(references).toEqual([]);
      expect(await readdir(join(output, name))).toEqual(["SKILL.md"]);
      continue;
    }
    expect(references).toEqual([file]);
    expect(skill).not.toContain("```json");
    expect(await readFile(join(output, name, file), "utf8")).toBe(example);
  }
  await appendFile(join(output, "startodel-build-track", file), "edited\n");
  await rm(join(output, "startodel-build-track-from-repo", file));
  await expect(checkSkills(source, output)).rejects.toThrow(/M startodel-build-track\/references/);
  await expect(checkSkills(source, output)).rejects.toThrow(
    /D startodel-build-track-from-repo\/references/,
  );
});

test("check reports edited, missing and extra paths without changing files", async () => {
  const output = await outputDirectory();
  await buildSkills(source, output);
  await checkSkills(source, output);
  await appendFile(join(output, "startodel-grill/SKILL.md"), "edited\n");
  await rm(join(output, "startodel-onboarding/SKILL.md"));
  await writeFile(join(output, "startodel-review-loop/extra.md"), "");
  await expect(checkSkills(source, output)).rejects.toThrow(
    /M startodel-grill\/SKILL.md[\s\S]*D startodel-onboarding\/SKILL.md[\s\S]*\+ startodel-review-loop\/extra.md/,
  );
});
