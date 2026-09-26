#!/usr/bin/env bash
# Compile the Rust engine to WebAssembly and generate JS bindings.
# Output:
#   src/engine/wasm/pkg/        – wasm-bindgen JS glue + .d.ts (imported by the app)
#   public/wasm/slide_engine_bg.wasm – binary served to browsers and read by API routes
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CRATE="$ROOT/crates/slide-engine"
OUT="$ROOT/src/engine/wasm/pkg"

cargo build --manifest-path "$CRATE/Cargo.toml" --release --target wasm32-unknown-unknown
wasm-bindgen "$CRATE/target/wasm32-unknown-unknown/release/slide_engine.wasm" \
  --target web --out-dir "$OUT" --omit-default-module-path
mkdir -p "$ROOT/public/wasm"
mv "$OUT/slide_engine_bg.wasm" "$ROOT/public/wasm/slide_engine_bg.wasm"
rm -f "$OUT/slide_engine_bg.wasm.d.ts" "$OUT/.gitignore"
echo "wasm: $(du -h "$ROOT/public/wasm/slide_engine_bg.wasm" | cut -f1)"
