import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // CommonJS files (the VS Code test suite runs in the extension host).
  { files: ["**/*.cjs"], rules: { "@typescript-eslint/no-require-imports": "off" } },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "src/engine/wasm/pkg/**",
      "crates/**",
      "vscode-extension/dist/**",
      "public/player/**",
      "packages/*/dist/**",
      "**/.vscode-test/**",
    ],
  },
];

export default eslintConfig;
