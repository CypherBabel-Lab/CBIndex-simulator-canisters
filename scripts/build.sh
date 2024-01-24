cargo build --target wasm32-unknown-unknown --package is20-token-canister --features export-api --release
ic-wasm target/wasm32-unknown-unknown/release/is20-token-canister.wasm -o target/wasm32-unknown-unknown/release/token.wasm shrink
cargo build --target wasm32-unknown-unknown --package token-factory --features export-api --release
ic-wasm target/wasm32-unknown-unknown/release/token-factory.wasm -o target/wasm32-unknown-unknown/release/token-factory.wasm shrink
cargo build --target wasm32-unknown-unknown --package vault --features export-api --release
ic-wasm target/wasm32-unknown-unknown/release/vault.wasm -o target/wasm32-unknown-unknown/release/vault.wasm shrink
cargo run -p token-factory --features export-api > src/candid/token-factory.did
cargo run -p is20-token-canister --features export-api > src/candid/token.did
cargo run -p vault --features export-api > src/candid/vault.did
