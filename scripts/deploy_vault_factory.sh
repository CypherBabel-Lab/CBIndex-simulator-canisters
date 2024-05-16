#!/bin/bash

# This script is used to deploy the Vault Factory.

dfx identity use default
PINCIPAL=$(dfx identity get-principal)
dfx deploy vault_factory --argument "(principal \"$PINCIPAL\", null)"
# gzip -f target/wasm32-unknown-unknown/release/vault-factory.wasm > target/wasm32-unknown-unknown/release/vault-factory.wasm.gz
# dfx canister install vault_factory --argument "(principal \"$PINCIPAL\", null)" --wasm target/wasm32-unknown-unknown/release/vault-factory.wasm.gz --mode=reinstall --yes