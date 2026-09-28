import fs from "node:fs";
import path from "node:path";

const targetFile = path.resolve(process.cwd(), "node_modules/@mlc-ai/web-llm/lib/index.js");

if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, "utf8");

  // Allow maxStorageBuffersPerShaderStage to adapt to the GPU adapter limits (8 or 9) instead of hard failing at 10
  const oldPattern = `const requiredMaxStorageBuffersPerShaderStage = 10; // default is 8\n\t\t                if (requiredMaxStorageBuffersPerShaderStage > adapter.limits.maxStorageBuffersPerShaderStage) {\n\t\t                    throw Error(\`Cannot initialize runtime because of requested maxStorageBuffersPerShaderStage \` +\n\t\t                        \`exceeds limit. requested=\${requiredMaxStorageBuffersPerShaderStage}, \` +\n\t\t                        \`limit=\${adapter.limits.maxStorageBuffersPerShaderStage}. \`);\n\t\t                }`;

  const flexibleReplacement = `const requiredMaxStorageBuffersPerShaderStage = Math.min(10, adapter.limits.maxStorageBuffersPerShaderStage || 8);`;

  if (content.includes("const requiredMaxStorageBuffersPerShaderStage = 10;")) {
    // Replace the check with adaptable limit
    content = content.replace(
      /const requiredMaxStorageBuffersPerShaderStage = 10;[\s\S]*?limit=\$\{adapter\.limits\.maxStorageBuffersPerShaderStage\}\.\s*`\);\s*\}/,
      flexibleReplacement,
    );
    fs.writeFileSync(targetFile, content, "utf8");
    console.log("✓ Successfully patched @mlc-ai/web-llm for WebGPU shader buffer compatibility (limits 8-10).");
  } else {
    console.log("ℹ @mlc-ai/web-llm already patched or updated.");
  }
}
