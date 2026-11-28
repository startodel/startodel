import { readFile } from "node:fs/promises";
import { parse, compileScript } from "@vue/compiler-sfc";

// Nitro renders this SFC without the browser application or a filesystem template at runtime.
export const emailTemplate = {
  name: "sign-in-email",
  resolveId(id) {
    if (id === "virtual:sign-in-email") return "\0" + id;
  },
  async load(id) {
    if (id !== "\0virtual:sign-in-email") return;
    const template = new URL("./emails/Challenge.vue", import.meta.url);
    const tokens = new URL("./app/assets/design/tokens.css", import.meta.url);
    for (const url of [template, tokens]) this.addWatchFile(url.pathname);
    const css = await readFile(tokens, "utf8");
    const palette = Object.fromEntries(
      ["bg", "raised", "line", "ink", "ink-2", "copper-fill", "on-copper"].map((name) => {
        const hex = css.match(new RegExp("--s-" + name + ": light-dark\\((#[a-f0-9]{6}),"))?.[1];
        if (!hex) throw new Error("Missing email colour " + name);
        return [name, hex];
      }),
    );
    for (const name of ["ui", "mono"])
      palette[name] = css.match(new RegExp("--s-font-" + name + ": ([^;]+);"))[1];
    const { descriptor } = parse(await readFile(template, "utf8"), { filename: template.pathname });
    return (
      compileScript(descriptor, {
        id: "challenge-email",
        inlineTemplate: true,
        templateOptions: { ssr: true },
      }).content +
      "\nexport const palette = " +
      JSON.stringify(palette) +
      ";"
    );
  },
};
