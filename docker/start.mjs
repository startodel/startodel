if (!["false", "0"].includes(process.env.RUN_MIGRATIONS)) {
  await import("./migrate.mjs");
}
await import("./index.mjs");
