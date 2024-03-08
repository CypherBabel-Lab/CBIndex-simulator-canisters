#!/bin/bash

# Please note that the vault canister id is get from the test_create_vault.sh script
VAULT_CANISTER_ID="be2us-64aaa-aaaaa-qaabq-cai"
VAULT_SHARES_TOKEN_CANISTER_ID="br5f7-7uaaa-aaaaa-qaaca-cai"
CKBTC_CANISTER_ID="mxzaz-hqaaa-aaaar-qaada-cai"
CKETH_CANISTER_ID="ss2fx-dyaaa-aaaar-qacoq-cai"
ICP_CANISTER_ID="ryjl3-tyaaa-aaaaa-aaaba-cai"

dfx identity use vault_creator
dfx canister call $VAULT_CANISTER_ID set_shares_token "(principal \"$VAULT_SHARES_TOKEN_CANISTER_ID\")"

dfx canister call $VAULT_CANISTER_ID get_config

dfx identity use default
INVESTOR=$(dfx identity get-principal)

echo "--------------check vault aum and nav---------------------"
dfx canister call $VAULT_CANISTER_ID get_aum
dfx canister call $VAULT_CANISTER_ID get_nav

DEPOSIT_CKBTC_AMOUNT=100_000_000
APPROVE_CKBTC_AMOUNT=100_010_000

echo "--------------approve vault canister ckbtc---------------------"
dfx canister call $CKBTC_CANISTER_ID icrc1_balance_of "(record { owner = principal \"$INVESTOR\"; })"
dfx canister call $CKBTC_CANISTER_ID icrc2_approve "(record {spender = record { owner = principal \"$VAULT_CANISTER_ID\";};amount = $APPROVE_CKBTC_AMOUNT; })"
dfx canister call $CKBTC_CANISTER_ID icrc2_allowance "(record {account = record { owner = principal \"$INVESTOR\";}; spender = record { owner = principal \"$VAULT_CANISTER_ID\";} })"
dfx canister call $VAULT_CANISTER_ID deposit "(principal \"$CKBTC_CANISTER_ID\", $DEPOSIT_CKBTC_AMOUNT : nat)"

echo "--------------investor ckbtc balance-----------------"
dfx canister call $CKBTC_CANISTER_ID icrc1_balance_of "(record { owner = principal \"$INVESTOR\"; })"
echo "--------------investor shares token balance-------------"
dfx canister call --query $VAULT_SHARES_TOKEN_CANISTER_ID icrc1_balance_of "(record { owner = principal \"$INVESTOR\"; })"
echo "--------------check vault aum and nav---------------------"
dfx canister call $VAULT_CANISTER_ID get_aum
dfx canister call $VAULT_CANISTER_ID get_nav

DEPOSIT_CKETH_AMOUNT=1_000_000_000
APPROVE_CKETH_AMOUNT=1_000_010_000

echo "--------------approve vault canister cketh---------------------"
dfx canister call $CKETH_CANISTER_ID icrc1_balance_of "(record { owner = principal \"$INVESTOR\"; })"
dfx canister call $CKETH_CANISTER_ID icrc2_approve "(record {spender = record { owner = principal \"$VAULT_CANISTER_ID\";};amount = $APPROVE_CKETH_AMOUNT; })"
dfx canister call $CKETH_CANISTER_ID icrc2_allowance "(record {account = record { owner = principal \"$INVESTOR\";}; spender = record { owner = principal \"$VAULT_CANISTER_ID\";} })"
dfx canister call $VAULT_CANISTER_ID deposit "(principal \"$CKETH_CANISTER_ID\", $DEPOSIT_CKETH_AMOUNT : nat)"

echo "--------------investor cketh balance-----------------"
dfx canister call $CKETH_CANISTER_ID icrc1_balance_of "(record { owner = principal \"$INVESTOR\"; })"
echo "--------------investor shares token balance-------------"
dfx canister call --query $VAULT_SHARES_TOKEN_CANISTER_ID icrc1_balance_of "(record { owner = principal \"$INVESTOR\"; })"
echo "--------------check vault aum and nav---------------------"
dfx canister call $VAULT_CANISTER_ID get_aum
dfx canister call $VAULT_CANISTER_ID get_nav

DEPOSIT_ICP_AMOUNT=1_000_000_000
APPROVE_ICP_AMOUNT=1_000_010_000

echo "--------------approve vault canister icp---------------------"
dfx canister call $ICP_CANISTER_ID icrc1_balance_of "(record { owner = principal \"$INVESTOR\"; })"
dfx canister call $ICP_CANISTER_ID icrc2_approve "(record {spender = record { owner = principal \"$VAULT_CANISTER_ID\";};amount = $APPROVE_ICP_AMOUNT; })"
dfx canister call $ICP_CANISTER_ID icrc2_allowance "(record {account = record { owner = principal \"$INVESTOR\";}; spender = record { owner = principal \"$VAULT_CANISTER_ID\";} })"
dfx canister call $VAULT_CANISTER_ID deposit "(principal \"$ICP_CANISTER_ID\", $DEPOSIT_ICP_AMOUNT : nat)"

echo "--------------investor icp balance-----------------"
dfx canister call $ICP_CANISTER_ID icrc1_balance_of "(record { owner = principal \"$INVESTOR\"; })"
echo "--------------investor shares token balance-------------"
dfx canister call --query $VAULT_SHARES_TOKEN_CANISTER_ID icrc1_balance_of "(record { owner = principal \"$INVESTOR\"; })"
echo "--------------check vault aum and nav---------------------"
dfx canister call $VAULT_CANISTER_ID get_aum
dfx canister call $VAULT_CANISTER_ID get_nav


echo "--------------withdraw ckbtc and cketh from vault canister-----------------"
dfx canister call $VAULT_CANISTER_ID withdraw "(5000 : nat16)"


echo "--------------investor ckbtc balance-----------------"
dfx canister call $CKBTC_CANISTER_ID icrc1_balance_of "(record { owner = principal \"$INVESTOR\"; })"
echo "--------------investor cketh balance-----------------"
dfx canister call $CKETH_CANISTER_ID icrc1_balance_of "(record { owner = principal \"$INVESTOR\"; })"
echo "--------------investor shares token balance-------------"
dfx canister call --query $VAULT_SHARES_TOKEN_CANISTER_ID icrc1_balance_of "(record { owner = principal \"$INVESTOR\"; })"
echo "--------------check vault aum and nav---------------------"
dfx canister call $VAULT_CANISTER_ID get_aum
dfx canister call $VAULT_CANISTER_ID get_nav
