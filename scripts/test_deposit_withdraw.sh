#!/bin/bash

# Please note that the vault canister id is get from the test_create_vault.sh script
VAULT_CANISTER_ID="be2us-64aaa-aaaaa-qaabq-cai"
VAULT_SHARES_TOKEN_CANISTER_ID="br5f7-7uaaa-aaaaa-qaaca-cai"
CKBTC_CANISTER_ID="mxzaz-hqaaa-aaaar-qaada-cai"
CKETH_CANISTER_ID="ss2fx-dyaaa-aaaar-qacoq-cai"

dfx identity use vault_creator
dfx canister call $VAULT_CANISTER_ID set_shares_token "(principal \"$VAULT_SHARES_TOKEN_CANISTER_ID\")"

dfx canister call $VAULT_CANISTER_ID get_config

dfx identity use default
INVESTOR=$(dfx identity get-principal)

echo "--------------check vault aum and nav---------------------"
dfx canister call $VAULT_CANISTER_ID get_aum
dfx canister call $VAULT_CANISTER_ID get_nav

DEPOSIT_CKBTC_AMOUNT=1_000_000_000
APPROVE_CKBTC_AMOUNT=1_000_010_000

echo "--------------approve vault canister ckbtc---------------------"
dfx canister call $CKBTC_CANISTER_ID icrc1_balance_of "(record { owner = principal \"$INVESTOR\"; })"
dfx canister call $CKBTC_CANISTER_ID icrc2_approve "(record {spender = record { owner = principal \"$VAULT_CANISTER_ID\";};amount = $APPROVE_CKBTC_AMOUNT; })"
dfx canister call $CKBTC_CANISTER_ID icrc2_allowance "(record {account = record { owner = principal \"$INVESTOR\";}; spender = record { owner = principal \"$VAULT_CANISTER_ID\";} })"
dfx canister call $VAULT_CANISTER_ID deposit "(record { canister_id = principal \"$CKBTC_CANISTER_ID\"; amount = $DEPOSIT_CKBTC_AMOUNT : nat;})"

echo "--------------investor ckbtc balance-----------------"
dfx canister call $CKBTC_CANISTER_ID icrc1_balance_of "(record { owner = principal \"$INVESTOR\"; })"
echo "--------------investor shares token balance-------------"
dfx canister call --query $VAULT_SHARES_TOKEN_CANISTER_ID icrc1_balance_of "(record { owner = principal \"$INVESTOR\"; })"
echo "--------------check vault aum and nav---------------------"
dfx canister call $VAULT_CANISTER_ID get_aum
dfx canister call $VAULT_CANISTER_ID get_nav
