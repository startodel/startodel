import { defineConfig } from "vite-plus";

export default defineConfig({
  test: { globalSetup: ["./packages/db/test/setup.ts"] },
  lint: { options: { typeAware: true, typeCheck: true } },
});
