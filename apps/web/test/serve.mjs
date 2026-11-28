// Run the app in its own process so the built server reads the test environment at startup.
import "./mail-capture.mjs";
import { createServer } from "node:http";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join } from "node:path";
import { buildNuxt, loadNuxt } from "nuxt/kit";

const rootDir = fileURLToPath(new URL("../", import.meta.url));
const buildDir = join(rootDir, ".nuxt/integration");
const outputDir = join(buildDir, "output");
if (!process.argv.includes("--built")) {
  const nuxt = await loadNuxt({
    cwd: rootDir,
    dev: false,
    overrides: {
      buildDir,
      nitro: { preset: "node-listener", serveStatic: true, output: { dir: outputDir } },
    },
  });
  try {
    await buildNuxt(nuxt);
  } finally {
    await nuxt.close();
  }
}
const { listener } = await import(pathToFileURL(join(outputDir, "server/index.mjs")).href);
const server = createServer(listener);
server.listen(0, "127.0.0.1", () => process.send({ port: server.address().port }));
process.on("disconnect", () => server.close(() => process.exit(0)));
