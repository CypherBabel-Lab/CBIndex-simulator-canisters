#!/usr/bin/env bash
dfx identity new minter_icp_swap --storage-mode=plaintext
dfx identity use minter_icp_swap

# TOTAL_SUPPLY="1000000000000000000"
# TRANS_FEE="100000000";
TRANS_FEE=0;
MINTER_PRINCIPAL="$(dfx identity get-principal)"
echo
echo "==> ------------------install ICRC2----------------------------"
dfx deploy ICRC2 --argument="( record {name = \"ICRC2\"; symbol = \"ICRC2\"; decimals = 8; fee = 0; max_supply = 1_000_000_000_000; initial_balances = vec {record {record {owner = principal \"$MINTER_PRINCIPAL\";subaccount = null;};100_000_000}};min_burn_amount = 10_000;minting_account = null;advanced_settings = null; })"
echo "==> ---------------------------install SwapFeeReceiver-------------------"
dfx deploy SwapFeeReceiver
echo "==> --------------------------install TrustedCanisterManager-----------------------"
dfx deploy TrustedCanisterManager --argument="(null)"
echo "==> ---------------------------install price----------------------------------------"
dfx deploy price
echo "==> ---------------------------install base_index------------------------------------"
dfx canister create base_index
dfx canister create node_index
dfx canister create PasscodeManager
dfx canister create SwapFactory
dfx deploy base_index --argument="(principal \"$(dfx canister id price)\", principal \"$(dfx canister id node_index)\")"
echo "==> ------------------------------install node_index-----------------------------------"
dfx deploy node_index --argument="(\"$(dfx canister id base_index)\", \"$(dfx canister id price)\")"
echo "==> --------------------------------install PasscodeManager-------------------------------------"
dfx deploy PasscodeManager --argument="(principal \"$(dfx canister id ICRC2)\", 100000000, principal \"$(dfx canister id SwapFactory)\")"
echo "==> -------------------------------install SwapFactory---------------------------------"
dfx deploy SwapFactory --argument="(principal \"$(dfx canister id base_index)\", principal \"$(dfx canister id SwapFeeReceiver)\", principal \"$(dfx canister id PasscodeManager)\", principal \"$(dfx canister id TrustedCanisterManager)\", null)"
echo "==> --------------------------------install PositionIndex-------------------------------------"
dfx deploy PositionIndex --argument="(principal \"$(dfx canister id SwapFactory)\")"