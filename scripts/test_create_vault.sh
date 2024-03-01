#!/bin/bash

# before running this script, make sure you have run "deploy.sh" first";

dfx identity use default
PRINCIPAL=$(dfx identity get-principal)
dfx identity new vault_creator --storage-mode=plaintext
dfx identity use vault_creator
CREATOR_ACC_ID=$(dfx ledger account-id)
dfx identity use default
VAULT_FACTORY=$(dfx canister id vault_factory)
ICP_LEDGER=$(dfx canister id icp_ledger_canister)
echo "--------------transfer 10 icp to vault creator---------------------"
dfx ledger transfer --memo 1234567 --amount 10 $CREATOR_ACC_ID
DEPOSIT_ICP_AMOUNT=500000000 # 5 ICP
dfx identity use vault_creator
echo "--------------vault creator balance: $(dfx ledger balance)--------------"
echo "--------------transfer $DEPOSIT_ICP_AMOUNT icp to vault factory-----------"
dfx canister call $ICP_LEDGER icrc2_approve "(record {spender = record { owner = principal \"$VAULT_FACTORY\";};amount = $DEPOSIT_ICP_AMOUNT; })"
dfx canister call $VAULT_FACTORY transfer_icp
echo "--------------vault creator balance: $(dfx ledger balance)-----------------"
CKBTC="mxzaz-hqaaa-aaaar-qaada-cai"
CKETH="ss2fx-dyaaa-aaaar-qacoq-cai"
dfx canister call $VAULT_FACTORY create_vault "(record {symbol = \"test_1\";name=\"tname_1\";decimals = 8; owner = principal \"$PRINCIPAL\"; fee = 10000; fee_to = principal \"$PRINCIPAL\";null}, vec {record { canister_id = principal \"$CKBTC\"; symbol = \"BTC\" }; record { canister_id = principal \"$CKETH\"; symbol = \"ETH\" } }, null, null)"
echo "--------------withdraw remain icp from vault factory---------------"
dfx canister call $VAULT_FACTORY refund_icp
echo "--------------vault creator balance: $(dfx ledger balance)-----------------"