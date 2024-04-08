#!/bin/bash

# This script is used to deploy the Vault Factory.
echo "--------------------Deploying the vault factory canister-------------------------"
dfx identity use default
PINCIPAL=$(dfx identity get-principal)
dfx deploy vault_factory --argument "(principal \"$PINCIPAL\", null)" --network=ic
gzip -f target/wasm32-unknown-unknown/release/vault-factory.wasm > target/wasm32-unknown-unknown/release/vault-factory.wasm.gz
dfx canister install vault_factory --argument "(principal \"$PINCIPAL\", null)" --wasm target/wasm32-unknown-unknown/release/vault-factory.wasm.gz --mode=reinstall --yes --network=ic

# This script is used to deploy the Notification Canister.
echo "--------------------Deploying the notification canister-------------------------"
VAULT_FACTORY=$(dfx canister id vault_factory --network=ic)
dfx deploy notification --argument "(principal \"$VAULT_FACTORY\")" --network=ic

# This script is used to set the notification canister id for the vault factory.
echo "--------------set notification canister id for vault factory-----------------"
NOTIFICATION_CANISTER=$(dfx canister id notification --network=ic)
dfx canister call $VAULT_FACTORY set_notification_canister "(principal \"$NOTIFICATION_CANISTER\")" --network=ic

# This script is used to deploy the cbindex_frontend
echo "--------------------Deploying the cbindex_frontend canister-------------------------"
npm install
npm run build
dfx deploy cbindex_frontend --network=ic