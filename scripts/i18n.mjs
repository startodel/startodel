import { globSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

function flatten(messages, prefix = "", result = new Map()) {
  for (const [name, value] of Object.entries(messages)) {
    const key = prefix + name;
    if (value && typeof value === "object" && !Array.isArray(value))
      flatten(value, key + ".", result);
    else result.set(key, value);
  }
  return result;
}

export function checkMessages(ru, en, references) {
  const locales = { ru: flatten(ru), en: flatten(en) };
  const keys = new Set([...locales.ru.keys(), ...locales.en.keys()]);
  const used = new Set(references);
  const errors = [];
  for (const key of keys) {
    for (const [lang, messages] of Object.entries(locales)) {
      if (!messages.has(key)) errors.push(lang + ": missing " + key);
      else if (typeof messages.get(key) !== "string" || !messages.get(key).trim())
        errors.push(lang + ": empty " + key);
    }
    if (!used.has(key)) errors.push("unused key " + key);
  }
  for (const key of used) if (!keys.has(key)) errors.push("unknown key " + key);
  return errors;
}

// Runtime enums used by the learner UI. Enumerating values also catches missing translations.
const families = {
  "mastery.level": ["0", "1", "2", "3", "4"],
  "verdict.": ["strong", "partial", "weak"],
  "callout.": ["gotcha", "production", "tip"],
  "grade.": ["junior", "middle", "senior", "lead"],
};
// The design showcase is an English reference built from sample copy. The components it shows are checked.
const showcase = [
  "apps/web/app/pages/design/",
  "apps/web/app/pages/design.vue",
  "apps/web/app/components/showcase/",
];
function inspect() {
  const load = (lang) =>
    JSON.parse(readFileSync("apps/web/i18n/locales/" + lang + ".json", "utf8"));
  const errors = [];
  const references = [];
  const web = createRequire(new URL("../apps/web/package.json", import.meta.url));
  const compiler = createRequire(web.resolve("@nuxtjs/i18n/package.json"))("@vue/compiler-sfc");
  for (const file of globSync("apps/web/{app,shared,server}/**/*.{vue,ts}")) {
    if (showcase.some((path) => file.startsWith(path))) continue;
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(/(?:\b(?:t|translate)\(\s*|\bkeypath=)(["'])([^"'\n]*)\1/g))
      references.push(match[2]);
    for (const match of source.matchAll(/\bt\(\s*`([\w.]+)\$\{/g)) {
      const values = families[match[1]];
      if (!values) errors.push(file + ": undocumented dynamic key " + match[1]);
      else for (const value of values) references.push(match[1] + value);
    }
    if (!file.endsWith(".vue")) continue;
    function visit(node) {
      if (
        node.type === 2 &&
        /\p{L}/u.test(node.content) &&
        !["S", "Startodel", "startodel", "Authorization:"].includes(node.content.trim())
      ) {
        errors.push(
          file + ":" + node.loc.start.line + ": untranslated text " + node.content.trim(),
        );
      }
      for (const prop of node.props ?? []) {
        if (
          prop.type === 6 &&
          ["aria-label", "title", "placeholder", "alt"].includes(prop.name) &&
          prop.value?.content.trim()
        ) {
          errors.push(file + ":" + prop.loc.start.line + ": untranslated " + prop.name);
        }
      }
      for (const child of node.children ?? []) visit(child);
    }
    const template = compiler.parse(source, { filename: file }).descriptor.template;
    if (template?.ast) visit(template.ast);
  }
  return [...errors, ...checkMessages(load("ru"), load("en"), references)];
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const errors = inspect();
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
  }
}
