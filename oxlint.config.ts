import { defineConfig } from "oxlint";
import antiSlop from "ultracite/oxlint/anti-slop";
import core from "ultracite/oxlint/core";
import { jsPluginSettings, selectJsPlugins } from "ultracite/oxlint/js-plugins";
import react from "ultracite/oxlint/react";
import shadcn from "ultracite/oxlint/shadcn";
import vitest from "ultracite/oxlint/vitest";

const jsPlugins = selectJsPlugins([
  "github",
  "jsdoc-js",
  "sonarjs",
  "tsdoc",
  "react-doctor",
]);

export default defineConfig({
  env: core.env,
  extends: [core, react, vitest, shadcn, antiSlop, jsPlugins],
  ignorePatterns: [
    "worker-configuration.d.ts",
    ".wrangler-dry-run/**",
    "temp/**",
  ],
  jsPlugins: [...jsPlugins.jsPlugins, ...shadcn.jsPlugins],
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
  rules: {
    "typescript/consistent-indexed-object-style": "error",
    "unicorn/no-immediate-mutation": "error",
    "unicorn/prefer-reflect-apply": "error",
  },
  settings: jsPluginSettings,
});
