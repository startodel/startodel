import { readFile } from "node:fs/promises";
import wawoff2 from "wawoff2";

// resvg reads TrueType files by path. Nitro resolves import.meta.url to the
// server entry in both the node-listener and node-server presets.
export const ogAssets = {
  name: "og-assets",
  resolveId(id) {
    if (id === "virtual:og-assets") return "\0" + id;
  },
  async load(id) {
    if (id !== "\0virtual:og-assets") return;
    const fontPaths = [];
    for (const subset of ["latin", "cyrillic", "latin-ext", "cyrillic-ext"]) {
      const name = "martian-mono-" + subset + "-standard-normal";
      const source = import.meta.resolve(
        "@fontsource-variable/martian-mono/files/" + name + ".woff2",
      );
      const fileName = "og-fonts/" + name + ".ttf";
      this.emitFile({
        type: "asset",
        fileName,
        // The decoder reuses its memory for the next subset.
        source: Buffer.from(await wawoff2.decompress(await readFile(new URL(source)))),
      });
      fontPaths.push(fileName);
    }
    this.emitFile({
      type: "asset",
      fileName: "og-fonts/LICENSE",
      source: await readFile(
        new URL(import.meta.resolve("@fontsource-variable/martian-mono/LICENSE")),
      ),
    });
    const artwork = await readFile(new URL("./public/brand/og.png", import.meta.url));
    return `export const fontUrls = ${JSON.stringify(fontPaths)}.map(path => new URL(path, import.meta.url).href);
      export const artwork = "data:image/png;base64,${artwork.toString("base64")}";`;
  },
};
