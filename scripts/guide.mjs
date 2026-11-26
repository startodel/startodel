import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

async function markdownFiles(directory) {
  return (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name)
    .sort();
}

async function readMarkdown(path) {
  return (await readFile(path, "utf8")).replaceAll("\r\n", "\n");
}

export async function readGuide(source) {
  const sections = [];
  for (const file of await markdownFiles(source)) {
    const markdown = await readMarkdown(join(source, file));
    const match =
      /^---\nid: ([\w-]+)\ntitle: ([^\n]+)\norder: (\d+)\n(?:skillDescription: ([^\n]+)\n)?---\n\n([\s\S]+)/.exec(
        markdown,
      );
    if (!match) throw new Error(`Invalid guide front matter in ${file}`);
    const [, id, title, order, skillDescription, body] = match;
    if (sections.some((s) => s.id === id || s.order === Number(order)))
      throw new Error(`Duplicate guide id or order in ${file}`);
    const uri = `startodel://guide/${id}`;
    sections.push({ file, id, title, order: Number(order), uri, body, skillDescription });
  }
  sections.sort((a, b) => a.order - b.order);
  const documents = new Map(sections.map((section) => [section.file, section]));
  for (const name of await markdownFiles(join(source, "references"))) {
    const file = "references/" + name;
    const body = await readMarkdown(join(source, file));
    const title = /^# ([^\n]+)/.exec(body)?.[1];
    if (!title) throw new Error(`Missing reference title in ${file}`);
    const id = file.slice(0, -3);
    documents.set(file, { id, file, title, uri: `startodel://guide/${id}`, body });
  }
  return documents;
}

export function renderLinks(document, documents, href) {
  return document.body.replace(/\]\(((?:references\/)?[\w-]+\.md)\)/g, (_, file) => {
    const target = documents.get(file);
    if (!target) throw new Error(`Unknown guide link ${file} in ${document.id}`);
    return `](${href(target)})`;
  });
}

async function renderGuide(source) {
  const guide = await readGuide(source);
  const resources = Array.from(guide.values(), (document) => ({
    ...document,
    body: renderLinks(document, guide, (target) => target.uri),
  }));
  return JSON.stringify(resources, ["id", "title", "order", "uri", "body"], 2) + "\n";
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
