#!/bin/sh
set -eu
cd "$(dirname "$0")/wimampgtm"
export CARGO_TARGET_DIR="${CARGO_TARGET_DIR:-/tmp/wimamp-target}"
cargo build --release --target wasm32-unknown-unknown
mkdir -p /workspace/public/rust
wasm-bindgen --target no-modules --no-modules-global wimampgtm --out-dir /workspace/public/rust \
  "$CARGO_TARGET_DIR/wasm32-unknown-unknown/release/wimampgtm.wasm"
printf '\nglobalThis.wimampgtm = wimampgtm;\n' >> /workspace/public/rust/wimampgtm.js
