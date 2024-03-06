cargo build --target wasm32-unknown-unknown --package is20-token-canister --features export-api mint_burn --release
ic-wasm target/wasm32-unknown-unknown/release/is20-token-canister.wasm -o target/wasm32-unknown-unknown/release/token.wasm shrink
cargo run -p is20-token-canister --features export-api mint_burn > src/candid/token.did