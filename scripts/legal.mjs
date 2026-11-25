import { readFile, writeFile } from "node:fs/promises";
import { LEGAL_TERMS_VERSION } from "../packages/core/src/legal.ts";

const docs = {};
for (const name of ["rules", "terms"]) {
  docs[name] = {};
  for (const lang of ["en", "ru"]) {
    const file = `docs/legal/${name}.${lang}.md`;
    const text = await readFile(file, "utf8");
    const fields =
      /^---\ntitle: (.+)\nversion: (.+)\nupdated: (\d{4}-\d{2}-\d{2})\n---\n\n([\s\S]+)$/.exec(
        text,
      );
    if (!fields || fields[2] !== LEGAL_TERMS_VERSION)
      throw new Error("Invalid legal document or version in " + file);
    const [, title, version, updated, body] = fields;
    docs[name][lang] = { title, version, updated, body };
  }
}
const output = "apps/web/app/utils/legal.generated.json";
const content = JSON.stringify(docs, null, 2) + "\n";
if (process.argv.includes("--check")) {
  if (content !== (await readFile(output, "utf8")))
    throw new Error("Legal bundle is stale. Run pnpm legal:build.");
} else await writeFile(output, content);
