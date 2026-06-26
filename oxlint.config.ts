import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";
import react from "ultracite/oxlint/react";

export default defineConfig({
  extends: [core, react],
  ignorePatterns: [
    "worker-configuration.d.ts",
    ".wrangler-dry-run/**",
    "temp/**",
  ],
  options: {
    typeAware: true,
  },
  overrides: [
    {
      files: ["scripts/**"],
      rules: {
        "eslint/no-await-in-loop": "off",
      },
    },
  ],
});
