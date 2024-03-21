cargo build --target wasm32-unknown-unknown --package notification --features export-api --release
ic-wasm target/wasm32-unknown-unknown/release/notification.wasm -o target/wasm32-unknown-unknown/release/notification.wasm shrink
cargo run -p notification --features export-api > src/candid/notification.did