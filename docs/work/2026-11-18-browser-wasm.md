# Browser Wasm integration — 18 November 2026

Base: `fbfc52fde008e0d16866fb5b6e3caa7ab9fec150` on `master`. Branch: `codex/browser-wasm-20261118`.

## Scope and acceptance

Connect the tested Rust Wasm module to the browser, using safe lifecycle management and an explicit loading failure state. Preserve fixed-step behavior and versioned export/replay, test Wasm/native parity and browser controls, and ensure the Wasm file is reproducibly built and served. Run Node, Rust, parity, Wasm and browser checks. Integrate only after checks pass, synchronize the site source, publish and verify the public deployment. Record exact failures and remaining steps if blocked. Rendering remains illustrative; physical state comes from Rust.
