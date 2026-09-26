#!/usr/bin/env bash
# Build the Slidewise VS Code extension from this repo and open it in VS Code for testing.
#
#   ./scripts/vscode-dev.sh              build, then launch an Extension Development Host on the sample deck
#   ./scripts/vscode-dev.sh path/to.md   …opening your own deck (its folder becomes the workspace)
#   ./scripts/vscode-dev.sh --install    build a .vsix and install it into your normal VS Code
#   ./scripts/vscode-dev.sh --wasm       rebuild the Rust/Wasm engine first (needs Rust + wasm-bindgen)
#
# Set CODE_BIN to use another CLI (e.g. CODE_BIN=code-insiders or CODE_BIN=cursor).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXT="$ROOT/vscode-extension"
CODE="${CODE_BIN:-code}"
INSTALL=0
DECK="$EXT/sample/demo.md"

for arg in "$@"; do
  case "$arg" in
    --install) INSTALL=1 ;;
    --wasm) WASM=1 ;;
    -h|--help) sed -n '2,10p' "$0"; exit 0 ;;
    *) DECK="$(cd "$(dirname "$arg")" && pwd)/$(basename "$arg")" ;;
  esac
done

cd "$ROOT"
[ -d node_modules ] || { echo "→ Installing dependencies"; npm ci; }
[ "${WASM:-0}" = 1 ] && { echo "→ Rebuilding the Wasm engine"; ./scripts/build-wasm.sh; }

if ! command -v "$CODE" >/dev/null 2>&1; then
  echo "✗ VS Code CLI '$CODE' not found."
  echo "  In VS Code run: Command Palette → 'Shell Command: Install 'code' command in PATH', or set CODE_BIN."
  exit 1
fi

if [ "$INSTALL" = 1 ]; then
  echo "→ Packaging .vsix"
  npm run vscode:package --silent
  VSIX="$(ls -t "$EXT"/*.vsix | head -1)"
  "$CODE" --install-extension "$VSIX" --force
  echo "✓ Installed $(basename "$VSIX"). Reload VS Code windows to pick it up."
  "$CODE" "$DECK"
  exit 0
fi

echo "→ Building extension (dev)"
npm run vscode:dev-build --silent
echo "→ Opening Extension Development Host with $(basename "$DECK")"
"$CODE" --new-window --extensionDevelopmentPath="$EXT" "$(dirname "$DECK")" "$DECK"
