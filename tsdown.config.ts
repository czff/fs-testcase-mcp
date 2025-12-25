import { defineConfig } from "tsdown";

// tsdown.config.ts
export default defineConfig({
  entry: {
    index: "src/index.ts",
  },
  format: "esm",
  banner: "#!/usr/bin/env node",
  outDir: "dist",
  minify: true,
});
