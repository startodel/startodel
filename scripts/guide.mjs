import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

async function renderGuide(source) {
  const sections = [];
  const resourceUris = new Map();
  for (const file of (await readdir(source)).filter((name) => name.endsWith(".md"))) {
    const markdown = await readFile(join(source, file), "utf8");
    const match = /^---\nid: ([\w-]+)\ntitle: ([^\n]+)\norder: (\d+)\n---\n\n([\s\S]+)/.exec(
      markdown,
    );
    if (!match) throw new Error(`Invalid guide front matter in ${file}`);
    const [, id, title, order, body] = match;
    if (sections.some((s) => s.id === id || s.order === Number(order)))
      throw new Error(`Duplicate guide id or order in ${file}`);
    const uri = `startodel://guide/${id}`;
    resourceUris.set(file, uri);
    sections.push({ id, title, order: Number(order), uri, body });
  }
  for (const section of sections) {
    section.body = section.body.replace(/\]\(([^():/]+\.md)\)/g, (_, file) => {
      if (!resourceUris.has(file)) throw new Error(`Unknown guide link ${file} in ${section.id}`);
      return `](${resourceUris.get(file)})`;
    });
  }
  sections.sort((a, b) => a.order - b.order);
  return JSON.stringify(sections, null, 2) + "\n";
}

export async function buildGuide(source, output) {
  await writeFile(output, await renderGuide(source));
}

export async function checkGuide(source, output) {
  if ((await readFile(output, "utf8")) !== (await renderGuide(source)))
    throw new Error("Generated guide is stale. Run pnpm guide:build.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const run = process.argv.includes("--check") ? checkGuide : buildGuide;
  await run("docs/agent-guide", "apps/web/server/mcp/guide.generated.json");
}
