import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { readGuideSections } from "./guide.mjs";

const workflows = {
  "startodel-onboarding": ["first-steps"],
  "startodel-build-track": ["build-track-technology", "lessons-and-blocks"],
  "startodel-build-track-from-repo": ["build-track-from-repo", "lessons-and-blocks"],
  "startodel-grill": ["grill-session"],
  "startodel-review-loop": ["review-loop"],
};

async function renderSkills(source) {
  const sections = new Map(
    (await readGuideSections(source)).map((section) => [section.id, section]),
  );
  const files = new Map();
  for (const [name, ids] of Object.entries(workflows)) {
    const parts = [...ids, "rules"].map((id) => {
      const section = sections.get(id);
      if (!section) throw new Error(`Missing guide section ${id} for ${name}`);
      return section;
    });
    const description = parts[0].skillDescription?.trim();
    if (!description || description.length >= 1024)
      throw new Error(`Invalid skillDescription in ${ids[0]}`);
    const body = parts.map((section) => section.body.trimEnd()).join("\n\n");
    files.set(
      join(name, "SKILL.md"),
      [
        "---",
        `name: ${name}`,
        `description: ${JSON.stringify(description)}`,
        "---",
        "",
        "<!-- Generated from docs/agent-guide by pnpm skills:build. Do not edit. -->",
        "",
        body,
        "",
      ].join("\n"),
    );
  }
  return files;
}

export async function buildSkills(source, output) {
  for (const [file, content] of await renderSkills(source)) {
    const path = join(output, file);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content);
  }
}

export async function checkSkills(source, output) {
  const expected = await renderSkills(source);
  const entries = await readdir(output, { recursive: true, withFileTypes: true }).catch((error) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  const differences = [];
  for (const entry of entries) {
    if (entry.isDirectory()) continue;
    const path = join(entry.parentPath, entry.name);
    const file = relative(output, path);
    if (!expected.has(file)) differences.push(`+ ${file}`);
    else if (!entry.isFile() || (await readFile(path, "utf8")) !== expected.get(file))
      differences.push(`M ${file}`);
    expected.delete(file);
  }
  for (const file of expected.keys()) differences.push(`D ${file}`);
  if (differences.length)
    throw new Error(
      [
        "Generated skills differ (M edited, D missing, + extra). Run pnpm skills:build and remove extra files.",
        ...differences.sort((a, b) => a.slice(2).localeCompare(b.slice(2), "en")),
      ].join("\n"),
    );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const run = process.argv.includes("--check") ? checkSkills : buildSkills;
  await run("docs/agent-guide", "packages/skills/skills");
}
