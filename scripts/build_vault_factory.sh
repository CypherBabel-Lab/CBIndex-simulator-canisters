cargo build --target wasm32-unknown-unknown --package vault-factory --features export-api --release
ic-wasm target/wasm32-unknown-unknown/release/vault-factory.wasm -o target/wasm32-unknown-unknown/release/vault-factory.wasm shrink
cargo run -p vault-factory --features export-api > src/candid/vault-factory.did