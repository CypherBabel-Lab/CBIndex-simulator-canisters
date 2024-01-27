cargo build --target wasm32-unknown-unknown --package vault --features export-api --release
ic-wasm target/wasm32-unknown-unknown/release/vault.wasm -o target/wasm32-unknown-unknown/release/vault.wasm shrink
cargo run -p vault --features export-api > src/candid/vault.did