import { appendFile, cp, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, expect, test } from "vite-plus/test";
import { buildSkills, checkSkills } from "./skills.mjs";

const source = "docs/agent-guide";
const workflows = {
  "startodel-onboarding": ["Complete the Onboarding Questionnaire"],
  "startodel-build-track": ["Build a Track around a technology", "Write a Lesson with Blocks"],
  "startodel-build-track-from-repo": [
    "Build a Track from a repository",
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

test("build maps each workflow to ordered guide sections and shared rules", async () => {
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
  }
});

test("skill files have valid front matter and identical bytes across builds and line endings", async () => {
  const first = await outputDirectory();
  const second = await outputDirectory();
  const crlf = await outputDirectory();
  await cp(source, crlf, { recursive: true });
  for (const file of await readdir(crlf)) {
    const path = join(crlf, file);
    await writeFile(path, (await readFile(path, "utf8")).replaceAll("\n", "\r\n"));
  }
  await buildSkills(source, first);
  await buildSkills(crlf, second);
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
  }
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
