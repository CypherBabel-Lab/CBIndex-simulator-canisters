#!/usr/bin/env bash

dfx identity new minter --storage-mode=plaintext
dfx identity use minter
MINT_ACC_ID=$(dfx ledger account-id)
dfx identity use default
LEDGER_ID=$(dfx canister id icp_ledger_canister)

dfx deploy cmc --specified-id rkp4c-7iaaa-aaaaa-aaaca-cai --argument "(opt record {
    minting_account_id = opt \"${MINT_ACC_ID}\";
    ledger_canister_id = opt principal \"${LEDGER_ID}\";
    governance_canister_id = opt principal \"aaaaa-aa\";
    last_purged_notification = opt 0;
    exchange_rate_canister = null;
})" --yes -qq --upgrade-unchanged