#!/usr/bin/env node
/**
 * Integration test: downloads VS Code (cached in .vscode-test), launches it
 * with the built extension and runs test/suite.cjs inside it.
 * Usage: npm run vscode:test   (Linux CI needs a display: xvfb-run -a …)
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runTests } from "@vscode/test-electron";

const ext = join(dirname(fileURLToPath(import.meta.url)), "..");
try {
  await runTests({
    extensionDevelopmentPath: ext,
    extensionTestsPath: join(ext, "test/suite.cjs"),
    cachePath: join(ext, ".vscode-test"),
    launchArgs: [join(ext, "sample"), "--disable-extensions", "--disable-workspace-trust"],
  });
} catch (e) {
  console.error("VS Code integration tests failed:", e);
  process.exit(1);
}
