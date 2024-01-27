cargo build --target wasm32-unknown-unknown --package is20-token-canister --features export-api --release
ic-wasm target/wasm32-unknown-unknown/release/is20-token-canister.wasm -o target/wasm32-unknown-unknown/release/token.wasm shrink
cargo build --target wasm32-unknown-unknown --package vault --features export-api --release
ic-wasm target/wasm32-unknown-unknown/release/vault.wasm -o target/wasm32-unknown-unknown/release/vault.wasm shrink
cargo build --target wasm32-unknown-unknown --package vault-factory --features export-api --release
ic-wasm target/wasm32-unknown-unknown/release/vault-factory.wasm -o target/wasm32-unknown-unknown/release/vault-factory.wasm shrink
cargo run -p is20-token-canister --features export-api > src/candid/token.did
cargo run -p vault --features export-api > src/candid/vault.did
cargo run -p vault-factory --features export-api > src/candid/vault-factory.did
